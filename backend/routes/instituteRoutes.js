const express = require("express");
const router = express.Router();
const Tbl_Institutes = require("../models/Tbl_Institutes");

// Get all institutes
router.get("/", async (req, res) => {
  try {
    const institutes = await Tbl_Institutes.find();
    res.json({
      success: true,
      data: institutes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching institutes",
      error: error.message,
    });
  }
});

// Get institute by ID
router.get("/:id", async (req, res) => {
  try {
    const institute = await Tbl_Institutes.findById(req.params.id);

    if (!institute) {
      return res.status(404).json({
        success: false,
        message: "Institute not found",
      });
    }

    res.json({
      success: true,
      data: institute,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching institute",
      error: error.message,
    });
  }
});

module.exports = router;
