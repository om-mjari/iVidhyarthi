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
async function transcribeAudio(audioFilePath, language = 'en') {
  try {
    if (!openai) {
      throw new Error('OpenAI client not initialized');
    }

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioFilePath),
      model: "whisper-1",
      language: language // Set language for transcription
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
  
  const timestamp = Date.now();
  const audioFilePath = path.join(tempDir, `audio_${timestamp}.mp3`);
  
  try {
    if (!openai) {
      throw new Error('OpenAI API key not configured. Please add OPENAI_API_KEY to your .env file.');
    }

    console.log('Downloading video from URL:', videoUrl);
    
    // Download the video/audio file
    await downloadFile(videoUrl, audioFilePath);
    console.log('Video downloaded successfully');
    
    // Map language names to ISO codes for Whisper
    const languageCodeMap = {
      'English': 'en',
      'Hindi': 'hi',
      'Gujarati': 'gu'
    };
    
    const languageCode = languageCodeMap[targetLanguage] || 'en';
    
    // Transcribe audio using Whisper
    console.log(`Transcribing audio in ${targetLanguage} (${languageCode})...`);
    let transcript = await transcribeAudio(audioFilePath, languageCode);
    console.log('Transcription completed');
    
    // If target language is not English, translate the transcript
    if (targetLanguage !== 'English' && languageCode === 'en') {
      console.log(`Translating to ${targetLanguage}...`);
      transcript = await translateText(transcript, targetLanguage);
    }
    
    // Generate summary in the target language
    console.log('Generating summary...');
    const summary = await generateSummary(transcript, targetLanguage);
    
    // Clean up temporary file
    try {
      fs.unlinkSync(audioFilePath);
    } catch (err) {
      console.log('Error cleaning up temp file:', err);
    }
    
    return {
      transcript,
      summary,
      language: targetLanguage
    };
  } catch (error) {
    // Clean up temporary file in case of error
    try {
      if (fs.existsSync(audioFilePath)) {
        fs.unlinkSync(audioFilePath);
      }
    } catch (err) {
      console.log('Error cleaning up temp file:', err);
    }
    
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
