import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function RolodexScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rolodex</Text>
      {/* TODO: contacts/rolodex list */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: '#fafafa' },
  title: { fontSize: 18, fontWeight: '600' },
});
