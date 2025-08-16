import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../../theme/theme';

export default function AccountSection({ title, children }) {
  return (
    <View style={styles.panel}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <View>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { marginTop: spacing.md, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  title: { fontWeight: '700', marginBottom: 8, color: colors.text, fontSize: 16 },
});
