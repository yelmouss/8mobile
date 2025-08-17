import { Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

// Constantes partagées pour assurer la cohérence
export const CARD_WIDTH = screenWidth * 0.9;
export const CARD_HEIGHT = CARD_WIDTH * (4/7); // Aspect ratio 7:4

// Fonctions utilitaires partagées
export const percentToPx = (percent, dimension) => {
  const containerSize = dimension === 'width' ? CARD_WIDTH : CARD_HEIGHT;
  return (percent / 100) * containerSize;
};

export const pxToPercent = (px, dimension) => {
  const containerSize = dimension === 'width' ? CARD_WIDTH : CARD_HEIGHT;
  return (px / containerSize) * 100;
};

// Fonction pour calculer la taille de police de manière cohérente
export const calculateFontSize = (widthPx, heightPx, storedFontSize = null) => {
  // Si une taille de police est explicitement stockée, l'utiliser
  if (storedFontSize && storedFontSize > 0) {
    return storedFontSize;
  }
  
  // Sinon, calculer basé sur les dimensions (comme dans l'app web)
  const minDimension = Math.min(widthPx, heightPx);
  const fontSizeFactor = 0.5; // Même facteur que dans l'app web
  return Math.round(Math.max(8, Math.min(72, minDimension * fontSizeFactor)));
};

// Fonction pour normaliser les valeurs numériques
export const toNum = (v, fallback) => {
  if (typeof v === "number" && isFinite(v)) return v;
  const n = parseFloat(v);
  return isFinite(n) ? n : fallback;
};
