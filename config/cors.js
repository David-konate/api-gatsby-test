const cors = require("cors");

const corsOptions = {
  origin: "http://localhost:3000", // Remplacez par l'URL de votre frontend
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Accept",
    "X-Requested-With", // Correction : déplacé à la bonne place
  ],
  credentials: true, // Permet l'envoi des cookies ou des en-têtes d'authentification
};

module.exports = cors(corsOptions);
