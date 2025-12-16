const textExtractionService = require('./services/textExtractionService');
const fs = require('fs');
const path = require('path');

// Test the extractTextFromPDF helper function directly
const { extractTextFromPDF } = require('./services/textExtractionService');

console.log('Testing PDF extraction helper function...');

async function testPdfHelper() {
  try {
    // First check if we have the pdf-parse function correctly
    const pdfParseModule = require('pdf-parse');
    const pdfParse = pdfParseModule.PDFParse || pdfParseModule.default || pdfParseModule;
    console.log('pdf-parse type:', typeof pdfParse);
    
    if (typeof pdfParse === 'function') {
      console.log('PDF parse function is correctly available');
    } else {
      console.log('PDF parse function is NOT available');
      return;
    }
    
    // Try to test with a non-existent PDF file to see the error handling
    const fakePdfPath = path.join(__dirname, 'temp', 'nonexistent.pdf');
    console.log('Testing with non-existent PDF file...');
    const result = await extractTextFromPDF(fakePdfPath);
    console.log('Unexpected success:', result);
  } catch (error) {
    console.log('Expected error for non-existent file:', error.message);
  }
}

testPdfHelper();