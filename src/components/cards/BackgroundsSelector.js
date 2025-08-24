import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Image, FlatList } from 'react-native';
import { SvgUri } from 'react-native-svg';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, spacing } from '../../theme/theme';
import { getBackgrounds } from '../../api/client';

const predefinedColors = [
  '#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#800080', '#008000', '#ffc0cb', '#a52a2a', '#808080', '#000080', '#800000', '#808000', '#008080',
  '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#f38ba8', '#a8e6cf', '#dda0dd', '#98d8c8', '#f7dc6f', '#bb8fce', '#85c1e9', '#f8c471', '#82e0aa', '#f1948a', '#85929e', '#d5dbdb',
  '#f8f9fa', '#e9ecef', '#dee2e6', '#ced4da', '#adb5bd', '#6c757d', '#495057', '#343a40', '#212529', '#1a1a1a', '#0f0f0f', '#050505',
];
const predefinedGradients = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%, #fecfef 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
];

export default function BackgroundsSelector({ selected, onSelect }) {
  const [tab, setTab] = useState('colors');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [svgError, setSvgError] = useState({}); // {url: bool}
  const pageSize = 5;

  useEffect(() => {
    let cancelled = false;
    async function loadImages() {
      setLoading(true);
      setError(null);
      try {
        const data = await getBackgrounds();
        if (!cancelled) {
          setImages(Array.isArray(data.backgrounds) ? data.backgrounds : []);
        }
      } catch (e) {
        if (!cancelled) setError('Erreur de chargement');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (tab === 'images' && images.length === 0 && !loading) {
      loadImages();
    }
    return () => { cancelled = true; };
  }, [tab]);

  return (
    <View style={styles.container}>
      <View style={styles.tabsRow}>
        {['colors','gradients','images'].map(t => (
          <Pressable key={t} onPress={() => setTab(t)} style={[styles.tabBtn, tab === t && styles.tabBtnActive]}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t === 'colors' ? 'Couleurs' : t === 'gradients' ? 'Dégradés' : 'Images'}</Text>
          </Pressable>
        ))}
      </View>
      {tab === 'colors' && (
        <View style={styles.grid}>
          {predefinedColors.map((color, idx) => (
            <Pressable key={color} style={[styles.colorOption, {backgroundColor: color}, selected?.type === 'color' && selected?.value === color && styles.selected]} onPress={() => onSelect({type:'color', value:color})}>
              {selected?.type === 'color' && selected?.value === color && (
                <MaterialCommunityIcons name="check" size={18} color={color==='#fff'?'#000':'#fff'} />
              )}
            </Pressable>
          ))}
        </View>
      )}
      {tab === 'gradients' && (
        <View style={styles.grid}>
          {predefinedGradients.map((g, idx) => (
            <Pressable key={g} style={[styles.gradientOption, selected?.type === 'gradient' && selected?.value === g && styles.selected]} onPress={() => onSelect({type:'gradient', value:g})}>
              <View style={[styles.gradientPreview, {backgroundColor:'#4facfe'}]} />
              {selected?.type === 'gradient' && selected?.value === g && (
                <MaterialCommunityIcons name="check" size={18} color="#fff" />
              )}
            </Pressable>
          ))}
        </View>
      )}
      {tab === 'images' && (
        <View style={styles.gridHorizontal}>
          {loading ? <ActivityIndicator color={colors.primary} /> : error ? <Text style={{color:'tomato'}}>{error}</Text> : images.length === 0 ? <Text style={{color:colors.mutedText}}>Aucune image</Text> : (
            <FlatList
              data={images.slice(0, page * pageSize)}
              horizontal
              keyExtractor={item => item}
              renderItem={({item}) => {
                const isSvg = typeof item === 'string' && item.toLowerCase().endsWith('.svg');
                // Fallback PNG URL (même nom que le SVG mais .png)
                const fallbackPng = isSvg ? item.replace(/\.svg$/i, '.png') : null;
                return (
                  <Pressable key={item} style={[styles.imageOption, selected?.type === 'image' && selected?.value === item && styles.selected]} onPress={() => onSelect({type:'image', value:item})}>
                    {isSvg && !svgError[item] ? (
                      <SvgUri uri={item} width={40} height={40} onError={() => setSvgError(prev => ({...prev, [item]: true}))} />
                    ) : isSvg && svgError[item] && fallbackPng ? (
                      <Image source={{ uri: fallbackPng }} style={{ width: 40, height: 40, borderRadius: 6 }} resizeMode="cover" />
                    ) : isSvg && svgError[item] ? (
                      <MaterialCommunityIcons name="alert-circle-outline" size={32} color="tomato" />
                    ) : (
                      <Image source={{ uri: item }} style={{ width: 40, height: 40, borderRadius: 6 }} resizeMode="cover" />
                    )}
                    {selected?.type === 'image' && selected?.value === item && (
                      <View style={styles.imageCheckbox}>
                        <MaterialCommunityIcons name="check" size={16} color="#fff" />
                      </View>
                    )}
                  </Pressable>
                );
              }}
              showsHorizontalScrollIndicator={false}
              ListFooterComponent={images.length > page * pageSize ? (
                <Pressable style={styles.showMoreBtn} onPress={() => setPage(page + 1)}>
                  <MaterialCommunityIcons name="chevron-right" size={28} color={colors.primary} />
                  <Text style={{color:colors.primary, fontWeight:'bold'}}>Plus</Text>
                </Pressable>
              ) : null}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: spacing.md },
  tabsRow: { flexDirection: 'row', marginBottom: spacing.sm },
  tabBtn: { flex: 1, padding: spacing.sm, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: colors.primary },
  tabText: { color: colors.mutedText, fontWeight: '600' },
  tabTextActive: { color: colors.primary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: spacing.sm },
  gridHorizontal: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, minHeight: 60 },
  showMoreBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#f8f9fa', borderRadius: 8, marginLeft: 8, borderWidth: 1, borderColor: colors.primary },
  colorOption: { width: 36, height: 36, borderRadius: 18, margin: 4, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#eee' },
  gradientOption: { width: 48, height: 36, borderRadius: 8, margin: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: '#eee' },
  gradientPreview: { width: 36, height: 24, borderRadius: 6, backgroundColor: '#4facfe' },
  imageOption: { width: 60, height: 60, borderRadius: 8, margin: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#eee' },
  selected: { borderColor: colors.primary, borderWidth: 2 },
  imageCheckbox: { position: 'absolute', top: 4, right: 4, backgroundColor: colors.primary, borderRadius: 8, padding: 2 },
});
