import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, spacing } from '../theme/theme';
import {
  createCard,
  updateCard
} from '../api/client';

// Fonction simple pour générer un matricule
const generateMatricule = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export default function CardEditorScreen({ navigation, route }) {
  // Récupérer les paramètres
  const { card, mode } = route.params || {};
  const isEditing = mode === 'edit' && card;

  // États
  const [name, setName] = useState(card?.name || "Ma nouvelle carte");
  const [matricule, setMatricule] = useState(card?.matricule || generateMatricule());
  const [description, setDescription] = useState(card?.description || "");
  const [backgroundColor, setBackgroundColor] = useState(card?.recto || "#3B82F6");
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [busy, setBusy] = useState(false);

  // Couleurs prédéfinies
  const predefinedColors = [
    "#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6",
    "#EC4899", "#14B8A6", "#F97316", "#6366F1", "#84CC16"
  ];

  // Fonction de sauvegarde
  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Erreur', 'Le nom de la carte est requis');
      return;
    }

    try {
      setBusy(true);
      
      const cardData = {
        name: name.trim(),
        matricule,
        description: description.trim(),
        recto: backgroundColor,
        verso: "#FFFFFF",
        rectoBackgroundType: "color",
        versoBackgroundType: "color"
      };

      if (isEditing && card?._id) {
        await updateCard(card._id, cardData);
        Alert.alert('Succès', 'Carte modifiée avec succès', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        await createCard(cardData);
        Alert.alert('Succès', 'Carte créée avec succès', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      Alert.alert('Erreur', error?.message || 'Impossible de sauvegarder la carte');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Modifier la carte' : 'Créer une carte'}
        </Text>
        <Pressable 
          onPress={handleSave} 
          disabled={busy}
          style={[styles.saveButton, busy && styles.saveButtonDisabled]}
        >
          <Text style={styles.saveButtonText}>
            {busy ? 'Sauvegarde...' : 'Sauvegarder'}
          </Text>
        </Pressable>
      </View>

      <ScrollView style={styles.content}>
        {/* Prévisualisation de la carte */}
        <View style={styles.previewSection}>
          <Text style={styles.sectionTitle}>Aperçu</Text>
          <View style={[styles.cardPreview, { backgroundColor }]}>
            <Text style={[styles.cardName, { color: textColor }]}>{name}</Text>
            <Text style={[styles.cardMatricule, { color: textColor, opacity: 0.8 }]}>
              {matricule}
            </Text>
            {description ? (
              <Text style={[styles.cardDescription, { color: textColor, opacity: 0.9 }]}>
                {description}
              </Text>
            ) : null}
          </View>
        </View>

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
            <Text style={styles.label}>Description (optionnelle)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Description de la carte..."
              multiline
              maxLength={200}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Matricule</Text>
            <View style={styles.matriculeContainer}>
              <TextInput
                style={[styles.textInput, styles.matriculeInput]}
                value={matricule}
                onChangeText={setMatricule}
                placeholder="Ex: ABC123"
                maxLength={10}
              />
              <Pressable 
                onPress={() => setMatricule(generateMatricule())}
                style={styles.regenerateButton}
              >
                <MaterialCommunityIcons name="refresh" size={20} color={colors.primary} />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Personnalisation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Couleurs</Text>
          
          <Text style={styles.label}>Couleur de fond</Text>
          <View style={styles.colorGrid}>
            {predefinedColors.map((color, index) => (
              <Pressable
                key={index}
                style={[
                  styles.colorOption,
                  { backgroundColor: color },
                  backgroundColor === color && styles.colorOptionSelected
                ]}
                onPress={() => setBackgroundColor(color)}
              >
                {backgroundColor === color && (
                  <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
                )}
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Couleur du texte</Text>
          <View style={styles.colorGrid}>
            <Pressable
              style={[
                styles.colorOption,
                { backgroundColor: "#FFFFFF" },
                textColor === "#FFFFFF" && styles.colorOptionSelected
              ]}
              onPress={() => setTextColor("#FFFFFF")}
            >
              {textColor === "#FFFFFF" && (
                <MaterialCommunityIcons name="check" size={20} color="#000000" />
              )}
            </Pressable>
            <Pressable
              style={[
                styles.colorOption,
                { backgroundColor: "#000000" },
                textColor === "#000000" && styles.colorOptionSelected
              ]}
              onPress={() => setTextColor("#000000")}
            >
              {textColor === "#000000" && (
                <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
              )}
            </Pressable>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  backButton: {
    padding: spacing.xs,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  previewSection: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    marginBottom: spacing.xs,
  },
  cardPreview: {
    width: 280,
    height: 180,
    borderRadius: 12,
    padding: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardName: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  cardMatricule: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  cardDescription: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  section: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: colors.text,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  matriculeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  matriculeInput: {
    flex: 1,
  },
  regenerateButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: colors.primary,
    borderWidth: 3,
  },
  bottomSpacer: {
    height: 50,
  },
});
