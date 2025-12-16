const textExtractionService = require('./services/textExtractionService');
const fs = require('fs');
const path = require('path');

console.log('=== Full PDF Extraction Test ===');

// Create a test PDF file
const testDir = path.join(__dirname, 'temp');
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir, { recursive: true });
}

// Create a simple PDF-like file (we'll test with a text file since we can't easily create a real PDF)
const testPdfFile = path.join(testDir, 'test.pdf');
fs.writeFileSync(testPdfFile, '%PDF-1.4\n%EOF\nThis is a test file that pretends to be a PDF.');

console.log('Created test PDF file:', testPdfFile);

async function testFullExtraction() {
  try {
    console.log('\n1. Testing textExtractionService.extractText with PDF file...');
    const result = await textExtractionService.extractText(testPdfFile);
    console.log('SUCCESS: Text extraction completed');
    console.log('Result length:', result.length);
    console.log('Result preview:', result.substring(0, 100));
  } catch (error) {
    console.log('FAILED: Text extraction failed');
    console.log('Error message:', error.message);
    console.log('Error stack:', error.stack);
  }

  try {
    console.log('\n2. Testing extractTextFromPDF helper directly...');
    const { extractTextFromPDF } = require('./services/textExtractionService');
    const result = await extractTextFromPDF(testPdfFile);
    console.log('SUCCESS: Direct PDF extraction completed');
    console.log('Result length:', result.length);
    console.log('Result preview:', result.substring(0, 100));
  } catch (error) {
    console.log('FAILED: Direct PDF extraction failed');
    console.log('Error message:', error.message);
    console.log('Error stack:', error.stack);
  }

  // Clean up
  try {
    fs.unlinkSync(testPdfFile);
    console.log('\nCleaned up test file');
  } catch (error) {
    console.log('Failed to clean up test file:', error.message);
  }
}

testFullExtraction();