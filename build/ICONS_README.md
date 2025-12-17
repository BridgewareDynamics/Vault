# Application Icons

This directory should contain the application icons for all platforms.

## Required Files

1. **icon.ico** - Windows icon (256x256 or larger, multi-resolution ICO format)
2. **icon.icns** - macOS icon (512x512 or larger, ICNS format)
3. **icon.png** - Linux icon (512x512 or larger, PNG format)

## Generating Icons

### Option 1: Using Online Tools
- Use tools like [CloudConvert](https://cloudconvert.com/) or [ConvertICO](https://convertico.com/) to convert PNG to ICO/ICNS
- Start with a high-resolution PNG (1024x1024 recommended)

### Option 2: Using ImageMagick (Command Line)
```bash
# Generate Windows ICO (requires ImageMagick)
convert icon.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico

# Generate macOS ICNS (requires iconutil on macOS)
mkdir icon.iconset
# Create various sizes and place in iconset, then:
iconutil -c icns icon.iconset
```

### Option 3: Using Electron Icon Generator
```bash
npm install -g electron-icon-maker
electron-icon-maker --input=./icon-source.png --output=./build
```

## Icon Requirements

- **Windows (.ico)**: Multi-resolution ICO file with sizes: 16x16, 32x32, 48x48, 64x64, 128x128, 256x256
- **macOS (.icns)**: ICNS format with sizes: 16x16, 32x32, 128x128, 256x256, 512x512, 1024x1024
- **Linux (.png)**: PNG format, 512x512 or 1024x1024 recommended

## Source Image

Create a high-resolution source image (1024x1024 PNG) with your app logo/icon, then generate platform-specific formats from it.

## Temporary Placeholder

Until actual icons are created, you can use placeholder icons or skip icon generation (electron-builder will use default icons).







