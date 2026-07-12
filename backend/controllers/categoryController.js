const createHttpError = require("http-errors");
const mongoose = require("mongoose");
const Category = require("../models/categoryModel");
const MenuItem = require("../models/menuItemModel");
const { CATEGORY_SEED } = require("../utils/menuSeedData");

/**
 * One-time seed: populates categories + menu items from CATEGORY_SEED if
 * the database is empty. Mirrors the existing seedTables() pattern.
 */
const seedMenu = async () => {
  try {
    const count = await Category.countDocuments();
    if (count > 0) {
      console.log("✅ Menu already seeded in DB");
      return;
    }
    for (const cat of CATEGORY_SEED) {
      const category = await Category.create({
        name: cat.name,
        icon: cat.icon,
        bgColor: cat.bgColor,
      });
      const items = cat.items.map((item) => ({ ...item, category: category._id }));
      await MenuItem.insertMany(items);
    }
    console.log("✅ Menu (categories + items) seeded into MongoDB");
  } catch (err) {
    console.error("❌ Menu seeding failed:", err.message);
  }
};

const addCategory = async (req, res, next) => {
  try {
    const { name, icon, bgColor } = req.body;
    if (!name) return next(createHttpError(400, "Category name is required!"));

    const existing = await Category.findOne({ name: name.trim() });
    if (existing) return next(createHttpError(400, "A category with this name already exists!"));

    const category = await Category.create({ name: name.trim(), icon, bgColor });
    res.status(201).json({ success: true, message: "Category added!", data: category });
  } catch (error) {
    next(error);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ createdAt: 1 });
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return next(createHttpError(400, "Invalid category id!"));

    const { name, icon, bgColor } = req.body;
    const update = {};
    if (name !== undefined) update.name = name.trim();
    if (icon !== undefined) update.icon = icon;
    if (bgColor !== undefined) update.bgColor = bgColor;

    const category = await Category.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!category) return next(createHttpError(404, "Category not found!"));
    res.status(200).json({ success: true, message: "Category updated!", data: category });
  } catch (error) {
    next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return next(createHttpError(400, "Invalid category id!"));

    const itemCount = await MenuItem.countDocuments({ category: id });
    if (itemCount > 0) {
      return next(createHttpError(400, `Cannot delete: ${itemCount} dish(es) still belong to this category. Delete or move them first.`));
    }

    const category = await Category.findByIdAndDelete(id);
    if (!category) return next(createHttpError(404, "Category not found!"));
    res.status(200).json({ success: true, message: "Category deleted!" });
  } catch (error) {
    next(error);
  }
};

module.exports = { seedMenu, addCategory, getCategories, updateCategory, deleteCategory };
