const mongoose = require("mongoose");

// Institute_Id [PK], Institute_Name, University_Id [FK], Courses_Offered
const instituteSchema = new mongoose.Schema(
  {
    Institute_Name: { type: String, required: true, trim: true },
    University_Id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tbl_University",
    },
    Courses_Offered: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

instituteSchema.virtual("Institute_Id").get(function () {
  return this._id;
});

module.exports = mongoose.model("Tbl_Institutes", instituteSchema);
