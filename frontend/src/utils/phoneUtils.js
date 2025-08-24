// Utilidades para normalizar números de teléfono

/**
 * Normaliza un número de teléfono eliminando espacios y caracteres especiales
 * @param {string} phoneNumber - Número de teléfono a normalizar
 * @returns {string} - Número normalizado
 */
export const normalizePhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '';
  
  // Convertir a string por si acaso
  phoneNumber = String(phoneNumber);
  
  // Eliminar todos los espacios, guiones y paréntesis
  let normalized = phoneNumber.replace(/[\s\-()]/g, '');
  
  // Si empieza con +, mantenerlo
  if (normalized.startsWith('+')) {
    return normalized;
  }
  
  // Si es un número español sin código de país, agregarlo
  if (normalized.length === 9 && (normalized.startsWith('6') || normalized.startsWith('7'))) {
    return `+34${normalized}`;
  }
  
  // Si empieza con 34 pero sin +, agregarlo
  if (normalized.startsWith('34')) {
    return `+${normalized}`;
  }
  
  // Si es solo números y tiene longitud de teléfono español completo con código
  if (normalized.length === 11 && normalized.startsWith('346')) {
    return `+${normalized}`;
  }
  
  // Si es un número largo (como un ID de WhatsApp Business)
  if (normalized.length > 11) {
    return normalized; // Devolver sin cambios
  }
  
  return normalized;
};

/**
 * Formatea un número de teléfono para mostrar
 * @param {string} phoneNumber - Número de teléfono a formatear
 * @returns {string} - Número formateado para mostrar
 */
export const formatPhoneNumber = (phoneNumber) => {
  const normalized = normalizePhoneNumber(phoneNumber);
  
  // Si es un número español
  if (normalized.startsWith('+34')) {
    const number = normalized.substring(3);
    // Formato: +34 XXX XX XX XX
    return `+34 ${number.substring(0, 3)} ${number.substring(3, 5)} ${number.substring(5, 7)} ${number.substring(7)}`;
  }
  
  return normalized;
};
