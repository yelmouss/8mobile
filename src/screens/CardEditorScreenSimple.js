import React, { useState, useEffect } from "react";
import {
  calculateFontSizeFromDimensions as calculateFontSizeFromDimensionsUtils,
  getNumericIndex,
  addElementToCard,
  deleteElementFromCard,
  duplicateElementInCard,
  alignElementInCard,
  generateMatricule,
  pickImage,
  takePhoto,
  uploadFile,
  selectAndUploadImage,
  predefinedColors,
  predefinedGradients,
  validateImageDimensions,
  getOptimalElementSize,
  buildCardWithElements,
  patchCardIsActive,
  getTextElementFromCard,
  setTextContentInCard,
  updateElementStyleInCard,
  // newly moved helpers
  updateCardElements as utilUpdateCardElements,
  startTextEditing as utilStartTextEditing,
  saveTextEdit as utilSaveTextEdit,
  cancelTextEdit as utilCancelTextEdit,
  updateElementStyle as utilUpdateElementStyle,
} from "../utils/cardUtils";
import {
  CARD_WIDTH,
  CARD_HEIGHT,
  calculateFontSize,
} from "../utils/cardDimensions";
import MobileCard from "../components/MobileCard";
import CardCanvas from "../components/cards/editor/CardCanvas";
import { styles } from "../theme/CardEditorScreenStyles";
import BackgroundsSelector from "../components/cards/BackgroundsSelector";
import { updateCard, createCard, apiFetch } from "../api/client";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import {  Pressable } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme/theme";

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

  // Switch pour activer/désactiver la carte
  const [isActive, setIsActive] = useState(card?.isActive ?? true);

  // Ne pas resynchroniser isActive depuis card après chaque sauvegarde :
  // Laisser l'utilisateur contrôler le toggle localement, et ne synchroniser que lors de l'initialisation.

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

  // Mise à jour immédiate de isActive côté serveur (délégué à cardUtils)
  const handleToggleActive = async () => {
    const newValue = !isActive;
    setIsActive(newValue);
    if (isEditing && card?._id) {
      try {
        await patchCardIsActive(card._id, newValue, apiFetch);
      } catch (e) {
        // En cas d'erreur, rollback visuel
        setIsActive(isActive);
        Alert.alert(
          "Erreur",
          "Impossible de mettre à jour l'état actif de la carte"
        );
      }
    }
  };

  // utiliser calculateFontSizeFromDimensionsUtils directement (défini dans utils)

  // Fonction pour mettre à jour les éléments de la carte (délégué à utils)
  const updateCardElements = (newElements) => {
    const newCard = utilUpdateCardElements(
      currentCard,
      newElements,
      name,
      matricule,
      generateMatricule
    );
    setCurrentCard(newCard);
  };

  // Fonctions d'édition avancées
  const startTextEditing = (elementIndex) => {
    const res = utilStartTextEditing(currentCard, elementIndex);
    setEditingText(res.editingIndex);
    setTextInputValue(res.textValue);
  };

  const saveTextEdit = () => {
    if (editingText === null) return;
    const updatedCard = utilSaveTextEdit(
      currentCard,
      editingText,
      textInputValue
    );
    updateCardElements(updatedCard.elements || []);
    setEditingText(null);
    setTextInputValue("");
  };

  const cancelTextEdit = () => {
    const res = utilCancelTextEdit();
    setEditingText(res.editingIndex);
    setTextInputValue(res.textValue);
  };

  const updateElementStyle = (elementIndex, styleUpdates) => {
    if (!currentCard) return;
    const updatedCard = utilUpdateElementStyle(
      currentCard,
      elementIndex,
      styleUpdates
    );
    console.log("🎨 Élément mis à jour (delegated):", {
      elementIndex,
      styleUpdates,
    });
    updateCardElements(updatedCard.elements || []);
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

      // Forcer la valeur booléenne explicite
      const cardData = {
        name: name.trim(),
        matricule: matricule || generateMatricule(),
        recto: selectedBg.value,
        verso: selectedBg.value, // Même background pour le verso
        rectoBackgroundType: selectedBg.type,
        versoBackgroundType: selectedBg.type,
        isActive: !!isActive,
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

      if (isEditing && card?._id) {
        const result = await updateCard(card._id, cardData);

        // Mettre à jour l'état local après la sauvegarde
        if (result?.card?.isActive !== undefined) {
          setIsActive(result.card.isActive);
        }

        Alert.alert("Succès", "Carte modifiée avec succès", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } else {
        const result = await createCard(cardData);

        if (result?.card?.isActive !== undefined) {
          setIsActive(result.card.isActive);
        }
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
                          const newFontSize =
                            calculateFontSizeFromDimensionsUtils(
                              percentWidth,
                              percentHeight,
                              CARD_WIDTH,
                              CARD_HEIGHT,
                              calculateFontSize
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
                onPress={() => {
                  const newCard = addElementToCard(
                    currentCard,
                    "text",
                    generateMatricule
                  );
                  updateCardElements(newCard.elements || []);
                }}
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
                onPress={() => {
                  const newCard = addElementToCard(
                    currentCard,
                    "image",
                    generateMatricule
                  );
                  updateCardElements(newCard.elements || []);
                }}
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
                onPress={() => {
                  const newCard = addElementToCard(
                    currentCard,
                    "line",
                    generateMatricule
                  );
                  updateCardElements(newCard.elements || []);
                }}
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
                onPress={() => {
                  const newCard = addElementToCard(
                    currentCard,
                    "vline",
                    generateMatricule
                  );
                  updateCardElements(newCard.elements || []);
                }}
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
                    onPress={() => {
                      const updatedCard = duplicateElementInCard(
                        currentCard,
                        selectedElementIndex
                      );
                      updateCardElements(updatedCard.elements || []);
                    }}
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
                    onPress={() => {
                      const updatedCard = deleteElementFromCard(
                        currentCard,
                        selectedElementIndex
                      );
                      setSelectedElementIndex(null);
                      updateCardElements(updatedCard.elements || []);
                    }}
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
                    onPress={() => {
                      const updatedCard = alignElementInCard(
                        currentCard,
                        selectedElementIndex,
                        "left"
                      );
                      updateCardElements(updatedCard.elements || []);
                    }}
                  >
                    <MaterialCommunityIcons
                      name="format-align-left"
                      size={20}
                      color="#007AFF"
                    />
                  </Pressable>
                  <Pressable
                    style={styles.alignButton}
                    onPress={() => {
                      const updatedCard = alignElementInCard(
                        currentCard,
                        selectedElementIndex,
                        "center"
                      );
                      updateCardElements(updatedCard.elements || []);
                    }}
                  >
                    <MaterialCommunityIcons
                      name="format-align-center"
                      size={20}
                      color="#007AFF"
                    />
                  </Pressable>
                  <Pressable
                    style={styles.alignButton}
                    onPress={() => {
                      const updatedCard = alignElementInCard(
                        currentCard,
                        selectedElementIndex,
                        "right"
                      );
                      updateCardElements(updatedCard.elements || []);
                    }}
                  >
                    <MaterialCommunityIcons
                      name="format-align-right"
                      size={20}
                      color="#007AFF"
                    />
                  </Pressable>
                  <Pressable
                    style={styles.alignButton}
                    onPress={() => {
                      const updatedCard = alignElementInCard(
                        currentCard,
                        selectedElementIndex,
                        "top"
                      );
                      updateCardElements(updatedCard.elements || []);
                    }}
                  >
                    <MaterialCommunityIcons
                      name="format-align-top"
                      size={20}
                      color="#007AFF"
                    />
                  </Pressable>
                  <Pressable
                    style={styles.alignButton}
                    onPress={() => {
                      const updatedCard = alignElementInCard(
                        currentCard,
                        selectedElementIndex,
                        "middle"
                      );
                      updateCardElements(updatedCard.elements || []);
                    }}
                  >
                    <MaterialCommunityIcons
                      name="format-align-middle"
                      size={20}
                      color="#007AFF"
                    />
                  </Pressable>
                  <Pressable
                    style={styles.alignButton}
                    onPress={() => {
                      const updatedCard = alignElementInCard(
                        currentCard,
                        selectedElementIndex,
                        "bottom"
                      );
                      updateCardElements(updatedCard.elements || []);
                    }}
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

        {/* Sélecteur de background (nouveau composant) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Arrière-plan</Text>
          <BackgroundsSelector selected={selectedBg} onSelect={setSelectedBg} />
        </View>

        {/* Switch isActive */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Carte active</Text>
          <Pressable
            onPress={handleToggleActive}
            style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}
          >
            <MaterialCommunityIcons
              name={isActive ? "toggle-switch" : "toggle-switch-off-outline"}
              size={36}
              color={isActive ? colors.primary : colors.mutedText}
            />
            <Text
              style={{
                marginLeft: 12,
                color: isActive ? colors.primary : colors.mutedText,
                fontWeight: "600",
              }}
            >
              {isActive ? "Active" : "Inactive"}
            </Text>
          </Pressable>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}
