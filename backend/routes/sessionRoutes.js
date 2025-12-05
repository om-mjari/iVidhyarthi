const express = require("express");
const router = express.Router();
const Tbl_Sessions = require("../models/Tbl_Sessions");
const Tbl_Courses = require("../models/Tbl_Courses");
const Tbl_Lecturers = require("../models/Tbl_Lecturers");
const User = require("../models/User");
const zoomService = require("../config/zoom");

/**
 * Middleware: Verify lecturer authorization for a course
 * Attaches lecturerEmail to req.lecturer if authorized
 */
async function verifyLecturerCourseAuth(req, res, next) {
  try {
    const { course_id } = req.body.course_id ? req.body : req.query;
    const lecturerId = req.headers['x-lecturer-id'] || req.query.lecturer_id;

    if (!lecturerId) {
      return res.status(401).json({
        success: false,
        message: "Lecturer identification required"
      });
    }

    if (!course_id) {
      return res.status(400).json({
        success: false,
        message: "course_id is required"
      });
    }

    // Resolve lecturer identifier (email or ID)
    let lecturerEmail = lecturerId;
    
    if (lecturerId.includes('@')) {
      const user = await User.findOne({ email: lecturerId.toLowerCase() });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }
      
      const lecturer = await Tbl_Lecturers.findOne({ User_Id: user._id });
      if (!lecturer) {
        return res.status(404).json({
          success: false,
          message: "Lecturer profile not found"
        });
      }
      
      lecturerEmail = lecturerId.toLowerCase();
    }

    // Verify lecturer owns the course
    const course = await Tbl_Courses.findOne({ Course_Id: course_id });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    if (course.Lecturer_Id !== lecturerEmail) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to create session for this course"
      });
    }

    // Attach lecturer info to request
    req.lecturerEmail = lecturerEmail;
    req.course = course;
    next();
  } catch (error) {
    console.error('Authorization error:', error);
    res.status(500).json({
      success: false,
      message: "Authorization verification failed"
    });
  }
}

/**
 * POST /api/lecturer/sessions
 * Create a new Zoom meeting and persist in Tbl_Sessions
 * 
 * Body:
 * {
 *   "course_id": "COURSE123",
 *   "scheduled_at": "2025-12-15T14:00:00Z",
 *   "duration": 60,
 *   "title": "Week 5 Lecture"
 * }
 * 
 * Headers:
 *   x-lecturer-id: lecturer_email@example.com
 */
router.post("/", async (req, res) => {
  try {
    const { course_id, scheduled_at, duration, title, description } = req.body;

    // Validate required fields
    if (!course_id || !scheduled_at || !duration || !title) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: course_id, scheduled_at, duration, title"
      });
    }

    // Get lecturer ID from header
    const lecturerId = req.headers['x-lecturer-id'];
    if (!lecturerId) {
      return res.status(401).json({
        success: false,
        message: "Lecturer identification required. Please provide x-lecturer-id header."
      });
    }

    // Resolve lecturer and verify authorization
    let lecturerEmail = lecturerId;
    let lecturerDoc = null;
    
    if (lecturerId.includes('@')) {
      const user = await User.findOne({ email: lecturerId.toLowerCase() });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }
      
      lecturerDoc = await Tbl_Lecturers.findOne({ User_Id: user._id });
      if (!lecturerDoc) {
        return res.status(404).json({
          success: false,
          message: "Lecturer profile not found"
        });
      }
      
      lecturerEmail = lecturerId.toLowerCase();
    }

    // Verify course ownership
    const course = await Tbl_Courses.findOne({ Course_Id: course_id });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    if (course.Lecturer_Id !== lecturerEmail) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to create session for this course"
      });
    }

    // Validate meeting parameters
    const validationErrors = zoomService.validateMeetingParams({
      scheduled_at,
      duration,
      title
    });

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: validationErrors.join('; ')
      });
    }

    // Check if Zoom is configured
    if (!zoomService.isConfigured()) {
      console.warn('⚠️ Zoom not configured. Creating session without Zoom meeting.');
      
      // Create session without Zoom URL for development/testing
      const newSession = new Tbl_Sessions({
        Course_Id: course_id,
        Session_Url: null,
        Scheduled_At: new Date(scheduled_at),
        Duration: duration,
        Title: title.trim(),
        Description: description || '',
        Status: 'Scheduled',
        Host_Id: lecturerDoc?.Lecturer_Id || lecturerEmail
      });

      await newSession.save();

      console.log(`✅ Session created without Zoom: ${newSession.Session_Id}`);

      return res.status(201).json({
        success: true,
        message: "Session created successfully (Zoom not configured)",
        data: {
          session_id: newSession.Session_Id,
          course_id: newSession.Course_Id,
          session_url: newSession.Session_Url,
          scheduled_at: newSession.Scheduled_At,
          duration: newSession.Duration,
          title: newSession.Title,
          status: newSession.Status,
          zoom_configured: false
        }
      });
    }

    // Create Zoom meeting
    let zoomMeeting;
    try {
      zoomMeeting = await zoomService.createMeeting({
        topic: title.trim(),
        start_time: scheduled_at,
        duration: duration,
        timezone: 'UTC',
        agenda: description || `${course.Course_Name} - ${title}`
      });

      console.log('✅ Zoom meeting created:', zoomMeeting.meeting_id);
    } catch (zoomError) {
      console.error('❌ Zoom creation failed:', zoomError.message);
      
      // Return specific error for Zoom failure
      return res.status(502).json({
        success: false,
        message: `Failed to create Zoom meeting: ${zoomError.message}`
      });
    }

    // Create session record in database (in transaction-like operation)
    let newSession;
    try {
      newSession = new Tbl_Sessions({
        Course_Id: course_id,
        Session_Url: zoomMeeting.join_url,
        Scheduled_At: new Date(scheduled_at),
        Duration: duration,
        Title: title.trim(),
        Description: description || '',
        Status: 'Scheduled',
        Host_Id: lecturerDoc?.Lecturer_Id || lecturerEmail
      });

      await newSession.save();

      console.log(`✅ Session persisted to DB: ${newSession.Session_Id}`);
    } catch (dbError) {
      console.error('❌ Database save failed:', dbError.message);
      
      // TODO: In production, consider deleting the Zoom meeting here
      // as the database transaction failed
      
      return res.status(500).json({
        success: false,
        message: "Failed to save session to database"
      });
    }

    // Success response
    res.status(201).json({
      success: true,
      message: "Session created successfully",
      data: {
        session_id: newSession.Session_Id,
        course_id: newSession.Course_Id,
        session_url: newSession.Session_Url,
        scheduled_at: newSession.Scheduled_At,
        duration: newSession.Duration,
        title: newSession.Title,
        description: newSession.Description,
        status: newSession.Status,
        zoom_configured: true
      }
    });
  } catch (error) {
    console.error('❌ Session creation error:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error during session creation"
    });
  }
});

/**
 * GET /api/lecturer/sessions
 * Get paginated list of sessions for lecturer's courses
 * 
 * Query params:
 *   - lecturer_id: lecturer email or ID (required via header or query)
 *   - course_id: filter by specific course (optional)
 *   - page: page number (default: 1)
 *   - per_page: items per page (default: 20, max: 100)
 *   - sort: sort field (default: scheduled_at)
 *   - order: asc or desc (default: desc)
 * 
 * Headers:
 *   x-lecturer-id: lecturer_email@example.com
 */
router.get("/", async (req, res) => {
  try {
    const lecturerId = req.headers['x-lecturer-id'] || req.query.lecturer_id;
    
    if (!lecturerId) {
      return res.status(401).json({
        success: false,
        message: "Lecturer identification required"
      });
    }

    // Parse pagination params
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const per_page = Math.min(100, Math.max(1, parseInt(req.query.per_page) || 20));
    const skip = (page - 1) * per_page;
    
    // Parse sorting params (Default: ascending by scheduled time)
    const sortField = req.query.sort || 'Scheduled_At';
    const sortOrder = req.query.order === 'desc' ? -1 : 1;
    const sort = { [sortField]: sortOrder };

    // Resolve lecturer identifier
    let lecturerEmail = lecturerId;
    
    if (lecturerId.includes('@')) {
      const user = await User.findOne({ email: lecturerId.toLowerCase() });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }
      
      const lecturer = await Tbl_Lecturers.findOne({ User_Id: user._id });
      if (!lecturer) {
        return res.status(404).json({
          success: false,
          message: "Lecturer profile not found"
        });
      }
      
      lecturerEmail = lecturerId.toLowerCase();
    }

    // Get lecturer's courses
    const lecturerCourses = await Tbl_Courses.find({ 
      Lecturer_Id: lecturerEmail 
    });
    
    const courseIds = lecturerCourses.map(course => course.Course_Id);

    if (courseIds.length === 0) {
      return res.json({
        success: true,
        data: {
          sessions: [],
          pagination: {
            page,
            per_page,
            total: 0,
            total_pages: 0
          }
        }
      });
    }

    // Build query filter
    const filter = { Course_Id: { $in: courseIds } };
    
    // Optional course filter
    if (req.query.course_id) {
      if (!courseIds.includes(req.query.course_id)) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to view sessions for this course"
        });
      }
      filter.Course_Id = req.query.course_id;
    }

    // Get total count for pagination
    const total = await Tbl_Sessions.countDocuments(filter);
    const total_pages = Math.ceil(total / per_page);

    // Fetch sessions with pagination
    const sessions = await Tbl_Sessions
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(per_page)
      .lean();

    // Enrich with course names (handle string Course_Id)
    const enrichedSessions = await Promise.all(
      sessions.map(async (session) => {
        // Parse Course_Id if it's a numeric string
        const courseId = typeof session.Course_Id === 'string' && !isNaN(session.Course_Id)
          ? parseInt(session.Course_Id)
          : session.Course_Id;
        
        const course = lecturerCourses.find(c => c.Course_Id === courseId);
        
        // Auto-complete expired ongoing sessions
        let status = session.Status;
        if (status === 'Ongoing') {
          const now = new Date();
          const endTime = new Date(session.Scheduled_At.getTime() + session.Duration * 60000);
          if (now > endTime) {
            // Update status in database
            await Tbl_Sessions.findOneAndUpdate(
              { Session_Id: session.Session_Id },
              { Status: 'Completed', Ended_At: endTime }
            );
            status = 'Completed';
          }
        }
        
        return {
          session_id: session.Session_Id,
          course_id: session.Course_Id,
          course_name: course?.Title || 'Unknown Course',
          title: session.Title,
          session_url: session.Session_Url,
          scheduled_at: session.Scheduled_At,
          duration: session.Duration,
          status: status,
          description: session.Description,
          created_at: session.createdAt
        };
      })
    );

    res.json({
      success: true,
      data: {
        sessions: enrichedSessions,
        pagination: {
          page,
          per_page,
          total,
          total_pages,
          has_next: page < total_pages,
          has_prev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('❌ Sessions fetch error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch sessions"
    });
  }
});

/**
 * GET /api/lecturer/sessions/student
 * Get upcoming sessions for student's enrolled courses
 * 
 * Query params:
 *   - course_ids: comma-separated list of course IDs
 */
router.get("/student", async (req, res) => {
  try {
    const { course_ids } = req.query;
    
    if (!course_ids) {
      return res.json({
        success: true,
        data: []
      });
    }

    const courseIdArray = course_ids.split(',').filter(Boolean);
    
    if (courseIdArray.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Get sessions for these courses (Scheduled future sessions + Ongoing sessions)
    const now = new Date();
    const sessions = await Tbl_Sessions
      .find({
        Course_Id: { $in: courseIdArray },
        $or: [
          { Status: 'Ongoing' },
          { Status: 'Scheduled', Scheduled_At: { $gte: now } }
        ]
      })
      .sort({ Scheduled_At: 1 })
      .limit(10)
      .lean();

    // Enrich with course names
    const enrichedSessions = await Promise.all(
      sessions.map(async (session) => {
        const course = await Tbl_Courses.findOne({ Course_Id: session.Course_Id });
        
        // Auto-complete expired ongoing sessions
        let status = session.Status;
        if (status === 'Ongoing') {
          const endTime = new Date(session.Scheduled_At.getTime() + session.Duration * 60000);
          if (now > endTime) {
            // Update status in database
            await Tbl_Sessions.findOneAndUpdate(
              { Session_Id: session.Session_Id },
              { Status: 'Completed', Ended_At: endTime }
            );
            status = 'Completed';
          }
        }
        
        // Don't show completed sessions to students
        if (status === 'Completed') {
          return null;
        }
        
        return {
          session_id: session.Session_Id,
          course_id: session.Course_Id,
          course_name: course?.Course_Name || 'Unknown Course',
          title: session.Title,
          session_url: session.Session_Url,
          scheduled_at: session.Scheduled_At,
          duration: session.Duration,
          status: status,
          description: session.Description,
          session_type: session.Session_Type
        };
      })
    );

    // Filter out null values (completed sessions)
    const filteredSessions = enrichedSessions.filter(s => s !== null);

    res.json({
      success: true,
      data: filteredSessions
    });
  } catch (error) {
    console.error('❌ Student sessions fetch error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch sessions"
    });
  }
});

// Start a session (Lecturer only)
router.put('/:sessionId/start', async (req, res) => {
  try {
    const { sessionId } = req.params;
    console.log(`🚀 Starting session: ${sessionId}`);

    const session = await Tbl_Sessions.findOneAndUpdate(
      { Session_Id: sessionId, Status: 'Scheduled' },
      { 
        Status: 'Ongoing',
        Started_At: new Date()
      },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or already started'
      });
    }

    console.log(`✅ Session started: ${sessionId}`);
    res.json({
      success: true,
      message: 'Session started successfully',
      data: session
    });
  } catch (error) {
    console.error('❌ Error starting session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start session',
      error: error.message
    });
  }
});

// End a session (Lecturer only)
router.put('/:sessionId/end', async (req, res) => {
  try {
    const { sessionId } = req.params;
    console.log(`🛑 Ending session: ${sessionId}`);

    const session = await Tbl_Sessions.findOneAndUpdate(
      { Session_Id: sessionId, Status: 'Ongoing' },
      { 
        Status: 'Completed',
        Ended_At: new Date()
      },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or not currently ongoing'
      });
    }

    console.log(`✅ Session ended: ${sessionId}`);
    res.json({
      success: true,
      message: 'Session ended successfully',
      data: session
    });
  } catch (error) {
    console.error('❌ Error ending session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end session',
      error: error.message
    });
  }
});

module.exports = router;
