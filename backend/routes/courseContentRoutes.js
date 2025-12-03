const express = require('express');
const router = express.Router();
const Tbl_CourseContent = require('../models/Tbl_CourseContent');

// POST - Upload course content
router.post('/', async (req, res) => {
  try {
    const { Course_Id, Topic_Id, Title, Content_Type, File_Url } = req.body;

    if (!Course_Id || !Topic_Id || !Title || !Content_Type || !File_Url) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    if (!['pdf', 'notes', 'video'].includes(Content_Type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Content_Type. Must be: pdf, notes, or video'
      });
    }

    const newContent = new Tbl_CourseContent({
      Course_Id: Number(Course_Id),
      Topic_Id: Number(Topic_Id),
      Title,
      Content_Type,
      File_Url
    });

    await newContent.save();

    res.status(201).json({
      success: true,
      message: 'Content uploaded successfully',
      data: newContent
    });
  } catch (error) {
    console.error('Error uploading content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload content',
      error: error.message
    });
  }
});

// GET - Get content by course ID
router.get('/course/:courseId', async (req, res) => {
  try {
    const content = await Tbl_CourseContent.find({
      Course_Id: Number(req.params.courseId)
    }).sort({ Uploaded_On: -1 });

    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch content',
      error: error.message
    });
  }
});

// GET - Get content by topic ID
router.get('/topic/:topicId', async (req, res) => {
  try {
    const content = await Tbl_CourseContent.find({
      Topic_Id: Number(req.params.topicId)
    }).sort({ Uploaded_On: -1 });

    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch content',
      error: error.message
    });
  }
});

// GET - Get all content for lecturer (by course IDs)
router.get('/lecturer/:lecturerId', async (req, res) => {
  try {
    const Tbl_Courses = require('../models/Tbl_Courses');
    const lecturerId = req.params.lecturerId;
    
    // Find all courses by this lecturer
    const courses = await Tbl_Courses.find({ 
      Lecturer_Id: lecturerId 
    });
    
    const courseIds = courses.map(c => c.Course_Id);
    
    if (courseIds.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }
    
    // Get all content for these courses
    const content = await Tbl_CourseContent.find({
      Course_Id: { $in: courseIds }
    }).sort({ Uploaded_On: -1 });
    
    // Enrich with course names
    const enrichedContent = content.map(item => {
      const course = courses.find(c => c.Course_Id === item.Course_Id);
      return {
        ...item.toObject(),
        CourseName: course ? course.Title : 'Unknown Course'
      };
    });

    res.json({
      success: true,
      data: enrichedContent
    });
  } catch (error) {
    console.error('Error fetching lecturer content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch content',
      error: error.message
    });
  }
});

// DELETE - Delete content
router.delete('/:contentId', async (req, res) => {
  try {
    const deleted = await Tbl_CourseContent.findOneAndDelete({
      Content_Id: req.params.contentId
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    res.json({
      success: true,
      message: 'Content deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete content',
      error: error.message
    });
  }
});

module.exports = router;
