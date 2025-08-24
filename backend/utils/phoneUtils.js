// Utilidades para normalizar números de teléfono en el backend

/**
 * Normaliza un número de teléfono eliminando espacios y caracteres especiales
 * @param {string} phoneNumber - Número de teléfono a normalizar
 * @returns {string} - Número normalizado
 */
const normalizePhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '';
  
  // Eliminar todos los espacios, guiones y paréntesis
  let normalized = phoneNumber.replace(/[\s\-\(\)]/g, '');
  
  // Si empieza con +, mantenerlo
  if (normalized.startsWith('+')) {
    return normalized;
  }
  
  // Si es un número español sin código de país, agregarlo
  if (normalized.startsWith('6') || normalized.startsWith('7')) {
    return `+34${normalized}`;
  }
  
  // Si empieza con 34 pero sin +, agregarlo
  if (normalized.startsWith('34')) {
    return `+${normalized}`;
  }
  
  return normalized;
};

module.exports = { normalizePhoneNumber };
