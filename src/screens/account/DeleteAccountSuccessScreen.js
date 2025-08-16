import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme/theme';

export default function DeleteAccountSuccessScreen({ navigation }) {
  const [count, setCount] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCount((c) => {
        if (c <= 1) {
          clearInterval(timer);
          navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Text style={{ fontSize: 28 }}>✓</Text>
        </View>
        <Text style={styles.title}>Compte supprimé</Text>
        <Text style={styles.text}>Votre compte a été supprimé avec succès.</Text>
        <Text style={styles.textSmall}>Redirection vers l'accueil dans {count}s</Text>
        <Pressable style={styles.btn} onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] })}>
          <Text style={styles.btnText}>Retour à l'accueil</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, padding: spacing.md },
  card: { width: '100%', maxWidth: 420, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, alignItems: 'center' },
  iconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#e8f5e9', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  title: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 6 },
  text: { color: colors.mutedText, textAlign: 'center', marginBottom: 8 },
  textSmall: { color: colors.mutedText, fontSize: 12, marginBottom: spacing.md },
  btn: { backgroundColor: colors.primary, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8 },
  btnText: { color: '#fff', fontWeight: '700' },
});
