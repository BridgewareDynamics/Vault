export default {
  appId: 'com.pdftract.app',
  productName: 'PDFtract',
  directories: {
    output: 'release',
  },
  files: [
    'dist/**/*',
    'dist-electron/**/*',
    'package.json',
  ],
  win: {
    target: 'nsis',
  },
  mac: {
    target: 'dmg',
  },
  linux: {
    target: 'AppImage',
  },
};



