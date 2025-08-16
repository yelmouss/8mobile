import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { colors, spacing } from '../../theme/theme';

export default function PrivacyPanel({ prefs, onChange }) {
  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>Confidentialité</Text>
      <View style={styles.rowBetween}>
        <Text style={styles.propLabel}>Infos utilisateur</Text>
        <Switch value={!!prefs.showUserInfo} onValueChange={(v) => onChange({ showUserInfo: v })} />
      </View>
      <View style={styles.rowBetween}>
        <Text style={styles.propLabel}>Réseaux sociaux</Text>
        <Switch value={!!prefs.showSocialMedia} onValueChange={(v) => onChange({ showSocialMedia: v })} />
      </View>
      <View style={styles.rowBetween}>
        <Text style={styles.propLabel}>Infos spécifiques</Text>
        <Switch value={!!prefs.showTypeSpecificInfo} onValueChange={(v) => onChange({ showTypeSpecificInfo: v })} />
      </View>
      <View style={styles.rowBetween}>
        <Text style={styles.propLabel}>Documents</Text>
        <Switch value={!!prefs.showDocuments} onValueChange={(v) => onChange({ showDocuments: v })} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: spacing.md, marginVertical: spacing.md },
  panelTitle: { fontWeight: '700', marginBottom: 8, color: colors.text },
  propLabel: { color: colors.mutedText, marginTop: 6 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
});
