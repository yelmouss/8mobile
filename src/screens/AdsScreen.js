import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AdsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Annonces</Text>
      {/* TODO: ads / announcements feed */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: '#fafafa' },
  title: { fontSize: 18, fontWeight: '600' },
});
