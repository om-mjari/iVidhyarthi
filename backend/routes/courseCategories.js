const express = require("express");
const Tbl_CourseCategories = require("../models/Tbl_CourseCategories");
const router = express.Router();

/* -----------------------------------------------------
   STATIC ROUTES FIRST  (These must always come first)
----------------------------------------------------- */

/** GET ALL CATEGORIES */
router.get("/", async (req, res) => {
  try {
    const categories = await Tbl_CourseCategories.find().sort({ Category_Name: 1 });
    return res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching categories",
      error: error.message,
    });
  }
});

/** CREATE CATEGORY */
router.post("/", async (req, res) => {
  try {
    const { Category_Name } = req.body;

    if (!Category_Name || !Category_Name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    const exists = await Tbl_CourseCategories.findOne({
      Category_Name: Category_Name.trim(),
    });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Category already exists",
      });
    }

    const category = new Tbl_CourseCategories({
      Category_Name: Category_Name.trim(),
    });

    await category.save();

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error creating category",
      error: error.message,
    });
  }
});

/** SEED DEFAULT CATEGORIES — MUST BE BEFORE /:id */
router.post("/seed", async (req, res) => {
  try {
    const defaultCategories = [
      { Category_Name: "Programming" },
      { Category_Name: "Web Development" },
      { Category_Name: "Mobile App Development" },
      { Category_Name: "Data Science" },
      { Category_Name: "Cloud Computing" },
      { Category_Name: "Networking" },
      { Category_Name: "Cyber Security" },
      { Category_Name: "Designing" },
      { Category_Name: "Business / Management" },
      { Category_Name: "Language Learning" }
    ];

    const count = await Tbl_CourseCategories.countDocuments();

    if (count > 0) {
      return res.json({
        success: true,
        message: "Categories already exist",
        data: await Tbl_CourseCategories.find(),
      });
    }

    await Tbl_CourseCategories.insertMany(defaultCategories);

    return res.status(201).json({
      success: true,
      message: "Default categories seeded successfully",
      data: await Tbl_CourseCategories.find(),
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error seeding categories",
      error: error.message,
    });
  }
});

/* -----------------------------------------------------
   DYNAMIC ROUTES LAST (/:id MUST ALWAYS COME AT BOTTOM)
----------------------------------------------------- */

/** GET CATEGORY BY ID */
router.get("/:id", async (req, res) => {
  try {
    const category = await Tbl_CourseCategories.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    return res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching category",
      error: error.message,
    });
  }
});

/** UPDATE CATEGORY */
router.put("/:id", async (req, res) => {
  try {
    const { Category_Name } = req.body;

    if (!Category_Name || !Category_Name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    const updated = await Tbl_CourseCategories.findByIdAndUpdate(
      req.params.id,
      { Category_Name: Category_Name.trim() },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    return res.json({
      success: true,
      message: "Category updated successfully",
      data: updated,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error updating category",
      error: error.message,
    });
  }
});

/** DELETE CATEGORY */
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Tbl_CourseCategories.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    return res.json({
      success: true,
      message: "Category deleted successfully",
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error deleting category",
      error: error.message,
    });
  }
});

module.exports = router;