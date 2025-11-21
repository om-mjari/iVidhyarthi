const mongoose = require("mongoose");

let Tbl_CourseCategories;

try {
  // If model already exists (hot reload), use existing model
  Tbl_CourseCategories = mongoose.model("Tbl_CourseCategories");
} catch (error) {
  
  const courseCategorySchema = new mongoose.Schema(
    {
      Category_Id: {
        type: Number,
        unique: true,
      },
      Category_Name: {
        type: String,
        required: [true, "Category name is required"],
        trim: true,
        unique: true,
      },
    },
    {
      collection: "tbl_coursecategories",
      timestamps: false,
    }
  );

  // Auto-generate incremental Category_Id
  courseCategorySchema.pre("save", async function (next) {
    try {
      if (!this.isNew) return next();

      const last = await mongoose
        .model("Tbl_CourseCategories")
        .findOne()
        .sort({ Category_Id: -1 });

      this.Category_Id = last ? last.Category_Id + 1 : 1;

      next();
    } catch (err) {
      next(err);
    }
  });

  Tbl_CourseCategories = mongoose.model(
    "Tbl_CourseCategories",
    courseCategorySchema
  );
}

module.exports = Tbl_CourseCategories;