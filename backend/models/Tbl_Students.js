const mongoose = require("mongoose");

// Student_Id [PK], User_Id [FK], Full_Name, Mobile_No, Institution_Id [FK], Enrollment_Year, Branch, Course, Semester, Highest_Qualification, DOB, Gender
const studentsSchema = new mongoose.Schema(
  {
    User_Id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    Full_Name: { type: String, required: true, trim: true },
    Mobile_No: { type: String, trim: true },
    Institution_Id: { type: mongoose.Schema.Types.ObjectId, ref: "Tbl_Institutes" },
    Enrollment_Year: { type: Number, min: 1950, max: 2100 },
    Branch: { type: String, trim: true },
    Course: { type: String, trim: true },
    Semester: { type: String, trim: true },
    Highest_Qualification: { type: String, trim: true },
    DOB: { type: Date },
    Gender: { type: String, enum: ["male", "female", "other", "prefer-not-to-say"], trim: true },
  },
  { timestamps: true }
);

studentsSchema.virtual("Student_Id").get(function () { return this._id; });

module.exports = mongoose.model("Tbl_Students", studentsSchema);


