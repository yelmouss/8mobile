import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

export default function CardItem({ card }) {
  return (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{card.name || 'Carte'}</Text>
        <Text numberOfLines={1} style={styles.meta}>#{String(card._id).slice(0,8)} · {card.matricule || '—'}</Text>
      </View>
      {card.qrCodeUrl ? (
        <Image source={{ uri: card.qrCodeUrl }} style={{ width: 56, height: 56 }} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 1, borderColor: '#eee', borderRadius: 8, marginBottom: 8, backgroundColor: '#fff' },
  title: { fontWeight: '600', fontSize: 16, marginBottom: 4 },
  meta: { color: '#666' },
});
