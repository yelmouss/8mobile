import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from '../../theme/theme';

export default function StatTile({
  title,
  value,
  subtitle,
  color = "#3b82f6",
}) {
  return (
    <View style={[styles.card, { borderColor: color }]}>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minWidth: 140, padding: 10, borderRadius: 12, borderWidth: 2, backgroundColor: colors.surface, margin: 6 },
  title: { color: colors.text, marginTop: 4 },
  value: { fontSize: 24, fontWeight: "800" },
  subtitle: { color: colors.mutedText, marginTop: 2 },
});
