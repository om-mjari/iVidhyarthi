const mongoose = require("mongoose");

// Lecturer_Id [PK], User_Id [FK], Full_Name, Mobile_No, DOB, Gender, Institute_Id [FK], Highest_Qualification, Specialization, Designation, Experience_Years
const lecturersSchema = new mongoose.Schema(
  {
    User_Id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    Full_Name: { type: String, required: true, trim: true },
    Mobile_No: { type: String, trim: true },
    DOB: { type: Date },
    Gender: { type: String, enum: ["male", "female", "other", "prefer-not-to-say"], trim: true },
    Institute_Id: { type: mongoose.Schema.Types.ObjectId, ref: "Tbl_Institutes", required: true },
    Highest_Qualification: { type: String, trim: true },
    Specialization: { type: String, trim: true },
    Designation: { type: String, trim: true },
    Experience_Years: { type: Number, min: 0 },
  },
  { timestamps: true }
);

lecturersSchema.virtual("Lecturer_Id").get(function () { return this._id; });

module.exports = mongoose.model("Tbl_Lecturers", lecturersSchema);


