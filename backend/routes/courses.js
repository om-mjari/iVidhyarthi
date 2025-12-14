const express = require('express');
const Course = require('../models/Course');
const User = require('../models/User');
const router = express.Router();

// Get all published courses with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      level,
      minPrice,
      maxPrice,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { status: 'published' };
    
    if (category) filter.category = category;
    if (level) filter.level = level;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    let query = Course.find(filter);

    // Add text search if provided
    if (search) {
      query = Course.find({
        ...filter,
        $text: { $search: search }
      }, { score: { $meta: 'textScore' } });
      sort.score = { $meta: 'textScore' };
    }

    // Execute query with pagination
    const courses = await query
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-modules.lessons.videoId -modules.lessons.resources');

    // Get total count for pagination
    const total = await Course.countDocuments(search ? 
      { ...filter, $text: { $search: search } } : filter
    );

    res.json({
      success: true,
      data: {
        courses,
        pagination: {
          current: Number(page),
          pages: Math.ceil(total / limit),
          total,
          limit: Number(limit)
        }
      }
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
    const mongoose = require('mongoose');
    let course = null;
    
    // Try to find by MongoDB _id first
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      course = await Course.findById(req.params.id);
    }
    
    // If not found, try to find by Course_Id in Tbl_Courses collection
    if (!course) {
      const Tbl_Courses = require('../models/Tbl_Courses');
      course = await Tbl_Courses.findOne({ Course_Id: req.params.id });
    }
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Increment view count if method exists
    if (course.incrementViews) {
      await course.incrementViews();
    }

    res.json({
      success: true,
      data: course
    });

  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching course',
      error: error.message
    });
  }
});

// Create new course (Admin only)
router.post('/', authenticateToken, authorizeRole(['admin', 'instructor']), async (req, res) => {
  try {
    const courseData = {
      ...req.body,
      'instructor.name': req.body.instructor?.name || req.user.name
    };

    const course = new Course(courseData);
    await course.save();

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: course
    });

  } catch (error) {
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
router.put('/:id', authenticateToken, authorizeRole(['admin', 'instructor']), async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.json({
      success: true,
      message: 'Course updated successfully',
      data: course
    });

  } catch (error) {
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
      message: 'Error updating course',
      error: error.message
    });
  }
});

// Delete course
router.delete('/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

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

// Enroll in course
router.post('/:id/enroll', authenticateToken, async (req, res) => {
  try {
    const courseId = req.params.id;
    const userId = req.user.userId;

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if course is published
    if (course.status !== 'published') {
      return res.status(400).json({
        success: false,
        message: 'Course is not available for enrollment'
      });
    }

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already enrolled
    const alreadyEnrolled = user.enrolledCourses.some(
      enrollment => enrollment.courseId.toString() === courseId
    );

    if (alreadyEnrolled) {
      return res.status(400).json({
        success: false,
        message: 'Already enrolled in this course'
      });
    }

    // Check enrollment limit
    if (course.maxEnrollments && course.enrollmentCount >= course.maxEnrollments) {
      return res.status(400).json({
        success: false,
        message: 'Course enrollment limit reached'
      });
    }

    // Add enrollment to user
    user.enrolledCourses.push({
      courseId: courseId,
      enrolledAt: new Date(),
      progress: 0
    });

    await user.save();

    // Increment course enrollment count
    await course.incrementEnrollment();

    res.json({
      success: true,
      message: 'Successfully enrolled in course',
      data: {
        courseId,
        enrolledAt: new Date()
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error enrolling in course',
      error: error.message
    });
  }
});

// Get user's enrolled courses
router.get('/user/enrolled', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate({
        path: 'enrolledCourses.courseId',
        select: 'name thumbnail price instructor rating duration'
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user.enrolledCourses
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching enrolled courses',
      error: error.message
    });
  }
});

// Update course progress
router.put('/:id/progress', authenticateToken, async (req, res) => {
  try {
    const { progress } = req.body;
    const courseId = req.params.id;
    const userId = req.user.userId;

    if (progress < 0 || progress > 100) {
      return res.status(400).json({
        success: false,
        message: 'Progress must be between 0 and 100'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find the enrollment
    const enrollment = user.enrolledCourses.find(
      e => e.courseId.toString() === courseId
    );

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Not enrolled in this course'
      });
    }

    // Update progress
    enrollment.progress = progress;
    
    // Mark as completed if progress is 100%
    if (progress === 100 && !enrollment.completedAt) {
      enrollment.completedAt = new Date();
    }

    await user.save();

    res.json({
      success: true,
      message: 'Progress updated successfully',
      data: {
        courseId,
        progress,
        completedAt: enrollment.completedAt
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating progress',
      error: error.message
    });
  }
});

// Add course rating
router.post('/:id/rating', authenticateToken, async (req, res) => {
  try {
    const { rating, review } = req.body;
    const courseId = req.params.id;
    const userId = req.user.userId;

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Check if user is enrolled
    const user = await User.findById(userId);
    const isEnrolled = user.enrolledCourses.some(
      e => e.courseId.toString() === courseId
    );

    if (!isEnrolled) {
      return res.status(403).json({
        success: false,
        message: 'You must be enrolled to rate this course'
      });
    }

    // Update course rating
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    await course.updateRating(rating);

    res.json({
      success: true,
      message: 'Rating added successfully',
      data: {
        rating: course.rating
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding rating',
      error: error.message
    });
  }
});

// Middleware functions
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  const jwt = require('jsonwebtoken');
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    req.user = user;
    next();
  });
}

function authorizeRole(roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }
    next();
  };
}

module.exports = router;
