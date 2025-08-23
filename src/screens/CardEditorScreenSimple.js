import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
  Alert,
  ScrollView,
  Dimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { colors, spacing } from "../theme/theme";
import { createCard, updateCard } from "../api/client";
import { generateMatricule } from "../utils/cardUtils";
import {
  CARD_WIDTH,
  CARD_HEIGHT,
  calculateFontSize,
} from "../utils/cardDimensions";
import MobileCard from "../components/MobileCard";
import CardCanvas from "../components/cards/editor/CardCanvas";

const { width } = Dimensions.get("window");

// Couleurs prédéfinies étendues
const predefinedColors = [
  // Couleurs de base
  "#ffffff",
  "#000000",
  "#ff0000",
  "#00ff00",
  "#0000ff",
  "#ffff00",
  "#ff00ff",
  "#00ffff",
  "#ffa500",
  "#800080",
  "#008000",
  "#ffc0cb",
  "#a52a2a",
  "#808080",
  "#000080",
  "#800000",
  "#808000",
  "#008080",

  // Couleurs étendues
  "#ff6b6b",
  "#4ecdc4",
  "#45b7d1",
  "#96ceb4",
  "#feca57",
  "#ff9ff3",
  "#f38ba8",
  "#a8e6cf",
  "#dda0dd",
  "#98d8c8",
  "#f7dc6f",
  "#bb8fce",
  "#85c1e9",
  "#f8c471",
  "#82e0aa",
  "#f1948a",
  "#85929e",
  "#d5dbdb",

  // Nuances de gris
  "#f8f9fa",
  "#e9ecef",
  "#dee2e6",
  "#ced4da",
  "#adb5bd",
  "#6c757d",
  "#495057",
  "#343a40",
  "#212529",
  "#1a1a1a",
  "#0f0f0f",
  "#050505",
];

// Gradients prédéfinis comme sur le web
const predefinedGradients = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
  "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%, #fecfef 100%)",
  "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
];

export default function CardEditorScreenSimple({ navigation, route }) {
  const { card, mode } = route.params || {};
  const isEditing = mode === "edit" && card;

  // États principaux
  const [name, setName] = useState(card?.name || "");
  const [matricule, setMatricule] = useState(card?.matricule || "");
  const [busy, setBusy] = useState(false);

  // États pour l'édition d'éléments
  const [selectedElementIndex, setSelectedElementIndex] = useState(null);
  const [currentCard, setCurrentCard] = useState(() => {
    if (!card) return null;

    // Initialiser currentCard avec les éléments existants
    return {
      ...card,
      elements: card.layout?.elements || card.elements || [],
    };
  });

  // Fonction utilitaire pour extraire l'index numérique du selectedElementIndex
  const getNumericIndex = (elementIndexString) => {
    if (typeof elementIndexString === "number") return elementIndexString;
    if (
      typeof elementIndexString === "string" &&
      elementIndexString.includes("-")
    ) {
      return parseInt(elementIndexString.split("-")[1]);
    }
    return elementIndexString;
  };

  // Fonction wrapper pour utiliser la fonction partagée avec des pourcentages
  const calculateFontSizeFromDimensions = (widthPercent, heightPercent) => {
    // Convertir les pourcentages en pixels basés sur la taille de la carte
    const pixelWidth = (widthPercent / 100) * CARD_WIDTH;
    const pixelHeight = (heightPercent / 100) * CARD_HEIGHT;

    // Utiliser la fonction partagée pour la cohérence
    return calculateFontSize(pixelWidth, pixelHeight);
  };

  // États pour le background - gestion améliorée des cartes existantes
  const [selectedBg, setSelectedBg] = useState(() => {
    if (card?.layout?.background) {
      return card.layout.background;
    }
    if (card?.recto) {
      return {
        type: card.rectoBackgroundType || "color",
        value: card.recto,
      };
    }
    return {
      type: "color",
      value: "#ffffff",
    };
  });

  // Debug les données de la carte
  useEffect(() => {
    if (card) {
      console.log("Card data in editor:", {
        name: card.name,
        layout: card.layout,
        background: card.layout?.background,
        elements: card.layout?.elements,
      });
    }
  }, [card]);

  // Fonction pour mettre à jour les éléments de la carte
  const updateCardElements = (newElements) => {
    console.log("🔄 updateCardElements - Mise à jour des éléments:", {
      nombreElements: newElements.length,
      elements: newElements.map((e) => ({
        type: e.type,
        content: e.content?.substring(0, 50) + "...",
        hasId: !!e._id,
        position: e.position,
        styleKeys: Object.keys(e.style || {}),
      })),
    });

    if (!currentCard) {
      console.log("❌ currentCard est null, création d'une nouvelle carte");
      const newCard = {
        name: name || "Nouvelle carte",
        matricule: matricule || generateMatricule(),
        elements: newElements,
      };
      setCurrentCard(newCard);
      return;
    }

    const updatedCard = {
      ...currentCard,
      elements: newElements, // Stocker directement dans elements
    };

    setCurrentCard(updatedCard);
  };

  // Fonction pour ajouter un nouvel élément
  const addElement = (type) => {
    console.log("🎯 Ajout d'élément:", { type, currentCard: !!currentCard });

    // Si pas de carte courante, créer une carte vide
    if (!currentCard) {
      const newCard = {
        name: name || "Nouvelle carte",
        matricule: matricule || generateMatricule(),
        elements: [],
      };
      setCurrentCard(newCard);
    }

    const newElement = {
      id: Date.now().toString(),
      type: type === "vline" ? "line" : type, // Convertir vline en line
      content:
        type === "text"
          ? "Nouveau texte"
          : type === "image"
          ? "https://via.placeholder.com/150x150/cccccc/666666?text=Image"
          : "",
      position: {
        x: 25, // Position en pourcentage
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

    const currentElements = currentCard?.elements || [];
    const updatedElements = [...currentElements, newElement];
    updateCardElements(updatedElements);

    console.log("✅ Élément ajouté:", {
      type,
      newElement,
      totalElements: updatedElements.length,
    });
  };

  // Fonction pour supprimer un élément
  const deleteElement = (elementIndexString) => {
    if (!currentCard || elementIndexString === null) return;

    // Utiliser la fonction utilitaire pour extraire l'index numérique
    const elementIndex = getNumericIndex(elementIndexString);
    const currentElements = currentCard.elements || [];

    if (elementIndex >= 0 && elementIndex < currentElements.length) {
      const updatedElements = currentElements.filter(
        (_, index) => index !== elementIndex
      );
      updateCardElements(updatedElements);
      setSelectedElementIndex(null);
    }
  };

  // Fonctions d'édition avancées
  const startTextEditing = (elementIndex) => {
    if (!currentCard?.elements) return;

    const index =
      typeof elementIndex === "string"
        ? parseInt(elementIndex.split("-")[1] || "0")
        : elementIndex;

    const element = currentCard.elements[index];
    if (element && element.type === "text") {
      setEditingText(index);
      setTextInputValue(element.content || "");
    }
  };

  const saveTextEdit = () => {
    if (editingText === null || !currentCard?.elements) return;

    const updatedElements = [...currentCard.elements];
    if (updatedElements[editingText]) {
      updatedElements[editingText] = {
        ...updatedElements[editingText],
        content: textInputValue,
      };
      updateCardElements(updatedElements);
    }

    setEditingText(null);
    setTextInputValue("");
  };

  const cancelTextEdit = () => {
    setEditingText(null);
    setTextInputValue("");
  };

  const updateElementStyle = (elementIndex, styleUpdates) => {
    if (!currentCard?.elements) return;

    // Utiliser la fonction utilitaire pour extraire l'index numérique
    const numericIndex = getNumericIndex(elementIndex);

    console.log("🎨 updateElementStyle:", {
      elementIndex,
      numericIndex,
      styleUpdates,
      currentElement: currentCard.elements[numericIndex],
    });

    const updatedElements = [...currentCard.elements];
    if (updatedElements[numericIndex]) {
      updatedElements[numericIndex] = {
        ...updatedElements[numericIndex],
        style: {
          ...updatedElements[numericIndex].style,
          ...styleUpdates,
        },
      };

      console.log("🎨 Élément mis à jour:", updatedElements[numericIndex]);
      updateCardElements(updatedElements);
    }
  };

  const duplicateElement = (elementIndex) => {
    if (!currentCard?.elements) return;

    // Utiliser la fonction utilitaire pour extraire l'index numérique
    const numericIndex = getNumericIndex(elementIndex);

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

      const updatedElements = [...currentCard.elements, duplicated];
      updateCardElements(updatedElements);
    }
  };

  const alignElements = (alignment) => {
    if (!currentCard?.elements || selectedElementIndex === null) return;

    // Utiliser la fonction utilitaire pour extraire l'index numérique
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

      updateCardElements(updatedElements);
    }
  };

  // Fonction pour rendre le panneau de propriétés
  const renderPropertyPanel = () => {
    if (!currentCard?.elements || selectedElementIndex === null) return null;

    // Utiliser la fonction utilitaire pour extraire l'index numérique
    const numericIndex = getNumericIndex(selectedElementIndex);
    const element = currentCard.elements[numericIndex];
    if (!element) return null;

    // Fonction helper pour mettre à jour le style de l'élément courant
    const updateCurrentElementStyle = (styleUpdates) => {
      updateElementStyle(numericIndex, styleUpdates);
    };

    // Fonctions pour les contrôles de taille
    const getCurrentSize = () => {
      if (element.type === "text") {
        return element.style?.fontSize || 16;
      } else if (element.type === "image") {
        return element.style?.width || 100;
      }
      return 100;
    };

    const handleSizeIncrease = () => {
      const currentSize = getCurrentSize();
      if (element.type === "text") {
        const newSize = Math.min(currentSize + 1, 72); // Incrément de 1px, Max 72px
        updateCurrentElementStyle({ fontSize: newSize });
      } else if (element.type === "image") {
        const newSize = Math.min(currentSize + 1, 300); // Incrément de 1px, Max 300px
        updateCurrentElementStyle({ width: newSize, height: newSize });
      }
    };

    const handleSizeDecrease = () => {
      const currentSize = getCurrentSize();
      if (element.type === "text") {
        const newSize = Math.max(currentSize - 1, 8); // Décrément de 1px, Min 8px
        updateCurrentElementStyle({ fontSize: newSize });
      } else if (element.type === "image") {
        const newSize = Math.max(currentSize - 1, 20); // Décrément de 1px, Min 20px
        updateCurrentElementStyle({ width: newSize, height: newSize });
      }
    };

    const getSizeLabel = () => {
      if (element.type === "text") {
        return `${Math.round(getCurrentSize())}px`;
      } else if (element.type === "image") {
        return `${Math.round(getCurrentSize())}px`;
      }
      return "100px";
    };

    return (
      <ScrollView
        style={styles.propertyContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Contrôles de taille déplacés dans la section outils d'édition */}

        {element.type === "text" && (
          <>
            {/* Édition du texte */}
            <Pressable
              style={styles.propertyButton}
              onPress={() => startTextEditing(numericIndex)}
            >
              <MaterialCommunityIcons name="pencil" size={20} color="#007AFF" />
              <Text style={styles.propertyButtonText}>Éditer le texte</Text>
            </Pressable>

            {/* Taille de police */}
            <View style={styles.fontSizeControl}>
              <Text style={styles.propertyLabel}>
                Taille de police: {element.style?.fontSize || 16}px
              </Text>
              <View style={styles.fontSizeButtons}>
                <Pressable
                  style={styles.fontSizeButton}
                  onPress={() =>
                    updateElementStyle(numericIndex, {
                      fontSize: Math.max(
                        8,
                        (element.style?.fontSize || 16) - 1
                      ),
                    })
                  }
                >
                  <MaterialCommunityIcons
                    name="minus"
                    size={16}
                    color="#007AFF"
                  />
                </Pressable>
                <Text style={styles.fontSizeValue}>
                  {element.style?.fontSize || 16}px
                </Text>
                <Pressable
                  style={styles.fontSizeButton}
                  onPress={() =>
                    updateElementStyle(numericIndex, {
                      fontSize: Math.min(
                        72,
                        (element.style?.fontSize || 16) + 1
                      ),
                    })
                  }
                >
                  <MaterialCommunityIcons
                    name="plus"
                    size={16}
                    color="#007AFF"
                  />
                </Pressable>
              </View>
            </View>

            {/* Famille de polices */}
            <View style={styles.fontFamilyControl}>
              <Text style={styles.propertyLabel}>Police</Text>
              <View style={styles.fontFamilyButtons}>
                {[
                  { name: "System", family: "System" },
                  { name: "Roboto", family: "Roboto" },
                  {
                    name: "San Francisco",
                    family: Platform.OS === "ios" ? "San Francisco" : "Roboto",
                  },
                  {
                    name: "Helvetica",
                    family: Platform.OS === "ios" ? "Helvetica" : "sans-serif",
                  },
                  {
                    name: "Monospace",
                    family: Platform.OS === "ios" ? "Courier" : "monospace",
                  },
                ].map((font) => (
                  <Pressable
                    key={font.name}
                    style={[
                      styles.fontFamilyButton,
                      element.style?.fontFamily === font.family &&
                        styles.selectedFontButton,
                    ]}
                    onPress={() =>
                      updateElementStyle(numericIndex, {
                        fontFamily: font.family,
                      })
                    }
                  >
                    <Text
                      style={[
                        styles.fontButtonText,
                        { fontFamily: font.family },
                      ]}
                    >
                      {font.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Style de police */}
            <View style={styles.fontStyleControl}>
              <Text style={styles.propertyLabel}>Style</Text>
              <View style={styles.fontStyleButtons}>
                <Pressable
                  style={[
                    styles.styleButton,
                    element.style?.fontWeight === "bold" &&
                      styles.selectedStyleButton,
                  ]}
                  onPress={() =>
                    updateElementStyle(selectedElementIndex, {
                      fontWeight:
                        element.style?.fontWeight === "bold"
                          ? "normal"
                          : "bold",
                    })
                  }
                >
                  <MaterialCommunityIcons
                    name="format-bold"
                    size={20}
                    color="#007AFF"
                  />
                </Pressable>
                <Pressable
                  style={[
                    styles.styleButton,
                    element.style?.fontStyle === "italic" &&
                      styles.selectedStyleButton,
                  ]}
                  onPress={() =>
                    updateElementStyle(selectedElementIndex, {
                      fontStyle:
                        element.style?.fontStyle === "italic"
                          ? "normal"
                          : "italic",
                    })
                  }
                >
                  <MaterialCommunityIcons
                    name="format-italic"
                    size={20}
                    color="#007AFF"
                  />
                </Pressable>
                <Pressable
                  style={[
                    styles.styleButton,
                    element.style?.textDecoration === "underline" &&
                      styles.selectedStyleButton,
                  ]}
                  onPress={() =>
                    updateElementStyle(selectedElementIndex, {
                      textDecoration:
                        element.style?.textDecoration === "underline"
                          ? "none"
                          : "underline",
                    })
                  }
                >
                  <MaterialCommunityIcons
                    name="format-underline"
                    size={20}
                    color="#007AFF"
                  />
                </Pressable>
              </View>
            </View>

            {/* Alignement du texte */}
            <View style={styles.textAlignControl}>
              <Text style={styles.propertyLabel}>Alignement</Text>
              <View style={styles.textAlignButtons}>
                {[
                  { align: "left", icon: "format-align-left" },
                  { align: "center", icon: "format-align-center" },
                  { align: "right", icon: "format-align-right" },
                  { align: "justify", icon: "format-align-justify" },
                ].map(({ align, icon }) => (
                  <Pressable
                    key={align}
                    style={[
                      styles.alignButton,
                      element.style?.textAlign === align &&
                        styles.selectedAlignButton,
                    ]}
                    onPress={() =>
                      updateElementStyle(selectedElementIndex, {
                        textAlign: align,
                      })
                    }
                  >
                    <MaterialCommunityIcons
                      name={icon}
                      size={18}
                      color="#007AFF"
                    />
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Couleur du texte */}
            <View style={styles.colorPicker}>
              <Text style={styles.propertyLabel}>Couleur du texte</Text>
              <View style={styles.colorOptions}>
                {predefinedColors.map((color) => (
                  <Pressable
                    key={color}
                    style={[
                      styles.colorOptionSmall,
                      { backgroundColor: color },
                      element.style?.color === color &&
                        styles.selectedColorOption,
                    ]}
                    onPress={() =>
                      updateElementStyle(selectedElementIndex, { color })
                    }
                  >
                    {element.style?.color === color && (
                      <MaterialCommunityIcons
                        name="check"
                        size={12}
                        color={
                          color === "#ffffff" || color === "#ffff00"
                            ? "#000000"
                            : "#ffffff"
                        }
                      />
                    )}
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Couleur de fond */}
            <View style={styles.backgroundColorPicker}>
              <Text style={styles.propertyLabel}>Arrière-plan du texte</Text>
              <View style={styles.colorOptions}>
                <Pressable
                  style={[
                    styles.colorOptionSmall,
                    {
                      backgroundColor: "transparent",
                      borderWidth: 2,
                      borderColor: "#ddd",
                    },
                    element.style?.backgroundColor === "transparent" &&
                      styles.selectedColorOption,
                  ]}
                  onPress={() =>
                    updateElementStyle(selectedElementIndex, {
                      backgroundColor: "transparent",
                    })
                  }
                >
                  <MaterialCommunityIcons name="close" size={12} color="#666" />
                </Pressable>
                {predefinedColors.map((color) => (
                  <Pressable
                    key={color}
                    style={[
                      styles.colorOptionSmall,
                      { backgroundColor: color },
                      element.style?.backgroundColor === color &&
                        styles.selectedColorOption,
                    ]}
                    onPress={() =>
                      updateElementStyle(selectedElementIndex, {
                        backgroundColor: color,
                      })
                    }
                  >
                    {element.style?.backgroundColor === color && (
                      <MaterialCommunityIcons
                        name="check"
                        size={12}
                        color={
                          color === "#ffffff" || color === "#ffff00"
                            ? "#000000"
                            : "#ffffff"
                        }
                      />
                    )}
                  </Pressable>
                ))}
              </View>
            </View>
          </>
        )}

        {element.type === "image" && (
          <>
            {/* Changer l'image */}
            <Pressable
              style={styles.propertyButton}
              onPress={() => setShowImagePicker(true)}
            >
              <MaterialCommunityIcons
                name="image-plus"
                size={20}
                color="#007AFF"
              />
              <Text style={styles.propertyButtonText}>Changer l'image</Text>
            </Pressable>

            {/* Border radius pour les images */}
            <View style={styles.borderRadiusControl}>
              <Text style={styles.propertyLabel}>
                Bordure arrondie: {element.style?.borderRadius || 0}%
              </Text>
              <View style={styles.borderRadiusButtons}>
                <Pressable
                  style={styles.radiusButton}
                  onPress={() =>
                    updateElementStyle(selectedElementIndex, {
                      borderRadius: 0,
                    })
                  }
                >
                  <MaterialCommunityIcons
                    name="square-outline"
                    size={20}
                    color="#007AFF"
                  />
                  <Text style={styles.radiusButtonText}>Carré</Text>
                </Pressable>
                <Pressable
                  style={styles.radiusButton}
                  onPress={() =>
                    updateElementStyle(selectedElementIndex, {
                      borderRadius: 10,
                    })
                  }
                >
                  <MaterialCommunityIcons
                    name="rounded-corner"
                    size={20}
                    color="#007AFF"
                  />
                  <Text style={styles.radiusButtonText}>Arrondi</Text>
                </Pressable>
                <Pressable
                  style={styles.radiusButton}
                  onPress={() =>
                    updateElementStyle(selectedElementIndex, {
                      borderRadius: 50,
                    })
                  }
                >
                  <MaterialCommunityIcons
                    name="circle-outline"
                    size={20}
                    color="#007AFF"
                  />
                  <Text style={styles.radiusButtonText}>Cercle</Text>
                </Pressable>
              </View>
            </View>

            {/* Contrôle manuel du radius en pourcentage */}
            <View style={styles.manualRadiusControl}>
              <Text style={styles.propertyLabel}>Radius personnalisé (%)</Text>
              <View style={styles.radiusSlider}>
                <Pressable
                  style={styles.radiusSliderButton}
                  onPress={() =>
                    updateElementStyle(selectedElementIndex, {
                      borderRadius: Math.max(
                        0,
                        (element.style?.borderRadius || 0) - 1
                      ),
                    })
                  }
                >
                  <MaterialCommunityIcons
                    name="minus"
                    size={16}
                    color="#007AFF"
                  />
                </Pressable>
                <Text style={styles.radiusValue}>
                  {element.style?.borderRadius || 0}%
                </Text>
                <Pressable
                  style={styles.radiusSliderButton}
                  onPress={() =>
                    updateElementStyle(selectedElementIndex, {
                      borderRadius: Math.min(
                        50,
                        (element.style?.borderRadius || 0) + 1
                      ),
                    })
                  }
                >
                  <MaterialCommunityIcons
                    name="plus"
                    size={16}
                    color="#007AFF"
                  />
                </Pressable>
              </View>
            </View>
          </>
        )}

        {element.type === "line" && (
          <>
            {/* Couleur de la ligne */}
            <View style={styles.colorPicker}>
              <Text style={styles.propertyLabel}>Couleur de la ligne</Text>
              <View style={styles.colorOptions}>
                {predefinedColors.map((color) => (
                  <Pressable
                    key={color}
                    style={[
                      styles.colorOptionSmall,
                      { backgroundColor: color },
                      element.style?.backgroundColor === color &&
                        styles.selectedColorOption,
                    ]}
                    onPress={() =>
                      updateElementStyle(selectedElementIndex, {
                        backgroundColor: color,
                      })
                    }
                  >
                    {element.style?.backgroundColor === color && (
                      <MaterialCommunityIcons
                        name="check"
                        size={12}
                        color={
                          color === "#ffffff" || color === "#ffff00"
                            ? "#000000"
                            : "#ffffff"
                        }
                      />
                    )}
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Épaisseur de la ligne */}
            <View style={styles.lineThicknessControl}>
              <Text style={styles.propertyLabel}>
                Épaisseur: {element.style?.height || 2}px
              </Text>
              <View style={styles.thicknessButtons}>
                <Pressable
                  style={styles.thicknessButton}
                  onPress={() =>
                    updateElementStyle(selectedElementIndex, {
                      height: Math.max(1, (element.style?.height || 2) - 1),
                    })
                  }
                >
                  <MaterialCommunityIcons
                    name="minus"
                    size={16}
                    color="#007AFF"
                  />
                </Pressable>
                <Text style={styles.thicknessText}>
                  {element.style?.height || 2}px
                </Text>
                <Pressable
                  style={styles.thicknessButton}
                  onPress={() =>
                    updateElementStyle(selectedElementIndex, {
                      height: Math.min(20, (element.style?.height || 2) + 1),
                    })
                  }
                >
                  <MaterialCommunityIcons
                    name="plus"
                    size={16}
                    color="#007AFF"
                  />
                </Pressable>
              </View>
            </View>
          </>
        )}

        {/* Contrôles communs à tous les éléments */}
        <View style={styles.commonControls}>
          {/* Opacité */}
          <View style={styles.opacityControl}>
            <Text style={styles.propertyLabel}>
              Opacité: {Math.round((element.style?.opacity || 1) * 100)}%
            </Text>
            <View style={styles.opacityButtons}>
              <Pressable
                style={styles.opacityButton}
                onPress={() =>
                  updateElementStyle(selectedElementIndex, {
                    opacity: Math.max(0.1, (element.style?.opacity || 1) - 0.1),
                  })
                }
              >
                <MaterialCommunityIcons
                  name="minus"
                  size={16}
                  color="#007AFF"
                />
              </Pressable>
              <Text style={styles.opacityText}>
                {Math.round((element.style?.opacity || 1) * 100)}%
              </Text>
              <Pressable
                style={styles.opacityButton}
                onPress={() =>
                  updateElementStyle(selectedElementIndex, {
                    opacity: Math.min(1, (element.style?.opacity || 1) + 0.1),
                  })
                }
              >
                <MaterialCommunityIcons name="plus" size={16} color="#007AFF" />
              </Pressable>
            </View>
          </View>

          {/* Rotation */}
          <View style={styles.rotationControl}>
            <Text style={styles.propertyLabel}>
              Rotation: {element.style?.rotation || 0}°
            </Text>
            <View style={styles.rotationButtons}>
              <Pressable
                style={styles.rotationButton}
                onPress={() =>
                  updateElementStyle(selectedElementIndex, {
                    rotation: ((element.style?.rotation || 0) - 15 + 360) % 360,
                  })
                }
              >
                <MaterialCommunityIcons
                  name="rotate-left"
                  size={16}
                  color="#007AFF"
                />
              </Pressable>
              <Text style={styles.rotationText}>
                {element.style?.rotation || 0}°
              </Text>
              <Pressable
                style={styles.rotationButton}
                onPress={() =>
                  updateElementStyle(selectedElementIndex, {
                    rotation: ((element.style?.rotation || 0) + 15) % 360,
                  })
                }
              >
                <MaterialCommunityIcons
                  name="rotate-right"
                  size={16}
                  color="#007AFF"
                />
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  // État pour les onglets (0: Couleurs, 1: Gradients, 2: Images)
  const [activeTab, setActiveTab] = useState(0);

  // États pour les backgrounds dynamiques
  const [allImages, setAllImages] = useState([]);
  const [bgLoading, setBgLoading] = useState(false);

  // États pour l'édition avancée
  const [showPropertyPanel, setShowPropertyPanel] = useState(false);
  const [editingText, setEditingText] = useState(null);
  const [textInputValue, setTextInputValue] = useState("");
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showAlignmentTools, setShowAlignmentTools] = useState(false);

  // Générer matricule et nom par défaut
  useEffect(() => {
    if (!isEditing) {
      const generated = generateMatricule();
      setMatricule(generated);
      if (!name) setName(`Carte ${generated}`);
    }
  }, [isEditing, name]);

  // Charger les backgrounds d'images
  useEffect(() => {
    const fetchBackgrounds = async () => {
      setBgLoading(true);
      try {
        // Utiliser les images de background locales au lieu de l'API
        const localBackgrounds = [
          "file:///android_asset/backgrounds/A1.svg",
          "file:///android_asset/backgrounds/A2.svg",
          "file:///android_asset/backgrounds/A3.svg",
          // Ajouter d'autres backgrounds locaux si nécessaire
        ];

        setAllImages(
          localBackgrounds.map((url) => ({
            type: "image",
            value: url,
            thumb: url,
          }))
        );
      } catch (e) {
        console.warn("Erreur chargement backgrounds:", e);
        // En cas d'erreur, utiliser un background par défaut
        setAllImages([
          {
            type: "color",
            value: "#ffffff",
            thumb: "#ffffff",
          },
        ]);
      } finally {
        setBgLoading(false);
      }
    };
    fetchBackgrounds();
  }, []);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Erreur", "Le nom de la carte est requis");
      return;
    }

    try {
      setBusy(true);

      const cardData = {
        name: name.trim(),
        matricule: matricule || generateMatricule(),
        recto: selectedBg.value,
        verso: selectedBg.value, // Même background pour le verso
        rectoBackgroundType: selectedBg.type,
        versoBackgroundType: selectedBg.type,
        // Envoyer les éléments dans les deux structures que le serveur peut attendre
        elements: currentCard?.elements || [], // Au niveau racine
        layout: {
          background: selectedBg,
          elements: currentCard?.elements || [], // Dans layout aussi
        },
        backLayout: {
          background: selectedBg,
          elements: [],
        },
      };

      console.log("💾 Sauvegarde carte avec éléments:", {
        cardId: card?._id,
        elementsCount: currentCard?.elements?.length || 0,
        elements: currentCard?.elements,
        cardData: JSON.stringify(cardData, null, 2),
      });

      if (isEditing && card?._id) {
        console.log("🔄 Mise à jour carte existante:", card._id);
        const result = await updateCard(card._id, cardData);
        console.log("✅ Carte sauvegardée avec succès");

        Alert.alert("Succès", "Carte modifiée avec succès", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } else {
        console.log("🆕 Création nouvelle carte");
        const result = await createCard(cardData);
        console.log("✅ Résultat création:", result);
        Alert.alert("Succès", "Carte créée avec succès", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error) {
      console.error("❌ Erreur sauvegarde complète:", {
        message: error?.message,
        status: error?.status,
        data: error?.data,
        stack: error?.stack,
      });
      Alert.alert(
        "Erreur",
        error?.message || "Impossible de sauvegarder la carte"
      );
    } finally {
      setBusy(false);
    }
  };

  const renderColorPicker = () => (
    <View style={styles.colorGrid}>
      {predefinedColors.map((color, index) => (
        <Pressable
          key={index}
          style={[
            styles.colorOption,
            { backgroundColor: color },
            selectedBg.type === "color" &&
              selectedBg.value === color &&
              styles.colorOptionSelected,
          ]}
          onPress={() => setSelectedBg({ type: "color", value: color })}
        >
          {selectedBg.type === "color" && selectedBg.value === color && (
            <MaterialCommunityIcons
              name="check"
              size={20}
              color={color === "#ffffff" ? "#000000" : "#ffffff"}
            />
          )}
        </Pressable>
      ))}
    </View>
  );

  const renderGradientPicker = () => (
    <View style={styles.colorGrid}>
      {predefinedGradients.map((gradient, index) => (
        <Pressable
          key={index}
          style={[
            styles.gradientOption,
            selectedBg.type === "gradient" &&
              selectedBg.value === gradient &&
              styles.colorOptionSelected,
          ]}
          onPress={() => setSelectedBg({ type: "gradient", value: gradient })}
        >
          <View
            style={[styles.gradientPreview, { backgroundColor: "#4facfe" }]}
          />
          {selectedBg.type === "gradient" && selectedBg.value === gradient && (
            <MaterialCommunityIcons name="check" size={20} color="#ffffff" />
          )}
        </Pressable>
      ))}
    </View>
  );

  const renderImagePicker = () => (
    <View style={styles.imageGrid}>
      {bgLoading ? (
        <Text style={styles.loadingText}>Chargement des images...</Text>
      ) : allImages.length > 0 ? (
        allImages.map((img, index) => (
          <Pressable
            key={index}
            style={[
              styles.imageOption,
              selectedBg.type === "image" &&
                selectedBg.value === img.value &&
                styles.imageOptionSelected,
            ]}
            onPress={() => setSelectedBg({ type: "image", value: img.value })}
          >
            {/* Ici on pourrait ajouter une Image component pour afficher la miniature */}
            <View style={styles.imagePlaceholder}>
              <MaterialCommunityIcons
                name="image"
                size={30}
                color={colors.mutedText}
              />
            </View>
            {selectedBg.type === "image" && selectedBg.value === img.value && (
              <View style={styles.imageCheckbox}>
                <MaterialCommunityIcons
                  name="check"
                  size={16}
                  color="#ffffff"
                />
              </View>
            )}
          </Pressable>
        ))
      ) : (
        <Text style={styles.emptyText}>Aucune image disponible</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={colors.text}
          />
        </Pressable>
        <Text style={styles.title}>
          {isEditing ? "Modifier la carte" : "Créer une carte"}
        </Text>
        <Pressable onPress={handleSave} disabled={busy} style={styles.saveBtn}>
          <Text style={styles.saveBtnText}>
            {busy ? "Sauvegarde..." : "Sauvegarder"}
          </Text>
        </Pressable>
      </View>

      <ScrollView style={styles.content}>
        {/* Prévisualisation de la carte */}
        <View style={styles.previewSection}>
          <Text style={styles.sectionTitle}>Aperçu</Text>
          <View style={styles.cardContainer}>
            {(() => {
              const cardData = {
                ...(currentCard || {}),
                name: currentCard?.name || name,
                matricule: currentCard?.matricule || matricule,
                recto: selectedBg.value,
                rectoBackgroundType: selectedBg.type,
                layout: {
                  background: selectedBg,
                  elements:
                    currentCard?.elements ||
                    card?.elements ||
                    card?.layout?.elements ||
                    [],
                },
                backLayout: {
                  background: selectedBg,
                  elements: [],
                },
              };

              console.log(
                "🚀 CardEditorScreen: Données passées à CardCanvas:",
                {
                  hasCurrentCard: !!currentCard,
                  currentCardElements: currentCard?.elements?.length || 0,
                  currentCardElementsRaw: currentCard?.elements,
                  layoutElements: cardData.layout.elements.length,
                  layoutElementsRaw: cardData.layout.elements,
                  cardData: JSON.stringify(cardData, null, 2),
                }
              );

              return (
                <>
                  <CardCanvas
                    card={cardData}
                    selectedElementIndex={selectedElementIndex}
                    onElementSelect={setSelectedElementIndex}
                    onElementMove={(elementIndex, percentX, percentY) => {
                      if (!currentCard) return;

                      console.log("🔄 onElementMove appelé:", {
                        elementIndex,
                        elementIndexType: typeof elementIndex,
                        percentX,
                        percentY,
                        currentCardElementsLength: currentCard.elements?.length,
                      });

                      const updatedElements = [...(currentCard.elements || [])];
                      if (updatedElements[elementIndex]) {
                        console.log(
                          "🔄 Élément trouvé pour déplacement:",
                          updatedElements[elementIndex]
                        );
                        updatedElements[elementIndex] = {
                          ...updatedElements[elementIndex],
                          position: {
                            ...updatedElements[elementIndex].position,
                            x: percentX,
                            y: percentY,
                          },
                        };
                        console.log(
                          "🔄 Élément après déplacement:",
                          updatedElements[elementIndex]
                        );
                        updateCardElements(updatedElements);
                      } else {
                        console.log("❌ Élément non trouvé pour déplacement:", {
                          elementIndex,
                          elementsLength: updatedElements.length,
                        });
                      }
                    }}
                    onElementResize={(
                      elementIndex,
                      percentWidth,
                      percentHeight
                    ) => {
                      if (!currentCard) return;

                      console.log("🔄 onElementResize appelé:", {
                        elementIndex,
                        elementIndexType: typeof elementIndex,
                        percentWidth,
                        percentHeight,
                        currentCardElementsLength: currentCard.elements?.length,
                      });

                      const updatedElements = [...(currentCard.elements || [])];
                      if (updatedElements[elementIndex]) {
                        const element = updatedElements[elementIndex];
                        console.log(
                          "🔄 Élément trouvé pour redimensionnement:",
                          element
                        );

                        // Calculer la nouvelle taille avec ajustement automatique de police pour les textes
                        let newStyle = {
                          ...element.style,
                          width: percentWidth,
                          height: percentHeight,
                        };

                        // Pour les textes, ajuster automatiquement la taille de police comme dans l'app web
                        if (element.type === "text") {
                          const newFontSize = calculateFontSizeFromDimensions(
                            percentWidth,
                            percentHeight
                          );
                          newStyle.fontSize = newFontSize;

                          console.log(
                            "📝 Ajustement automatique police (comme web):",
                            {
                              percentWidth,
                              percentHeight,
                              newFontSize,
                              oldFontSize: element.style?.fontSize,
                            }
                          );
                        }

                        updatedElements[elementIndex] = {
                          ...element,
                          style: newStyle,
                        };

                        console.log(
                          "🔄 Élément après redimensionnement:",
                          updatedElements[elementIndex]
                        );
                        updateCardElements(updatedElements);
                      } else {
                        console.log(
                          "❌ Élément non trouvé pour redimensionnement:",
                          {
                            elementIndex,
                            elementsLength: updatedElements.length,
                          }
                        );
                      }
                    }}
                    style={{ opacity: busy ? 0.7 : 1 }}
                  />
                  {busy && (
                    <View style={styles.loadingOverlay}>
                      <Text style={styles.loadingText}>Traitement...</Text>
                    </View>
                  )}
                </>
              );
            })()}
          </View>
        </View>

        {/* Toolbar pour l'édition */}
        {isEditing && (
          <View style={styles.toolbarSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Outils d'édition</Text>
              <View style={styles.debugInfo}>
                <Text style={styles.elementsCounter}>
                  {currentCard?.elements?.length || 0} élément(s)
                </Text>
              </View>
            </View>

            {/* Contrôles de taille - affichés quand un élément est sélectionné */}
            {selectedElementIndex !== null &&
              (() => {
                const numericIndex = getNumericIndex(selectedElementIndex);
                const element = currentCard?.elements?.[numericIndex];

                if (!element) return null;

                const getCurrentSize = () => {
                  if (element.type === "text") {
                    return element.style?.fontSize || 16;
                  } else if (element.type === "image") {
                    return element.style?.width || 100;
                  }
                  return 100;
                };

                const updateCurrentElementStyle = (styleUpdate) => {
                  updateElementStyle(numericIndex, styleUpdate);
                };

                const handleSizeIncrease = () => {
                  const currentSize = getCurrentSize();
                  if (element.type === "text") {
                    const newSize = Math.min(currentSize + 1, 72);
                    updateCurrentElementStyle({ fontSize: newSize });
                  } else if (element.type === "image") {
                    const newSize = Math.min(currentSize + 1, 300);
                    updateCurrentElementStyle({
                      width: newSize,
                      height: newSize,
                    });
                  }
                };

                const handleSizeDecrease = () => {
                  const currentSize = getCurrentSize();
                  if (element.type === "text") {
                    const newSize = Math.max(currentSize - 1, 8);
                    updateCurrentElementStyle({ fontSize: newSize });
                  } else if (element.type === "image") {
                    const newSize = Math.max(currentSize - 1, 20);
                    updateCurrentElementStyle({
                      width: newSize,
                      height: newSize,
                    });
                  }
                };
              })()}

            {/* Toolbar principale */}
            <View style={styles.toolbarContainer}>
              <Pressable
                style={styles.toolButton}
                onPress={() => addElement("text")}
              >
                <MaterialCommunityIcons
                  name="format-text"
                  size={24}
                  color="#007AFF"
                />
                <Text style={styles.toolButtonText}>Texte</Text>
              </Pressable>

              <Pressable
                style={styles.toolButton}
                onPress={() => addElement("image")}
              >
                <MaterialCommunityIcons
                  name="image"
                  size={24}
                  color="#007AFF"
                />
                <Text style={styles.toolButtonText}>Image</Text>
              </Pressable>

              <Pressable
                style={styles.toolButton}
                onPress={() => addElement("line")}
              >
                <MaterialCommunityIcons
                  name="minus"
                  size={24}
                  color="#007AFF"
                />
                <Text style={styles.toolButtonText}>Ligne H</Text>
              </Pressable>

              <Pressable
                style={styles.toolButton}
                onPress={() => addElement("vline")}
              >
                <MaterialCommunityIcons
                  name="minus"
                  size={24}
                  color="#007AFF"
                  style={{ transform: [{ rotate: "90deg" }] }}
                />
                <Text style={styles.toolButtonText}>Ligne V</Text>
              </Pressable>

              <Pressable
                style={styles.toolButton}
                onPress={() => setShowAlignmentTools(!showAlignmentTools)}
              >
                <MaterialCommunityIcons
                  name="format-align-center"
                  size={24}
                  color="#007AFF"
                />
                <Text style={styles.toolButtonText}>Aligner</Text>
              </Pressable>

              {selectedElementIndex !== null && (
                <>
                  <Pressable
                    style={styles.toolButton}
                    onPress={() => duplicateElement(selectedElementIndex)}
                  >
                    <MaterialCommunityIcons
                      name="content-copy"
                      size={24}
                      color="#007AFF"
                    />
                    <Text style={styles.toolButtonText}>Dupliquer</Text>
                  </Pressable>

                  <Pressable
                    style={styles.toolButton}
                    onPress={() => setShowPropertyPanel(!showPropertyPanel)}
                  >
                    <MaterialCommunityIcons
                      name="cog"
                      size={24}
                      color="#007AFF"
                    />
                    <Text style={styles.toolButtonText}>Propriétés</Text>
                  </Pressable>

                  <Pressable
                    style={[styles.toolButton, styles.deleteButton]}
                    onPress={() => deleteElement(selectedElementIndex)}
                  >
                    <MaterialCommunityIcons
                      name="delete"
                      size={24}
                      color="#FF3B30"
                    />
                    <Text
                      style={[styles.toolButtonText, styles.deleteButtonText]}
                    >
                      Supprimer
                    </Text>
                  </Pressable>
                </>
              )}
            </View>

            {/* Outils d'alignement */}
            {showAlignmentTools && selectedElementIndex && (
              <View style={styles.alignmentToolbar}>
                <Text style={styles.subSectionTitle}>Alignement</Text>
                <View style={styles.alignmentGrid}>
                  <Pressable
                    style={styles.alignButton}
                    onPress={() => alignElements("left")}
                  >
                    <MaterialCommunityIcons
                      name="format-align-left"
                      size={20}
                      color="#007AFF"
                    />
                  </Pressable>
                  <Pressable
                    style={styles.alignButton}
                    onPress={() => alignElements("center")}
                  >
                    <MaterialCommunityIcons
                      name="format-align-center"
                      size={20}
                      color="#007AFF"
                    />
                  </Pressable>
                  <Pressable
                    style={styles.alignButton}
                    onPress={() => alignElements("right")}
                  >
                    <MaterialCommunityIcons
                      name="format-align-right"
                      size={20}
                      color="#007AFF"
                    />
                  </Pressable>
                  <Pressable
                    style={styles.alignButton}
                    onPress={() => alignElements("top")}
                  >
                    <MaterialCommunityIcons
                      name="format-align-top"
                      size={20}
                      color="#007AFF"
                    />
                  </Pressable>
                  <Pressable
                    style={styles.alignButton}
                    onPress={() => alignElements("middle")}
                  >
                    <MaterialCommunityIcons
                      name="format-align-middle"
                      size={20}
                      color="#007AFF"
                    />
                  </Pressable>
                  <Pressable
                    style={styles.alignButton}
                    onPress={() => alignElements("bottom")}
                  >
                    <MaterialCommunityIcons
                      name="format-align-bottom"
                      size={20}
                      color="#007AFF"
                    />
                  </Pressable>
                </View>
              </View>
            )}

            {/* Panneau de propriétés */}
            {showPropertyPanel && selectedElementIndex && (
              <View style={styles.propertyPanel}>
                <Text style={styles.subSectionTitle}>
                  Propriétés de l'élément
                </Text>
                {renderPropertyPanel()}
              </View>
            )}

            {/* Éditeur de texte inline */}
            {editingText !== null && (
              <View style={styles.textEditor}>
                <Text style={styles.subSectionTitle}>Éditer le texte</Text>
                <TextInput
                  style={styles.textInput}
                  value={textInputValue}
                  onChangeText={setTextInputValue}
                  placeholder="Entrez votre texte..."
                  multiline
                />
                <View style={styles.textEditorButtons}>
                  <Pressable style={styles.saveButton} onPress={saveTextEdit}>
                    <Text style={styles.saveButtonText}>Enregistrer</Text>
                  </Pressable>
                  <Pressable
                    style={styles.cancelButton}
                    onPress={cancelTextEdit}
                  >
                    <Text style={styles.cancelButtonText}>Annuler</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Informations de base */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nom de la carte</Text>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="Ex: Carte professionnelle"
              maxLength={50}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Matricule</Text>
            <View style={styles.matriculeContainer}>
              <TextInput
                style={[styles.textInput, styles.matriculeInput]}
                value={matricule}
                onChangeText={setMatricule}
                placeholder="Ex: C-123456-789"
                maxLength={15}
              />
              <Pressable
                onPress={() => setMatricule(generateMatricule())}
                style={styles.regenerateButton}
              >
                <MaterialCommunityIcons
                  name="refresh"
                  size={20}
                  color={colors.primary}
                />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Sélecteur de background */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Arrière-plan</Text>

          {/* Onglets */}
          <View style={styles.tabContainer}>
            <Pressable
              style={[styles.tab, activeTab === 0 && styles.activeTab]}
              onPress={() => setActiveTab(0)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 0 && styles.activeTabText,
                ]}
              >
                Couleurs
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tab, activeTab === 1 && styles.activeTab]}
              onPress={() => setActiveTab(1)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 1 && styles.activeTabText,
                ]}
              >
                Gradients
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tab, activeTab === 2 && styles.activeTab]}
              onPress={() => setActiveTab(2)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 2 && styles.activeTabText,
                ]}
              >
                Images
              </Text>
            </Pressable>
          </View>

          {/* Contenu des onglets */}
          <View style={styles.tabContent}>
            {activeTab === 0 && renderColorPicker()}
            {activeTab === 1 && renderGradientPicker()}
            {activeTab === 2 && renderImagePicker()}
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  closeBtn: {
    padding: 8,
    borderRadius: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    flex: 1,
    textAlign: "center",
  },
  saveBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  previewSection: {
    padding: 16,
    backgroundColor: colors.surface,
    marginBottom: 8,
  },
  cardContainer: {
    alignItems: "center",
    paddingVertical: 16,
  },
  section: {
    padding: 16,
    backgroundColor: colors.surface,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
    color: colors.text,
  },
  matriculeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  matriculeInput: {
    flex: 1,
  },
  regenerateButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: colors.border,
    borderRadius: 8,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.mutedText,
  },
  activeTabText: {
    color: "#fff",
  },
  tabContent: {
    minHeight: 200,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorOptionSelected: {
    borderColor: colors.primary,
    borderWidth: 3,
  },
  gradientOption: {
    width: 50,
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
    overflow: "hidden",
  },
  gradientPreview: {
    width: "100%",
    height: "100%",
    borderRadius: 6,
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  imageOption: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "transparent",
    overflow: "hidden",
  },
  imageOptionSelected: {
    borderColor: colors.primary,
    borderWidth: 3,
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.border,
  },
  imageCheckbox: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    textAlign: "center",
    color: colors.mutedText,
    fontSize: 16,
    paddingVertical: 32,
  },
  emptyText: {
    textAlign: "center",
    color: colors.mutedText,
    fontSize: 16,
    paddingVertical: 32,
  },
  bottomSpacer: {
    height: 50,
  },
  toolbarSection: {
    padding: 16,
    backgroundColor: colors.surface,
    marginBottom: 8,
  },
  toolbarContainer: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  toolButton: {
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#fff",
    minWidth: 80,
  },
  toolButtonText: {
    fontSize: 12,
    color: "#007AFF",
    marginTop: 4,
    textAlign: "center",
  },
  deleteButton: {
    borderColor: "#FF3B30",
  },
  deleteButtonText: {
    color: "#FF3B30",
  },

  // Styles pour les outils d'édition avancés
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  elementsCounter: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
    marginTop: 12,
  },
  alignmentToolbar: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  alignmentGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  alignButton: {
    padding: 8,
    backgroundColor: "#fff",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  propertyPanel: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    maxHeight: 400,
  },
  propertyContent: {
    gap: 12,
  },
  propertyButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  propertyButtonText: {
    fontSize: 14,
    color: "#007AFF",
  },
  propertyLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.text,
    marginBottom: 4,
  },

  // Styles pour les contrôles de police
  fontFamilyControl: {
    gap: 4,
  },
  fontFamilyButtons: {
    gap: 6,
  },
  fontFamilyButton: {
    padding: 8,
    backgroundColor: "#fff",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  selectedFontButton: {
    borderColor: "#007AFF",
    backgroundColor: "#f0f8ff",
  },
  fontButtonText: {
    fontSize: 12,
    color: colors.text,
  },

  fontStyleControl: {
    gap: 4,
  },
  fontStyleButtons: {
    flexDirection: "row",
    gap: 8,
  },
  styleButton: {
    padding: 8,
    backgroundColor: "#fff",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
  },
  selectedStyleButton: {
    borderColor: "#007AFF",
    backgroundColor: "#f0f8ff",
  },

  textAlignControl: {
    gap: 4,
  },
  textAlignButtons: {
    flexDirection: "row",
    gap: 8,
  },
  selectedAlignButton: {
    borderColor: "#007AFF",
    backgroundColor: "#f0f8ff",
  },

  // Styles pour les couleurs
  colorPicker: {
    gap: 4,
  },
  backgroundColorPicker: {
    gap: 4,
  },
  colorOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  colorOptionSmall: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  selectedColorOption: {
    borderColor: "#007AFF",
  },

  fontSizeControl: {
    gap: 4,
  },
  fontSizeButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  fontSizeButton: {
    padding: 6,
    backgroundColor: "#fff",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fontSizeText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
  },
  fontSizeValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
    minWidth: 40,
    textAlign: "center",
  },

  // Styles pour les images
  borderRadiusControl: {
    gap: 8,
  },
  borderRadiusButtons: {
    flexDirection: "row",
    gap: 8,
  },
  radiusButton: {
    flex: 1,
    alignItems: "center",
    padding: 8,
    backgroundColor: "#fff",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  radiusButtonText: {
    fontSize: 11,
    color: "#007AFF",
  },

  manualRadiusControl: {
    gap: 4,
  },
  radiusSlider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  radiusSliderButton: {
    padding: 6,
    backgroundColor: "#fff",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  radiusValue: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
    minWidth: 40,
    textAlign: "center",
  },

  // Styles pour les lignes
  lineThicknessControl: {
    gap: 4,
  },
  thicknessButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  thicknessButton: {
    padding: 6,
    backgroundColor: "#fff",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  thicknessText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
  },

  // Styles pour les contrôles communs
  commonControls: {
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  opacityControl: {
    gap: 4,
  },
  opacityButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  opacityButton: {
    padding: 6,
    backgroundColor: "#fff",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  opacityText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
    minWidth: 40,
    textAlign: "center",
  },

  rotationControl: {
    gap: 4,
  },
  rotationButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rotationButton: {
    padding: 6,
    backgroundColor: "#fff",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rotationText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
    minWidth: 40,
    textAlign: "center",
  },
  textEditor: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  textInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: "top",
  },

  // Styles pour les contrôles de taille
  sizeControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8f9fa",
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e9ecef",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sizeButton: {
    backgroundColor: "#007AFF",
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderColor: "#fff",
  },
  sizeDisplay: {
    alignItems: "center",
    flex: 1,
    marginHorizontal: 20,
    backgroundColor: "#f8f9fa",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  sizeLabel: {
    fontSize: 11,
    color: "#6c757d",
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sizeValue: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "700",
  },

  textEditorButtons: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  saveButton: {
    flex: 1,
    padding: 10,
    backgroundColor: "#007AFF",
    borderRadius: 6,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "500",
  },
  cancelButton: {
    flex: 1,
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  cancelButtonText: {
    color: colors.text,
    fontWeight: "500",
  },

  // Styles debug
  debugInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  // Styles pour les contrôles de taille
  sizeControls: {
    backgroundColor: "#f8f9fa",
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e1e5e9",
  },
  sizeLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
    textAlign: "center",
  },
  sizeButtonsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  sizeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sizeButtonDisabled: {
    borderColor: "#ccc",
    backgroundColor: "#f5f5f5",
  },
  sizeDisplay: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    alignItems: "center",
  },
  sizeValue: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  sizeUnit: {
    color: "#fff",
    fontSize: 12,
    marginTop: 2,
  },
});
