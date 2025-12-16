const Tbl_CourseContent = require('../models/Tbl_CourseContent');
const Tbl_Assignments = require('../models/Tbl_Assignments');
const textExtractionService = require('./textExtractionService');
const chunkingService = require('./chunkingService');
const aiQuizGenerationService = require('./aiQuizGenerationService');
const quizConsolidationService = require('./quizConsolidationService');
const Tbl_Quiz = require('../models/Tbl_Quiz');
const path = require('path');
const fs = require('fs').promises;
const mongoose = require('mongoose');
const https = require('https');
const http = require('http');

class AutoQuizOrchestrator {
  constructor() {
    this.uploadsBasePath = path.join(__dirname, '..', 'public', 'uploads');
    this.tempDir = path.join(__dirname, '..', 'temp');
    this.ensureTempDir();
  }

  async ensureTempDir() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (err) {
      // Directory already exists
    }
  }

  async downloadFromGridFS(fileId, fileName) {
    try {
      if (!mongoose.connection.db) {
        console.error('MongoDB connection not ready');
        return null;
      }

      const gridfsBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        bucketName: 'uploads'
      });

      const objectId = new mongoose.Types.ObjectId(fileId);
      const files = await gridfsBucket.find({ _id: objectId }).toArray();
      
      if (!files || files.length === 0) {
        console.error(`GridFS file not found: ${fileId}`);
        return null;
      }

      const file = files[0];
      const extension = path.extname(file.filename || fileName || '.pdf');
      const tempFilePath = path.join(this.tempDir, `${fileId}${extension}`);

      console.log(`Downloading GridFS file ${fileId} to ${tempFilePath}`);

      const downloadStream = gridfsBucket.openDownloadStream(objectId);
      const writeStream = require('fs').createWriteStream(tempFilePath);

      return new Promise((resolve, reject) => {
        downloadStream.pipe(writeStream);
        writeStream.on('finish', () => {
          console.log(`Successfully downloaded: ${tempFilePath}`);
          resolve(tempFilePath);
        });
        writeStream.on('error', (err) => {
          console.error(`Write stream error: ${err.message}`);
          reject(err);
        });
        downloadStream.on('error', (err) => {
          console.error(`Download stream error: ${err.message}`);
          reject(err);
        });
      });
    } catch (error) {
      console.error(`Error downloading from GridFS: ${error.message}`);
      return null;
    }
  }

  async generateQuizForCourse(courseId) {
    console.log(`\n=== Starting Auto Quiz Generation for Course ${courseId} ===`);

    try {
      const existingQuiz = await this.checkExistingQuiz(courseId);
      if (existingQuiz) {
        console.log('Quiz already exists for this course');
        return { success: true, quizId: existingQuiz.Quiz_Id, message: 'Quiz already generated' };
      }

      const materials = await this.fetchCourseMaterials(courseId);
      if (materials.length === 0) {
        throw new Error('No course materials found for quiz generation');
      }

      const extractedTexts = await this.extractTextsFromMaterials(materials);
      // FIXED: Only throw error if ALL materials fail, not if just some fail
      if (extractedTexts.length === 0 && materials.length > 0) {
        throw new Error('Failed to extract text from course materials');
      }

      const chunks = await chunkingService.chunkMultipleDocuments(extractedTexts);
      console.log(`Created ${chunks.length} chunks for AI processing`);

      const allQuestions = await aiQuizGenerationService.generateQuestionsFromChunks(chunks);
      console.log(`Generated ${allQuestions.length} questions from AI`);

      const finalQuestions = await quizConsolidationService.consolidateQuestions(allQuestions);
      console.log(`Consolidated to ${finalQuestions.length} final questions`);

      if (finalQuestions.length < 15) {
        throw new Error(`Insufficient questions generated: ${finalQuestions.length}/30. Need more course materials.`);
      }

      const quiz = await this.saveQuizToDatabase(courseId, finalQuestions);
      console.log(`Quiz saved successfully: ${quiz.Quiz_Id}`);

      return {
        success: true,
        quizId: quiz.Quiz_Id,
        totalQuestions: finalQuestions.length,
        totalMarks: quiz.Total_Marks,
        message: 'Quiz generated successfully'
      };

    } catch (error) {
      console.error('Quiz generation failed:', error);
      throw error;
    }
  }

  async checkExistingQuiz(courseId) {
    return await Tbl_Quiz.findOne({
      Course_Id: courseId.toString(),
      Week_Number: 0,
      AI_Generated: true,
      Status: 'Active'
    });
  }

  async fetchCourseMaterials(courseId) {
    // Get course content materials (PDFs and notes)
    const courseContentMaterials = await Tbl_CourseContent.find({
      Course_Id: parseInt(courseId),
      Content_Type: { $in: ['pdf', 'notes'] }
    }).lean();

    // Get assignment materials that have PDF files
    const assignmentMaterials = await Tbl_Assignments.find({
      Course_Id: courseId.toString(),
      File_URL: { $ne: null, $exists: true }
    }).lean();

    // Combine both types of materials
    const allMaterials = [...courseContentMaterials];

    // Convert assignment materials to the same format as course content
    assignmentMaterials.forEach(assignment => {
      allMaterials.push({
        Content_Id: assignment.Assignment_Id,
        Course_Id: parseInt(assignment.Course_Id),
        Topic_Id: assignment.Topic_Id ? parseInt(assignment.Topic_Id) : null,
        Title: assignment.Title,
        Content_Type: 'pdf', // Treat assignments with files as PDF content
        File_Url: assignment.File_URL, // Note the different casing
        Uploaded_On: assignment.Uploaded_On
      });
    });

    console.log(`Found ${courseContentMaterials.length} course content materials and ${assignmentMaterials.length} assignment materials for course ${courseId}`);
    console.log(`Total materials: ${allMaterials.length}`);
    return allMaterials;
  }

  async extractTextsFromMaterials(materials) {
    const extractedTexts = [];
    const failedMaterials = []; // Track failed materials

    for (const material of materials) {
      try {
        let filePath;
        let isGridFS = false;
        
        console.log(`Processing material: ${material.Title}, File_Url: ${material.File_Url}`);
        
        // Check if file URL is a GridFS file ID (e.g., /api/files/xxxxx)
        if (material.File_Url && material.File_Url.includes('/api/files/')) {
          const fileId = material.File_Url.split('/api/files/')[1];
          console.log(`Detected GridFS file, ID: ${fileId}`);
          isGridFS = true;
          filePath = await this.downloadFromGridFS(fileId, material.Title);
          if (!filePath) {
            console.warn(`Failed to download GridFS file: ${material.File_Url}`);
            failedMaterials.push(material.Title);
            continue;
          }
        } else {
          filePath = this.resolveFilePath(material.File_Url);
          const exists = await this.fileExists(filePath);
          if (!exists) {
            console.warn(`File not found: ${filePath}`);
            failedMaterials.push(material.Title);
            continue;
          }
        }

        console.log(`Extracting text from: ${filePath}`);
        const text = await textExtractionService.extractText(filePath);
        console.log(`Extracted ${text ? text.length : 0} characters from ${material.Title}`);
        
        if (text && text.trim().length > 100) {
          extractedTexts.push({
            source: material.Title,
            text: text,
            contentId: material.Content_Id
          });
          console.log(`✓ Added text from ${material.Title}`);
        } else {
          console.warn(`Insufficient text extracted from ${material.Title}`);
          failedMaterials.push(material.Title);
        }
        
        // Clean up downloaded GridFS file
        if (isGridFS && filePath) {
          try {
            await fs.unlink(filePath);
            console.log(`Cleaned up temp file: ${filePath}`);
          } catch (err) {
            console.warn(`Failed to clean up temp file: ${err.message}`);
          }
        }
      } catch (error) {
        // Error handling: Continue processing other files even if one fails
        console.error(`❌ Failed to extract text from ${material.Title}:`, error.message);
        failedMaterials.push(material.Title);
        // Clean up temp file on error
        if (isGridFS && filePath) {
          try {
            await fs.unlink(filePath);
          } catch (err) {
            // Ignore cleanup errors
          }
        }
      }
    }

    console.log(`Total texts extracted: ${extractedTexts.length}`);
    console.log(`Failed materials: ${failedMaterials.length}`);
    
    // FIXED: Only throw error if ALL materials fail, not if just some fail
    if (extractedTexts.length === 0 && materials.length > 0) {
      throw new Error('Failed to extract text from course materials');
    }
    
    return extractedTexts;
  }

  resolveFilePath(fileUrl) {
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      const urlPath = new URL(fileUrl).pathname;
      return path.join(this.uploadsBasePath, urlPath.replace('/uploads/', ''));
    }
    
    if (fileUrl.startsWith('/uploads/')) {
      return path.join(this.uploadsBasePath, fileUrl.replace('/uploads/', ''));
    }

    if (path.isAbsolute(fileUrl)) {
      return fileUrl;
    }

    return path.join(this.uploadsBasePath, fileUrl);
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async saveQuizToDatabase(courseId, questions) {
    const mcqQuestions = questions.filter(q => q.type === 'mcq');
    const shortAnswerQuestions = questions.filter(q => q.type === 'short_answer');
    const conceptualQuestions = questions.filter(q => q.type === 'conceptual');

    const formattedQuestions = mcqQuestions.map((q, index) => ({
      question_id: index + 1,
      question: q.question,
      options: [q.options.A, q.options.B, q.options.C, q.options.D],
      correct_answer: ['A', 'B', 'C', 'D'].indexOf(q.correctAnswer),
      marks: q.points || 1,
      difficulty: 'Medium',
      explanation: ''
    }));

    const totalMarks = questions.reduce((sum, q) => sum + (q.points || 1), 0);

    const quizData = {
      Course_Id: courseId.toString(),
      Week_Number: 0,
      Title: 'Course Completion Quiz',
      Topic: 'Comprehensive Assessment',
      Description: `AI-generated quiz covering all course materials. Includes ${mcqQuestions.length} MCQs, ${shortAnswerQuestions.length} short answers, and ${conceptualQuestions.length} conceptual questions.`,
      Time_Limit: 45,
      Total_Marks: totalMarks,
      Total_Questions: formattedQuestions.length,
      Questions: formattedQuestions,
      Status: 'Active',
      Created_By: 'AI_System',
      AI_Generated: true
    };

    const quiz = new Tbl_Quiz(quizData);
    await quiz.save();

    return quiz;
  }

  async getQuizForCourse(courseId) {
    return await Tbl_Quiz.findOne({
      Course_Id: courseId.toString(),
      Week_Number: 0,
      AI_Generated: true,
      Status: 'Active'
    }).lean();
  }
}

module.exports = new AutoQuizOrchestrator();