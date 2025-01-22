// server.js
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");

// Charger les variables d'environnement
dotenv.config();

// Configurer Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Créer l'application Express
const app = express();

// Configurer les options CORS
const corsOptions = {
  origin: "http://localhost:8000", // Remplacez par l'URL exacte utilisée par votre frontend
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Accept",
    "X-Requested-With",
  ],
  credentials: true,
};

// Utiliser le middleware CORS
app.use(cors(corsOptions));

// Middleware pour le traitement JSON
app.use(express.json());

// Configurer Multer pour les fichiers
const upload = multer({ dest: "upload/uploads/" });

// Connexion à MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connecté"))
  .catch((err) => console.error("Erreur de connexion MongoDB :", err));

// Tester la connexion Cloudinary au démarrage du serveur
(async () => {
  try {
    const result = await cloudinary.api.ping();
    console.log("Connexion à Cloudinary réussie :", result);
  } catch (error) {
    console.error("Erreur de connexion à Cloudinary :", error.message);
  }
})();

// Importer les routes Markdown
const markdownRoutes = require("./routes/markDownRoutes");

// Utiliser les routes importées
app.use("/api/routes/markdown", markdownRoutes);

// Définir le port du serveur
const PORT = process.env.PORT || 5000;

// Lancer le serveur
app.listen(PORT, () => {
  console.log(`Serveur en cours d'exécution sur le port ${PORT}`);
});
