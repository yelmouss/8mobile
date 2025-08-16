import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { colors, spacing } from '../theme/theme';
import { apiFetch } from '../api/client';
import MobileCard from '../components/MobileCard';

export default function CardDetailScreen({ route, navigation }) {
  const id = route?.params?.id;
  const [card, setCard] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/api/cartes/${id}`);
      setCard(data?.card || null);
      setUserInfo(data?.userInfo || null);
    } catch (e) {
      Alert.alert('Erreur', e?.message || 'Impossible de charger la carte');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) load();
  }, [id, load]);

  useEffect(() => {
    navigation?.setOptions?.({ title: 'Carte' });
  }, [navigation]);

  if (loading) {
    return (
      <View style={styles.center}>
  <ActivityIndicator size={28} color={colors.primary} />
  <Text style={{ marginTop: 8, color: colors.mutedText }}>Chargement...</Text>
      </View>
    );
  }

  if (!card) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.mutedText }}>Carte introuvable</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.md }}>
      <View style={styles.cardWrap}>
        <MobileCard card={card} onPress={() => {}} />
      </View>
      {userInfo ? (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Informations</Text>
          {userInfo.name ? <Text style={styles.row}>Nom: <Text style={styles.value}>{userInfo.name}</Text></Text> : null}
          {userInfo.email ? <Text style={styles.row}>Email: <Text style={styles.value}>{userInfo.email}</Text></Text> : null}
          {userInfo.phone ? <Text style={styles.row}>Téléphone: <Text style={styles.value}>{userInfo.phone}</Text></Text> : null}
          {userInfo.address ? (
            <Text style={styles.row}>Adresse: <Text style={styles.value}>{userInfo.address}{userInfo.city ? `, ${userInfo.city}`: ''}{userInfo.postalCode ? ` ${userInfo.postalCode}`: ''}{userInfo.country ? `, ${userInfo.country}`: ''}</Text></Text>
          ) : null}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fafafa' },
  cardWrap: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee', borderRadius: 12, padding: 8 },
  panel: { marginTop: spacing.md, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  panelTitle: { fontWeight: '700', marginBottom: 8, color: colors.text },
  row: { marginTop: 4, color: colors.text },
  value: { fontWeight: '600' },
});
