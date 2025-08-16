import React from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, spacing } from '../../theme/theme';

/**
 * FilterBar
 * Props:
 * - search: string
 * - onSearchChange: (text) => void
 * - types: Array<{ value: string, label: string }>
 * - value: string (selected type value)
 * - onChange: (value) => void
 * - placeholder?: string
 */
export default function FilterBar({ search, onSearchChange, types = [], value = '', onChange, placeholder = 'Rechercher' }) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.searchRow}>
        <MaterialCommunityIcons name="magnify" size={20} color={colors.mutedText} />
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={colors.mutedText}
          style={styles.searchInput}
          value={search}
          onChangeText={onSearchChange}
        />
        {search ? (
          <Pressable onPress={() => onSearchChange('')} accessibilityLabel="Effacer la recherche">
            <MaterialCommunityIcons name="close-circle" size={18} color={colors.mutedText} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.typeRow}>
        {types.map((t) => (
          <Pressable
            key={t.value || 'all'}
            onPress={() => onChange(t.value)}
            style={[styles.typeBtn, value === t.value && styles.typeBtnActive]}
            accessibilityLabel={`Filtrer: ${t.label}`}
          >
            <Text style={[styles.typeText, value === t.value && styles.typeTextActive]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.md,
    borderRadius: 12,
    padding: spacing.md,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  searchInput: { flex: 1, paddingVertical: 8, marginLeft: 6, color: colors.text },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.sm },
  typeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    marginRight: 8,
    marginTop: 8,
    backgroundColor: '#f8fafc',
  },
  typeBtnActive: { backgroundColor: '#e6f0ff', borderColor: colors.primary },
  typeText: { color: colors.mutedText },
  typeTextActive: { color: colors.text, fontWeight: '600' },
});
