// responseFormatter.js

/**
 * Fonction pour formater une réponse standardisée
 * @param {boolean} success - Indique si la réponse est positive ou négative
 * @param {string} message - Le message à envoyer dans la réponse
 * @param {Object} [data=null] - Données supplémentaires (facultatif)
 * @returns {Object} - L'objet de réponse formaté
 */
const formatResponse = (success, message, data = null) => {
  if (success) {
    return {
      status: "success",
      message,
      data,
    };
  } else {
    return {
      status: "error",
      message,
      data,
    };
  }
};

module.exports = { formatResponse };
