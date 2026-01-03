// PDF Downloader with Case Organization
// Paste this into Chrome DevTools Console on a DOJ court records page
// Downloads PDFs with case-prefixed names that can be organized into folders

(async () => {
  console.log('🔍 Scanning for PDF links...');
  
  // Collect all PDF links on the current page
  const anchors = Array.from(document.querySelectorAll('a[href]'));
  
  const pdfUrls = anchors
    .map(a => a.getAttribute('href'))
    .filter(Boolean)
    .map(href => new URL(href, location.href).href)
    .filter(u => u.toLowerCase().includes('.pdf'))
    .filter((u, i, arr) => arr.indexOf(u) === i) // dedupe
    .sort();
  
  if (pdfUrls.length === 0) {
    console.log('❌ No PDF links found on this page.');
    return;
  }
  
  console.log(`✅ Found ${pdfUrls.length} PDF link(s)`);
  
  // Function to extract case name from URL
  function extractCaseName(url) {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      
      // Look for "Court Records" or similar
      for (let i = 0; i < pathParts.length; i++) {
        if (pathParts[i].includes('Court') && pathParts[i].includes('Record')) { 
          if (i + 1 < pathParts.length) {
            let caseName = decodeURIComponent(pathParts[i + 1]);
            // Clean for use in filename
            caseName = caseName.replace(/[<>:"|?*]/g, '_');
            return caseName;
          }
        }
      }
      return 'Uncategorized';
    } catch (e) {
      return 'Uncategorized';
    }
  }
  
  // Function to get filename from URL
  function getFilename(url) {
    const urlObj = new URL(url);
    const parts = urlObj.pathname.split('/');
    return decodeURIComponent(parts[parts.length - 1]);
  }
  
  // Organize by case
  const byCase = {};
  pdfUrls.forEach(url => {
    const caseName = extractCaseName(url);
    if (!byCase[caseName]) byCase[caseName] = [];
    byCase[caseName].push(url);
  });
  
  console.log(`\n📁 Organized into ${Object.keys(byCase).length} case(s):`);
  Object.entries(byCase).forEach(([caseName, urls]) => {
    console.log(`  • ${caseName}: ${urls.length} PDF(s)`);
  });
  
  // Ask user to confirm
  const proceed = confirm(
    `Download ${pdfUrls.length} PDFs?\n\n` +
    `Files will be downloaded with case-prefixed names.\n` +
    `Use the Python script afterwards to organize into folders.\n\n` +
    `This may take several minutes. Continue?`
  );
  
  if (!proceed) {
    console.log('❌ Download cancelled by user.');
    return;
  }
  
  // Download function with delay
  async function downloadWithDelay(url, caseName, filename, index, total) {
    return new Promise((resolve) => {
      const prefixedName = `${caseName}____${filename}`;
      
      console.log(`[${index}/${total}] Downloading: ${prefixedName}`);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = prefixedName;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Delay to avoid overwhelming the browser
      setTimeout(resolve, 1000); // 1 second between downloads
    });
  }
  
  // Download all PDFs
  console.log('\n⬇️  Starting downloads...');
  console.log('⚠️  Check your Downloads folder for files');
  console.log('⚠️  Browser may ask for permission to download multiple files\n');
  
  let count = 0;
  for (const [caseName, urls] of Object.entries(byCase)) {
    for (const url of urls) {
      count++;
      const filename = getFilename(url);
      await downloadWithDelay(url, caseName, filename, count, pdfUrls.length);
    }
  }
  
  console.log(`\n✅ Initiated download of ${pdfUrls.length} PDF(s)`);
  console.log('\n📝 Next steps:');
  console.log('   1. Wait for all downloads to complete');
  console.log('   2. Run the Python script: python organize_downloads.py');
  console.log('   3. It will move files from Downloads into case folders');
  
  // Store for reference
  window.__pdfUrls = pdfUrls;
  window.__pdfsByCase = byCase;
  
})();
