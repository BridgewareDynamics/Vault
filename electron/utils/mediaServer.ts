import * as http from 'http';
import { createReadStream } from 'fs';
import * as fs from 'fs/promises';
import { randomBytes } from 'crypto';
import { logger } from './logger';
import { getMimeTypeFromExtension } from './fileDataUtils';

/**
 * Validates that a requested file path is allowed to be served. Returning `false`
 * rejects the request with 403. This mirrors the protocol handler's security
 * checks (safe path + confined to a managed root).
 */
export type MediaPathValidator = (filePath: string) => Promise<boolean> | boolean;

interface MediaServerInfo {
  port: number;
  token: string;
}

/**
 * Local media streaming server.
 *
 * Chromium's `<video>` element needs HTTP byte-range (`206`) responses to seek
 * (drag the scrubber) and to resume reads after the player has been idle. Custom
 * `protocol.handle` schemes cannot satisfy this reliably: any hand-built `206`
 * response fails with `PIPELINE_ERROR_READ: FFmpegDemuxer: data source error` on
 * the first range read after the player goes idle (e.g. the user pauses a few
 * seconds before pressing play, or seeks). Electron's `net.fetch` over `file://`
 * survives idle but only ever returns a non-range `200`, so it isn't seekable.
 *
 * A real loopback HTTP server sidesteps both problems: Chromium talks ordinary
 * HTTP (keep-alive, ranges, seeking) and everything "just works", exactly as it
 * would for a video served from a web server.
 *
 * Security: the server binds to `127.0.0.1` on an ephemeral port, requires a
 * per-session random token, and validates every requested path with the supplied
 * validator before streaming.
 */
let serverPromise: Promise<MediaServerInfo> | null = null;
let validatorRef: MediaPathValidator | null = null;

async function handleRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  token: string
): Promise<void> {
  try {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405).end();
      return;
    }

    const url = new URL(req.url ?? '', 'http://127.0.0.1');
    if (url.searchParams.get('t') !== token) {
      res.writeHead(403).end();
      return;
    }

    const filePath = url.searchParams.get('p');
    if (!filePath) {
      res.writeHead(400).end();
      return;
    }

    const validator = validatorRef;
    if (!validator || !(await validator(filePath))) {
      res.writeHead(403).end();
      return;
    }

    const stat = await fs.stat(filePath).catch(() => null);
    if (!stat || !stat.isFile()) {
      res.writeHead(404).end();
      return;
    }

    const size = stat.size;
    const contentType = getMimeTypeFromExtension(filePath);
    const rangeHeader = req.headers.range;

    if (rangeHeader) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
      if (!match || (match[1] === '' && match[2] === '')) {
        res.writeHead(416, { 'Content-Range': `bytes */${size}` }).end();
        return;
      }

      let start: number;
      let end: number;
      if (match[1] === '') {
        // Suffix range: last N bytes.
        start = Math.max(0, size - parseInt(match[2], 10));
        end = size - 1;
      } else {
        start = parseInt(match[1], 10);
        end = match[2] ? parseInt(match[2], 10) : size - 1;
      }
      if (end >= size) end = size - 1;

      if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= size) {
        res.writeHead(416, { 'Content-Range': `bytes */${size}` }).end();
        return;
      }

      res.writeHead(206, {
        'Content-Type': contentType,
        'Content-Length': end - start + 1,
        'Content-Range': `bytes ${start}-${end}/${size}`,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-store',
      });

      if (req.method === 'HEAD') {
        res.end();
        return;
      }

      const stream = createReadStream(filePath, { start, end });
      stream.on('error', () => res.destroy());
      req.on('close', () => stream.destroy());
      stream.pipe(res);
      return;
    }

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': size,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-store',
    });

    if (req.method === 'HEAD') {
      res.end();
      return;
    }

    const stream = createReadStream(filePath);
    stream.on('error', () => res.destroy());
    req.on('close', () => stream.destroy());
    stream.pipe(res);
  } catch (error) {
    logger.error('[mediaServer] request error:', error);
    try {
      res.writeHead(500).end();
    } catch {
      // Response may already be partially sent.
    }
  }
}

function startMediaServer(validate: MediaPathValidator): Promise<MediaServerInfo> {
  validatorRef = validate;
  if (serverPromise) return serverPromise;

  serverPromise = new Promise<MediaServerInfo>((resolve, reject) => {
    const token = randomBytes(24).toString('hex');
    const server = http.createServer((req, res) => {
      void handleRequest(req, res, token);
    });

    server.on('error', (error) => {
      serverPromise = null;
      reject(error);
    });

    // Port 0 = OS-assigned ephemeral port. Bind to loopback only.
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      logger.info(`[mediaServer] listening on http://127.0.0.1:${port}`);
      resolve({ port, token });
    });
  });

  return serverPromise;
}

/**
 * Returns a loopback HTTP URL the renderer can use as a `<video>`/`<audio>` `src`.
 * Lazily starts the server on first use. The supplied validator is invoked for
 * every request to confirm the path is still allowed.
 */
export async function getMediaUrl(
  filePath: string,
  validate: MediaPathValidator
): Promise<string> {
  const { port, token } = await startMediaServer(validate);
  return `http://127.0.0.1:${port}/media?t=${token}&p=${encodeURIComponent(filePath)}`;
}
