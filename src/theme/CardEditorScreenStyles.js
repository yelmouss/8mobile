import { StyleSheet } from "react-native";
import { colors, spacing } from "./theme";

export const styles = StyleSheet.create({
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
    backgroundColor: colors.background,
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
    backgroundColor: colors.background,
    marginBottom: 8,
  },
  cardContainer: {
    alignItems: "center",
    paddingVertical: 16,
  },
  section: {
    padding: 16,
    backgroundColor: colors.background,
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
    // backgroundColor: colors.surface,
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
    // backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    minHeight: 40,
    textAlignVertical: "top",
  },

  // Styles pour les contrôles de taille
  sizeControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    // backgroundColor: "#f8f9fa",
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
    // backgroundColor: "#f8f9fa",
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
    // backgroundColor: "#007AFF",
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
    // backgroundColor: "#fff",
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
