// Debug script to check pdf-parse import and usage
console.log('=== Debugging pdf-parse issue ===');

// Method 1: Direct import
try {
  console.log('\n1. Testing direct import:');
  const pdfParse = require('pdf-parse');
  console.log('Typeof pdfParse:', typeof pdfParse);
  console.log('Is function:', typeof pdfParse === 'function');
  console.log('Properties:', Object.keys(pdfParse));
} catch (error) {
  console.error('Direct import failed:', error.message);
}

// Method 2: Accessing PDFParse property
try {
  console.log('\n2. Testing PDFParse property access:');
  const pdfParseModule = require('pdf-parse');
  console.log('Module keys:', Object.keys(pdfParseModule));
  const pdfParseFunc = pdfParseModule.PDFParse || pdfParseModule.default || pdfParseModule;
  console.log('pdfParseFunc type:', typeof pdfParseFunc);
  console.log('Is function:', typeof pdfParseFunc === 'function');
} catch (error) {
  console.error('PDFParse property access failed:', error.message);
}

// Method 3: Try calling it directly
try {
  console.log('\n3. Testing direct call:');
  const pdfParseModule = require('pdf-parse');
  const pdfParse = pdfParseModule.PDFParse || pdfParseModule.default || pdfParseModule;
  
  if (typeof pdfParse === 'function') {
    console.log('Can call pdfParse as function');
  } else {
    console.log('Cannot call pdfParse as function');
    // Let's see what we actually got
    console.log('pdfParse value:', pdfParse);
  }
} catch (error) {
  console.error('Direct call test failed:', error.message);
}

console.log('\n=== End debug ===');