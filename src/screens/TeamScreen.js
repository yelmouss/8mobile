import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "../theme/theme";
import { apiFetch } from "../api/client";
import OrgChart from "../components/orgchart/OrgChart";

export default function TeamScreen() {
  const [loading, setLoading] = useState(true);
  const [collaborateurs, setCollaborateurs] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch("/api/user/organisation/collaborateurs");
        setCollaborateurs(Array.isArray(res?.collaborateurs) ? res.collaborateurs : []);
      } catch (e) {
        setError(e?.message || "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Collaborateurs</Text>
        </View>
        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size={28} color={colors.primary} />
          </View>
        ) : error ? (
          <Text style={{ color: 'red', textAlign: 'center', marginTop: 24 }}>{error}</Text>
        ) : (
          <OrgChart collaborateurs={collaborateurs} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, padding: 12 },
  title: { fontSize: 20, fontWeight: "700", color: colors.text },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
});
