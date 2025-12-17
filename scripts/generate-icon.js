// path: scripts/generate-icon.js
import sharp from 'sharp';
import toIco from 'to-ico';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const sourcePath = join(rootDir, 'build', 'icon.png');
const outputPath = join(rootDir, 'build', 'icon.ico');

// Required sizes for Windows ICO
const sizes = [16, 32, 48, 64, 128, 256];

async function generateIcon() {
  try {
    console.log('Reading source icon:', sourcePath);
    
    // Check if source file exists
    try {
      readFileSync(sourcePath);
    } catch (error) {
      throw new Error(`Source icon not found: ${sourcePath}`);
    }

    // Get source image metadata
    const metadata = await sharp(sourcePath).metadata();
    console.log(`Source image: ${metadata.width}x${metadata.height} (${metadata.format})`);

    // Warn if source is smaller than 256x256
    if (metadata.width < 256 || metadata.height < 256) {
      console.warn(`Warning: Source image is smaller than 256x256. Quality may be reduced.`);
    }

    // Generate all required sizes
    console.log('Generating icon sizes:', sizes.join(', '));
    const buffers = await Promise.all(
      sizes.map(async (size) => {
        const buffer = await sharp(sourcePath)
          .resize(size, size, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .png()
          .toBuffer();
        console.log(`  ✓ Generated ${size}x${size}`);
        return buffer;
      })
    );

    // Convert to ICO format
    console.log('Converting to ICO format...');
    const icoBuffer = await toIco(buffers);
    
    // Write ICO file
    writeFileSync(outputPath, icoBuffer);
    
    const fileSize = (icoBuffer.length / 1024).toFixed(2);
    console.log(`✓ Successfully created ${outputPath} (${fileSize} KB)`);
    console.log(`  Contains ${sizes.length} resolutions: ${sizes.join('x')} pixels`);
    
  } catch (error) {
    console.error('Error generating icon:', error.message);
    process.exit(1);
  }
}

generateIcon();




