// Detailed debug script to check pdf-parse import and usage
console.log('=== Detailed pdf-parse Debug ===');

// Check what we get when we import pdf-parse
const pdfParseModule = require('pdf-parse');
console.log('pdfParseModule type:', typeof pdfParseModule);
console.log('pdfParseModule keys:', Object.keys(pdfParseModule));

// Check if it has a default export
if (pdfParseModule.default) {
  console.log('pdfParseModule.default type:', typeof pdfParseModule.default);
  if (typeof pdfParseModule.default === 'function') {
    console.log('pdfParseModule.default is a function - this might be what we need');
  } else if (typeof pdfParseModule.default === 'object') {
    console.log('pdfParseModule.default is an object with keys:', Object.keys(pdfParseModule.default));
  }
}

// Check if it has a PDFParse property
if (pdfParseModule.PDFParse) {
  console.log('pdfParseModule.PDFParse type:', typeof pdfParseModule.PDFParse);
  if (typeof pdfParseModule.PDFParse === 'function') {
    console.log('pdfParseModule.PDFParse is a function');
  } else if (typeof pdfParseModule.PDFParse === 'object') {
    console.log('pdfParseModule.PDFParse is an object with keys:', Object.keys(pdfParseModule.PDFParse));
  }
}

// Try to figure out what the actual export is
console.log('\nTrying different access methods:');

// Method 1: Direct import
try {
  const pdfParse1 = require('pdf-parse');
  console.log('Method 1 (direct):', typeof pdfParse1);
} catch (error) {
  console.log('Method 1 failed:', error.message);
}

// Method 2: Access default
try {
  const pdfParse2 = require('pdf-parse').default;
  console.log('Method 2 (default):', typeof pdfParse2);
} catch (error) {
  console.log('Method 2 failed:', error.message);
}

// Method 3: Access PDFParse
try {
  const pdfParse3 = require('pdf-parse').PDFParse;
  console.log('Method 3 (PDFParse):', typeof pdfParse3);
} catch (error) {
  console.log('Method 3 failed:', error.message);
}

// Method 4: Try calling each one
console.log('\nTesting actual calls:');

// Test direct import
try {
  const pdfParseFunc = require('pdf-parse');
  if (typeof pdfParseFunc === 'function') {
    console.log('Direct import is callable');
  } else {
    console.log('Direct import is NOT callable');
  }
} catch (error) {
  console.log('Direct import test failed:', error.message);
}

// Test default
try {
  const pdfParseFunc = require('pdf-parse').default;
  if (typeof pdfParseFunc === 'function') {
    console.log('Default export is callable');
  } else {
    console.log('Default export is NOT callable');
  }
} catch (error) {
  console.log('Default export test failed:', error.message);
}

// Test PDFParse
try {
  const pdfParseFunc = require('pdf-parse').PDFParse;
  if (typeof pdfParseFunc === 'function') {
    console.log('PDFParse property is callable');
  } else {
    console.log('PDFParse property is NOT callable');
  }
} catch (error) {
  console.log('PDFParse property test failed:', error.message);
}

console.log('\n=== End detailed debug ===');