import React, { useMemo, useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, Modal, TextInput, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, spacing } from '../../theme/theme';
import EditorToolbar from './EditorToolbar';
import BackgroundPicker from './BackgroundPicker';
import PropertiesPanel from './PropertiesPanel';
import PrivacyPanel from './PrivacyPanel';
import CanvasEditor from '../CanvasEditor';
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
  const currentElements = useMemo(() => (bgSide === 'recto' ? (editing?.layout?.elements || []) : (editing?.backLayout?.elements || [])), [bgSide, editing]);
  const selectedEl = selectedIdx >= 0 ? currentElements[selectedIdx] : null;

  const updateSelectedEl = (patch) => {
    if (!editing || !selectedEl) return;
    const arr = currentElements.slice();
    arr[selectedIdx] = { ...selectedEl, ...patch };
    if (bgSide === 'recto') onEditingChange({ ...(editing || {}), layout: { ...(editing?.layout || {}), elements: arr } });
    else onEditingChange({ ...(editing || {}), backLayout: { ...(editing?.backLayout || {}), elements: arr } });
  };
  const updateSelectedElStyle = (patch) => updateSelectedEl({ style: { ...(selectedEl?.style || {}), ...patch } });
  const updateSelectedElPos = (patch) => updateSelectedEl({ position: { ...(selectedEl?.position || {}), ...patch } });

  // Reset selection when switching side or closing
  useEffect(() => { setSelectedIdx(-1); }, [bgSide, visible]);

  const [interacting, setInteracting] = useState(false);
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onRequestClose}>
      <SafeAreaView style={styles.modalSafe}>
        <ScrollView contentContainerStyle={styles.modalContent} scrollEnabled={!interacting}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editing && editing._id ? 'Modifier la carte' : 'Créer une carte'}</Text>
            <Pressable onPress={onRequestClose} style={styles.closeBtn} accessibilityLabel="Fermer">
              <MaterialCommunityIcons name="close" size={22} color={colors.primaryDark} />
            </Pressable>
          </View>

          <Text style={styles.label}>Nom</Text>
          <TextInput style={styles.input} value={name} onChangeText={onChangeName} placeholder="Ex: Carte pro" />

          <Text style={styles.label}>Matricule</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TextInput style={[styles.input, { flex: 1 }]} value={matricule} editable={false} placeholder="Ex: ABC123" />
            <Pressable onPress={onRegenerateMatricule} style={[styles.iconBtn, { marginLeft: 8 }]} accessibilityLabel="Régénérer le matricule">
              <MaterialCommunityIcons name="refresh" size={22} color={colors.primaryDark} />
            </Pressable>
          </View>

          <Text style={styles.label}>{editMode ? 'Éditeur' : 'Prévisualisation'}</Text>
          <EditorToolbar
            editMode={editMode}
            onToggleMode={onToggleEditMode}
            onSwitchSide={() => onSetBgSide(bgSide === 'recto' ? 'verso' : 'recto')}
            side={bgSide}
            onAddText={() => {
              if (!editing) return;
              const arr = bgSide === 'recto' ? (editing.layout?.elements || []) : (editing.backLayout?.elements || []);
              const next = arr.concat([{ type: 'text', content: 'Nouveau texte', position: { x: 10, y: 10 }, style: { width: 30, height: 10, fontSize: 18 } }]);
              if (bgSide === 'recto') onEditingChange({ ...(editing || {}), layout: { ...(editing.layout || {}), elements: next } });
              else onEditingChange({ ...(editing || {}), backLayout: { ...(editing.backLayout || {}), elements: next } });
              setSelectedIdx(next.length - 1);
            }}
            onAddImage={onPickElementImage}
            onAddAudio={() => {
              if (!editing) return;
              const arr = bgSide === 'recto' ? (editing.layout?.elements || []) : (editing.backLayout?.elements || []);
              const next = arr.concat([{ type: 'audio', content: '', position: { x: 50, y: 80 }, style: { width: 10, height: 10 } }]);
              if (bgSide === 'recto') onEditingChange({ ...(editing || {}), layout: { ...(editing.layout || {}), elements: next } });
              else onEditingChange({ ...(editing || {}), backLayout: { ...(editing.backLayout || {}), elements: next } });
            }}
          />

          {editMode ? (
            <View>
              <CanvasEditor
                side={bgSide}
                layout={{ background: { type: detectType(bgSide === 'recto' ? recto : verso), value: bgSide === 'recto' ? recto : verso }, elements: (bgSide === 'recto' ? (editing?.layout?.elements || []) : (editing?.backLayout?.elements || [])) }}
                onChange={(nextLayout) => {
                  if (!editing) return;
                  if (bgSide === 'recto') onEditingChange({ ...(editing || {}), layout: nextLayout }); else onEditingChange({ ...(editing || {}), backLayout: nextLayout });
                }}
                selectedIdx={selectedIdx}
                onSelectIdx={setSelectedIdx}
                onInteractStart={() => setInteracting(true)}
                onInteractEnd={() => setInteracting(false)}
              />
              <View style={styles.sideRow}>
                {['recto','verso'].map(s => (
                  <Pressable key={s} onPress={() => onSetBgSide(s)} style={[styles.tabBtn, bgSide === s && styles.tabBtnActive]}>
                    <Text style={[styles.tabText, bgSide === s && styles.tabTextActive]}>{s === 'recto' ? 'Recto' : 'Verso'}</Text>
                  </Pressable>
                ))}
              </View>
              <BackgroundPicker
                tab={bgTab}
                onTabChange={onSetBgTab}
                currentValue={bgSide === 'recto' ? recto : verso}
                onSelect={onSelectBg}
                backgrounds={backgrounds}
                uploads={uploads}
                onUploadPress={onPickBackgroundImage}
              />
              <PropertiesPanel
                selectedEl={selectedEl}
                onUpdateContent={(t) => updateSelectedEl({ content: t })}
                onUpdateStyle={(p) => updateSelectedElStyle(p)}
                onUpdatePos={(p) => updateSelectedElPos(p)}
                onDelete={() => {
                  if (!editing) return;
                  const arr = currentElements.filter((_, i) => i !== selectedIdx);
                  if (bgSide === 'recto') onEditingChange({ ...(editing || {}), layout: { ...(editing.layout || {}), elements: arr } });
                  else onEditingChange({ ...(editing || {}), backLayout: { ...(editing.backLayout || {}), elements: arr } });
                  setSelectedIdx(-1);
                }}
                onSendBack={() => updateSelectedElPos({ zIndex: Math.max(1, (selectedEl?.position?.zIndex || 1) - 1) })}
                onBringFront={() => updateSelectedElPos({ zIndex: (selectedEl?.position?.zIndex || 1) + 1 })}
              />
            </View>
          ) : (
            <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, overflow: 'hidden' }}>
              <MobileCard card={{ layout: { background: recto ? { type: detectType(recto), value: recto } : { type: 'color', value: '#e5e7eb' }, elements: editing?.layout?.elements || [] }, backLayout: { background: verso ? { type: detectType(verso), value: verso } : { type: 'color', value: '#fff' }, elements: editing?.backLayout?.elements || [] } }} />
            </View>
          )}

          <View style={{ height: spacing.md }} />
          <PrivacyPanel prefs={prefs} onChange={onChangePrefs} />

          <View style={{ flexDirection: 'row', gap: 10, marginTop: spacing.md }}>
            <Pressable onPress={onRequestClose} disabled={busy} style={[styles.secondaryBtn, busy && { opacity: 0.6 }]} accessibilityLabel="Annuler">
              <Text style={styles.secondaryBtnText}>Annuler</Text>
            </Pressable>
            <Pressable onPress={onSave} disabled={busy} style={[styles.primaryBtn, busy && { opacity: 0.6 }]} accessibilityLabel="Enregistrer">
              <Text style={styles.primaryBtnText}>{busy ? 'Veuillez patienter…' : (editing && editing._id ? 'Enregistrer' : 'Créer')}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalSafe: { flex: 1, backgroundColor: colors.background },
  modalContent: { padding: spacing.md },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  modalTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  closeBtn: { padding: 6, borderRadius: 20 },
  label: { marginTop: spacing.sm, color: colors.mutedText },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, marginTop: 6, backgroundColor: '#fff' },
  sideRow: { flexDirection: 'row', marginTop: spacing.md, marginBottom: spacing.sm },
  tabBtn: { paddingVertical: 6, paddingHorizontal: 10, borderWidth: 1, borderColor: colors.border, borderRadius: 20, marginRight: 8 },
  tabBtnActive: { backgroundColor: '#fff', borderColor: colors.primary },
  tabText: { color: colors.mutedText },
  tabTextActive: { color: colors.text, fontWeight: '600' },
  primaryBtn: { flex: 1, backgroundColor: colors.primary, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
  secondaryBtn: { flex: 1, backgroundColor: '#e5e7eb', paddingVertical: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  secondaryBtnText: { color: colors.text, fontWeight: '600' },
});
