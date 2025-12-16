const fs = require('fs');
const path = require('path');

// Test pdf-parse directly
try {
  const pdfParseModule = require('pdf-parse');
  const pdfParse = pdfParseModule.PDFParse || pdfParseModule.default || pdfParseModule;
  console.log('pdf-parse imported successfully');
  console.log('Type of pdfParse:', typeof pdfParse);
  console.log('Is function:', typeof pdfParse === 'function');
} catch (error) {
  console.error('Failed to import pdf-parse:', error.message);
}

// Try to find a sample PDF to test with
async function testPdfExtraction() {
  try {
    const pdfParseModule = require('pdf-parse');
    const pdfParse = pdfParseModule.PDFParse || pdfParseModule.default || pdfParseModule;
    
    // Look for any PDF file in the uploads directory
    const uploadsDir = path.join(__dirname, 'public', 'uploads');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      const pdfFiles = files.filter(file => path.extname(file).toLowerCase() === '.pdf');
      
      if (pdfFiles.length > 0) {
        const testFile = path.join(uploadsDir, pdfFiles[0]);
        console.log(`Testing with PDF file: ${testFile}`);
        
        const dataBuffer = fs.readFileSync(testFile);
        console.log('File read successfully, buffer length:', dataBuffer.length);
        
        const data = await pdfParse(dataBuffer);
        console.log('PDF parsed successfully');
        console.log('Number of pages:', data.numpages);
        console.log('Text length:', data.text.length);
        console.log('First 200 characters:', data.text.substring(0, 200));
      } else {
        console.log('No PDF files found in uploads directory');
      }
    } else {
      console.log('Uploads directory does not exist');
    }
  } catch (error) {
    console.error('PDF extraction test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testPdfExtraction();