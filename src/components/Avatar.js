import React from 'react';
import { Image, View, Text, StyleSheet } from 'react-native';
import Constants from 'expo-constants';

const BASE = (Constants?.expoConfig?.extra?.NEXT_BASE_URL) || 'http://localhost:3000';

function toAbsolute(u) {
  if (!u) return null;
  if (u.startsWith('http://') || u.startsWith('https://')) return u;
  const path = u.startsWith('/') ? u : `/${u}`;
  return `${BASE}${path}`;
}

export default function Avatar({ uri, name, size = 64 }) {
  const abs = toAbsolute(uri);
  if (abs) return <Image source={{ uri: abs }} style={{ width: size, height: size, borderRadius: size/2 }} />;
  const initials = (name || '?').split(' ').map(p => p[0]).slice(0,2).join('').toUpperCase();
  return (
    <View style={[styles.fallback, { width: size, height: size, borderRadius: size/2 }]}> 
      <Text style={styles.text}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { backgroundColor: '#1976d2', alignItems: 'center', justifyContent: 'center' },
  text: { color: '#fff', fontWeight: 'bold' }
});
