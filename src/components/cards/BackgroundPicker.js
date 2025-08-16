import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, FlatList, Image } from 'react-native';
import { colors, spacing } from '../../theme/theme';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SvgUri } from 'react-native-svg';
import Constants from 'expo-constants';

export default function BackgroundPicker({
  tab,
  onTabChange,
  currentValue,
  onSelect,
  backgrounds = [],
  uploads = [],
  onUploadPress,
}) {
  const [search, setSearch] = useState('');
  const [carouselWidth, setCarouselWidth] = useState(0);

  const chunk3 = (arr) => {
    const out = [];
    for (let i = 0; i < arr.length; i += 3) out.push(arr.slice(i, i + 3));
    return out;
  };

  const NEXT_EXTRA = Constants?.expoConfig?.extra?.NEXT_BASE_URL;
  const BASE = (typeof NEXT_EXTRA === 'string'
    ? NEXT_EXTRA
    : (NEXT_EXTRA?.production || NEXT_EXTRA?.development)) || 'http://localhost:3000';
  const toAbs = (u) => {
    if (!u) return null;
    const s = String(u);
    if (s.startsWith('http')) return s;
    return `${BASE}${s.startsWith('/') ? s : '/' + s}`;
  };
  const isSvg = (u) => typeof u === 'string' && u.trim().toLowerCase().endsWith('.svg');

  return (
    <View>
      <View style={styles.tabsRow}>
        {['images','uploads','gradients','colors'].map(t => (
          <Pressable key={t} onPress={() => onTabChange(t)} style={[styles.tabBtn, tab === t && styles.tabBtnActive]}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'images' ? 'Images' : t === 'uploads' ? 'Mes fichiers' : t === 'gradients' ? 'Dégradés' : 'Couleurs'}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === 'images' && (
        <>
          <TextInput style={styles.input} placeholder="Rechercher..." value={search} onChangeText={setSearch} />
          {!backgrounds.length ? (
            <View style={{ padding: spacing.md }}>
              <Text style={{ color: colors.mutedText, marginBottom: 8 }}>Aucun background trouvé.</Text>
            </View>
          ) : (
            <View onLayout={(e) => setCarouselWidth(e.nativeEvent.layout.width)}>
              <FlatList
                data={chunk3(backgrounds.filter(u => !search || String(u).toLowerCase().includes(search.toLowerCase())))}
                keyExtractor={(_, idx) => `page-${idx}`}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                initialNumToRender={2}
                maxToRenderPerBatch={2}
                windowSize={3}
                removeClippedSubviews
                renderItem={({ item: page }) => {
                  const W = Math.max(0, carouselWidth - spacing.md * 2);
                  const gap = spacing.md;
                  const cardW = W > 0 ? (W - gap * 2) / 3 : 100;
                  return (
                    <View style={{ width: carouselWidth }}>
                      <View style={{ flexDirection: 'row', paddingHorizontal: spacing.md, justifyContent: 'space-between' }}>
                        {page.map((u) => {
                          const isSel = currentValue === u;
                          return (
                            <Pressable key={u} onPress={() => onSelect(u)} style={[styles.thumbWrap, isSel && styles.thumbWrapSelected, { width: cardW, aspectRatio: 1.6 }]}>
                              {isSvg(u) ? (
                                <SvgUri uri={toAbs(u)} width="100%" height="100%" />
                              ) : (
                                <Image source={{ uri: toAbs(u) }} style={styles.thumb} />
                              )}
                            </Pressable>
                          );
                        })}
                        {page.length < 3 && Array.from({ length: 3 - page.length }).map((_, idx) => (
                          <View key={`sp-${idx}`} style={{ width: cardW }} />
                        ))}
                      </View>
                    </View>
                  );
                }}
              />
            </View>
          )}
        </>
      )}

      {tab === 'uploads' && (
        <>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.label}>Mes uploads</Text>
            <Pressable onPress={onUploadPress} style={{ padding: 8, borderRadius: 20 }}>
              <MaterialCommunityIcons name="upload" size={22} color={colors.primaryDark} />
            </Pressable>
          </View>
          <View style={styles.grid}>
            {uploads.map(u => {
              const isSel = currentValue === u;
              return (
                <Pressable key={u} onPress={() => onSelect(u)} style={[styles.thumbWrap, isSel && styles.thumbWrapSelected]}>
                  <Image source={{ uri: toAbs(u) }} style={styles.thumb} />
                </Pressable>
              );
            })}
          </View>
        </>
      )}

      {tab === 'gradients' && (
        <View style={styles.grid}>
          {[
            'linear-gradient(90deg, #3b82f6 0%, #06b6d4 100%)',
            'linear-gradient(90deg, #f472b6 0%, #f59e42 100%)',
            'linear-gradient(90deg, #8b5cf6 0%, #6366f1 100%)',
            'linear-gradient(90deg, #10b981 0%, #facc15 100%)',
            'linear-gradient(90deg, #181C14 0%, #697565 100%)',
            'linear-gradient(135deg, #181C14 0%, #3C3D37 100%)',
          ].map(g => {
            const isSel = currentValue === g;
            return (
              <Pressable key={g} onPress={() => onSelect(g)} style={[styles.gradientThumb, isSel && styles.thumbWrapSelected]}>
                <Text style={styles.gradientLabel}>Gradient</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {tab === 'colors' && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {['#181C14','#ECDFCC','#3C3D37','#697565','#9ca3af','#4b5563','#ef4444','#f59e0b','#10b981','#3b82f6','#f472b6','#facc15','#ffffff','#000000','#6366f1','#8b5cf6','#06b6d4','#f59e42'].map(c => {
            const isSel = currentValue === c;
            return (
              <Pressable key={c} onPress={() => onSelect(c)} style={[styles.colorDot, { backgroundColor: c }, isSel && { borderColor: colors.primary, borderWidth: 2 }]} />
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, marginTop: 6, backgroundColor: '#fff' },
  tabsRow: { flexDirection: 'row', marginTop: spacing.md, marginBottom: spacing.sm },
  tabBtn: { paddingVertical: 6, paddingHorizontal: 10, borderWidth: 1, borderColor: colors.border, borderRadius: 20, marginRight: 8 },
  tabBtnActive: { backgroundColor: '#fff', borderColor: colors.primary },
  tabText: { color: colors.mutedText },
  tabTextActive: { color: colors.text, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.sm },
  thumbWrap: { width: '31%', aspectRatio: 1.6, margin: 6, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  thumbWrapSelected: { borderColor: colors.primary },
  thumb: { width: '100%', height: '100%' },
  gradientThumb: { width: '31%', aspectRatio: 1.6, margin: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e5e7eb' },
  gradientLabel: { fontSize: 12, color: '#333' },
  colorDot: { width: 36, height: 36, borderRadius: 18, margin: 6, borderWidth: 1, borderColor: colors.border },
  label: { marginTop: spacing.sm, color: colors.mutedText },
});
