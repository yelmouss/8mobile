import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Button, Alert, Pressable, Modal, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import MobileCard from '../components/MobileCard';
import { getMyCards, deleteCard, createCard, updateCard } from '../api/client';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, spacing } from '../theme/theme';
import { useFocusEffect } from '@react-navigation/native';

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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const openNew = () => {
    setEditing(null);
    setName(''); setMatricule(''); setRecto(''); setVerso('');
    setShowForm(true);
  };
  const openEdit = (card) => {
    setEditing(card);
    setName(card?.name || '');
    setMatricule(card?.matricule || '');
    setRecto(card?.layout?.background?.value || '');
    setVerso(card?.backLayout?.background?.value || '');
    setShowForm(true);
  };
  const closeForm = () => { if (!busy) setShowForm(false); };
  const saveForm = async () => {
    try {
      setBusy(true);
      if (editing?._id) {
        await updateCard(editing._id, { name, matricule, recto, verso, backgroundType: 'image' });
      } else {
        await createCard({ name, matricule, recto, verso, backgroundType: 'image' });
      }
      setShowForm(false);
      await load();
    } catch (e) {
      Alert.alert('Erreur', e?.message || 'Échec');
    } finally { setBusy(false); }
  };

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
            <TextInput style={styles.input} value={matricule} onChangeText={setMatricule} placeholder="Ex: ABC123" />
            <Text style={styles.label}>Recto (URL ou chemin)</Text>
            <TextInput style={styles.input} value={recto} onChangeText={setRecto} placeholder="/uploads/recto.png" />
            <Text style={styles.label}>Verso (URL ou chemin)</Text>
            <TextInput style={styles.input} value={verso} onChangeText={setVerso} placeholder="/uploads/verso.png" />
            <View style={{ height: spacing.md }} />
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
});
