import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TextInput, FlatList, Alert, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, spacing } from '../../theme/theme';
import { apiFetch } from '../../api/client';
import Avatar from '../../components/Avatar';

const DEFAULT_COLORS = [
  '#f44336','#e91e63','#9c27b0','#673ab7','#3f51b5','#2196f3','#03a9f4','#00bcd4',
  '#009688','#4caf50','#8bc34a','#cddc39','#ffeb3b','#ffc107','#ff9800','#ff5722',
  '#795548','#607d8b'
];

export default function GroupManager({ visible, onRequestClose, groups, onChange, canManage = true, onUnauthorized, allContacts = [] }) {
  const [busy, setBusy] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#1976d2');
  const [editing, setEditing] = useState(null);
  // Manage members dialog
  const [manageFor, setManageFor] = useState(null); // group object
  const [memberSearch, setMemberSearch] = useState('');
  const [memberBusy, setMemberBusy] = useState(new Set()); // contactIds in-flight

  const sorted = useMemo(() => {
    return [...(groups || [])].sort((a,b) => a.name.localeCompare(b.name));
  }, [groups]);

  const openCreate = () => { setName(''); setColor('#1976d2'); setCreateOpen(true); };
  const openEdit = (g) => { setEditing(g); setName(g?.name || ''); setColor(g?.color || '#1976d2'); setEditOpen(true); };
  const closeAll = () => { setCreateOpen(false); setEditOpen(false); setEditing(null); setName(''); setColor('#1976d2'); };
  const openManage = (g) => { setManageFor(g); setMemberSearch(''); };
  const closeManage = () => { setManageFor(null); setMemberSearch(''); setMemberBusy(new Set()); };

  const createGroup = async () => {
    if (!name.trim()) { Alert.alert('Groupes', 'Veuillez saisir un nom.'); return; }
    try {
      setBusy(true);
      const res = await apiFetch('/api/contact-groups', { method: 'POST', body: JSON.stringify({ name: name.trim(), color }) });
      const next = (groups || []).concat([res.group]);
      onChange?.(next);
      closeAll();
    } catch (e) {
      if (e?.status === 401) onUnauthorized?.();
      else Alert.alert('Groupes', e?.message || 'Échec de la création');
    } finally { setBusy(false); }
  };

  const updateGroup = async () => {
    if (!editing?._id) return;
    if (!name.trim()) { Alert.alert('Groupes', 'Veuillez saisir un nom.'); return; }
    try {
      setBusy(true);
      const res = await apiFetch(`/api/contact-groups/${editing._id}`, { method: 'PUT', body: JSON.stringify({ name: name.trim(), color }) });
      const next = (groups || []).map(g => String(g._id) === String(editing._id) ? res.group : g);
      onChange?.(next);
      closeAll();
    } catch (e) {
      if (e?.status === 401) onUnauthorized?.();
      else Alert.alert('Groupes', e?.message || 'Échec de la mise à jour');
    } finally { setBusy(false); }
  };

  const deleteGroup = async (g) => {
    Alert.alert('Supprimer', `Supprimer le groupe "${g?.name}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        try {
          setBusy(true);
          await apiFetch(`/api/contact-groups/${g._id}`, { method: 'DELETE' });
          const next = (groups || []).filter(x => String(x._id) !== String(g._id));
          onChange?.(next);
        } catch (e) {
          if (e?.status === 401) onUnauthorized?.();
          else Alert.alert('Groupes', e?.message || 'Échec de la suppression');
        } finally { setBusy(false); }
      }}
    ]);
  };

  // Members helpers
  const members = useMemo(() => {
    if (!manageFor) return [];
    const ids = (manageFor.contacts || []).map(String);
    return allContacts
      .filter(c => ids.includes(String(c._id)))
      .sort((a,b) => (a?.owner?.name || '').localeCompare(b?.owner?.name || ''));
  }, [manageFor, allContacts]);

  const available = useMemo(() => {
    if (!manageFor) return [];
    const ids = new Set((manageFor.contacts || []).map(id => String(id)));
    const s = memberSearch.trim().toLowerCase();
    return allContacts
      .filter(c => !ids.has(String(c._id)))
      .filter(c => {
        if (!s) return true;
        const n = (c?.owner?.name || '').toLowerCase();
        const card = (c?.card?.name || '').toLowerCase();
        const notes = (c?.notes || '').toLowerCase();
        return n.includes(s) || card.includes(s) || notes.includes(s);
      })
      .sort((a,b) => (a?.owner?.name || '').localeCompare(b?.owner?.name || ''));
  }, [manageFor, allContacts, memberSearch]);

  const setBusyFor = (contactId, on) => {
    setMemberBusy(prev => {
      const next = new Set([...prev]);
      const key = String(contactId);
      if (on) next.add(key); else next.delete(key);
      return next;
    });
  };

  const addMember = async (contactId) => {
    if (!manageFor) return;
    try {
      setBusyFor(contactId, true);
      await apiFetch(`/api/contact-groups/${manageFor._id}/contacts`, {
        method: 'POST',
        body: JSON.stringify({ contactId })
      });
      // update groups list
      const next = (groups || []).map(g => String(g._id) === String(manageFor._id)
        ? { ...g, contacts: [...(g.contacts || []), String(contactId)] }
        : g);
      onChange?.(next);
      // also update local manageFor
      setManageFor(prev => prev ? { ...prev, contacts: [...(prev.contacts || []), String(contactId)] } : prev);
    } catch (e) {
      if (e?.status === 401) onUnauthorized?.();
      else Alert.alert('Groupes', e?.message || "Échec d'ajout au groupe");
    } finally {
      setBusyFor(contactId, false);
    }
  };

  const removeMember = async (contactId) => {
    if (!manageFor) return;
    try {
      setBusyFor(contactId, true);
      await apiFetch(`/api/contact-groups/${manageFor._id}/contacts/${contactId}`, { method: 'DELETE' });
      const next = (groups || []).map(g => String(g._id) === String(manageFor._id)
        ? { ...g, contacts: (g.contacts || []).filter(id => String(id) !== String(contactId)) }
        : g);
      onChange?.(next);
      setManageFor(prev => prev ? { ...prev, contacts: (prev.contacts || []).filter(id => String(id) !== String(contactId)) } : prev);
    } catch (e) {
      if (e?.status === 401) onUnauthorized?.();
      else Alert.alert('Groupes', e?.message || 'Échec du retrait du groupe');
    } finally {
      setBusyFor(contactId, false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Groupes de contacts</Text>
            <Pressable onPress={onRequestClose} style={styles.iconBtn} accessibilityLabel="Fermer">
              <MaterialCommunityIcons name="close" size={22} color={colors.text} />
            </Pressable>
          </View>

          {canManage ? (
            <Pressable onPress={openCreate} style={styles.primaryBtn} accessibilityLabel="Créer un groupe">
              <MaterialCommunityIcons name="plus" size={18} color="#fff" />
              <Text style={styles.primaryText}>Nouveau groupe</Text>
            </Pressable>
          ) : (
            <View style={styles.infoBox}><Text style={styles.infoText}>Gestion des groupes indisponible.</Text></View>
          )}

          <FlatList
            data={sorted}
            keyExtractor={(item) => String(item._id)}
            contentContainerStyle={{ paddingVertical: spacing.sm }}
            renderItem={({ item }) => (
              <View style={styles.groupRow}>
                <View style={[styles.colorDot, { backgroundColor: item.color || '#999' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.groupName}>{item.name}</Text>
                  <Text style={styles.groupMeta}>{(item.contacts?.length || 0)} contact(s)</Text>
                </View>
                {canManage ? (
                  <>
                    <Pressable style={styles.iconBtn} onPress={() => openManage(item)} accessibilityLabel="Gérer les membres">
                      <MaterialCommunityIcons name="account-multiple-plus" size={18} color={colors.text} />
                    </Pressable>
                    <Pressable style={styles.iconBtn} onPress={() => openEdit(item)} accessibilityLabel="Modifier">
                      <MaterialCommunityIcons name="pencil" size={18} color={colors.text} />
                    </Pressable>
                    <Pressable style={styles.iconBtn} onPress={() => deleteGroup(item)} accessibilityLabel="Supprimer">
                      <MaterialCommunityIcons name="delete" size={18} color="#c62828" />
                    </Pressable>
                  </>
                ) : null}
              </View>
            )}
            ListEmptyComponent={<View style={{ padding: spacing.md }}><Text style={{ color: colors.mutedText }}>Aucun groupe.</Text></View>}
          />

          {/* Create/Edit Dialog */}
          {(createOpen || editOpen) && (
            <View style={styles.dialogBackdrop}>
              <View style={styles.dialog}>
                <Text style={styles.dialogTitle}>{createOpen ? 'Créer un groupe' : 'Modifier le groupe'}</Text>
                <Text style={styles.label}>Nom</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Nom du groupe"
                  placeholderTextColor={colors.mutedText}
                />
                <Text style={[styles.label, { marginTop: 8 }]}>Couleur</Text>
                <View style={styles.colorsRow}>
                  {DEFAULT_COLORS.map((c) => (
                    <Pressable key={c} onPress={() => setColor(c)} style={[styles.colorPick, { backgroundColor: c }, color === c && styles.colorPickActive]} />
                  ))}
                </View>
                <View style={styles.dialogRow}>
                  <Pressable style={[styles.btn, styles.secondary]} disabled={busy} onPress={closeAll}><Text style={styles.secondaryText}>Annuler</Text></Pressable>
                  <Pressable
                    style={[styles.btn, styles.primary, busy && { opacity: 0.7 }]}
                    onPress={createOpen ? createGroup : updateGroup}
                    disabled={busy}
                  >
                    <Text style={styles.primaryBtnText}>{createOpen ? 'Créer' : 'Enregistrer'}</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          )}

          {/* Manage Members Dialog */}
          {manageFor && (
            <View style={styles.dialogBackdrop}>
              <View style={[styles.dialog, { maxHeight: '85%' }] }>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={styles.dialogTitle}>Membres • {manageFor.name}</Text>
                  <Pressable onPress={closeManage} style={styles.iconBtn} accessibilityLabel="Fermer">
                    <MaterialCommunityIcons name="close" size={20} color={colors.text} />
                  </Pressable>
                </View>

                <Text style={styles.label}>Rechercher des contacts à ajouter</Text>
                <View style={[styles.searchRow, { marginTop: 6 }] }>
                  <MaterialCommunityIcons name="magnify" size={18} color={colors.mutedText} />
                  <TextInput
                    style={[styles.input, { flex: 1, marginTop: 0, borderWidth: 0 }]}
                    placeholder="Nom, carte, note"
                    placeholderTextColor={colors.mutedText}
                    value={memberSearch}
                    onChangeText={setMemberSearch}
                  />
                  {memberSearch ? (
                    <Pressable onPress={() => setMemberSearch('')} accessibilityLabel="Effacer">
                      <MaterialCommunityIcons name="close-circle" size={18} color={colors.mutedText} />
                    </Pressable>
                  ) : null}
                </View>

                <Text style={[styles.label, { marginTop: 10 }]}>Dans le groupe ({members.length})</Text>
                <FlatList
                  data={members}
                  keyExtractor={(item) => String(item._id)}
                  style={{ maxHeight: 200 }}
                  ListEmptyComponent={<Text style={{ color: colors.mutedText, paddingVertical: 6 }}>Aucun membre.</Text>}
                  renderItem={({ item }) => (
                    <View style={styles.memberRow}>
                      <Avatar uri={item?.owner?.image} name={item?.owner?.name} size={28} />
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={styles.memberName}>{item?.owner?.name || 'Sans nom'}</Text>
                        <Text style={styles.memberMeta}>{item?.card?.name || 'Carte'}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => removeMember(item._id)}
                        style={[styles.smallBtn, styles.outlineBtn, memberBusy.has(String(item._id)) && { opacity: 0.6 }]}
                        disabled={memberBusy.has(String(item._id))}
                      >
                        <MaterialCommunityIcons name="minus" size={16} color={colors.text} />
                        <Text style={styles.outlineText}>Retirer</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                />

                <Text style={[styles.label, { marginTop: 10 }]}>Ajouter au groupe ({available.length})</Text>
                <FlatList
                  data={available}
                  keyExtractor={(item) => String(item._id)}
                  style={{ maxHeight: 240 }}
                  ListEmptyComponent={<Text style={{ color: colors.mutedText, paddingVertical: 6 }}>Aucun résultat.</Text>}
                  renderItem={({ item }) => (
                    <View style={styles.memberRow}>
                      <Avatar uri={item?.owner?.image} name={item?.owner?.name} size={28} />
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={styles.memberName}>{item?.owner?.name || 'Sans nom'}</Text>
                        <Text style={styles.memberMeta}>{item?.card?.name || 'Carte'}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => addMember(item._id)}
                        style={[styles.smallBtn, styles.primary, memberBusy.has(String(item._id)) && { opacity: 0.7 }]}
                        disabled={memberBusy.has(String(item._id))}
                      >
                        <MaterialCommunityIcons name="plus" size={16} color="#fff" />
                        <Text style={styles.primarySmallText}>Ajouter</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                />
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', alignItems: 'center', justifyContent: 'center', padding: spacing.md },
  sheet: { width: '100%', maxHeight: '85%', backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  iconBtn: { padding: 8, borderRadius: 16 },
  primaryBtn: { marginTop: spacing.sm, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  primaryText: { color: '#fff', fontWeight: '700', marginLeft: 6 },
  infoBox: { backgroundColor: '#f5f6f8', borderWidth: 1, borderColor: colors.border, padding: spacing.md, borderRadius: 8, marginTop: spacing.sm },
  infoText: { color: colors.mutedText },
  groupRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingVertical: 10 },
  colorDot: { width: 16, height: 16, borderRadius: 8, marginRight: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  groupName: { fontWeight: '700', color: colors.text },
  groupMeta: { color: colors.mutedText, marginTop: 2, fontSize: 12 },
  dialogBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.25)', alignItems: 'center', justifyContent: 'center', padding: spacing.md },
  dialog: { width: '100%', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  dialogTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 8 },
  label: { color: colors.mutedText },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, color: colors.text, marginTop: 6 },
  colorsRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },
  colorPick: { width: 28, height: 28, borderRadius: 14, marginRight: 8, marginTop: 8, borderWidth: 2, borderColor: 'transparent' },
  colorPickActive: { borderColor: '#333' },
  dialogRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 },
  btn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, marginLeft: 8 },
  secondary: { backgroundColor: '#eef2f7', borderWidth: 1, borderColor: colors.border },
  secondaryText: { color: colors.text, fontWeight: '600' },
  primary: { backgroundColor: colors.primary },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
  searchRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 10 },
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f2f2f2' },
  memberName: { color: colors.text, fontWeight: '600' },
  memberMeta: { color: colors.mutedText, fontSize: 12 },
  smallBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
  outlineBtn: { backgroundColor: '#eef2f7', borderWidth: 1, borderColor: colors.border },
  outlineText: { color: colors.text, fontWeight: '700', marginLeft: 6 },
  primarySmallText: { color: '#fff', fontWeight: '700', marginLeft: 6 },
});

// Members management dialog notes: implemented above; we reuse dialogBackdrop with manageFor

