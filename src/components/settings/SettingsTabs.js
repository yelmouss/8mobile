import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, spacing } from '../../theme/theme';

// Lightweight segmented tabs control
// tabs: Array<{ key: string; label: string; icon?: string }>
export default function SettingsTabs({ tabs, value, onChange }) {
  return (
    <View style={styles.wrap}>
      {tabs.map((t) => {
        const active = value === t.key;
        return (
          <Pressable key={t.key} onPress={() => onChange(t.key)} style={[styles.tab, active && styles.tabActive]} accessibilityLabel={`Onglet ${t.label}`}>
            {t.icon ? (
              <MaterialCommunityIcons name={t.icon} size={18} color={active ? colors.primary : colors.mutedText} />
            ) : null}
            <Text style={[styles.tabText, active && styles.tabTextActive]} numberOfLines={1}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 2,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    gap: 2,
  },
  tabActive: {
    backgroundColor: colors.primary + '15',
  },
  tabText: {
    color: colors.mutedText,
    fontWeight: '600',
    fontSize: 11,
  },
  tabTextActive: {
    color: colors.primary,
  },
});
