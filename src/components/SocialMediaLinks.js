import React from 'react';
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../theme/theme';

const ICONS = {
  facebook: 'facebook',
  twitter: 'twitter',
  x: 'twitter',
  instagram: 'instagram',
  linkedin: 'linkedin',
  youtube: 'youtube',
  tiktok: 'tiktok',
  github: 'github',
  website: 'web',
};

function normalizeEntries(socialMedia) {
  if (!socialMedia || typeof socialMedia !== 'object') return [];
  const entries = [];
  Object.keys(socialMedia).forEach((key) => {
    const val = socialMedia[key];
    if (!val) return;
    const k = key.toLowerCase();
    const url = typeof val === 'string' ? val : val.url || val.link;
    if (!url) return;
    entries.push({ key: k, url });
  });
  return entries;
}

export default function SocialMediaLinks({ socialMedia }) {
  const items = normalizeEntries(socialMedia);
  if (!items.length) return null;
  return (
    <View style={styles.wrap}>
      {items.map(({ key, url }) => {
        const icon = ICONS[key] || 'link-variant';
        const label = key[0].toUpperCase() + key.slice(1);
        return (
          <Pressable
            key={key}
            onPress={() => Linking.openURL(url).catch(() => {})}
            style={styles.chip}
            accessibilityRole="link"
            accessibilityLabel={`Ouvrir ${label}`}
          >
            <MaterialCommunityIcons name={icon} size={18} color={colors.primaryDark} />
            <Text style={styles.chipText}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
    borderRadius: 16,
    margin: 4,
  },
  chipText: { marginLeft: 6, color: colors.text },
});
