import { motion } from 'framer-motion';
import { FileImage, Film, FileText, Loader2 } from 'lucide-react';
import { FileConverterSource, Theme } from '../../types';
import { useFileConverterSourcePreview } from '../../hooks/useFileConverterSourcePreview';
import { useFileConverterTheme } from './fileConverterTheme';

interface FileConverterSourcePreviewProps {
  source: FileConverterSource;
  theme: Theme;
}

function PreviewFallback({
  source,
  t,
  unavailable,
}: {
  source: FileConverterSource;
  t: ReturnType<typeof useFileConverterTheme>;
  unavailable: boolean;
}) {
  const Icon =
    source.category === 'video' ? Film : source.category === 'pdf' ? FileText : FileImage;

  return (
    <div className={`flex h-full min-h-[12rem] flex-col items-center justify-center gap-3 px-6 text-center ${t.mutedText}`}>
      <div className={`rounded-2xl p-4 ${t.metaBox}`}>
        <Icon className={`h-8 w-8 ${t.primary}`} />
      </div>
      <div>
        <p className={`text-sm font-semibold ${t.heading}`}>{source.fileName}</p>
        <p className={`mt-1 text-xs leading-5 ${t.mutedText}`}>
          {unavailable
            ? 'Preview unavailable for this file, but conversion will still work.'
            : 'Loading preview…'}
        </p>
      </div>
    </div>
  );
}

export function FileConverterSourcePreview({ source, theme }: FileConverterSourcePreviewProps) {
  const t = useFileConverterTheme(theme);
  const preview = useFileConverterSourcePreview(source);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      className={`overflow-hidden rounded-[26px] border ${t.insetSurface}`}
    >
      <div className={`border-b px-4 py-3 ${t.softInsetSurface}`}>
        <p className={`text-xs uppercase tracking-[0.22em] ${t.sectionLabel}`}>Source preview</p>
        <p className={`mt-1 truncate text-sm ${t.mutedText}`}>{source.fileName}</p>
      </div>

      <div className={`relative min-h-[14rem] max-h-[22rem] bg-black/5 ${t.isPastel ? '' : 'bg-black/20'}`}>
        {preview.loading ? (
          <div className="flex h-full min-h-[14rem] items-center justify-center gap-3">
            <Loader2 className={`h-6 w-6 animate-spin ${t.primary}`} />
            <span className={`text-sm ${t.mutedText}`}>Loading preview…</span>
          </div>
        ) : preview.videoSrc ? (
          <div className="flex h-full min-h-[14rem] items-center justify-center p-4">
            <video
              key={preview.videoSrc}
              src={preview.videoSrc}
              controls
              playsInline
              className="max-h-[20rem] w-full rounded-[20px] border border-white/10 bg-black/70 object-contain shadow-2xl"
            />
          </div>
        ) : preview.imageSrc ? (
          <div className="flex h-full min-h-[14rem] items-center justify-center p-4">
            <img
              src={preview.imageSrc}
              alt={`Preview of ${source.fileName}`}
              className="max-h-[20rem] w-full rounded-[20px] object-contain shadow-2xl"
            />
          </div>
        ) : (
          <PreviewFallback source={source} t={t} unavailable={preview.unavailable} />
        )}
      </div>
    </motion.div>
  );
}
