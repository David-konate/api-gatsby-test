const express = require("express");
const fs = require("fs");
const router = express.Router();
const cloudinary = require("cloudinary").v2;
const Markdown = require("../models/markdown");
const multer = require("multer");

const upload = multer({ dest: "upload/uploads/" });

// Route pour uploader un fichier Markdown
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    // Uploader le fichier Markdown sur Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "raw", // Importer comme fichier brut
    });

    // Supprimer le fichier temporaire
    fs.unlinkSync(req.file.path);

    // Sauvegarder les métadonnées dans MongoDB
    const markdown = new Markdown({
      title: req.body.title,
      category: req.body.category,
      url: result.secure_url,
    });

    await markdown.save();
    console.log("ok");
    // Réponse avec succès
    res.status(200).json({
      status: "success",
      message: "Fichier Markdown sauvegardé",
      data: markdown,
    });
  } catch (error) {
    console.error("Erreur lors de l'upload :", error);

    // Réponse d'erreur
    res.status(500).json({
      status: "error",
      message: "Erreur lors de l'upload",
      error: error.message || error,
    });
  }
});

// Route pour récupérer tous les fichiers Markdown
router.get("/", async (req, res) => {
  try {
    res.status(200).json({
      status: "success",
      message: "Fichier Markdown sauvegardé",
    });
  } catch (error) {
    console.error("Erreur lors de la récupération :", error);

    // Réponse d'erreur
    res.status(500).json({
      status: "error",
      message: "Erreur lors de la récupération",
      error: error.message || error,
    });
  }
});

module.exports = router;
