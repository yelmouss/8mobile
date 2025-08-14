import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Button, Alert, Pressable, Modal, TextInput, ScrollView, Image, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import MobileCard, { prefetchSvgUri } from '../components/MobileCard';
import CanvasEditor from '../components/CanvasEditor';
import { getMyCards, deleteCard, createCard, updateCard, getBackgrounds, getMyUploads, uploadImageFile } from '../api/client';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, spacing } from '../theme/theme';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
import { SvgUri } from 'react-native-svg';

export default function CardsScreen() {
  const { token } = useAuth();
  const [cards, setCards] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null); // card or null
  const [name, setName] = useState('');
  const [matricule, setMatricule] = useState('');
  const [recto, setRecto] = useState('');
  const [verso, setVerso] = useState('');
  const [busy, setBusy] = useState(false);
  const [bgTab, setBgTab] = useState('images'); // images | uploads | gradients | colors
  const [bgSide, setBgSide] = useState('recto'); // recto | verso
  const [search, setSearch] = useState('');
  const [backgrounds, setBackgrounds] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [carouselWidth, setCarouselWidth] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [prefs, setPrefs] = useState({ showUserInfo: true, showSocialMedia: true, showTypeSpecificInfo: true, showDocuments: true });
  const textPropInputRef = useRef(null);

  // Resolve Next base URL from Expo config (supports string or {development,production})
  const NEXT_EXTRA = Constants?.expoConfig?.extra?.NEXT_BASE_URL;
  const BASE = (typeof NEXT_EXTRA === 'string'
    ? NEXT_EXTRA
    : (NEXT_EXTRA?.production || NEXT_EXTRA?.development)) || 'http://localhost:3000';
  const toAbs = (u) => {
    if (!u) return null;
    const s = String(u);
    if (s.startsWith('http')) return s;
    return `${BASE}${s.startsWith('/') ? s : '/' + s}`;
  };
  const detectType = (v) => {
    if (!v) return 'image';
    const s = String(v);
    if (s.startsWith('linear-gradient')) return 'gradient';
    if (s.startsWith('#')) return 'color';
    return 'image';
  };
  const isSvg = (u) => typeof u === 'string' && u.trim().toLowerCase().endsWith('.svg');
  const prefetchBackground = useCallback((u) => {
    if (!u) return;
    const uri = toAbs(u);
    if (!uri) return;
    if (isSvg(u)) prefetchSvgUri(u);
    else Image.prefetch(uri).catch(() => {});
  }, []);

  const onSelectBg = useCallback((u) => {
    if (bgSide === 'recto') setRecto(u); else setVerso(u);
    prefetchBackground(u);
  }, [bgSide, prefetchBackground]);

  const chunk3 = (arr) => {
    const out = [];
    for (let i = 0; i < arr.length; i += 3) out.push(arr.slice(i, i + 3));
    return out;
  };

  const genMatricule = () => {
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    let part1 = '';
    for (let i = 0; i < 3; i++) part1 += letters[Math.floor(Math.random() * letters.length)];
    const digits = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    return `${part1}${digits}`;
  };

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const data = await getMyCards();
      setCards(data.cards || []);
      setError(null);
    } catch (e) {
      if (e.status === 401) {
        Alert.alert('Session expirée', 'Veuillez vous reconnecter.');
      } else {
        console.warn('Failed to load cards', e);
        setError('Impossible de charger vos cartes');
      }
    }
  }, [token]);

  useEffect(() => { if (token) load(); }, [token, load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const reloadChoices = useCallback(async () => {
    try {
      const b = await getBackgrounds();
      setBackgrounds(Array.isArray(b.backgrounds) ? b.backgrounds : []);
    } catch (e) {
      console.warn('Backgrounds load failed', e?.message || e);
      setBackgrounds([]);
    }
    try {
      const u = await getMyUploads();
      setUploads(Array.isArray(u.files) ? u.files : []);
    } catch (e) {
      console.warn('Uploads load failed', e?.message || e);
      setUploads([]);
    }
  }, []);

  useEffect(() => { reloadChoices(); }, [reloadChoices]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const openNew = () => {
    setName('Ma carte');
    setMatricule(genMatricule());
    setRecto(''); setVerso('');
    setBgSide('recto');
    setBgTab('images');
    setSelectedIdx(-1);
    setPrefs({ showUserInfo: true, showSocialMedia: true, showTypeSpecificInfo: true, showDocuments: true });
  setEditMode(true);
    // Prepare a fresh editing object so CanvasEditor can add elements prior to first save
    setEditing({
      layout: { background: { type: 'color', value: '#e5e7eb' }, elements: [] },
      backLayout: { background: { type: 'color', value: '#ffffff' }, elements: [] },
      displayPreferences: { showUserInfo: true, showSocialMedia: true, showTypeSpecificInfo: true, showDocuments: true },
    });
    if (!backgrounds.length || !uploads.length) reloadChoices();
    setShowForm(true);
  };
  const openEdit = (card) => {
    setEditing(card);
    setName(card?.name || '');
    setMatricule(card?.matricule || '');
    setRecto(card?.layout?.background?.value || '');
    setVerso(card?.backLayout?.background?.value || '');
    setPrefs({
      showUserInfo: !!card?.displayPreferences?.showUserInfo,
      showSocialMedia: !!card?.displayPreferences?.showSocialMedia,
      showTypeSpecificInfo: !!card?.displayPreferences?.showTypeSpecificInfo,
      showDocuments: !!card?.displayPreferences?.showDocuments,
    });
    setEditMode(true);
    setSelectedIdx(-1);
    if (!backgrounds.length || !uploads.length) reloadChoices();
    setShowForm(true);
  };
  const closeForm = () => { if (!busy) setShowForm(false); };
  const saveForm = async () => {
    try {
      setBusy(true);
      const basePayload = {
        name,
        matricule,
        recto,
        verso,
        rectoBackgroundType: detectType(recto),
        versoBackgroundType: detectType(verso),
      };
      const extra = {
        // Persist elements and preferences if available
        elements: editing?.layout?.elements || [],
        backElements: editing?.backLayout?.elements || [],
        displayPreferences: prefs,
      };
      if (editing?._id) {
        await updateCard(editing._id, { ...basePayload, ...extra });
      } else {
        const created = await createCard(basePayload);
        const newId = created?.cardId || created?._id;
        // If there are elements or preferences, follow up with an update
        if (newId && ((extra.elements && extra.elements.length) || (extra.backElements && extra.backElements.length) || extra.displayPreferences)) {
          try { await updateCard(newId, extra); } catch {}
        }
      }
      setShowForm(false);
      await load();
    } catch (e) {
      Alert.alert('Erreur', e?.message || 'Échec');
    } finally { setBusy(false); }
  };

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') {
      Alert.alert('Permission requise', 'Autorisez l’accès à la galerie pour importer une image.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.9 });
    if (res?.assets && res.assets[0]) {
      const a = res.assets[0];
      const file = { uri: a.uri, name: a.fileName || 'image.jpg', type: a.mimeType || 'image/jpeg' };
      try {
        setBusy(true);
        const up = await uploadImageFile(file);
        const url = up?.dockerFileUrl || up?.fileUrl;
        if (url) {
          if (bgSide === 'recto') setRecto(url); else setVerso(url);
          prefetchBackground(url);
          setBgTab('uploads');
          // refresh uploads list
          const u = await getMyUploads();
          setUploads(Array.isArray(u.files) ? u.files : []);
        }
      } catch (e) {
        Alert.alert('Upload', e?.message || 'Échec de l\'upload');
      } finally { setBusy(false); }
    }
  };

  // Pick image to insert as an element (not as background)
  const pickElementImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') {
      Alert.alert('Permission requise', 'Autorisez l’accès à la galerie pour importer une image.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.9 });
    if (res?.assets && res.assets[0]) {
      const a = res.assets[0];
      const file = { uri: a.uri, name: a.fileName || 'image.jpg', type: a.mimeType || 'image/jpeg' };
      try {
        setBusy(true);
        const up = await uploadImageFile(file);
        const url = up?.dockerFileUrl || up?.fileUrl;
        if (url && editing) {
          const arr = bgSide === 'recto' ? (editing.layout?.elements || []) : (editing.backLayout?.elements || []);
          const next = arr.concat([{ type: 'image', content: url, position: { x: 10, y: 10, zIndex: 1 }, style: { width: 30, height: 20, objectFit: 'contain' } }]);
          if (bgSide === 'recto') editing.layout = { ...(editing.layout || {}), elements: next }; else editing.backLayout = { ...(editing.backLayout || {}), elements: next };
          setEditing({ ...editing });
          setSelectedIdx(next.length - 1);
        }
      } catch (e) {
        Alert.alert('Upload', e?.message || 'Échec de l\'upload');
      } finally { setBusy(false); }
    }
  };

  const currentElements = useMemo(() => (bgSide === 'recto' ? (editing?.layout?.elements || []) : (editing?.backLayout?.elements || [])), [bgSide, editing]);
  const selectedEl = selectedIdx >= 0 ? currentElements[selectedIdx] : null;
  const updateSelectedEl = (patch) => {
    if (!editing || !selectedEl) return;
    const arr = currentElements.slice();
    arr[selectedIdx] = { ...selectedEl, ...patch };
    if (bgSide === 'recto') editing.layout = { ...(editing.layout || {}), elements: arr }; else editing.backLayout = { ...(editing.backLayout || {}), elements: arr };
    setEditing({ ...editing });
  };
  const updateSelectedElStyle = (patch) => updateSelectedEl({ style: { ...(selectedEl?.style || {}), ...patch } });
  const updateSelectedElPos = (patch) => updateSelectedEl({ position: { ...(selectedEl?.position || {}), ...patch } });

  // Focus the text input when selecting a text element
  useEffect(() => {
    if (selectedEl && selectedEl.type === 'text' && textPropInputRef.current) {
      try { textPropInputRef.current.focus?.(); } catch {}
    }
  }, [selectedEl]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes cartes</Text>
        <Pressable onPress={openNew} style={styles.iconBtn} accessibilityLabel="Nouvelle carte">
          <MaterialCommunityIcons name="plus" size={24} color={colors.primaryDark} />
        </Pressable>
      </View>
      <FlatList
        contentContainerStyle={styles.listContent}
        style={styles.list}
        data={cards}
        keyExtractor={(item) => String(item._id)}
        renderItem={({ item }) => (
          <View>
            <MobileCard
              card={item}
              onPress={() => openEdit(item)}
            />
            <View style={styles.actionsRow}>
              <Pressable
                onPress={() => openEdit(item)}
                style={styles.actionBtn}
                accessibilityLabel="Modifier"
              >
                <MaterialCommunityIcons name="pencil" size={20} color={colors.primaryDark} />
              </Pressable>
              <Pressable
                onPress={() => {
                  Alert.alert('Supprimer', 'Confirmer la suppression ?', [
                    { text: 'Annuler', style: 'cancel' },
                    { text: 'Supprimer', style: 'destructive', onPress: async () => { try { await deleteCard(item._id); await load(); } catch (e) { Alert.alert('Erreur', e?.message || 'Échec'); } } }
                  ]);
                }}
                style={styles.actionBtn}
                accessibilityLabel="Supprimer"
              >
                <MaterialCommunityIcons name="trash-can-outline" size={20} color="#d9534f" />
              </Pressable>
            </View>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListFooterComponent={<View style={{ height: spacing.lg }} />}
        ListEmptyComponent={!error ? (
          <View style={{ padding: spacing.lg }}>
            <Text style={{ color: colors.mutedText }}>Aucune carte pour l'instant.</Text>
          </View>
        ) : null}
      />
      {error ? (
        <View style={{ padding: spacing.md }}>
          <Text style={{ color: 'tomato', marginTop: 8 }}>{error}</Text>
          <View style={{ height: spacing.sm }} />
          <Button title="Recharger" onPress={onRefresh} />
        </View>
      ) : null}
      <Pressable onPress={openNew} style={styles.fab} accessibilityLabel="Créer une nouvelle carte">
        <MaterialCommunityIcons name="plus" size={26} color="#fff" />
      </Pressable>

      <Modal visible={showForm} animationType="slide" onRequestClose={closeForm}>
        <SafeAreaView style={styles.modalSafe}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>{editing ? 'Modifier la carte' : 'Nouvelle carte'}</Text>
            <Text style={styles.label}>Nom</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Ex: Carte pro" />
            <Text style={styles.label}>Matricule</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TextInput style={[styles.input, { flex: 1 }]} value={matricule} editable={false} placeholder="Ex: ABC123" />
              <Pressable onPress={() => setMatricule(genMatricule())} style={[styles.iconBtn, { marginLeft: 8 }]} accessibilityLabel="Régénérer le matricule">
                <MaterialCommunityIcons name="refresh" size={22} color={colors.primaryDark} />
              </Pressable>
            </View>
            <Text style={styles.label}>{editMode ? 'Éditeur' : 'Prévisualisation'}</Text>
            {editMode ? (
              <View>
                <CanvasEditor
                  side={bgSide}
                  layout={{ background: { type: detectType(bgSide === 'recto' ? recto : verso), value: bgSide === 'recto' ? recto : verso }, elements: (bgSide === 'recto' ? (editing?.layout?.elements || []) : (editing?.backLayout?.elements || [])) }}
                  onChange={(nextLayout) => {
                    if (!editing) return;
                    if (bgSide === 'recto') editing.layout = nextLayout; else editing.backLayout = nextLayout;
                    setEditing({ ...editing });
                  }}
                  selectedIdx={selectedIdx}
                  onSelectIdx={setSelectedIdx}
                />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm }}>
                  <Pressable style={styles.smallBtn} onPress={() => {
                    if (!editing) return;
                    const arr = bgSide === 'recto' ? (editing.layout.elements || []) : (editing.backLayout?.elements || []);
                    const next = arr.concat([{ type: 'text', content: 'Nouveau texte', position: { x: 10, y: 10 }, style: { width: 30, height: 10, fontSize: 18 } }]);
                    if (bgSide === 'recto') editing.layout.elements = next; else { if (!editing.backLayout) editing.backLayout = { background: { type: 'color', value: '#fff' }, elements: [] }; editing.backLayout.elements = next; }
                    setEditing({ ...editing });
                    setSelectedIdx(next.length - 1);
                  }}>
                    <Text style={styles.smallBtnText}>+ Texte</Text>
                  </Pressable>
                  <Pressable style={styles.smallBtn} onPress={pickElementImage}>
                    <Text style={styles.smallBtnText}>+ Image</Text>
                  </Pressable>
                  <Pressable style={styles.smallBtn} onPress={() => {
                    if (!editing) return;
                    const arr = bgSide === 'recto' ? (editing.layout.elements || []) : (editing.backLayout?.elements || []);
                    const next = arr.concat([{ type: 'audio', content: '', position: { x: 50, y: 80 }, style: { width: 10, height: 10 } }]);
                    if (bgSide === 'recto') editing.layout.elements = next; else { if (!editing.backLayout) editing.backLayout = { background: { type: 'color', value: '#fff' }, elements: [] }; editing.backLayout.elements = next; }
                    setEditing({ ...editing });
                  }}>
                    <Text style={styles.smallBtnText}>+ Audio</Text>
                  </Pressable>
                </View>
                {selectedEl ? (
                  <View style={styles.panel}>
                    <Text style={styles.panelTitle}>Propriétés</Text>
                    {selectedEl.type === 'text' ? (
                      <>
                        <Text style={styles.propLabel}>Texte</Text>
                        <TextInput ref={textPropInputRef} style={styles.input} value={String(selectedEl.content || '')} onChangeText={(t) => updateSelectedEl({ content: t })} />
                        <View style={styles.rowGap}>
                          <View style={{ flex: 1, marginRight: 6 }}>
                            <Text style={styles.propLabel}>Taille</Text>
                            <TextInput style={styles.input} keyboardType="numeric" value={String(selectedEl?.style?.fontSize ?? 18)} onChangeText={(v) => updateSelectedElStyle({ fontSize: parseFloat(v) || 12 })} />
                          </View>
                          <View style={{ flex: 1, marginLeft: 6 }}>
                            <Text style={styles.propLabel}>Couleur</Text>
                            <TextInput style={styles.input} value={String(selectedEl?.style?.color || '#111827')} onChangeText={(v) => updateSelectedElStyle({ color: v })} />
                          </View>
                        </View>
                      </>
                    ) : null}
                    {/* Position controls for easier placement */}
                    {selectedEl ? (
                      <View style={styles.rowGap}>
                        <View style={{ flex: 1, marginRight: 6 }}>
                          <Text style={styles.propLabel}>X (%)</Text>
                          <TextInput
                            style={styles.input}
                            keyboardType="numeric"
                            value={String(selectedEl?.position?.x ?? 0)}
                            onChangeText={(v) => updateSelectedElPos({ x: Math.max(0, Math.min(100, parseFloat(v) || 0)) })}
                          />
                        </View>
                        <View style={{ flex: 1, marginLeft: 6 }}>
                          <Text style={styles.propLabel}>Y (%)</Text>
                          <TextInput
                            style={styles.input}
                            keyboardType="numeric"
                            value={String(selectedEl?.position?.y ?? 0)}
                            onChangeText={(v) => updateSelectedElPos({ y: Math.max(0, Math.min(100, parseFloat(v) || 0)) })}
                          />
                        </View>
                      </View>
                    ) : null}
                    {selectedEl ? (
                      <View style={{ flexDirection: 'row', marginTop: 6 }}>
                        <Pressable style={styles.smallBtn} onPress={() => updateSelectedElPos({ x: Math.max(0, (selectedEl?.position?.x || 0) - 1) })}>
                          <Text style={styles.smallBtnText}>X-</Text>
                        </Pressable>
                        <Pressable style={[styles.smallBtn, { marginLeft: 6 }]} onPress={() => updateSelectedElPos({ x: Math.min(100, (selectedEl?.position?.x || 0) + 1) })}>
                          <Text style={styles.smallBtnText}>X+</Text>
                        </Pressable>
                        <Pressable style={[styles.smallBtn, { marginLeft: 12 }]} onPress={() => updateSelectedElPos({ y: Math.max(0, (selectedEl?.position?.y || 0) - 1) })}>
                          <Text style={styles.smallBtnText}>Y-</Text>
                        </Pressable>
                        <Pressable style={[styles.smallBtn, { marginLeft: 6 }]} onPress={() => updateSelectedElPos({ y: Math.min(100, (selectedEl?.position?.y || 0) + 1) })}>
                          <Text style={styles.smallBtnText}>Y+</Text>
                        </Pressable>
                      </View>
                    ) : null}
                    <View style={styles.rowGap}>
                      <View style={{ flex: 1, marginRight: 6 }}>
                        <Text style={styles.propLabel}>Largeur (%)</Text>
                        <TextInput style={styles.input} keyboardType="numeric" value={String(selectedEl?.style?.width ?? 20)} onChangeText={(v) => updateSelectedElStyle({ width: Math.max(1, Math.min(100, parseFloat(v) || 1)) })} />
                      </View>
                      <View style={{ flex: 1, marginLeft: 6 }}>
                        <Text style={styles.propLabel}>Hauteur (%)</Text>
                        <TextInput style={styles.input} keyboardType="numeric" value={String(selectedEl?.style?.height ?? 10)} onChangeText={(v) => updateSelectedElStyle({ height: Math.max(1, Math.min(100, parseFloat(v) || 1)) })} />
                      </View>
                    </View>
                    <View style={styles.rowGap}>
                      <View style={{ flex: 1, marginRight: 6 }}>
                        <Text style={styles.propLabel}>Rotation (deg)</Text>
                        <TextInput style={styles.input} keyboardType="numeric" value={String(selectedEl?.style?.rotation ?? 0)} onChangeText={(v) => updateSelectedElStyle({ rotation: parseFloat(v) || 0 })} />
                      </View>
                      <View style={{ flex: 1, marginLeft: 6 }}>
                        <Text style={styles.propLabel}>Opacité (0-1)</Text>
                        <TextInput style={styles.input} keyboardType="numeric" value={String(selectedEl?.style?.opacity ?? 1)} onChangeText={(v) => updateSelectedElStyle({ opacity: Math.max(0, Math.min(1, parseFloat(v))) })} />
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                      <Pressable style={[styles.smallBtn, { backgroundColor: '#fee2e2' }]} onPress={() => {
                        if (!editing) return;
                        const arr = currentElements.filter((_, i) => i !== selectedIdx);
                        if (bgSide === 'recto') editing.layout = { ...(editing.layout || {}), elements: arr }; else editing.backLayout = { ...(editing.backLayout || {}), elements: arr };
                        setEditing({ ...editing });
                        setSelectedIdx(-1);
                      }}>
                        <Text style={[styles.smallBtnText, { color: '#991b1b' }]}>Supprimer</Text>
                      </Pressable>
                      <View style={{ flexDirection: 'row' }}>
                        <Pressable style={styles.smallBtn} onPress={() => updateSelectedElPos({ zIndex: Math.max(1, (selectedEl?.position?.zIndex || 1) - 1) })}>
                          <Text style={styles.smallBtnText}>Arrière</Text>
                        </Pressable>
                        <Pressable style={[styles.smallBtn, { marginLeft: 8 }]} onPress={() => updateSelectedElPos({ zIndex: (selectedEl?.position?.zIndex || 1) + 1 })}>
                          <Text style={styles.smallBtnText}>Avant</Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                ) : null}
              </View>
            ) : (
              <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, overflow: 'hidden' }}>
                <MobileCard card={{ layout: { background: recto ? { type: detectType(recto), value: recto } : { type: 'color', value: '#e5e7eb' }, elements: editing?.layout?.elements || [] }, backLayout: { background: verso ? { type: detectType(verso), value: verso } : { type: 'color', value: '#fff' }, elements: editing?.backLayout?.elements || [] } }} />
              </View>
            )}

            <View style={styles.sideRow}>
              {['recto','verso'].map(s => (
                <Pressable key={s} onPress={() => setBgSide(s)} style={[styles.tabBtn, bgSide === s && styles.tabBtnActive]}>
                  <Text style={[styles.tabText, bgSide === s && styles.tabTextActive]}>{s}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.tabsRow}>
              {['images','uploads','gradients','colors'].map(t => (
                <Pressable key={t} onPress={() => setBgTab(t)} style={[styles.tabBtn, bgTab === t && styles.tabBtnActive]}>
                  <Text style={[styles.tabText, bgTab === t && styles.tabTextActive]}>{t}</Text>
                </Pressable>
              ))}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm }}>
              <Pressable onPress={() => setEditMode((v) => !v)} style={[styles.smallBtn, { backgroundColor: editMode ? colors.primary : '#e5e7eb' }]}>
                <Text style={[styles.smallBtnText, { color: editMode ? '#fff' : '#111' }]}>{editMode ? 'Prévisualiser' : 'Éditer'}</Text>
              </Pressable>
              <Pressable onPress={() => setBgSide(bgSide === 'recto' ? 'verso' : 'recto')} style={styles.smallBtn}>
                <Text style={styles.smallBtnText}>{bgSide === 'recto' ? 'Aller au verso' : 'Aller au recto'}</Text>
              </Pressable>
            </View>

            {bgTab === 'images' && (
              <>
                <TextInput style={styles.input} placeholder="Rechercher..." value={search} onChangeText={setSearch} />
                {!backgrounds.length ? (
                  <View style={{ padding: spacing.md }}>
                    <Text style={{ color: colors.mutedText, marginBottom: 8 }}>Aucun background trouvé.</Text>
                    <Button title="Recharger" onPress={reloadChoices} />
                  </View>
                ) : (
                  <View onLayout={(e) => setCarouselWidth(e.nativeEvent.layout.width)}>
                    <FlatList
                      data={chunk3(backgrounds.filter(u => !search || String(u).toLowerCase().includes(search.toLowerCase())))}
                      keyExtractor={(_, idx) => `page-${idx}`}
                      horizontal
                      pagingEnabled
                      showsHorizontalScrollIndicator={false}
                      initialNumToRender={2}
                      maxToRenderPerBatch={2}
                      windowSize={3}
                      removeClippedSubviews
                      renderItem={({ item: page }) => {
                        const W = Math.max(0, carouselWidth - spacing.md * 2);
                        const gap = spacing.md;
                        const cardW = W > 0 ? (W - gap * 2) / 3 : 100;
                        return (
                          <View style={{ width: carouselWidth }}>
                            <View style={{ flexDirection: 'row', paddingHorizontal: spacing.md, justifyContent: 'space-between' }}>
                              {page.map((u) => {
                                const selectedVal = bgSide === 'recto' ? recto : verso;
                                const isSel = selectedVal === u;
                                return (
                                  <Pressable key={u} onPress={() => onSelectBg(u)} style={[styles.thumbWrap, isSel && styles.thumbWrapSelected, { width: cardW, aspectRatio: 1.6 }]}>
                                    {isSvg(u) ? (
                                      <SvgUri uri={toAbs(u)} width="100%" height="100%" />
                                    ) : (
                                      <Image source={{ uri: toAbs(u) }} style={styles.thumb} />
                                    )}
                                  </Pressable>
                                );
                              })}
                              {page.length < 3 && Array.from({ length: 3 - page.length }).map((_, idx) => (
                                <View key={`sp-${idx}`} style={{ width: cardW }} />
                              ))}
                            </View>
                          </View>
                        );
                      }}
                    />
                  </View>
                )}
              </>
            )}
            {bgTab === 'uploads' && (
              <>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.label}>Mes uploads</Text>
                  <Pressable onPress={pickImage} style={styles.iconBtn}>
                    <MaterialCommunityIcons name="upload" size={22} color={colors.primaryDark} />
                  </Pressable>
                </View>
                <View style={styles.grid}>
          {uploads.map(u => {
                    const selectedVal = bgSide === 'recto' ? recto : verso;
                    const isSel = selectedVal === u;
                    return (
            <Pressable key={u} onPress={() => onSelectBg(u)} style={[styles.thumbWrap, isSel && styles.thumbWrapSelected]}>
                        <Image source={{ uri: toAbs(u) }} style={styles.thumb} />
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}
            {bgTab === 'gradients' && (
              <View style={styles.grid}>
                {[
                  'linear-gradient(90deg, #3b82f6 0%, #06b6d4 100%)',
                  'linear-gradient(90deg, #f472b6 0%, #f59e42 100%)',
                  'linear-gradient(90deg, #8b5cf6 0%, #6366f1 100%)',
                  'linear-gradient(90deg, #10b981 0%, #facc15 100%)',
                  'linear-gradient(90deg, #181C14 0%, #697565 100%)',
                  'linear-gradient(135deg, #181C14 0%, #3C3D37 100%)',
                ].map(g => {
                  const selectedVal = bgSide === 'recto' ? recto : verso;
                  const isSel = selectedVal === g;
                  return (
                    <Pressable key={g} onPress={() => onSelectBg(g)} style={[styles.gradientThumb, isSel && styles.thumbWrapSelected]}>
                      <Text style={styles.gradientLabel}>Gradient</Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
            {bgTab === 'colors' && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {['#181C14','#ECDFCC','#3C3D37','#697565','#9ca3af','#4b5563','#ef4444','#f59e0b','#10b981','#3b82f6','#f472b6','#facc15','#ffffff','#000000','#6366f1','#8b5cf6','#06b6d4','#f59e42'].map(c => {
                  const selectedVal = bgSide === 'recto' ? recto : verso;
                  const isSel = selectedVal === c;
                  return (
                    <Pressable key={c} onPress={() => onSelectBg(c)} style={[styles.colorDot, { backgroundColor: c }, isSel && { borderColor: colors.primary, borderWidth: 2 }]} />
                  );
                })}
              </View>
            )}
            <View style={{ height: spacing.md }} />
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Confidentialité</Text>
              <View style={styles.rowBetween}>
                <Text style={styles.propLabel}>Infos utilisateur</Text>
                <Switch value={!!prefs.showUserInfo} onValueChange={(v) => setPrefs((p) => ({ ...p, showUserInfo: v }))} />
              </View>
              <View style={styles.rowBetween}>
                <Text style={styles.propLabel}>Réseaux sociaux</Text>
                <Switch value={!!prefs.showSocialMedia} onValueChange={(v) => setPrefs((p) => ({ ...p, showSocialMedia: v }))} />
              </View>
              <View style={styles.rowBetween}>
                <Text style={styles.propLabel}>Infos spécifiques</Text>
                <Switch value={!!prefs.showTypeSpecificInfo} onValueChange={(v) => setPrefs((p) => ({ ...p, showTypeSpecificInfo: v }))} />
              </View>
              <View style={styles.rowBetween}>
                <Text style={styles.propLabel}>Documents</Text>
                <Switch value={!!prefs.showDocuments} onValueChange={(v) => setPrefs((p) => ({ ...p, showDocuments: v }))} />
              </View>
            </View>
            <Button title={busy ? 'Veuillez patienter…' : (editing ? 'Enregistrer' : 'Créer')} onPress={saveForm} disabled={busy} />
            <View style={{ height: spacing.sm }} />
            <Button title="Fermer" onPress={closeForm} disabled={busy} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fafafa' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  iconBtn: { padding: 8, borderRadius: 20 },
  list: { flex: 1 },
  listContent: { padding: spacing.md },
  fab: { position: 'absolute', right: spacing.lg, bottom: spacing.lg, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', elevation: 3 },
  actionsRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 6 },
  actionBtn: { paddingHorizontal: 8, paddingVertical: 4, marginLeft: 8 },
  modalSafe: { flex: 1, backgroundColor: colors.background },
  modalContent: { padding: spacing.md },
  modalTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  label: { marginTop: spacing.sm, color: colors.mutedText },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, marginTop: 6, backgroundColor: '#fff' },
  tabsRow: { flexDirection: 'row', marginTop: spacing.md, marginBottom: spacing.sm },
  tabBtn: { paddingVertical: 6, paddingHorizontal: 10, borderWidth: 1, borderColor: colors.border, borderRadius: 20, marginRight: 8 },
  tabBtnActive: { backgroundColor: '#fff', borderColor: colors.primary },
  tabText: { color: colors.mutedText },
  tabTextActive: { color: colors.text, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.sm },
  thumbWrap: { width: '31%', aspectRatio: 1.6, margin: 6, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  thumb: { width: '100%', height: '100%' },
  gradientThumb: { width: '31%', aspectRatio: 1.6, margin: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e5e7eb' },
  gradientLabel: { fontSize: 12, color: '#333' },
  colorDot: { width: 36, height: 36, borderRadius: 18, margin: 6, borderWidth: 1, borderColor: colors.border },
  panel: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: spacing.md, marginVertical: spacing.md },
  panelTitle: { fontWeight: '700', marginBottom: 8, color: colors.text },
  propLabel: { color: colors.mutedText, marginTop: 6 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  rowGap: { flexDirection: 'row', marginTop: 6 },
});
