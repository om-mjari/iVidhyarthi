const mongoose = require("mongoose");

// University_Id [PK], University_Email, University_Name, Verification_Status, State, City
const universitySchema = new mongoose.Schema(
  {
    University_Email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email"],
    },
    University_Name: { type: String, required: true, trim: true },
    Verification_Status: { type: String, enum: ["pending", "verified", "rejected"], default: "pending" },
    State: { type: String, trim: true },
    City: { type: String, trim: true },
  },
  { timestamps: true }
);

// PK alias
universitySchema.virtual("University_Id").get(function () { return this._id; });

module.exports = mongoose.model("Tbl_University", universitySchema);


