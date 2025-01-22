const express = require("express");
const router = express.Router();
const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");
const Blog = require("../models/Blog");
const fs = require("fs");

// Configuration de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
// Route pour enregistrer un article avec son contenu Markdown et ses images
const storage = multer.memoryStorage(); // Stockage en mémoire des fichiers
const upload = multer({ storage: storage }).fields([
  { name: "markdown", maxCount: 1 }, // Champ pour le fichier markdown
  { name: "imagesSections", maxCount: 10 }, // Correspond au champ pour les sections
  { name: "imageTitleData", maxCount: 1 }, // Correspond au champ pour l'image titre
]);

// Route pour uploader des images sur Cloudinary
router.post(`/upload/images/:slug`, upload, async (req, res) => {
  try {
    const files = req.files; // Récupérer les fichiers via req.files
    let slug = req.params.slug; // Le slug passé dans l'URL

    // Vérifications initiales
    if (!files || (!files.imagesSections && !files.imageTitleData)) {
      return res.status(400).json({
        status: "error",
        message: "Aucune image reçue.",
      });
    }

    if (!slug) {
      return res.status(400).json({
        status: "error",
        message: "Le slug est manquant.",
      });
    }

    // Vérification si le slug existe déjà dans Cloudinary
    const slugExists = await checkCloudinaryExistence(
      "markdown_articles",
      slug
    );

    if (slugExists) {
      // Si le slug existe déjà, générer un slug unique
      slug = await generateUniqueSlug(slug);
    }

    const imageUrls = [];
    let imageTitleDataUrl = null; // URL pour l'image titre

    // Gestion de l'image titre (imageTitleData)
    if (files.imageTitleData && files.imageTitleData[0]) {
      const titleFile = files.imageTitleData[0];
      const titleImageName = titleFile.originalname;

      const titlePath = `markdown_articles/${slug}`;

      // Vérifier si l'image titre existe déjà sur Cloudinary
      const imageTitleDataExists = await checkCloudinaryExistence(
        titlePath,
        titleImageName
      );

      if (imageTitleDataExists) {
        imageTitleDataUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/v1/${titlePath}/${titleImageName}`;
      } else {
        // Upload de l'image titre si elle n'existe pas encore
        const uploadResponse = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              resource_type: "auto",
              folder: titlePath,
              public_id: titleImageName.split(".")[0],
              transformation: [
                { width: 1200, height: 628, crop: "fill" }, // Dimensions pour l'image titre
              ],
            },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result);
              }
            }
          );

          uploadStream.end(titleFile.buffer);
        });

        imageTitleDataUrl = uploadResponse.secure_url;
      }
    }

    // Gestion des images des sections (imagesSections)
    if (files.imagesSections && files.imagesSections.length > 0) {
      for (let index = 0; index < files.imagesSections.length; index++) {
        const file = files.imagesSections[index];
        const imageName = file.originalname;

        const folderPath = `markdown_articles/${slug}/images`;

        // Vérifier si l'image existe déjà dans le dossier approprié
        const imageExists = await checkCloudinaryExistence(
          folderPath,
          imageName
        );

        if (imageExists) {
          imageUrls.push(
            `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/v1/${folderPath}/${imageName}`
          );
        } else {
          // Upload de l'image si elle n'existe pas encore
          const uploadResponse = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                resource_type: "auto",
                folder: folderPath,
                public_id: imageName.split(".")[0],
                transformation: [
                  { width: 800, height: 600, crop: "fill" }, // Dimensions pour les sections
                ],
              },
              (error, result) => {
                if (error) {
                  reject(error);
                } else {
                  resolve(result);
                }
              }
            );

            uploadStream.end(file.buffer);
          });

          imageUrls.push(uploadResponse.secure_url);
        }
      }
    }

    // Répondre avec les URLs des images téléchargées
    return res.status(200).json({
      status: "success",
      message: "Images téléchargées avec succès.",
      secure_urls: imageUrls,
      image_title_url: imageTitleDataUrl, // Retourne également l'image titre
      slug: slug,
    });
  } catch (error) {
    console.error("Erreur lors de l'upload des images:", error);
    return res.status(500).json({
      status: "error",
      message: "Une erreur est survenue lors du téléchargement des images.",
      error: error.message,
    });
  }
});

// Fonction pour vérifier l'existence d'un fichier ou dossier dans Cloudinary
const checkCloudinaryExistence = async (folder, fileName = "") => {
  try {
    const response = await cloudinary.api.resources({
      type: "upload",
      prefix: fileName ? `${folder}/${fileName}` : folder,
      max_results: 1,
    });
    return response.resources.length > 0;
  } catch (error) {
    console.error("Erreur lors de la vérification dans Cloudinary:", error);
    throw new Error("Erreur lors de la vérification dans Cloudinary.");
  }
};

// Fonction pour générer un slug unique pour les articles
const generateUniqueSlug = async (baseSlug) => {
  let slug = baseSlug;
  let counter = 1;

  // Vérification si le slug existe déjà dans Cloudinary
  while (await checkCloudinaryExistence(`markdown_articles/${slug}`)) {
    slug = `${baseSlug}_${counter}`;
    counter++;
  }

  return slug;
};

// Route pour vérifier l'existence du slug et générer un slug unique si nécessaire
router.get("/check-or-generate-slug/:slug", async (req, res) => {
  let slug = req.params.slug; // Récupère le slug depuis l'URL
  if (!slug) {
    return res.status(400).json({
      status: "error",
      message: 'Le paramètre "slug" est requis.',
    });
  }

  try {
    // Vérification si le slug existe déjà dans Cloudinary
    const slugExists = await checkCloudinaryExistence(
      "markdown_articles",
      slug
    );

    if (slugExists) {
      // Si le slug existe déjà, générer un slug unique
      const uniqueSlug = await generateUniqueSlug(slug);
      return res.status(200).json({
        status: "success",
        exists: true,
        uniqueSlug,
      });
    } else {
      // Si le slug n'existe pas, retourner le slug d'origine
      return res.status(200).json({
        status: "success",
        exists: false,
        uniqueSlug: slug,
      });
    }
  } catch (error) {
    console.error(
      "Erreur lors de la vérification ou génération du slug:",
      error
    );
    return res.status(500).json({
      status: "error",
      message:
        "Une erreur est survenue lors de la vérification ou génération du slug.",
      error: error.message,
    });
  }
});

router.post("/save/:slug", upload, async (req, res) => {
  console.log("req.files", req.files);

  try {
    // Vérifiez que le fichier Markdown est présent
    if (!req.files || !req.files.markdown || req.files.markdown.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Aucun fichier Markdown reçu.",
      });
    }

    // Vérifiez que le slug est présent
    const slug = req.params.slug; // Le slug est dans les paramètres de l'URL
    if (!slug) {
      return res.status(400).json({
        status: "error",
        message: "Slug manquant.",
      });
    }

    // Récupérer le fichier Markdown (le buffer du fichier)
    const file = req.files.markdown[0]; // Récupération du premier fichier Markdown

    // Envoi du fichier à Cloudinary
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw", // Type de fichier non-image
        public_id: `${slug}.md`, // Utiliser le slug comme nom du fichier
        folder: `markdown_articles/${slug}`, // Nom du dossier basé sur le slug
      },
      (error, result) => {
        if (error) {
          return res.status(500).json({
            status: "error",
            message: "Erreur Cloudinary",
            error: error.message,
          });
        }

        console.log("Fichier Markdown téléchargé sur Cloudinary : ", result);

        // Répondre avec l'URL du fichier téléchargé
        res.status(200).json({
          status: "success",
          message: "Fichier Markdown téléchargé avec succès.",
          markdownUrl: result.secure_url, // URL sécurisée du fichier
        });
      }
    );

    // Envoyer l
    // e buffer du fichier à Cloudinary via un stream
    stream.end(file.buffer); // Utiliser le buffer du fichier pour le télécharger
  } catch (error) {
    console.error("Erreur lors de l'enregistrement du Markdown :", error);
    res.status(500).json({
      status: "error",
      message:
        "Une erreur est survenue lors de l'enregistrement du fichier Markdown.",
      error: error.message,
    });
  }
});

// Route pour récupérer les fichiers Markdown depuis Cloudinary
router.get("/articles", async (req, res) => {
  try {
    // Recherche des fichiers Markdown sur Cloudinary
    const result = await cloudinary.search
      .expression("resource_type:raw AND format:md") // Filtre pour les fichiers Markdown
      .max_results(50) // Limite des résultats
      .execute();

    if (!result.resources || result.resources.length === 0) {
      return res.status(404).json({ message: "Aucun fichier Markdown trouvé" });
    }

    // Mappe les résultats pour ne retourner que les informations nécessaires
    const markdownFiles = result.resources.map((file) => ({
      public_id: file.public_id,
      url: file.secure_url,
      format: file.format,
    }));

    // Réponse avec les fichiers Markdown
    res.status(200).json({
      status: "success",
      data: markdownFiles,
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des fichiers Markdown depuis Cloudinary:",
      error
    );
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
