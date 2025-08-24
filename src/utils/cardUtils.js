// --- Fonctions extraites de CardEditorScreenSimple.js ---
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
// Extraire l'index numérique d'un index d'élément (ex: 'element-2' => 2)
export const getNumericIndex = (elementIndexString) => {
  if (typeof elementIndexString === "number") return elementIndexString;
  if (
    typeof elementIndexString === "string" &&
    elementIndexString.includes("-")
  ) {
    return parseInt(elementIndexString.split("-")[1]);
  }
  return elementIndexString;
};

// Ajout d'un nouvel élément à la carte
export const addElementToCard = (currentCard, type, generateMatricule) => {
  // Si pas de carte courante, créer une carte vide
  let card = currentCard;
  if (!card) {
    card = {
      name: "Nouvelle carte",
      matricule: generateMatricule(),
      elements: [],
    };
  }
  const newElement = {
    id: Date.now().toString(),
    type: type === "vline" ? "line" : type,
    content:
      type === "text"
        ? "Nouveau texte"
        : type === "image"
        ? "https://via.placeholder.com/150x150/cccccc/666666?text=Image"
        : "",
    position: {
      x: 25,
      y: 25,
    },
    style:
      type === "text"
        ? {
            width: 30,
            height: 10,
            fontSize: 16,
            fontFamily: "Arial, sans-serif",
            fontWeight: "normal",
            fontStyle: "normal",
            textDecoration: "none",
            textAlign: "left",
            color: "#000000",
            backgroundColor: "transparent",
            opacity: 1,
            borderRadius: 0,
            borderWidth: 0,
            borderColor: "transparent",
            padding: 5,
          }
        : type === "image"
        ? {
            width: 25,
            height: 25,
            opacity: 1,
            borderRadius: 0,
            borderWidth: 0,
            borderColor: "transparent",
            backgroundColor: "transparent",
          }
        : type === "line"
        ? {
            width: 50,
            height: 2,
            backgroundColor: "#000000",
            opacity: 1,
            borderRadius: 0,
          }
        : type === "vline"
        ? {
            width: 2,
            height: 50,
            backgroundColor: "#000000",
            opacity: 1,
            borderRadius: 0,
          }
        : {
            width: 20,
            height: 10,
          },
    enabled: true,
  };
  const currentElements = card.elements || [];
  const updatedElements = [...currentElements, newElement];
  return {
    ...card,
    elements: updatedElements,
  };
};

// Supprimer un élément d'une carte
export const deleteElementFromCard = (currentCard, elementIndexString) => {
  if (!currentCard || elementIndexString === null) return currentCard;
  const elementIndex = getNumericIndex(elementIndexString);
  const currentElements = currentCard.elements || [];
  if (elementIndex >= 0 && elementIndex < currentElements.length) {
    const updatedElements = currentElements.filter((_, index) => index !== elementIndex);
    return {
      ...currentCard,
      elements: updatedElements,
    };
  }
  return currentCard;
};

// Dupliquer un élément d'une carte
export const duplicateElementInCard = (currentCard, elementIndexString) => {
  if (!currentCard?.elements) return currentCard;
  const numericIndex = getNumericIndex(elementIndexString);
  const element = currentCard.elements[numericIndex];
  if (element) {
    const duplicated = {
      ...element,
      id: Date.now().toString(),
      position: {
        x: (element.position?.x || 0) + 5,
        y: (element.position?.y || 0) + 5,
      },
    };
    return {
      ...currentCard,
      elements: [...currentCard.elements, duplicated],
    };
  }
  return currentCard;
};

// Aligner un élément dans la carte
export const alignElementInCard = (currentCard, selectedElementIndex, alignment) => {
  if (!currentCard?.elements || selectedElementIndex === null) return currentCard;
  const numericIndex = getNumericIndex(selectedElementIndex);
  const updatedElements = [...currentCard.elements];
  const element = updatedElements[numericIndex];
  if (element) {
    let newPosition = { ...element.position };
    switch (alignment) {
      case "left":
        newPosition.x = 5;
        break;
      case "center":
        newPosition.x = 50 - (element.style?.width || 20) / 2;
        break;
      case "right":
        newPosition.x = 95 - (element.style?.width || 20);
        break;
      case "top":
        newPosition.y = 5;
        break;
      case "middle":
        newPosition.y = 50 - (element.style?.height || 10) / 2;
        break;
      case "bottom":
        newPosition.y = 95 - (element.style?.height || 10);
        break;
    }
    updatedElements[numericIndex] = {
      ...element,
      position: newPosition,
    };
    return {
      ...currentCard,
      elements: updatedElements,
    };
  }
  return currentCard;
};


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

// Mettre à jour l'état isActive d'une carte côté serveur via l'apiFetch fourni
export const patchCardIsActive = async (cardId, newValue, apiFetch) => {
  if (!cardId || !apiFetch) {
    throw new Error('cardId and apiFetch are required');
  }

  const response = await apiFetch(`/api/cartes/${cardId}`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive: newValue }),
  });

  return response;
};

// Construire/mettre à jour un objet carte avec une nouvelle liste d'éléments
export const buildCardWithElements = (currentCard, newElements, name, matricule, generateMatriculeFn) => {
  if (!currentCard) {
    return {
      name: name || 'Nouvelle carte',
      matricule: matricule || (generateMatriculeFn ? generateMatriculeFn() : 'C-000000-000'),
      elements: newElements || [],
    };
  }

  return {
    ...currentCard,
    elements: newElements || [],
  };
};

// Mettre à jour le style d'un élément dans une carte (retourne une nouvelle carte)
export const updateElementStyleInCard = (currentCard, elementIndexOrString, styleUpdates) => {
  if (!currentCard?.elements) return currentCard;
  const index = getNumericIndex(elementIndexOrString);
  const updatedElements = [...currentCard.elements];
  if (updatedElements[index]) {
    updatedElements[index] = {
      ...updatedElements[index],
      style: {
        ...updatedElements[index].style,
        ...styleUpdates,
      },
    };
    return {
      ...currentCard,
      elements: updatedElements,
    };
  }
  return currentCard;
};

// Récupérer un élément texte par index (nombre ou 'element-N')
export const getTextElementFromCard = (currentCard, elementIndexOrString) => {
  if (!currentCard?.elements) return null;
  const idx = getNumericIndex(elementIndexOrString);
  const el = currentCard.elements[idx];
  return el && el.type === 'text' ? el : null;
};

// Remplacer le contenu texte d'un élément et renvoyer la carte mise à jour
export const setTextContentInCard = (currentCard, elementIndexOrString, newText) => {
  if (!currentCard?.elements) return currentCard;
  const idx = getNumericIndex(elementIndexOrString);
  const updatedElements = [...currentCard.elements];
  if (updatedElements[idx] && updatedElements[idx].type === 'text') {
    updatedElements[idx] = {
      ...updatedElements[idx],
      content: newText,
    };
    return {
      ...currentCard,
      elements: updatedElements,
    };
  }
  return currentCard;
};

// Wrapper utilitaire pour calculer une taille de police depuis des pourcentages
export const calculateFontSizeFromDimensions = (widthPercent, heightPercent, CARD_WIDTH, CARD_HEIGHT, calculateFontSizeFn) => {
  const pixelWidth = (widthPercent / 100) * CARD_WIDTH;
  const pixelHeight = (heightPercent / 100) * CARD_HEIGHT;
  return calculateFontSizeFn(pixelWidth, pixelHeight);
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

// Helper: updateCardElements
export function updateCardElements(currentCard, newElements, name, matricule, generateMatricule) {
  console.log("🔄 updateCardElements - Mise à jour des éléments:", {
    nombreElements: (newElements || []).length,
    elementsPreview: (newElements || []).map((e) => ({
      type: e.type,
      content: (e.content || "").toString().substring(0, 50),
      hasId: !!e._id,
    })),
  });

  const newCard = buildCardWithElements(
    currentCard,
    newElements || [],
    name,
    matricule,
    generateMatricule
  );

  return newCard;
}

// Helper: start text editing - returns editing index and current text value
export function startTextEditing(currentCard, elementIndex) {
  const el = getTextElementFromCard(currentCard, elementIndex);
  if (el) {
    const idx = getNumericIndex(elementIndex);
    return { editingIndex: idx, textValue: el.content || "" };
  }
  return { editingIndex: null, textValue: "" };
}

// Helper: save text edit - returns updated card
export function saveTextEdit(currentCard, editingText, textInputValue) {
  if (editingText === null || editingText === undefined) return currentCard;
  const updatedCard = setTextContentInCard(currentCard, editingText, textInputValue);
  return updatedCard;
}

// Helper: cancel text edit - returns reset values
export function cancelTextEdit() {
  return { editingIndex: null, textValue: "" };
}

// Helper: update element style - returns updated card
export function updateElementStyle(currentCard, elementIndex, styleUpdates) {
  if (!currentCard) return currentCard;
  const updatedCard = updateElementStyleInCard(currentCard, elementIndex, styleUpdates);
  return updatedCard;
}

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
