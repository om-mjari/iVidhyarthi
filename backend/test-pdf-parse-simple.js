// Simple test to check pdf-parse usage
const fs = require('fs');

console.log('Testing pdf-parse usage...');

// Now I understand how to use PDFParse correctly
const pdfParseModule = require('pdf-parse');
const PDFParse = pdfParseModule.PDFParse;

try {
  console.log('\nTrying PDFParse with correct parameters...');
  
  // Create a minimal PDF buffer for testing
  const pdfBuffer = Buffer.from('%PDF-1.4\n%EOF', 'utf8');
  
  // Create an instance with the correct options
  const parser = new PDFParse({
    data: pdfBuffer,
    verbosity: 0 // Reduce verbosity
  });
  console.log('Created parser with correct options');
  
  // Try to get info (which should load the document)
  parser.getInfo().then(info => {
    console.log('Got info successfully');
    console.log('Pages:', info.total);
    
    // Now try to get text
    return parser.getText();
  }).then(textResult => {
    console.log('Text extraction success!');
    console.log('Total text length:', textResult.text.length);
    console.log('Pages with text:', textResult.pages.length);
  }).catch(error => {
    console.log('Error in PDF processing:', error.message);
  });
} catch (error) {
  console.log('Error creating parser:', error.message);
}

// Let's also try with a more complete PDF structure
try {
  console.log('\nTrying with more complete PDF...');
  
  // Create a slightly more complete PDF buffer
  const pdfContent = `
%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/ProcSet [/PDF /Text]
/Font <<
/F1 5 0 R
>>
>>
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(Hello World) Tj
ET
endstream
endobj
5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000053 00000 n 
0000000102 00000 n 
0000000270 00000 n 
0000000356 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
462
%%EOF
`;
  
  const pdfBuffer = Buffer.from(pdfContent, 'utf8');
  
  // Create an instance with the correct options
  const parser = new PDFParse({
    data: pdfBuffer,
    verbosity: 0
  });
  console.log('Created parser with complete PDF');
  
  // Try to get info
  parser.getInfo().then(info => {
    console.log('Got info from complete PDF');
    console.log('Pages:', info.total);
    
    // Now try to get text
    return parser.getText();
  }).then(textResult => {
    console.log('Text extraction success from complete PDF!');
    console.log('Total text length:', textResult.text.length);
    console.log('Text content:', textResult.text.substring(0, 100));
  }).catch(error => {
    console.log('Error with complete PDF:', error.message);
  });
} catch (error) {
  console.log('Error with complete PDF creation:', error.message);
}