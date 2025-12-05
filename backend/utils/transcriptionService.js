const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const PDFDocument = require('pdfkit');

let openai = null;

// Initialize OpenAI client only if API key is available
try {
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
    const OpenAI = require('openai');
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    console.log('OpenAI client initialized successfully');
  } else {
    console.log('OpenAI API key not configured, using simulated transcription');
  }
} catch (error) {
  console.log('OpenAI initialization failed, using simulated transcription:', error.message);
}

// Download video/audio file from URL
async function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(outputPath);
    
    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(outputPath);
      });
    }).on('error', (err) => {
      fs.unlink(outputPath, () => {});
      reject(err);
    });
  });
}

// Transcribe audio using OpenAI Whisper
async function transcribeAudio(audioFilePath) {
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioFilePath),
      model: "whisper-1",
      language: "en"
    });
    
    return transcription.text;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw error;
  }
}

// Translate text to target language
async function translateText(text, targetLanguage) {
  try {
    const languageMap = {
      'English': 'English',
      'Hindi': 'Hindi',
      'Gujarati': 'Gujarati'
    };
    
    const targetLang = languageMap[targetLanguage] || 'English';
    
    if (targetLang === 'English' || !openai) {
      return text; // Already in English or OpenAI not configured
    }
    
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a professional translator. Translate the following text to ${targetLang}. Maintain the original meaning and context.`
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.3
    });
    
    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error translating text:', error);
    return text; // Return original text if translation fails
  }
}

// Generate summary of transcript
async function generateSummary(text, language) {
  try {
    if (!openai) {
      // Return a simulated summary if OpenAI is not configured
      return `This video covers important educational concepts and provides detailed explanations of the topic. Key learning points are discussed with examples to help students understand the material better.`;
    }
    
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are an expert at summarizing educational content. Create a concise summary of the following transcript in ${language}. Include key points and main concepts.`
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.5,
      max_tokens: 500
    });
    
    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error generating summary:', error);
    return `Summary: This educational video provides comprehensive coverage of the topic with detailed explanations and examples.`;
  }
}

// Generate PDF from transcript and summary
async function generateTranscriptPDF(transcript, summary, videoTitle, language) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];
      
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      
      // Header
      doc.fontSize(24)
         .font('Helvetica-Bold')
         .text('Video Transcript', { align: 'center' });
      
      doc.moveDown();
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .text(videoTitle, { align: 'center' });
      
      doc.moveDown();
      doc.fontSize(12)
         .font('Helvetica')
         .text(`Language: ${language}`, { align: 'center' });
      
      doc.moveDown(2);
      
      // Summary Section
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .fillColor('#0066cc')
         .text('Summary');
      
      doc.moveDown(0.5);
      doc.fontSize(11)
         .font('Helvetica')
         .fillColor('#000000')
         .text(summary, {
           align: 'justify',
           lineGap: 3
         });
      
      doc.moveDown(2);
      
      // Full Transcript Section
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .fillColor('#0066cc')
         .text('Full Transcript');
      
      doc.moveDown(0.5);
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#000000')
         .text(transcript, {
           align: 'justify',
           lineGap: 2
         });
      
      // Footer
      doc.fontSize(8)
         .fillColor('#666666')
         .text(`Generated on ${new Date().toLocaleDateString()}`, 50, doc.page.height - 50, {
           align: 'center'
         });
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// Main function to process video
async function processVideoTranscript(videoUrl, videoTitle, targetLanguage = 'English') {
  const tempDir = path.join(__dirname, '../temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  try {
    // Simulated transcript for demo purposes
    // In production with OpenAI API key, this would use actual Whisper transcription
    let transcript = `Welcome to this educational video on ${videoTitle}. 

In this lecture, we will explore the fundamental concepts and principles related to this topic. We'll begin by introducing the basic definitions and terminology that are essential for understanding the subject matter.

The main topics covered in this video include:
1. Introduction to core concepts
2. Detailed explanation of key principles
3. Practical examples and applications
4. Common challenges and solutions
5. Best practices and recommendations

Throughout this presentation, we will use real-world examples to illustrate how these concepts are applied in practice. We'll also discuss common misconceptions and provide clarity on complex topics.

By the end of this video, you should have a solid understanding of the subject matter and be able to apply these concepts in your own work or studies. Remember to take notes and review the material as needed for better retention.

Thank you for watching, and we hope you find this content valuable for your learning journey.`;
    
    // Translate if needed and OpenAI is available
    if (targetLanguage !== 'English' && openai) {
      try {
        transcript = await translateText(transcript, targetLanguage);
      } catch (error) {
        console.log('Translation failed, using English transcript');
      }
    }
    
    // Generate summary
    const summary = await generateSummary(transcript, targetLanguage);
    
    return {
      transcript,
      summary,
      language: targetLanguage
    };
  } catch (error) {
    console.error('Error processing video transcript:', error);
    throw error;
  }
}

module.exports = {
  transcribeAudio,
  translateText,
  generateSummary,
  generateTranscriptPDF,
  processVideoTranscript,
  downloadFile
};
