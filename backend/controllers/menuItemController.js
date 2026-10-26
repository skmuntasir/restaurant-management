const createHttpError = require("http-errors");
const mongoose = require("mongoose");
const MenuItem = require("../models/menuItemModel");
const Category = require("../models/categoryModel");

const addMenuItem = async (req, res, next) => {
  try {
    const { name, price, category, type, stock } = req.body;
    if (!name || price === undefined || !category) {
      return next(createHttpError(400, "name, price, and category are required!"));
    }
    if (!mongoose.Types.ObjectId.isValid(category)) {
      return next(createHttpError(400, "Invalid category id!"));
    }
    if (typeof price !== "number" || price < 0) {
      return next(createHttpError(400, "Price must be a non-negative number!"));
    }

    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) return next(createHttpError(404, "Category not found!"));

    const item = await MenuItem.create({
      name: name.trim(),
      price,
      category,
      type,
      stock: stock === "" || stock === undefined ? null : stock,
    });

    const populated = await item.populate("category", "name icon bgColor");
    res.status(201).json({ success: true, message: "Dish added!", data: populated });
  } catch (error) {
    next(error);
  }
};

const getMenuItems = async (req, res, next) => {
  try {
    const { category } = req.query;
    const filter = {};
    if (category) {
      if (!mongoose.Types.ObjectId.isValid(category)) return next(createHttpError(400, "Invalid category id!"));
      filter.category = category;
    }
    const items = await MenuItem.find(filter).populate("category", "name icon bgColor").sort({ createdAt: 1 }).lean();
    res.status(200).json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
};

const updateMenuItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return next(createHttpError(400, "Invalid item id!"));

    const { name, price, category, type, isAvailable, stock } = req.body;
    const update = {};
    if (name !== undefined) update.name = name.trim();
    if (price !== undefined) {
      if (typeof price !== "number" || price < 0) return next(createHttpError(400, "Price must be a non-negative number!"));
      update.price = price;
    }
    if (category !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(category)) return next(createHttpError(400, "Invalid category id!"));
      update.category = category;
    }
    if (type !== undefined) update.type = type;
    if (isAvailable !== undefined) update.isAvailable = isAvailable;
    if (stock !== undefined) update.stock = stock === "" ? null : stock;

    const item = await MenuItem.findByIdAndUpdate(id, update, { new: true, runValidators: true })
      .populate("category", "name icon bgColor");
    if (!item) return next(createHttpError(404, "Dish not found!"));
    res.status(200).json({ success: true, message: "Dish updated!", data: item });
  } catch (error) {
    next(error);
  }
};

// Quick toggle for the common "86 this item" action — separate from the
// general update endpoint so the frontend can fire it with one click.
const toggleAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return next(createHttpError(400, "Invalid item id!"));

    const item = await MenuItem.findById(id);
    if (!item) return next(createHttpError(404, "Dish not found!"));

    item.isAvailable = !item.isAvailable;
    await item.save();

    res.status(200).json({ success: true, message: `${item.name} marked as ${item.isAvailable ? "available" : "unavailable"}!`, data: item });
  } catch (error) {
    next(error);
  }
};

const deleteMenuItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return next(createHttpError(400, "Invalid item id!"));

    const item = await MenuItem.findByIdAndDelete(id);
    if (!item) return next(createHttpError(404, "Dish not found!"));
    res.status(200).json({ success: true, message: "Dish deleted!" });
  } catch (error) {
    next(error);
  }
};

module.exports = { addMenuItem, getMenuItems, updateMenuItem, toggleAvailability, deleteMenuItem };
