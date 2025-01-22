const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema({
  title: { type: String, required: false }, // Permet des chaînes vides
  author: { type: String, required: false }, // Permet des chaînes vides
  date: { type: Date, default: Date.now },
  category: { type: String, required: false }, // Permet des chaînes vides
  resume: { type: String, required: false }, // Permet des chaînes vides
  slug: { type: String, required: false, unique: true }, // Permet des chaînes vides
  image: { type: String, required: false }, // Permet des chaînes vides
  cardImage: { type: String, required: false }, // Permet des chaînes vides
  markdownUrl: { type: String, required: false }, // Permet des chaînes vides
});

module.exports = mongoose.model("Blog", blogSchema);
