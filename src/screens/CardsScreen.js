import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Button,
  Alert,
  Pressable,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { prefetchSvgUri } from "../components/MobileCard";
import CardList from "../components/cards/CardList";
import CardEditorModal from "../components/cards/CardEditorModal";
import {
  getMyCards,
  deleteCard,
  createCard,
  updateCard,
  getBackgrounds,
  getMyUploads,
  uploadImageFile,
} from "../api/client";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { colors, spacing } from "../theme/theme";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import Constants from "expo-constants";
// (no direct Svg rendering here)

export default function CardsScreen() {
  const { token } = useAuth();
  const [cards, setCards] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null); // card or null
  const [name, setName] = useState("");
  const [matricule, setMatricule] = useState("");
  const [recto, setRecto] = useState("");
  const [verso, setVerso] = useState("");
  const [busy, setBusy] = useState(false);
  const [bgTab, setBgTab] = useState("images"); // images | uploads | gradients | colors
  const [bgSide, setBgSide] = useState("recto"); // recto | verso
  const [backgrounds, setBackgrounds] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [prefs, setPrefs] = useState({
    showUserInfo: true,
    showSocialMedia: true,
    showTypeSpecificInfo: true,
    showDocuments: true,
  });

  // Resolve Next base URL from Expo config (supports string or {development,production})
  const NEXT_EXTRA = Constants?.expoConfig?.extra?.NEXT_BASE_URL;
  const BASE =
    (typeof NEXT_EXTRA === "string"
      ? NEXT_EXTRA
      : NEXT_EXTRA?.production || NEXT_EXTRA?.development) ||
    "http://localhost:3000";
  const toAbs = (u) => {
    if (!u) return null;
    const s = String(u);
    if (s.startsWith("http")) return s;
    return `${BASE}${s.startsWith("/") ? s : "/" + s}`;
  };
  const detectType = (v) => {
    if (!v) return "image";
    const s = String(v);
    if (s.startsWith("linear-gradient")) return "gradient";
    if (s.startsWith("#")) return "color";
    return "image";
  };
  const isSvg = (u) =>
    typeof u === "string" && u.trim().toLowerCase().endsWith(".svg");
  const prefetchBackground = useCallback((u) => {
    if (!u) return;
    const uri = toAbs(u);
    if (!uri) return;
    if (isSvg(u)) prefetchSvgUri(u);
    else Image.prefetch(uri).catch(() => {});
  }, []);

  const onSelectBg = useCallback(
    (u) => {
      if (bgSide === "recto") setRecto(u);
      else setVerso(u);
      prefetchBackground(u);
    },
    [bgSide, prefetchBackground]
  );

  const genMatricule = () => {
    const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    let part1 = "";
    for (let i = 0; i < 3; i++)
      part1 += letters[Math.floor(Math.random() * letters.length)];
    const digits = String(Math.floor(Math.random() * 1000)).padStart(3, "0");
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
        Alert.alert("Session expirée", "Veuillez vous reconnecter.");
      } else {
        console.warn("Failed to load cards", e);
        setError("Impossible de charger vos cartes");
      }
    }
  }, [token]);

  useEffect(() => {
    if (token) load();
  }, [token, load]);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const reloadChoices = useCallback(async () => {
    try {
      const b = await getBackgrounds();
      setBackgrounds(Array.isArray(b.backgrounds) ? b.backgrounds : []);
    } catch (e) {
      console.warn("Backgrounds load failed", e?.message || e);
      setBackgrounds([]);
    }
    try {
      const u = await getMyUploads();
      setUploads(Array.isArray(u.files) ? u.files : []);
    } catch (e) {
      console.warn("Uploads load failed", e?.message || e);
      setUploads([]);
    }
  }, []);

  useEffect(() => {
    reloadChoices();
  }, [reloadChoices]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const openNew = () => {
    setName("Ma carte");
    setMatricule(genMatricule());
    setRecto("");
    setVerso("");
    setBgSide("recto");
    setBgTab("images");
    setPrefs({
      showUserInfo: true,
      showSocialMedia: true,
      showTypeSpecificInfo: true,
      showDocuments: true,
    });
    setEditMode(true);
    // Prepare a fresh editing object so CanvasEditor can add elements prior to first save
    setEditing({
      layout: { background: { type: "color", value: "#e5e7eb" }, elements: [] },
      backLayout: {
        background: { type: "color", value: "#ffffff" },
        elements: [],
      },
      displayPreferences: {
        showUserInfo: true,
        showSocialMedia: true,
        showTypeSpecificInfo: true,
        showDocuments: true,
      },
    });
    if (!backgrounds.length || !uploads.length) reloadChoices();
    setShowForm(true);
  };
  const openEdit = (card) => {
    setEditing(card);
    setName(card?.name || "");
    setMatricule(card?.matricule || "");
    setRecto(card?.layout?.background?.value || "");
    setVerso(card?.backLayout?.background?.value || "");
    setPrefs({
      showUserInfo: !!card?.displayPreferences?.showUserInfo,
      showSocialMedia: !!card?.displayPreferences?.showSocialMedia,
      showTypeSpecificInfo: !!card?.displayPreferences?.showTypeSpecificInfo,
      showDocuments: !!card?.displayPreferences?.showDocuments,
    });
    setEditMode(true);
    if (!backgrounds.length || !uploads.length) reloadChoices();
    setShowForm(true);
  };
  const closeForm = () => {
    if (!busy) setShowForm(false);
  };
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
        if (
          newId &&
          ((extra.elements && extra.elements.length) ||
            (extra.backElements && extra.backElements.length) ||
            extra.displayPreferences)
        ) {
          try {
            await updateCard(newId, extra);
          } catch {}
        }
      }
      setShowForm(false);
      await load();
    } catch (e) {
      Alert.alert("Erreur", e?.message || "Échec");
    } finally {
      setBusy(false);
    }
  };

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== "granted") {
      Alert.alert(
        "Permission requise",
  "Autorisez l'acces a la galerie pour importer une image."
      );
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: [ImagePicker.MediaType.Images],
      quality: 0.9,
    });
    if (res?.assets && res.assets[0]) {
      const a = res.assets[0];
      const file = {
        uri: a.uri,
        name: a.fileName || "image.jpg",
        type: a.mimeType || "image/jpeg",
      };
      try {
        setBusy(true);
        const up = await uploadImageFile(file);
        const url = up?.dockerFileUrl || up?.fileUrl;
        if (url) {
          if (bgSide === "recto") setRecto(url);
          else setVerso(url);
          prefetchBackground(url);
          setBgTab("uploads");
          // refresh uploads list
          const u = await getMyUploads();
          setUploads(Array.isArray(u.files) ? u.files : []);
        }
      } catch (e) {
        Alert.alert("Upload", e?.message || "Échec de l'upload");
      } finally {
        setBusy(false);
      }
    }
  };

  // Pick image to insert as an element (not as background)
  const pickElementImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== "granted") {
      Alert.alert(
        "Permission requise",
  "Autorisez l'acces a la galerie pour importer une image."
      );
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: [ImagePicker.MediaType.Images],
      quality: 0.9,
    });
    if (res?.assets && res.assets[0]) {
      const a = res.assets[0];
      const file = {
        uri: a.uri,
        name: a.fileName || "image.jpg",
        type: a.mimeType || "image/jpeg",
      };
      try {
        setBusy(true);
        const up = await uploadImageFile(file);
        const url = up?.dockerFileUrl || up?.fileUrl;
        if (url && editing) {
          const arr =
            bgSide === "recto"
              ? editing.layout?.elements || []
              : editing.backLayout?.elements || [];
          const next = arr.concat([
            {
              type: "image",
              content: url,
              position: { x: 10, y: 10, zIndex: 1 },
              style: { width: 30, height: 20, objectFit: "contain" },
            },
          ]);
          if (bgSide === "recto")
            editing.layout = { ...(editing.layout || {}), elements: next };
          else
            editing.backLayout = {
              ...(editing.backLayout || {}),
              elements: next,
            };
          setEditing({ ...editing });
        }
      } catch (e) {
        Alert.alert("Upload", e?.message || "Échec de l'upload");
      } finally {
        setBusy(false);
      }
    }
  };

  const updateEditing = (next) => setEditing(next);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes cartes</Text>
        <Pressable
          onPress={openNew}
          style={styles.iconBtn}
          accessibilityLabel="Nouvelle carte"
        >
          <MaterialCommunityIcons
            name="plus"
            size={24}
            color={colors.primaryDark}
          />
        </Pressable>
      </View>
      <CardList
        cards={cards}
        onEdit={openEdit}
        onDelete={(item) => {
          Alert.alert("Supprimer", "Confirmer la suppression ?", [
            { text: "Annuler", style: "cancel" },
            {
              text: "Supprimer",
              style: "destructive",
              onPress: async () => {
                try {
                  await deleteCard(item._id);
                  await load();
                } catch (e) {
                  Alert.alert("Erreur", e?.message || "Échec");
                }
              },
            },
          ]);
        }}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          !error ? (
            <View style={{ padding: spacing.lg }}>
              <Text style={{ color: colors.mutedText }}>
                Aucune carte pour l'instant.
              </Text>
            </View>
          ) : null
        }
      />
      {error ? (
        <View style={{ padding: spacing.md }}>
          <Text style={{ color: "tomato", marginTop: 8 }}>{error}</Text>
          <View style={{ height: spacing.sm }} />
          <Button title="Recharger" onPress={onRefresh} />
        </View>
      ) : null}
      <Pressable
        onPress={openNew}
        style={styles.fab}
        accessibilityLabel="Créer une nouvelle carte"
      >
        <MaterialCommunityIcons name="plus" size={26} color="#fff" />
      </Pressable>

      <CardEditorModal
        visible={showForm}
        onRequestClose={closeForm}
        onSave={saveForm}
        busy={busy}
        editing={editing}
        onEditingChange={updateEditing}
        name={name}
        onChangeName={setName}
        matricule={matricule}
        onRegenerateMatricule={() => setMatricule(genMatricule())}
        editMode={editMode}
        onToggleEditMode={() => setEditMode((v) => !v)}
        bgSide={bgSide}
        onSetBgSide={setBgSide}
        bgTab={bgTab}
        onSetBgTab={setBgTab}
        recto={recto}
        verso={verso}
        onSelectBg={(u) => onSelectBg(u)}
        backgrounds={backgrounds}
        uploads={uploads}
        onPickBackgroundImage={pickImage}
        onPickElementImage={pickElementImage}
        detectType={detectType}
        prefs={prefs}
        onChangePrefs={(patch) => setPrefs((p) => ({ ...p, ...patch }))}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: colors.text },
  iconBtn: { padding: 8, borderRadius: 20 },
  list: { flex: 1 },
  listContent: { padding: spacing.md },
  fab: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 6,
  },
  actionBtn: { paddingHorizontal: 8, paddingVertical: 4, marginLeft: 8 },
  modalSafe: { flex: 1, backgroundColor: colors.background },
  modalContent: { padding: spacing.md },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  modalTitle: { fontSize: 20, fontWeight: "700", color: colors.text },
  closeBtn: { padding: 6, borderRadius: 20 },
  label: { marginTop: spacing.sm, color: colors.mutedText },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginTop: 6,
    backgroundColor: "#fff",
  },
  tabsRow: {
    flexDirection: "row",
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  tabBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    marginRight: 8,
  },
  tabBtnActive: { backgroundColor: "#fff", borderColor: colors.primary },
  tabText: { color: colors.mutedText },
  tabTextActive: { color: colors.text, fontWeight: "600" },
  grid: { flexDirection: "row", flexWrap: "wrap", marginTop: spacing.sm },
  thumbWrap: {
    width: "31%",
    aspectRatio: 1.6,
    margin: 6,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumb: { width: "100%", height: "100%" },
  gradientThumb: {
    width: "31%",
    aspectRatio: 1.6,
    margin: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e5e7eb",
  },
  gradientLabel: { fontSize: 12, color: "#333" },
  colorDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    margin: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  panel: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    marginVertical: spacing.md,
  },
  panelTitle: { fontWeight: "700", marginBottom: 8, color: colors.text },
  propLabel: { color: colors.mutedText, marginTop: 6 },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  rowGap: { flexDirection: "row", marginTop: 6 },
  primaryBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "700" },
  secondaryBtn: {
    flex: 1,
    backgroundColor: "#e5e7eb",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryBtnText: { color: colors.text, fontWeight: "600" },
});
