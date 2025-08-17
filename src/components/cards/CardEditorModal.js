import React, { useMemo, useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, Modal, TextInput, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, spacing } from '../../theme/theme';
import EditorToolbar from './editor/EditorToolbar';
import BackgroundPicker from './editor/BackgroundPicker';
import PropertiesPanel from './editor/PropertiesPanel';
import PrivacyPanel from './PrivacyPanel';
import CardCanvasEditor from './editor/CardCanvasEditor';
import MobileCard from '../MobileCard';

export default function CardEditorModal({
  visible,
  onRequestClose,
  onSave,
  busy,
  // identity
  editing,
  onEditingChange,
  name,
  onChangeName,
  matricule,
  onRegenerateMatricule,
  // editor state
  editMode,
  onToggleEditMode,
  bgSide,
  onSetBgSide,
  bgTab,
  onSetBgTab,
  recto,
  verso,
  onSelectBg,
  // assets
  backgrounds,
  uploads,
  onPickBackgroundImage,
  onPickElementImage,
  // helpers
  detectType,
  // privacy
  prefs,
  onChangePrefs,
}) {
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [interacting, setInteracting] = useState(false);
  
  // Calculer les éléments actuels selon la face
  const currentElements = useMemo(() => 
    bgSide === 'recto' 
      ? (editing?.layout?.elements || []) 
      : (editing?.backLayout?.elements || []), 
    [bgSide, editing]
  );
  
  const selectedEl = selectedIdx >= 0 ? currentElements[selectedIdx] : null;
  
  // Calculer le layout actuel pour le canvas
  const currentLayout = useMemo(() => {
    const background = bgSide === 'recto' ? recto : verso;
    return {
      background: background ? { type: detectType(background), value: background } : { type: 'color', value: '#e5e7eb' },
      elements: currentElements
    };
  }, [bgSide, recto, verso, currentElements, detectType]);

  // Fonctions de mise à jour des éléments
  const updateElement = (idx, newElement) => {
    if (!editing) return;
    const arr = [...currentElements];
    arr[idx] = newElement;
    updateElementsArray(arr);
  };

  const updateElementsArray = (newElements) => {
    if (!editing) return;
    if (bgSide === 'recto') {
      onEditingChange({ 
        ...editing, 
        layout: { ...(editing.layout || {}), elements: newElements } 
      });
    } else {
      onEditingChange({ 
        ...editing, 
        backLayout: { ...(editing.backLayout || {}), elements: newElements } 
      });
    }
  };

  const updateSelectedEl = (patch) => {
    if (!editing || !selectedEl || selectedIdx < 0) return;
    const newElement = { ...selectedEl, ...patch };
    updateElement(selectedIdx, newElement);
  };

  const updateSelectedElStyle = (patch) => {
    updateSelectedEl({ style: { ...(selectedEl?.style || {}), ...patch } });
  };

  const updateSelectedElPos = (patch) => {
    updateSelectedEl({ position: { ...(selectedEl?.position || {}), ...patch } });
  };

  // Fonctions d'ajout d'éléments
  const addTextElement = () => {
    if (!editing) return;
    const newElement = {
      type: 'text',
      content: 'Nouveau texte',
      position: { x: 10, y: 10, zIndex: currentElements.length + 1 },
      style: {
        width: 30,
        height: 15,
        fontSize: 18,
        color: '#000000',
        fontWeight: 'normal',
        textAlign: 'left',
        backgroundColor: 'transparent',
      }
    };
    const newElements = [...currentElements, newElement];
    updateElementsArray(newElements);
    setSelectedIdx(newElements.length - 1);
  };

  const addImageElement = () => {
    if (!editing) return;
    onPickElementImage && onPickElementImage((imageUrl) => {
      const newElement = {
        type: 'image',
        content: imageUrl,
        position: { x: 20, y: 20, zIndex: currentElements.length + 1 },
        style: {
          width: 25,
          height: 20,
          borderRadius: 0,
          opacity: 1,
          backgroundColor: 'transparent',
        }
      };
      const newElements = [...currentElements, newElement];
      updateElementsArray(newElements);
      setSelectedIdx(newElements.length - 1);
    });
  };

  const addAudioElement = () => {
    if (!editing) return;
    const newElement = {
      type: 'audio',
      content: '',
      position: { x: 50, y: 80, zIndex: currentElements.length + 1 },
      style: {
        width: 15,
        height: 10,
        backgroundColor: colors.primary + '20',
        borderRadius: 8,
      }
    };
    const newElements = [...currentElements, newElement];
    updateElementsArray(newElements);
    setSelectedIdx(newElements.length - 1);
  };

  // Fonctions d'actions sur les éléments
  const deleteSelectedElement = () => {
    if (!editing || selectedIdx < 0) return;
    Alert.alert(
      'Supprimer l\'élément',
      'Êtes-vous sûr de vouloir supprimer cet élément ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            const newElements = currentElements.filter((_, i) => i !== selectedIdx);
            updateElementsArray(newElements);
            setSelectedIdx(-1);
          }
        }
      ]
    );
  };

  const duplicateSelectedElement = () => {
    if (!editing || selectedIdx < 0 || !selectedEl) return;
    const duplicatedElement = {
      ...selectedEl,
      position: {
        ...selectedEl.position,
        x: Math.min(90, (selectedEl.position?.x || 0) + 5),
        y: Math.min(90, (selectedEl.position?.y || 0) + 5),
        zIndex: currentElements.length + 1,
      }
    };
    const newElements = [...currentElements, duplicatedElement];
    updateElementsArray(newElements);
    setSelectedIdx(newElements.length - 1);
  };

  const sendToBack = () => {
    updateSelectedElPos({ 
      zIndex: Math.max(1, (selectedEl?.position?.zIndex || 1) - 1) 
    });
  };

  const bringToFront = () => {
    updateSelectedElPos({ 
      zIndex: (selectedEl?.position?.zIndex || 1) + 1 
    });
  };

  // Gérer la sélection d'arrière-plan
  const handleSelectBackground = (background) => {
    onSelectBg && onSelectBg(background);
  };

  // Reset de la sélection lors du changement de face ou de fermeture
  useEffect(() => {
    setSelectedIdx(-1);
  }, [bgSide, visible]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onRequestClose}>
      <SafeAreaView style={styles.modalSafe}>
        <ScrollView 
          contentContainerStyle={styles.modalContent} 
          scrollEnabled={!interacting}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editing && editing._id ? 'Modifier la carte' : 'Créer une carte'}
            </Text>
            <Pressable onPress={onRequestClose} style={styles.closeBtn} accessibilityLabel="Fermer">
              <MaterialCommunityIcons name="close" size={22} color={colors.primaryDark} />
            </Pressable>
          </View>

          {/* Informations de base */}
          <View style={styles.basicInfoSection}>
            <Text style={styles.label}>Nom</Text>
            <TextInput 
              style={styles.input} 
              value={name} 
              onChangeText={onChangeName} 
              placeholder="Ex: Carte pro" 
            />

            <Text style={styles.label}>Matricule</Text>
            <View style={styles.matriculeRow}>
              <TextInput 
                style={[styles.input, { flex: 1 }]} 
                value={matricule} 
                editable={false} 
                placeholder="Ex: ABC123" 
              />
              <Pressable 
                onPress={onRegenerateMatricule} 
                style={styles.matriculeBtn} 
                accessibilityLabel="Régénérer le matricule"
              >
                <MaterialCommunityIcons name="refresh" size={22} color={colors.primaryDark} />
              </Pressable>
            </View>
          </View>

          {/* Toolbar d'édition */}
          <EditorToolbar
            editMode={editMode}
            onToggleMode={onToggleEditMode}
            side={bgSide}
            onSwitchSide={onSetBgSide}
            onAddText={addTextElement}
            onAddImage={addImageElement}
            onAddAudio={addAudioElement}
            disabled={busy}
          />

          {/* Zone d'édition/prévisualisation */}
          <View style={styles.editorSection}>
            <Text style={styles.sectionTitle}>
              {editMode ? 'Éditeur' : 'Prévisualisation'} - {bgSide === 'recto' ? 'Recto' : 'Verso'}
            </Text>
            
            {editMode ? (
              <View style={styles.editorContainer}>
                <CardCanvasEditor
                  side={bgSide}
                  layout={currentLayout}
                  onChange={(newLayout) => {
                    if (!editing) return;
                    if (bgSide === 'recto') {
                      onEditingChange({ 
                        ...editing, 
                        layout: newLayout 
                      });
                    } else {
                      onEditingChange({ 
                        ...editing, 
                        backLayout: newLayout 
                      });
                    }
                  }}
                  selectedIdx={selectedIdx}
                  onSelectIdx={setSelectedIdx}
                  onInteractStart={() => setInteracting(true)}
                  onInteractEnd={() => setInteracting(false)}
                  disabled={busy}
                  snapEnabled={true}
                  snapStep={2}
                />
              </View>
            ) : (
              <View style={styles.previewContainer}>
                <MobileCard 
                  card={{
                    layout: {
                      background: recto ? { type: detectType(recto), value: recto } : { type: 'color', value: '#e5e7eb' },
                      elements: editing?.layout?.elements || []
                    },
                    backLayout: {
                      background: verso ? { type: detectType(verso), value: verso } : { type: 'color', value: '#fff' },
                      elements: editing?.backLayout?.elements || []
                    }
                  }}
                />
              </View>
            )}
          </View>

          {/* Panneaux de configuration en mode édition */}
          {editMode && (
            <View style={styles.configPanels}>
              <BackgroundPicker
                tab={bgTab}
                onTabChange={onSetBgTab}
                currentValue={bgSide === 'recto' ? recto : verso}
                onSelect={handleSelectBackground}
                backgrounds={backgrounds}
                uploads={uploads}
                onUploadPress={onPickBackgroundImage}
                loading={busy}
              />

              <PropertiesPanel
                selectedEl={selectedEl}
                onUpdateContent={(content) => updateSelectedEl({ content })}
                onUpdateStyle={updateSelectedElStyle}
                onUpdatePos={updateSelectedElPos}
                onDelete={deleteSelectedElement}
                onDuplicate={duplicateSelectedElement}
                onSendBack={sendToBack}
                onBringFront={bringToFront}
              />
            </View>
          )}

          {/* Panneau de confidentialité */}
          <PrivacyPanel prefs={prefs} onChange={onChangePrefs} />

          {/* Boutons d'action */}
          <View style={styles.actionButtons}>
            <Pressable 
              onPress={onRequestClose} 
              disabled={busy} 
              style={[styles.secondaryBtn, busy && { opacity: 0.6 }]} 
              accessibilityLabel="Annuler"
            >
              <Text style={styles.secondaryBtnText}>Annuler</Text>
            </Pressable>
            <Pressable 
              onPress={onSave} 
              disabled={busy} 
              style={[styles.primaryBtn, busy && { opacity: 0.6 }]} 
              accessibilityLabel="Enregistrer"
            >
              <Text style={styles.primaryBtnText}>
                {busy ? 'Veuillez patienter…' : (editing && editing._id ? 'Enregistrer' : 'Créer')}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalSafe: { 
    flex: 1, 
    backgroundColor: colors.background 
  },
  modalContent: { 
    padding: spacing.md 
  },
  modalHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    marginBottom: spacing.md 
  },
  modalTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: colors.text 
  },
  closeBtn: { 
    padding: 6, 
    borderRadius: 20 
  },
  basicInfoSection: {
    marginBottom: spacing.md,
    padding: spacing.sm,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: { 
    marginTop: spacing.sm, 
    marginBottom: 6,
    color: colors.mutedText,
    fontSize: 14,
    fontWeight: '500',
  },
  input: { 
    borderWidth: 1, 
    borderColor: colors.border, 
    borderRadius: 8, 
    padding: 12, 
    backgroundColor: '#fff',
    fontSize: 16,
  },
  matriculeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  matriculeBtn: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  editorSection: {
    marginBottom: spacing.md,
  },
  editorContainer: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.sm,
    backgroundColor: '#fff',
  },
  previewContainer: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  configPanels: {
    marginBottom: spacing.md,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  primaryBtn: { 
    flex: 1, 
    backgroundColor: colors.primary, 
    paddingVertical: 12, 
    borderRadius: 8, 
    alignItems: 'center' 
  },
  primaryBtnText: { 
    color: '#fff', 
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryBtn: { 
    flex: 1, 
    backgroundColor: '#e5e7eb', 
    paddingVertical: 12, 
    borderRadius: 8, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: colors.border 
  },
  secondaryBtnText: { 
    color: colors.text, 
    fontWeight: '600',
    fontSize: 16,
  },
});
