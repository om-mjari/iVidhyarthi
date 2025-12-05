const express = require('express');
const router = express.Router();
const {
  processVideoTranscript,
  generateTranscriptPDF
} = require('../utils/transcriptionService');

// Generate transcript for a video
router.post('/generate', async (req, res) => {
  try {
    const { videoUrl, videoTitle, language } = req.body;
    
    if (!videoUrl || !videoTitle) {
      return res.status(400).json({
        success: false,
        message: 'Video URL and title are required'
      });
    }
    
    console.log('Generating transcript for:', videoTitle, 'Language:', language);
    
    const result = await processVideoTranscript(videoUrl, videoTitle, language || 'English');
    
    console.log('Transcript generated successfully');
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error generating transcript:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate transcript',
      error: error.message || 'Unknown error occurred'
    });
  }
});

// Download transcript as PDF
router.post('/download-pdf', async (req, res) => {
  try {
    const { transcript, summary, videoTitle, language } = req.body;
    
    if (!transcript || !summary || !videoTitle) {
      return res.status(400).json({
        success: false,
        message: 'Transcript, summary, and video title are required'
      });
    }
    
    console.log('Generating PDF for:', videoTitle);
    
    const pdfBuffer = await generateTranscriptPDF(transcript, summary, videoTitle, language || 'English');
    
    console.log('PDF generated successfully');
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="transcript_${videoTitle.replace(/[^a-z0-9]/gi, '_')}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF',
      error: error.message || 'Unknown error occurred'
    });
  }
});

module.exports = router;
