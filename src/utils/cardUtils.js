import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

// Détection du type de background
export const detectBackgroundType = (value) => {
  if (!value) return 'color';
  
  if (value.startsWith('#') || value.startsWith('rgb') || value.startsWith('hsl')) {
    return 'color';
  }
  
  if (value.includes('gradient') || value.includes('linear-gradient') || value.includes('radial-gradient')) {
    return 'gradient';
  }
  
  if (value.includes('http') || value.includes('/') || value.includes('.')) {
    return 'image';
  }
  
  return 'color';
};

// Picker d'image avec permissions
export const pickImage = async (options = {}) => {
  try {
    // Demander les permissions
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission requise', 'L\'accès à la galerie est nécessaire pour sélectionner une image.');
      return null;
    }

    // Configuration par défaut
    const config = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: options.aspect || [4, 3],
      quality: options.quality || 0.8,
      ...options
    };

    const result = await ImagePicker.launchImageLibraryAsync(config);
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0];
    }
    
    return null;
  } catch (error) {
    console.error('Erreur lors de la sélection d\'image:', error);
    Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    return null;
  }
};

// Prendre une photo avec la caméra
export const takePhoto = async (options = {}) => {
  try {
    // Demander les permissions
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission requise', 'L\'accès à la caméra est nécessaire pour prendre une photo.');
      return null;
    }

    // Configuration par défaut
    const config = {
      allowsEditing: true,
      aspect: options.aspect || [4, 3],
      quality: options.quality || 0.8,
      ...options
    };

    const result = await ImagePicker.launchCameraAsync(config);
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0];
    }
    
    return null;
  } catch (error) {
    console.error('Erreur lors de la prise de photo:', error);
    Alert.alert('Erreur', 'Impossible de prendre la photo');
    return null;
  }
};

// Upload d'un fichier vers le serveur
export const uploadFile = async (fileUri, type = 'image') => {
  try {
    const formData = new FormData();
    const filename = fileUri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const fileType = match ? `${type}/${match[1]}` : `${type}`;

    formData.append('file', {
      uri: fileUri,
      name: filename,
      type: fileType,
    });
    
    if (type === 'background') {
      formData.append('type', 'background');
    }

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de l\'upload');
    }

    return data;
  } catch (error) {
    console.error('Erreur upload:', error);
    throw error;
  }
};

// Fonction complète pour sélectionner et uploader une image
export const selectAndUploadImage = async (type = 'image', options = {}) => {
  try {
    // Permettre de choisir entre galerie et caméra
    const choice = await new Promise((resolve) => {
      Alert.alert(
        'Sélectionner une image',
        'Comment souhaitez-vous ajouter votre image ?',
        [
          { text: 'Annuler', style: 'cancel', onPress: () => resolve(null) },
          { text: 'Galerie', onPress: () => resolve('gallery') },
          { text: 'Caméra', onPress: () => resolve('camera') },
        ],
        { cancelable: true, onDismiss: () => resolve(null) }
      );
    });

    if (!choice) return null;

    let imageResult;
    if (choice === 'gallery') {
      imageResult = await pickImage(options);
    } else {
      imageResult = await takePhoto(options);
    }

    if (!imageResult) return null;

    // Upload du fichier
    const uploadResult = await uploadFile(imageResult.uri, type);
    
    return {
      ...uploadResult,
      localUri: imageResult.uri,
      width: imageResult.width,
      height: imageResult.height,
    };
  } catch (error) {
    console.error('Erreur lors de la sélection/upload:', error);
    Alert.alert('Erreur', error.message || 'Impossible de traiter l\'image');
    return null;
  }
};

// Générer un matricule unique
export const generateMatricule = () => {
  const prefix = 'C';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}-${random}`;
};

// Valider les dimensions d'une image
export const validateImageDimensions = (width, height, maxWidth = 2048, maxHeight = 2048) => {
  if (width > maxWidth || height > maxHeight) {
    return {
      valid: false,
      message: `L'image est trop grande. Taille maximale: ${maxWidth}x${maxHeight}px`,
    };
  }
  
  if (width < 50 || height < 50) {
    return {
      valid: false,
      message: 'L\'image est trop petite. Taille minimale: 50x50px',
    };
  }
  
  return { valid: true };
};

// Obtenir les dimensions optimales pour un élément
export const getOptimalElementSize = (containerWidth, containerHeight, elementType) => {
  const baseWidth = containerWidth || 350;
  const baseHeight = containerHeight || 200;
  
  switch (elementType) {
    case 'text':
      return {
        width: Math.round((baseWidth * 0.3) / baseWidth * 100), // 30%
        height: Math.round((baseHeight * 0.15) / baseHeight * 100), // 15%
      };
    case 'image':
      return {
        width: Math.round((baseWidth * 0.25) / baseWidth * 100), // 25%
        height: Math.round((baseHeight * 0.2) / baseHeight * 100), // 20%
      };
    case 'audio':
      return {
        width: Math.round((baseWidth * 0.15) / baseWidth * 100), // 15%
        height: Math.round((baseHeight * 0.1) / baseHeight * 100), // 10%
      };
    default:
      return { width: 20, height: 15 };
  }
};

// Calculer une taille de police appropriée
export const calculateFontSize = (width, height, textLength = 10) => {
  const minDimension = Math.min(width, height);
  const baseFontSize = 24;
  const scaleFactor = Math.max(0.5, Math.min(1, 8 / Math.max(8, textLength)));
  return Math.round(Math.max(8, Math.min(72, minDimension * 0.5 * scaleFactor)));
};

// Couleurs prédéfinies pour l'interface
export const predefinedColors = [
  '#ffffff', '#f8f9fa', '#e9ecef', '#dee2e6', '#ced4da', '#adb5bd',
  '#6c757d', '#495057', '#343a40', '#212529', '#000000',
  '#dc3545', '#fd7e14', '#ffc107', '#28a745', '#20c997', '#17a2b8',
  '#6f42c1', '#e83e8c', '#007bff', '#6610f2', '#d63384', '#198754',
];

// Gradients prédéfinis
export const predefinedGradients = [
  { type: 'gradient', value: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)', name: 'Purple Blue' },
  { type: 'gradient', value: 'linear-gradient(45deg, #f093fb 0%, #f5576c 100%)', name: 'Pink Red' },
  { type: 'gradient', value: 'linear-gradient(45deg, #4facfe 0%, #00f2fe 100%)', name: 'Blue Cyan' },
  { type: 'gradient', value: 'linear-gradient(45deg, #43e97b 0%, #38f9d7 100%)', name: 'Green Mint' },
  { type: 'gradient', value: 'linear-gradient(45deg, #fa709a 0%, #fee140 100%)', name: 'Pink Yellow' },
  { type: 'gradient', value: 'linear-gradient(45deg, #a8edea 0%, #fed6e3 100%)', name: 'Soft Pastel' },
  { type: 'gradient', value: 'linear-gradient(45deg, #ff9a9e 0%, #fecfef 100%)', name: 'Rose Pink' },
  { type: 'gradient', value: 'linear-gradient(45deg, #ffecd2 0%, #fcb69f 100%)', name: 'Peach' },
];

// Utilitaires de validation
export const validation = {
  isValidUrl: (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },
  
  isValidColor: (color) => {
    const s = new Option().style;
    s.color = color;
    return s.color !== '';
  },
  
  isValidText: (text, minLength = 1, maxLength = 500) => {
    return typeof text === 'string' && text.length >= minLength && text.length <= maxLength;
  },
};

export default {
  detectBackgroundType,
  pickImage,
  takePhoto,
  uploadFile,
  selectAndUploadImage,
  generateMatricule,
  validateImageDimensions,
  getOptimalElementSize,
  calculateFontSize,
  predefinedColors,
  predefinedGradients,
  validation,
};
