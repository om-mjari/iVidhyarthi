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

// Create new institute
router.post("/", async (req, res) => {
  try {
    const { name, courses } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Institute name is required",
      });
    }

    const newInstitute = new Tbl_Institutes({
      Institute_Name: name,
      Courses_Offered: courses || "",
    });

    await newInstitute.save();

    res.status(201).json({
      success: true,
      message: "Institute created successfully",
      data: newInstitute,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating institute",
      error: error.message,
    });
  }
});

// Update institute
router.put("/:id", async (req, res) => {
  try {
    const { name, courses, status } = req.body;
    
    const updateData = {};
    if (name) updateData.Institute_Name = name;
    if (courses !== undefined) updateData.Courses_Offered = courses;
    if (status !== undefined) updateData.status = status;

    const updatedInstitute = await Tbl_Institutes.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedInstitute) {
      return res.status(404).json({
        success: false,
        message: "Institute not found",
      });
    }

    res.json({
      success: true,
      message: "Institute updated successfully",
      data: updatedInstitute,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating institute",
      error: error.message,
    });
  }
});

// Delete institute
router.delete("/:id", async (req, res) => {
  try {
    const deletedInstitute = await Tbl_Institutes.findByIdAndDelete(
      req.params.id
    );

    if (!deletedInstitute) {
      return res.status(404).json({
        success: false,
        message: "Institute not found",
      });
    }

    res.json({
      success: true,
      message: "Institute deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting institute",
      error: error.message,
    });
  }
});

module.exports = router;
