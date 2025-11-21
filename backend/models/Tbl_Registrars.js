const mongoose = require("mongoose");

// Registrar_Id [PK], User_Id [FK], Contact_No, University_Id [FK]
const registrarsSchema = new mongoose.Schema(
  {
    User_Id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    Contact_No: { type: String, trim: true },
    University_Id: { type: mongoose.Schema.Types.ObjectId, ref: "Tbl_University", required: true },
  },
  { timestamps: true }
);

registrarsSchema.virtual("Registrar_Id").get(function () { return this._id; });

module.exports = mongoose.model("Tbl_Registrars", registrarsSchema);


