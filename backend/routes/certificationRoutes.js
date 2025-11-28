const express = require("express");
const router = express.Router();
const Certificate = require("../models/Tbl_Certificates");

// Get certificates by student ID
router.get("/:studentId", async (req, res) => {
  try {
    const certificates = await Certificate.find({
      Student_Id: req.params.studentId,
    });
    res.json({ success: true, data: certificates });
  } catch (error) {
    console.error("Error fetching certificates:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
