const express = require('express');
const Tbl_Courses = require('../models/Tbl_Courses');
const Tbl_CourseCategories = require('../models/Tbl_CourseCategories');
const Tbl_CourseTopics = require('../models/Tbl_CourseTopics');
const Tbl_CourseSubTopics = require('../models/Tbl_CourseSubTopics');
const router = express.Router();

// Test route to verify this file is loaded
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'tbl-courses route is working!' });
});

// Get all courses
router.get('/', async (req, res) => {
  try {
    const { lecturerId } = req.query;
    
    // Build query filter
    const filter = {};
    if (lecturerId) {
      filter.Lecturer_Id = lecturerId;
    }
    
    const courses = await Tbl_Courses.find(filter).sort({ Created_At: -1 });
    res.json({
      success: true,
      data: courses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching courses',
      error: error.message
    });
  }
});

// Get single course by ID
router.get('/:id', async (req, res) => {
  try {
    const course = await Tbl_Courses.findOne({ Course_Id: req.params.id });
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Fetch topics for this course
    const topics = await Tbl_CourseTopics.find({ Course_Id: course.Course_Id }).sort({ Order_Number: 1 });
    
    // Fetch subtopics for each topic
    const topicsWithSubTopics = await Promise.all(
      topics.map(async (topic) => {
        const subtopics = await Tbl_CourseSubTopics.find({ Topic_Id: topic.Topic_Id });
        return {
          ...topic.toObject(),
          SubTopics: subtopics
        };
      })
    );

    // Add topics to course data
    const courseData = {
      ...course.toObject(),
      Topics: topicsWithSubTopics
    };

    res.json({
      success: true,
      data: courseData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching course',
      error: error.message
    });
  }
});

// Pool of course images that cycle every 4 courses
const COURSE_IMAGES = [
  'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800',
  'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800',
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800'
];

// Create new course
router.post('/', async (req, res) => {
  try {
    console.log('POST /api/tbl-courses - Received request:', req.body);
    const { Title, Description, Category_Id, Price, Lecturer_Id, Duration, Topics } = req.body;

    // Detailed validation with specific error messages
    const missingFields = [];
    if (!Title || Title.trim() === '') missingFields.push('Title');
    if (!Category_Id) missingFields.push('Category_Id');
    if (!Price && Price !== 0) missingFields.push('Price');
    if (!Lecturer_Id || Lecturer_Id.trim() === '') missingFields.push('Lecturer_Id');

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
        errors: missingFields.map(field => `${field} is required`)
      });
    }

    // Verify category exists
    const categoryId = Number(Category_Id);
    if (isNaN(categoryId)) {
      return res.status(400).json({
        success: false,
        message: 'Category_Id must be a valid number',
        errors: ['Invalid Category_Id format']
      });
    }

    const category = await Tbl_CourseCategories.findOne({ Category_Id: categoryId });
    if (!category) {
      return res.status(400).json({
        success: false,
        message: `Category with ID ${categoryId} does not exist`,
        errors: ['Invalid Category_Id - category not found']
      });
    }

    // Validate price
    const priceNum = Number(Price);
    if (isNaN(priceNum) || priceNum < 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be a valid positive number',
        errors: ['Invalid Price']
      });
    }

    // Auto-generate Course_Id
    const lastCourse = await Tbl_Courses.findOne().sort({ Course_Id: -1 });
    const nextId = lastCourse ? lastCourse.Course_Id + 1 : 1;

    // Auto-assign cycling image based on Course_Id
    const imageIndex = (nextId - 1) % COURSE_IMAGES.length;
    const image_url = COURSE_IMAGES[imageIndex];

    // Create course
    const course = new Tbl_Courses({
      Course_Id: nextId,
      Title: Title.trim(),
      Description: Description ? Description.trim() : '',
      Category_Id: categoryId,
      Price: priceNum,
      Lecturer_Id: Lecturer_Id.trim(),
      Duration: Duration ? Duration.trim() : '',
      image_url: image_url,
      Created_At: new Date(),
      status: 'pending'
    });

    await course.save();

    // Save Topics and SubTopics if provided
    if (Topics && Array.isArray(Topics) && Topics.length > 0) {
      const lastTopic = await Tbl_CourseTopics.findOne().sort({ Topic_Id: -1 });
      let nextTopicId = lastTopic ? lastTopic.Topic_Id + 1 : 1;

      const lastSubTopic = await Tbl_CourseSubTopics.findOne().sort({ SubTopic_Id: -1 });
      let nextSubTopicId = lastSubTopic ? lastSubTopic.SubTopic_Id + 1 : 1;

      for (const topicData of Topics) {
        // Create main topic
        const topic = new Tbl_CourseTopics({
          Topic_Id: nextTopicId,
          Course_Id: nextId,
          Title: topicData.Title || '',
          Description: topicData.Description || '',
          Order_Number: topicData.Order_Number || 0,
          Estimated_Hours: topicData.Estimated_Hours || null
        });

        await topic.save();

        // Create subtopics if provided
        if (topicData.SubTopics && Array.isArray(topicData.SubTopics)) {
          for (const subTopicData of topicData.SubTopics) {
            const subTopic = new Tbl_CourseSubTopics({
              SubTopic_Id: nextSubTopicId,
              Topic_Id: nextTopicId,
              Title: subTopicData.Title || '',
              Description: subTopicData.Description || '',
              Order_Number: subTopicData.Order_Number || ''
            });

            await subTopic.save();
            nextSubTopicId++;
          }
        }

        nextTopicId++;
      }
    }

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: course
    });
  } catch (error) {
    console.error('Error creating course:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating course',
      error: error.message
    });
  }
});

// Update course
router.put('/:id', async (req, res) => {
  try {
    const courseId = Number(req.params.id);
    const { Topics, ...courseUpdates } = req.body;

    const course = await Tbl_Courses.findOneAndUpdate(
      { Course_Id: courseId },
      courseUpdates,
      { new: true, runValidators: true }
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Update Topics and SubTopics if provided
    if (Topics && Array.isArray(Topics)) {
      // Delete existing topics and subtopics for this course
      const existingTopics = await Tbl_CourseTopics.find({ Course_Id: courseId });
      const existingTopicIds = existingTopics.map(t => t.Topic_Id);
      
      // Delete all subtopics for these topics
      if (existingTopicIds.length > 0) {
        await Tbl_CourseSubTopics.deleteMany({ Topic_Id: { $in: existingTopicIds } });
      }
      
      // Delete all topics for this course
      await Tbl_CourseTopics.deleteMany({ Course_Id: courseId });

      // Create new topics and subtopics
      if (Topics.length > 0) {
        const lastTopic = await Tbl_CourseTopics.findOne().sort({ Topic_Id: -1 });
        let nextTopicId = lastTopic ? lastTopic.Topic_Id + 1 : 1;

        const lastSubTopic = await Tbl_CourseSubTopics.findOne().sort({ SubTopic_Id: -1 });
        let nextSubTopicId = lastSubTopic ? lastSubTopic.SubTopic_Id + 1 : 1;

        for (const topicData of Topics) {
          // Create main topic
          const topic = new Tbl_CourseTopics({
            Topic_Id: nextTopicId,
            Course_Id: courseId,
            Title: topicData.Title || '',
            Description: topicData.Description || '',
            Order_Number: topicData.Order_Number || 0,
            Estimated_Hours: topicData.Estimated_Hours || null
          });

          await topic.save();

          // Create subtopics if provided
          if (topicData.SubTopics && Array.isArray(topicData.SubTopics)) {
            for (const subTopicData of topicData.SubTopics) {
              const subTopic = new Tbl_CourseSubTopics({
                SubTopic_Id: nextSubTopicId,
                Topic_Id: nextTopicId,
                Title: subTopicData.Title || '',
                Description: subTopicData.Description || '',
                Order_Number: subTopicData.Order_Number || ''
              });

              await subTopic.save();
              nextSubTopicId++;
            }
          }

          nextTopicId++;
        }
      }
    }

    res.json({
      success: true,
      message: 'Course updated successfully',
      data: course
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating course',
      error: error.message
    });
  }
});

// Delete course
router.delete('/:id', async (req, res) => {
  try {
    const courseId = Number(req.params.id);
    const course = await Tbl_Courses.findOneAndDelete({ Course_Id: courseId });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Delete associated topics and subtopics
    const topics = await Tbl_CourseTopics.find({ Course_Id: courseId });
    const topicIds = topics.map(t => t.Topic_Id);
    
    if (topicIds.length > 0) {
      await Tbl_CourseSubTopics.deleteMany({ Topic_Id: { $in: topicIds } });
    }
    await Tbl_CourseTopics.deleteMany({ Course_Id: courseId });

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting course',
      error: error.message
    });
  }
});

module.exports = router;