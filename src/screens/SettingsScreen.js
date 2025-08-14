import React from 'react';
import { View, Text, StyleSheet, Button, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function SettingsScreen() {
  const { logout, user } = useAuth();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Paramètres</Text>
      <Text style={styles.subtitle}>Compte</Text>
      <Text style={styles.row}>Nom: {user?.name || '-'}</Text>
      <Text style={styles.row}>Email: {user?.email || '-'}</Text>
      <View style={{ height: 12 }} />
      <Button title="Déconnexion" onPress={logout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: '#fafafa' },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  subtitle: { fontSize: 16, fontWeight: '500', marginTop: 8 },
  row: { marginTop: 6 },
});
