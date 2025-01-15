const mongoose = require("mongoose");

const markdownSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  url: { type: String, required: true }, // URL du fichier Markdown sur Cloudinary
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Markdown", markdownSchema);
