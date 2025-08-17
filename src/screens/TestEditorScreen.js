import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CardEditorModal from '../components/cards/CardEditorModal';
import { colors, spacing } from '../theme/theme';
import { detectBackgroundType, generateMatricule } from '../utils/cardUtils';

export default function TestEditorScreen() {
  const [showEditor, setShowEditor] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState('');
  const [matricule, setMatricule] = useState('');
  const [recto, setRecto] = useState('#ffffff');
  const [verso, setVerso] = useState('#f0f0f0');
  const [editMode, setEditMode] = useState(true);
  const [bgSide, setBgSide] = useState('recto');
  const [bgTab, setBgTab] = useState('colors');
  const [busy, setBusy] = useState(false);
  const [prefs, setPrefs] = useState({
    showUserInfo: true,
    showSocialMedia: true,
    showTypeSpecificInfo: true,
    showDocuments: false,
  });

  const openEditor = () => {
    setName('Test Card');
    setMatricule(generateMatricule());
    setRecto('#ffffff');
    setVerso('#f0f0f0');
    setBgSide('recto');
    setBgTab('colors');
    setEditMode(true);
    
    // Préparer un objet d'édition vide
    setEditing({
      layout: {
        background: { type: 'color', value: '#ffffff' },
        elements: []
      },
      backLayout: {
        background: { type: 'color', value: '#f0f0f0' },
        elements: []
      },
      displayPreferences: prefs
    });
    
    setShowEditor(true);
  };

  const closeEditor = () => {
    setShowEditor(false);
    setEditing(null);
  };

  const saveCard = async () => {
    setBusy(true);
    
    // Simulation de sauvegarde
    setTimeout(() => {
      Alert.alert(
        'Succès',
        'Carte sauvegardée avec succès !',
        [{ text: 'OK', onPress: closeEditor }]
      );
      setBusy(false);
    }, 2000);
  };

  const handleSelectBg = (background) => {
    if (bgSide === 'recto') {
      setRecto(background.value);
    } else {
      setVerso(background.value);
    }
  };

  const detectType = (value) => {
    return detectBackgroundType(value);
  };

  // Mock data pour les backgrounds et uploads
  const mockBackgrounds = [
    { type: 'image', value: 'https://picsum.photos/350/200?random=1' },
    { type: 'image', value: 'https://picsum.photos/350/200?random=2' },
    { type: 'image', value: 'https://picsum.photos/350/200?random=3' },
  ];

  const mockUploads = [
    'https://picsum.photos/350/200?random=4',
    'https://picsum.photos/350/200?random=5',
  ];

  const mockPickImage = async () => {
    Alert.alert('Info', 'Sélection d\'image simulée');
  };

  const mockPickElementImage = async (callback) => {
    Alert.alert('Info', 'Sélection d\'image d\'élément simulée');
    if (callback) {
      callback('https://picsum.photos/100/100?random=6');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Test de l'Éditeur de Cartes</Text>
        <Text style={styles.subtitle}>
          Nouvelle interface d'édition avec drag & drop
        </Text>
        
        <Pressable style={styles.button} onPress={openEditor}>
          <Text style={styles.buttonText}>Ouvrir l'Éditeur</Text>
        </Pressable>
        
        <View style={styles.features}>
          <Text style={styles.featuresTitle}>Fonctionnalités :</Text>
          <Text style={styles.featureItem}>• Drag & drop des éléments</Text>
          <Text style={styles.featureItem}>• Redimensionnement en temps réel</Text>
          <Text style={styles.featureItem}>• Propriétés avancées (couleurs, styles)</Text>
          <Text style={styles.featureItem}>• Gestion recto/verso</Text>
          <Text style={styles.featureItem}>• Arrière-plans personnalisés</Text>
          <Text style={styles.featureItem}>• Aperçu en temps réel</Text>
        </View>
      </View>

      <CardEditorModal
        visible={showEditor}
        onRequestClose={closeEditor}
        onSave={saveCard}
        busy={busy}
        editing={editing}
        onEditingChange={setEditing}
        name={name}
        onChangeName={setName}
        matricule={matricule}
        onRegenerateMatricule={() => setMatricule(generateMatricule())}
        editMode={editMode}
        onToggleEditMode={() => setEditMode(!editMode)}
        bgSide={bgSide}
        onSetBgSide={setBgSide}
        bgTab={bgTab}
        onSetBgTab={setBgTab}
        recto={recto}
        verso={verso}
        onSelectBg={handleSelectBg}
        backgrounds={mockBackgrounds}
        uploads={mockUploads}
        onPickBackgroundImage={mockPickImage}
        onPickElementImage={mockPickElementImage}
        detectType={detectType}
        prefs={prefs}
        onChangePrefs={setPrefs}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: colors.mutedText,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    marginBottom: spacing.lg,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  features: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    width: '100%',
    maxWidth: 300,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  featureItem: {
    fontSize: 14,
    color: colors.mutedText,
    marginBottom: 4,
  },
});
