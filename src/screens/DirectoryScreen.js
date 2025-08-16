import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, RefreshControl, Pressable, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { colors, spacing } from '../theme/theme';
import { apiFetch, getMyCards } from '../api/client';
import MobileCard from '../components/MobileCard';
import { useAuth } from '../context/AuthContext';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const USER_TYPES = [
  { value: '', label: 'Tous' },
  { value: 'ETABLISSEMENT', label: 'Établissement' },
  { value: 'SCHOOL', label: 'École' },
  { value: 'STUDENT', label: 'Étudiant' },
  { value: 'ANIMAL_DE_COMPAGNIE', label: 'Animal' },
  { value: 'PROFESSIONNEL', label: 'Professionnel' },
  { value: 'PROFESSION_LIBERALE', label: 'Prof. libérale' },
  { value: 'PARTICULIER', label: 'Particulier' },
  { value: 'SPORTSCLUB', label: 'Club sportif' },
  { value: 'AUTRES', label: 'Autres' },
];

export default function DirectoryScreen({ navigation }) {
  const { token, user } = useAuth();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [detailId, setDetailId] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailCard, setDetailCard] = useState(null);
  const [detailUserInfo, setDetailUserInfo] = useState(null);

  const loadRolodexFlags = useCallback(async () => {
    try {
      const res = await apiFetch('/api/rolodex');
      const contacts = Array.isArray(res?.contacts) ? res.contacts : [];
      const cardIdSet = new Set(contacts.map((c) => String(c.cardId)));
      setCards((prev) => prev.map((c) => ({ ...c, isInRolodex: cardIdSet.has(String(c._id)) })));
    } catch (_) {
      // ignore if unavailable
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Annuaire is a public endpoint; avoid sending Bearer to prevent any server-side scoping quirks
      const data = await apiFetch('/api/annuaire', { noAuth: true });
      let list = Array.isArray(data?.cards) ? data.cards : [];
      // Merge in my own active cards if missing (server annuaire should include them, but ensure parity)
      if (token) {
        try {
          const mine = await getMyCards();
          const myActive = (Array.isArray(mine?.cards) ? mine.cards : []).filter((c) => !!c.isActive);
          if (myActive.length) {
            const have = new Set(list.map((c) => String(c._id)));
            const enriched = myActive
              .filter((c) => !have.has(String(c._id)))
              .map((c) => ({
                ...c,
                ownerName: user?.name || c.ownerName,
                ownerType: user?.userType || c.ownerType,
                isMine: true,
              }));
            if (enriched.length) list = list.concat(enriched);
          }
        } catch {}
      }
      // Mark ownership on all cards
      const normalizeId = (v) => (v == null ? '' : String(v));
      const myId = normalizeId(user?._id || user?.id || user?.userId);
      if (myId) {
        list = list.map((c) => {
          if (c.isMine) return c;
          const ownerId = normalizeId(c.ownerId ?? c.userId ?? c.user?._id ?? c.owner?._id);
          return { ...c, isMine: !!ownerId && ownerId === myId };
        });
      }
      setCards(list);
      // Annuaire web ne voit pas le Bearer; recalcule isInRolodex côté mobile si on est connecté
      if (token) {
        await loadRolodexFlags();
      }
    } catch (e) {
      Alert.alert('Erreur', e?.message || "Echec du chargement de l'annuaire");
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, [token, user, loadRolodexFlags]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return cards.filter((c) => {
      const txt = `${c?.name || ''} ${c?.ownerName || ''} ${c?.matricule || ''}`.toLowerCase();
      const matchSearch = !s || txt.includes(s);
      const matchType = !filterType || c?.ownerType === filterType;
      return matchSearch && matchType;
    });
  }, [cards, search, filterType]);

  const toggleRolodex = useCallback(async (card) => {
    try {
      if (card?.isMine) {
        Alert.alert('Info', 'Cette carte vous appartient déjà.');
        return;
      }
      if (!token) {
        Alert.alert('Connexion requise', 'Veuillez vous connecter pour gérer votre rolodex.');
        return;
      }
      if (card.isInRolodex) {
        // find contact id then delete
        const res = await apiFetch('/api/rolodex');
        const contacts = Array.isArray(res?.contacts) ? res.contacts : [];
        const found = contacts.find((k) => String(k.cardId) === String(card._id));
        if (!found) return;
        await apiFetch(`/api/rolodex/${found._id}`, { method: 'DELETE' });
        setCards((prev) => prev.map((c) => (c._id === card._id ? { ...c, isInRolodex: false } : c)));
      } else {
        await apiFetch('/api/rolodex', {
          method: 'POST',
          body: JSON.stringify({ cardId: card._id, notes: '' }),
        });
        setCards((prev) => prev.map((c) => (c._id === card._id ? { ...c, isInRolodex: true } : c)));
      }
    } catch (e) {
      Alert.alert('Rolodex', e?.message || 'Action impossible');
    }
  }, [token]);

  const renderItem = ({ item }) => (
    <View style={styles.cardWrap}>
  <MobileCard card={item} onPress={() => openDetail(item._id)} />
      {(item?.ownerName || item?.ownerType) ? (
        <View style={styles.ownerRow}>
          {item?.ownerName ? <Text style={styles.ownerName} numberOfLines={1}>{item.ownerName}</Text> : null}
          {item?.ownerType ? (
            <View style={styles.chip}><Text style={styles.chipText}>{USER_TYPES.find(t => t.value === item.ownerType)?.label || item.ownerType}</Text></View>
          ) : null}
          {item?.isMine ? (
            <View style={[styles.chip, { marginLeft: 8 }]}><Text style={[styles.chipText, { fontWeight: '600' }]}>Ma carte</Text></View>
          ) : null}
        </View>
      ) : null}
      <View style={styles.actionsRow}>
  <Pressable style={[styles.btn, styles.btnOutline]} onPress={() => openDetail(item._id)} accessibilityLabel="Voir la carte">
          <Text style={[styles.btnText, styles.btnOutlineText]}>Voir</Text>
        </Pressable>
        {!item?.isMine ? (
          <Pressable style={[styles.btn, styles.btnSecondary]} onPress={() => toggleRolodex(item)} accessibilityLabel="Ajouter au rolodex">
            <MaterialCommunityIcons name={item.isInRolodex ? 'minus-circle-outline' : 'account-plus-outline'} size={18} color={item.isInRolodex ? '#b00020' : colors.primaryDark} />
            <Text style={[styles.btnText, { marginLeft: 6, color: item.isInRolodex ? '#b00020' : colors.primaryDark }]}>{item.isInRolodex ? 'Retirer' : 'Ajouter'}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );

  const openDetail = useCallback(async (id) => {
    try {
      setDetailId(id);
      setDetailLoading(true);
      setDetailCard(null);
      setDetailUserInfo(null);
      const data = await apiFetch(`/api/cartes/${id}`);
      setDetailCard(data?.card || null);
      setDetailUserInfo(data?.userInfo || null);
    } catch (e) {
      Alert.alert('Erreur', e?.message || 'Impossible de charger la carte');
      setDetailId(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const closeDetail = useCallback(() => {
    setDetailId(null);
    setDetailCard(null);
    setDetailUserInfo(null);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}> 
        <Text style={styles.title}>Annuaire</Text>
      </View>

      <View style={styles.filters}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" color={colors.mutedText} size={20} />
          <TextInput
            placeholder="Rechercher par nom, propriétaire..."
            placeholderTextColor="#999"
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 6 }}>
          {USER_TYPES.map((t) => (
            <Pressable key={t.value} onPress={() => setFilterType((cur) => cur === t.value ? '' : t.value)} style={[styles.typeChip, filterType === t.value && styles.typeChipActive]}>
              <Text style={[styles.typeChipText, filterType === t.value && styles.typeChipTextActive]}>{t.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <View style={styles.countRow}>
          <Text style={styles.countText}>{filtered.length} carte{filtered.length > 1 ? 's' : ''}</Text>
          {filterType ? (
            <Pressable onPress={() => setFilterType('')}><Text style={styles.clearFilter}>Effacer le filtre</Text></Pressable>
          ) : null}
        </View>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size={28} color={colors.primary} /><Text style={{ marginTop: 8, color: colors.mutedText }}>Chargement...</Text></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item._id)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: spacing.md }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={!loading ? (<View style={styles.center}><Text style={{ color: colors.mutedText }}>Aucune carte ne correspond à votre recherche.</Text></View>) : null}
        />
      )}

      {/* Detail overlay */}
      {detailId ? (
        <View style={styles.detailOverlay}>
          <View style={styles.detailHeader}>
            <Pressable onPress={closeDetail} style={styles.backBtn} accessibilityLabel="Fermer">
              <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
              <Text style={styles.backLabel}>Retour</Text>
            </Pressable>
            <Text style={styles.detailTitle}>Carte</Text>
            <View style={{ width: 72 }} />
          </View>
          {detailLoading ? (
            <View style={styles.center}><ActivityIndicator size={28} color={colors.primary} /><Text style={{ marginTop: 8, color: colors.mutedText }}>Chargement...</Text></View>
          ) : !detailCard ? (
            <View style={styles.center}><Text style={{ color: colors.mutedText }}>Carte introuvable</Text></View>
          ) : (
            <ScrollView contentContainerStyle={{ padding: spacing.md }}>
              <View style={styles.cardWrap}>
                <MobileCard card={detailCard} onPress={() => {}} />
              </View>
              {detailUserInfo ? (
                <View style={styles.panel}>
                  <Text style={styles.panelTitle}>Informations</Text>
                  {detailUserInfo.name ? <Text style={styles.row}>Nom: <Text style={styles.value}>{detailUserInfo.name}</Text></Text> : null}
                  {detailUserInfo.email ? <Text style={styles.row}>Email: <Text style={styles.value}>{detailUserInfo.email}</Text></Text> : null}
                  {detailUserInfo.phone ? <Text style={styles.row}>Téléphone: <Text style={styles.value}>{detailUserInfo.phone}</Text></Text> : null}
                  {detailUserInfo.address ? (
                    <Text style={styles.row}>Adresse: <Text style={styles.value}>{detailUserInfo.address}{detailUserInfo.city ? `, ${detailUserInfo.city}`: ''}{detailUserInfo.postalCode ? ` ${detailUserInfo.postalCode}`: ''}{detailUserInfo.country ? `, ${detailUserInfo.country}`: ''}</Text></Text>
                  ) : null}
                </View>
              ) : null}
            </ScrollView>
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  header: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm },
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
  filters: { paddingHorizontal: spacing.md },
  searchBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  searchInput: { flex: 1, marginLeft: 6, color: colors.text },
  typeChip: { paddingVertical: 6, paddingHorizontal: 10, borderWidth: 1, borderColor: colors.border, borderRadius: 16, marginRight: 8, backgroundColor: '#fff' },
  typeChipActive: { borderColor: colors.primary },
  typeChipText: { color: colors.mutedText, fontSize: 12 },
  typeChipTextActive: { color: colors.text, fontWeight: '600' },
  countRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, marginBottom: spacing.sm },
  countText: { color: colors.mutedText },
  clearFilter: { color: colors.primary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  cardWrap: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#eee', padding: 8, marginBottom: spacing.md },
  ownerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  ownerName: { flex: 1, color: colors.mutedText },
  chip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff' },
  chipText: { fontSize: 12, color: colors.mutedText },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  btnOutline: { backgroundColor: '#fff', borderColor: colors.border },
  btnOutlineText: { color: colors.text, fontWeight: '600' },
  btnSecondary: { backgroundColor: '#fff', borderColor: colors.border },
  btnText: { fontWeight: '600' },
  detailOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#fafafa' },
  detailHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: '#eee' },
  backBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingRight: 8 },
  backLabel: { marginLeft: 6, color: colors.text, fontWeight: '600' },
  detailTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  panel: { marginTop: spacing.md, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  panelTitle: { fontWeight: '700', marginBottom: 8, color: colors.text },
  row: { marginTop: 4, color: colors.text },
  value: { fontWeight: '600' },
});
