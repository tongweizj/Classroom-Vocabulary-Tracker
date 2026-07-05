const Prompt = require("../models/Prompt");

exports.list = async (req, res) => {
  try {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === "true";

    const prompts = await Prompt.find(filter).sort({ category: 1, name: 1 }).lean();
    res.json({ count: prompts.length, data: prompts });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch prompts.", error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, category, content } = req.body;
    if (!name || !content) {
      return res.status(400).json({ message: "name and content are required." });
    }
    const prompt = await Prompt.create({ name, category, content });
    res.status(201).json({ message: "Prompt created.", data: prompt });
  } catch (err) {
    res.status(500).json({ message: "Failed to create prompt.", error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { name, category, content, isActive } = req.body;
    const prompt = await Prompt.findByIdAndUpdate(
      req.params.id,
      { name, category, content, isActive },
      { new: true, runValidators: true }
    );
    if (!prompt) return res.status(404).json({ message: "Prompt not found." });
    res.json({ message: "Prompt updated.", data: prompt });
  } catch (err) {
    res.status(500).json({ message: "Failed to update prompt.", error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const prompt = await Prompt.findByIdAndDelete(req.params.id);
    if (!prompt) return res.status(404).json({ message: "Prompt not found." });
    res.json({ message: "Prompt deleted." });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete prompt.", error: err.message });
  }
};
