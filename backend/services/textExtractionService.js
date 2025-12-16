const fs = require('fs');
const path = require('path');
// Import pdf-parse and use the PDFParse class correctly
const pdfParseModule = require('pdf-parse');
const PDFParse = pdfParseModule.PDFParse;

const mammoth = require('mammoth');
const textract = require('textract');

// Bulletproof helper function for PDF text extraction
async function extractTextFromPDF(filePath) {
  try {
    // Read the PDF from disk using fs.readFile
    const dataBuffer = fs.readFileSync(filePath);
    
    // Create PDFParse instance with correct options
    const parser = new PDFParse({
      data: dataBuffer,
      verbosity: 0 // Reduce verbosity
    });
    
    // Extract text from the PDF
    const textResult = await parser.getText();
    
    // Return extracted text as a string
    return textResult.text || '';
  } catch (error) {
    // Throw a clear error if parsing fails
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

class TextExtractionService {
  async extractText(filePath) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const ext = path.extname(filePath).toLowerCase();
    let rawText = '';

    switch (ext) {
      case '.pdf':
        // Use our bulletproof helper function
        rawText = await extractTextFromPDF(filePath);
        break;
      case '.doc':
      case '.docx':
        rawText = await this.extractFromDOCX(filePath);
        break;
      case '.ppt':
      case '.pptx':
        rawText = await this.extractFromPPT(filePath);
        break;
      case '.txt':
        rawText = fs.readFileSync(filePath, 'utf-8');
        break;
      default:
        throw new Error(`Unsupported file type: ${ext}`);
    }

    return this.cleanText(rawText);
  }

  async extractFromPDF(filePath) {
    // Delegate to our bulletproof helper function
    return await extractTextFromPDF(filePath);
  }

  async extractFromDOCX(filePath) {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  async extractFromPPT(filePath) {
    return new Promise((resolve, reject) => {
      textract.fromFileWithPath(filePath, { preserveLineBreaks: true }, (error, text) => {
        if (error) reject(error);
        else resolve(text);
      });
    });
  }

  cleanText(text) {
    if (!text) return '';

    let cleaned = text;

    // Remove page numbers
    cleaned = cleaned.replace(/\bPage \d+\b/gi, '');
    cleaned = cleaned.replace(/\d+ of \d+/g, '');
    cleaned = cleaned.replace(/^\d+$/gm, '');

    // Remove headers/footers
    cleaned = cleaned.replace(/^(Chapter|Section|Unit) \d+.*$/gim, '');
    
    // Normalize whitespace
    cleaned = cleaned.replace(/[ \t]+/g, ' ');
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

    // Remove duplicate consecutive lines
    const lines = cleaned.split('\n');
    const uniqueLines = [];
    let prevLine = '';
    
    for (let line of lines) {
      const trimmed = line.trim();
      if (trimmed && trimmed !== prevLine) {
        uniqueLines.push(line);
        prevLine = trimmed;
      } else if (!trimmed) {
        uniqueLines.push('');
      }
    }

    cleaned = uniqueLines.join('\n');
    cleaned = cleaned.replace(/[^\w\s\.,;:!?()\-'"\/\n]/g, '');

    return cleaned.trim();
  }

  async extractFromMultipleFiles(filePaths) {
    const results = [];
    for (const filePath of filePaths) {
      try {
        const text = await this.extractText(filePath);
        const wordCount = text.trim().split(/\s+/).length;
        results.push({
          filePath,
          fileName: path.basename(filePath),
          text,
          wordCount,
          success: true
        });
      } catch (error) {
        results.push({
          filePath,
          fileName: path.basename(filePath),
          text: '',
          wordCount: 0,
          success: false,
          error: error.message
        });
      }
    }
    return results;
  }
}

module.exports = new TextExtractionService();
// Export our helper function for external use
module.exports.extractTextFromPDF = extractTextFromPDF;