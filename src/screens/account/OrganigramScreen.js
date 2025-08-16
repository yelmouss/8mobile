import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme/theme';
import { apiFetch } from '../../api/client';

export default function OrganigramScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch('/api/user/organisation/collaborateurs');
        const list = Array.isArray(res?.collaborateurs) ? res.collaborateurs : [];
        setNodes(list);
      } catch (e) {
        Alert.alert('Organigramme', e?.message || 'Chargement impossible');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}><Text style={styles.link}>Retour</Text></Pressable>
        <Text style={styles.title}>Organigramme</Text>
        <View style={{ width: 60 }} />
      </View>
      {loading ? (
        <View style={styles.center}><ActivityIndicator size={28} color={colors.primary} /></View>
      ) : (
        <FlatList
          data={nodes}
          keyExtractor={(item) => String(item._id || item.id || Math.random())}
          contentContainerStyle={{ padding: spacing.md }}
          renderItem={({ item }) => (
            <View style={styles.item}> 
              <Text style={styles.itemName}>{item?.name || item?.fullName || 'Collaborateur'}</Text>
              {item?.role ? <Text style={styles.itemRole}>{item.role}</Text> : null}
            </View>
          )}
          ListEmptyComponent={<Text style={{ color: colors.mutedText, textAlign: 'center' }}>Aucun collaborateur.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm },
  link: { color: colors.primary, fontWeight: '700' },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  item: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: spacing.md, marginBottom: spacing.sm },
  itemName: { color: colors.text, fontWeight: '700' },
  itemRole: { color: colors.mutedText, marginTop: 2 },
});
