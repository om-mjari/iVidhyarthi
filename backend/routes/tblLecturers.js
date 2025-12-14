const express = require("express");
const Tbl_Lecturers = require("../models/Tbl_Lecturers");
const router = express.Router();

// Test route to verify this file is loaded
router.get("/test", (req, res) => {
  res.json({ success: true, message: "tbl-lecturers route is working!" });
});

// Get all lecturers
router.get("/", async (req, res) => {
  try {
    const lecturers = await Tbl_Lecturers.find().sort({ Created_At: -1 });
    res.json({
      success: true,
      data: lecturers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching lecturers",
      error: error.message,
    });
  }
});

// Get single lecturer by ID
router.get("/:id", async (req, res) => {
  try {
    const lecturerId = parseInt(req.params.id, 10);

    if (isNaN(lecturerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lecturer ID format",
      });
    }

    const lecturer = await Tbl_Lecturers.findOne({ Lecturer_Id: lecturerId });

    if (!lecturer) {
      return res.status(404).json({
        success: false,
        message: "Lecturer not found",
      });
    }

    res.json({
      success: true,
      data: lecturer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching lecturer",
      error: error.message,
    });
  }
});

module.exports = router;
