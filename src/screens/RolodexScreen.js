import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
  Modal,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { colors, spacing } from "../theme/theme";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../api/client";
import Avatar from "../components/Avatar";
import MobileCard from "../components/MobileCard";
import GroupManager from "../components/rolodex/GroupManager";
import FilterBar from "../components/common/FilterBar";

// Align with DirectoryScreen values for consistency
const USER_TYPES = [
  { value: "", label: "Tous" },
  { value: "ETABLISSEMENT", label: "Établissement" },
  { value: "SCHOOL", label: "École" },
  { value: "STUDENT", label: "Étudiant" },
  { value: "ANIMAL_DE_COMPAGNIE", label: "Animal" },
  { value: "PROFESSIONNEL", label: "Professionnel" },
  { value: "PROFESSION_LIBERALE", label: "Prof. libérale" },
  { value: "PARTICULIER", label: "Particulier" },
  { value: "SPORTSCLUB", label: "Club sportif" },
  { value: "AUTRES", label: "Autres" },
];

export default function RolodexScreen() {
  const { token } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(new Set()); // ids of contacts with card preview shown
  // Removed cardFilter: everyone has a card

  // Groups
  const [groups, setGroups] = useState([]);
  const [groupsEnabled, setGroupsEnabled] = useState(true);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [managerOpen, setManagerOpen] = useState(false);

  // Notes modal
  const [noteModal, setNoteModal] = useState({ visible: false, id: null, text: "" });

  const loadContacts = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await apiFetch("/api/rolodex");
      setContacts(Array.isArray(data?.contacts) ? data.contacts : []);
      setError(null);
    } catch (e) {
      setError(e?.message || "Impossible de charger le rolodex");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const loadGroups = useCallback(async () => {
    setGroupsLoading(true);
    try {
      const data = await apiFetch("/api/contact-groups");
      setGroups(Array.isArray(data?.groups) ? data.groups : []);
      setGroupsEnabled(true);
    } catch (e) {
      // If 401, these routes likely require cookie session; disable groups UI gracefully
      if (e?.status === 401) setGroupsEnabled(false);
      else setError(e?.message || "Groupes indisponibles");
    } finally {
      setGroupsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      loadContacts();
      loadGroups();
    }
  }, [token, loadContacts, loadGroups]);

  useFocusEffect(
    useCallback(() => {
      if (token) {
        loadContacts();
        loadGroups();
      }
    }, [token, loadContacts, loadGroups])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadContacts(), groupsEnabled ? loadGroups() : Promise.resolve()]);
    setRefreshing(false);
  }, [loadContacts, loadGroups, groupsEnabled]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return contacts.filter((c) => {
    const byType = !filterType || String(c?.owner?.userType) === filterType;
    if (!s) return byType;
      const cardName = (c?.card?.name || "").toLowerCase();
      const ownerName = (c?.owner?.name || "").toLowerCase();
      const notes = (c?.notes || "").toLowerCase();
    return byType && (cardName.includes(s) || ownerName.includes(s) || notes.includes(s));
    });
  }, [contacts, search, filterType]);

  // Helpers for groups membership per contact
  const groupsForContact = useCallback(
    (contactId) => groups.filter((g) => Array.isArray(g.contacts) && g.contacts.some((id) => String(id) === String(contactId))),
    [groups]
  );

  const confirmDelete = (contact) => {
    Alert.alert("Supprimer", "Retirer ce contact de votre rolodex ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: () => deleteContact(contact?._id),
      },
    ]);
  };

  const deleteContact = async (id) => {
    if (!id) return;
    try {
      await apiFetch(`/api/rolodex/${id}`, { method: "DELETE" });
      setContacts((prev) => prev.filter((c) => String(c._id) !== String(id)));
      // Also remove from local groups membership arrays
      setGroups((prev) => prev.map((g) => ({
        ...g,
        contacts: (g.contacts || []).filter((cid) => String(cid) !== String(id)),
      })));
    } catch (e) {
      Alert.alert("Erreur", e?.message || "Échec de la suppression");
    }
  };

  const toggleExpand = (id) => {
    setExpanded((prev) => {
      const next = new Set([...prev]);
      const key = String(id);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const openNoteModal = (contact) => {
    setNoteModal({ visible: true, id: contact?._id, text: contact?.notes || "" });
  };

  const saveNote = async () => {
    const { id, text } = noteModal;
    if (!id) return;
    try {
      await apiFetch(`/api/rolodex/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ notes: text }),
      });
      setContacts((prev) => prev.map((c) => (String(c._id) === String(id) ? { ...c, notes: text } : c)));
      setNoteModal({ visible: false, id: null, text: "" });
    } catch (e) {
      Alert.alert("Erreur", e?.message || "Échec de la mise à jour");
    }
  };

  const addToGroup = async (groupId, contactId) => {
    if (!groupsEnabled) return;
    try {
      await apiFetch(`/api/contact-groups/${groupId}/contacts`, {
        method: "POST",
        body: JSON.stringify({ contactId }),
      });
      setGroups((prev) => prev.map((g) => (String(g._id) === String(groupId)
        ? { ...g, contacts: [...(g.contacts || []), String(contactId)] }
        : g)));
    } catch (e) {
      if (e?.status === 401) {
        setGroupsEnabled(false);
      } else {
        Alert.alert("Groupes", e?.message || "Échec d'ajout au groupe");
      }
    }
  };

  const removeFromGroup = async (groupId, contactId) => {
    if (!groupsEnabled) return;
    try {
      await apiFetch(`/api/contact-groups/${groupId}/contacts/${contactId}`, { method: "DELETE" });
      setGroups((prev) => prev.map((g) => (String(g._id) === String(groupId)
        ? { ...g, contacts: (g.contacts || []).filter((id) => String(id) !== String(contactId)) }
        : g)));
    } catch (e) {
      if (e?.status === 401) setGroupsEnabled(false);
      else Alert.alert("Groupes", e?.message || "Échec du retrait du groupe");
    }
  };

  const renderItem = ({ item }) => {
    const owner = item?.owner || {};
    const card = item?.card; // keep undefined/null if absent
    const hasCard = !!card;
    const membership = groupsForContact(item?._id);
    const isExpanded = expanded.has(String(item?._id));
    return (
      <View style={styles.card}>
        <View style={styles.row}>
          <Avatar uri={owner?.image} name={owner?.name} size={48} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.name}>{owner?.name || "Sans nom"}</Text>
            <Text style={styles.sub}>
              {card?.name || "Carte"}
              {card?.isActive === false ? "  •  Inactive" : ""}
            </Text>
            {item?.notes ? <Text style={styles.notes}>“{item.notes}”</Text> : null}
          </View>
          <View style={styles.actions}>
            <Pressable
              style={styles.iconBtn}
              onPress={() => (hasCard ? toggleExpand(item._id) : null)}
              accessibilityLabel={isExpanded ? "Masquer la carte" : "Afficher la carte"}
            >
              <MaterialCommunityIcons
                name={isExpanded ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={hasCard ? colors.primaryDark : colors.mutedText}
              />
            </Pressable>
            <Pressable style={styles.iconBtn} onPress={() => openNoteModal(item)} accessibilityLabel="Éditer la note">
              <MaterialCommunityIcons name="note-edit" size={20} color={colors.primaryDark} />
            </Pressable>
            <Pressable style={styles.iconBtn} onPress={() => confirmDelete(item)} accessibilityLabel="Supprimer">
              <MaterialCommunityIcons name="delete" size={20} color="#c62828" />
            </Pressable>
          </View>
        </View>

        {isExpanded ? (
          <View style={styles.previewWrap}>
            {hasCard ? (
              <MobileCard card={card} onPress={() => {}} />
            ) : (
              <Text style={{ color: colors.mutedText }}>Aucune carte pour ce contact.</Text>
            )}
          </View>
        ) : null}

        {groupsEnabled ? (
          <View style={styles.groupRow}>
            <Text style={styles.groupLabel}>Groupes:</Text>
            <View style={styles.groupChips}>
              {membership.length === 0 ? (
                <Text style={styles.groupEmpty}>Aucun</Text>
              ) : (
                membership.map((g) => (
                  <View key={g._id} style={[styles.chip, { borderColor: g.color || colors.border }]}> 
                    <Text style={[styles.chipText, { color: colors.text }]}>{g.name}</Text>
                    <TouchableOpacity style={styles.chipClose} onPress={() => removeFromGroup(g._id, item._id)}>
                      <MaterialCommunityIcons name="close" size={14} color={colors.mutedText} />
                    </TouchableOpacity>
                  </View>
                ))
              )}
              {groupsLoading ? null : (
                <Pressable
                  style={[styles.addChip, { borderColor: colors.border }]}
                  onPress={() => {
                    if (!groups?.length) {
                      // No groups yet: open manager so user can create one
                      setManagerOpen(true);
                    } else {
                      Alert.alert(
                        "Ajouter au groupe",
                        "Choisissez un groupe",
                        groups.map((g) => ({
                          text: g.name,
                          onPress: () => addToGroup(g._id, item._id),
                        })).concat([{ text: "Annuler", style: "cancel" }])
                      );
                    }
                  }}
                >
                  <MaterialCommunityIcons name="plus" size={14} color={colors.mutedText} />
                  <Text style={[styles.chipText, { color: colors.mutedText }]}>Ajouter</Text>
                </Pressable>
              )}
            </View>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Rolodex</Text>
        <Pressable
          style={styles.manageBtn}
          onPress={() => setManagerOpen(true)}
          accessibilityLabel="Gérer les groupes"
        >
          <MaterialCommunityIcons name="folder-account" size={18} color={colors.primary} />
          <Text style={styles.manageText}>Groupes</Text>
        </Pressable>
      </View>

      {/* Search & type filters */}
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        types={USER_TYPES}
        value={filterType}
        onChange={setFilterType}
        placeholder="Rechercher par nom, carte, note"
      />

      {/* Content */}
      {loading ? (
        <View style={styles.center}> 
          <ActivityIndicator size={28} color={colors.primary} />
          <Text style={{ marginTop: 8, color: colors.mutedText }}>Chargement...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item._id)}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xl }}
          refreshing={refreshing}
          onRefresh={onRefresh}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={{ padding: spacing.lg }}>
              <Text style={{ color: colors.mutedText }}>
                {contacts.length === 0
                  ? "Votre rolodex est vide. Ajoutez des contacts depuis l'annuaire."
                  : "Aucun contact ne correspond à votre recherche."}
              </Text>
            </View>
          }
        />
      )}

      {error ? (
        <View style={{ paddingHorizontal: spacing.md }}>
          <Text style={{ color: "tomato" }}>{error}</Text>
        </View>
      ) : null}

      {/* Notes Modal */}
      <Modal visible={noteModal.visible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Note</Text>
            <TextInput
              multiline
              style={styles.noteInput}
              value={noteModal.text}
              onChangeText={(t) => setNoteModal((m) => ({ ...m, text: t }))}
              placeholder="Saisir une note"
              placeholderTextColor={colors.mutedText}
            />
            <View style={styles.modalRow}>
              <Pressable style={[styles.modalBtn, styles.secondaryBtn]} onPress={() => setNoteModal({ visible: false, id: null, text: "" })}>
                <Text style={styles.secondaryText}>Annuler</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, styles.primaryBtn]} onPress={saveNote}>
                <Text style={styles.primaryText}>Enregistrer</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Group Manager */}
      <GroupManager
        visible={managerOpen}
        onRequestClose={() => setManagerOpen(false)}
        groups={groups}
        onChange={(next) => setGroups(next)}
        canManage={groupsEnabled}
        onUnauthorized={() => setGroupsEnabled(false)}
  allContacts={contacts}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: colors.text },

  manageBtn: { flexDirection: 'row', alignItems: 'center' },
  manageText: { marginLeft: 6, color: colors.primary, fontWeight: '700' },
  panel: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.md,
    borderRadius: 12,
    padding: spacing.md,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  searchInput: { flex: 1, paddingVertical: 8, marginLeft: 6, color: colors.text },
  typeRow: { flexDirection: "row", flexWrap: "wrap", marginTop: spacing.sm },
  typeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    marginRight: 8,
    marginTop: 8,
    backgroundColor: "#f8fafc",
  },
  typeBtnActive: { backgroundColor: "#e6f0ff", borderColor: colors.primary },
  typeText: { color: colors.mutedText },
  typeTextActive: { color: colors.text, fontWeight: "600" },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  row: { flexDirection: "row", alignItems: "center" },
  name: { fontSize: 16, fontWeight: "700", color: colors.text },
  sub: { color: colors.mutedText, marginTop: 2 },
  notes: { color: colors.text, marginTop: 6, fontStyle: "italic" },
  actions: { flexDirection: "row", alignItems: "center" },
  iconBtn: { padding: 8, borderRadius: 18, marginLeft: 6 },

  groupRow: { marginTop: 10 },
  groupLabel: { color: colors.mutedText, marginBottom: 4 },
  groupChips: { flexDirection: "row", flexWrap: "wrap", alignItems: "center" },
  groupEmpty: { color: colors.mutedText, marginRight: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: 6,
    marginBottom: 6,
    backgroundColor: "#fff",
  },
  chipText: { fontSize: 12 },
  chipClose: { marginLeft: 6 },
  addChip: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: 6,
    marginBottom: 6,
    backgroundColor: "#f8fafc",
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 10 },
  noteInput: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 10,
    color: colors.text,
  },
  modalRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 12 },
  modalBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, marginLeft: 8 },
  primaryBtn: { backgroundColor: colors.primary },
  primaryText: { color: "#fff", fontWeight: "700" },
  secondaryBtn: { backgroundColor: "#eef2f7", borderWidth: 1, borderColor: colors.border },
  secondaryText: { color: colors.text, fontWeight: "600" },
});
