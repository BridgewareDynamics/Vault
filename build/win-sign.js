// Windows code signing script for electron-builder
// This script will be used if WIN_CERTIFICATE_FILE and WIN_CERTIFICATE_PASSWORD are set
// Otherwise, signing will be skipped gracefully

exports.default = async function(configuration) {
  const { WIN_CERTIFICATE_FILE, WIN_CERTIFICATE_PASSWORD } = process.env;
  
  if (!WIN_CERTIFICATE_FILE || !WIN_CERTIFICATE_PASSWORD) {
    console.log('Skipping Windows code signing: Certificate not configured');
    return;
  }

  const { sign } = require('electron-builder/out/codeSign/windowsCodeSign');
  
  try {
    await sign(configuration.path, {
      path: WIN_CERTIFICATE_FILE,
      password: WIN_CERTIFICATE_PASSWORD,
      name: configuration.name,
      site: 'https://github.com/yourusername/pdftract',
    });
    console.log('Windows code signing completed');
  } catch (error) {
    console.error('Windows code signing failed:', error);
    // Don't fail the build if signing fails
  }
};








