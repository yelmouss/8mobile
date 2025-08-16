import React, { useRef, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { colors, spacing } from '../../theme/theme';

export default function PropertiesPanel({ selectedEl, onUpdateStyle, onUpdatePos, onUpdateContent, onDelete, onSendBack, onBringFront }) {
  const textRef = useRef(null);
  useEffect(() => {
    if (selectedEl?.type === 'text' && textRef.current) {
      try { textRef.current.focus?.(); } catch {}
    }
  }, [selectedEl]);

  if (!selectedEl) return null;

  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>Propriétés</Text>
      {selectedEl.type === 'text' ? (
        <>
          <Text style={styles.propLabel}>Texte</Text>
          <TextInput ref={textRef} style={styles.input} value={String(selectedEl.content || '')} onChangeText={(t) => onUpdateContent(t)} />
          <View style={styles.rowGap}>
            <View style={{ flex: 1, marginRight: 6 }}>
              <Text style={styles.propLabel}>Taille</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={String(selectedEl?.style?.fontSize ?? 18)} onChangeText={(v) => onUpdateStyle({ fontSize: parseFloat(v) || 12 })} />
            </View>
            <View style={{ flex: 1, marginLeft: 6 }}>
              <Text style={styles.propLabel}>Couleur</Text>
              <TextInput style={styles.input} value={String(selectedEl?.style?.color || '#111827')} onChangeText={(v) => onUpdateStyle({ color: v })} />
            </View>
          </View>
          <View style={styles.rowGap}>
            <View style={{ flex: 1, marginRight: 6 }}>
              <Text style={styles.propLabel}>Alignement</Text>
              <View style={{ flexDirection: 'row', marginTop: 6 }}>
                {['left','center','right'].map(a => (
                  <Pressable key={a} onPress={() => onUpdateStyle({ textAlign: a })} style={[styles.smallBtn, { marginRight: 6 }, selectedEl?.style?.textAlign === a && { backgroundColor: '#eef2ff', borderColor: '#6366f1' }]}>
                    <Text style={styles.smallBtnText}>{a}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={{ flex: 1, marginLeft: 6 }}>
              <Text style={styles.propLabel}>Fond / Bordure</Text>
              <TextInput style={styles.input} placeholder="#ffffff" value={String(selectedEl?.style?.backgroundColor || '')} onChangeText={(v) => onUpdateStyle({ backgroundColor: v })} />
              <View style={styles.rowGap}>
                <TextInput style={[styles.input, { flex: 1, marginRight: 6 }]} placeholder="#e5e7eb" value={String(selectedEl?.style?.borderColor || '')} onChangeText={(v) => onUpdateStyle({ borderColor: v })} />
                <TextInput style={[styles.input, { flex: 1 }]} keyboardType="numeric" placeholder="1" value={String(selectedEl?.style?.borderWidth || 0)} onChangeText={(v) => onUpdateStyle({ borderWidth: parseFloat(v) || 0 })} />
              </View>
            </View>
          </View>
        </>
      ) : null}

      {selectedEl.type === 'image' ? (
        <>
          <View style={styles.rowGap}>
            <View style={{ flex: 1, marginRight: 6 }}>
              <Text style={styles.propLabel}>Forme</Text>
              <View style={{ flexDirection: 'row', marginTop: 6 }}>
                {[
                  { k: 'rect', label: 'Rectangle' },
                  { k: 'circle', label: 'Cercle' },
                ].map(opt => (
                  <Pressable key={opt.k} onPress={() => onUpdateStyle({ shape: opt.k === 'rect' ? undefined : 'circle' })} style={[styles.smallBtn, { marginRight: 6 }, (opt.k === 'circle' ? selectedEl?.style?.shape === 'circle' : !selectedEl?.style?.shape) && { backgroundColor: '#eef2ff', borderColor: '#6366f1' }]}>
                    <Text style={styles.smallBtnText}>{opt.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={{ flex: 1, marginLeft: 6 }}>
              <Text style={styles.propLabel}>Arrondi (%)</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={String(selectedEl?.style?.borderRadius ?? 0)} onChangeText={(v) => onUpdateStyle({ borderRadius: Math.max(0, Math.min(100, parseFloat(v) || 0)) })} />
            </View>
          </View>
        </>
      ) : null}

      <View style={styles.rowGap}>
        <View style={{ flex: 1, marginRight: 6 }}>
          <Text style={styles.propLabel}>X (%)</Text>
          <TextInput style={styles.input} keyboardType="numeric" value={String(selectedEl?.position?.x ?? 0)} onChangeText={(v) => onUpdatePos({ x: Math.max(0, Math.min(100, parseFloat(v) || 0)) })} />
        </View>
        <View style={{ flex: 1, marginLeft: 6 }}>
          <Text style={styles.propLabel}>Y (%)</Text>
          <TextInput style={styles.input} keyboardType="numeric" value={String(selectedEl?.position?.y ?? 0)} onChangeText={(v) => onUpdatePos({ y: Math.max(0, Math.min(100, parseFloat(v) || 0)) })} />
        </View>
      </View>

      <View style={{ flexDirection: 'row', marginTop: 6 }}>
        <Pressable style={styles.smallBtn} onPress={() => onUpdatePos({ x: Math.max(0, (selectedEl?.position?.x || 0) - 1) })}>
          <Text style={styles.smallBtnText}>X-</Text>
        </Pressable>
        <Pressable style={[styles.smallBtn, { marginLeft: 6 }]} onPress={() => onUpdatePos({ x: Math.min(100, (selectedEl?.position?.x || 0) + 1) })}>
          <Text style={styles.smallBtnText}>X+</Text>
        </Pressable>
        <Pressable style={[styles.smallBtn, { marginLeft: 12 }]} onPress={() => onUpdatePos({ y: Math.max(0, (selectedEl?.position?.y || 0) - 1) })}>
          <Text style={styles.smallBtnText}>Y-</Text>
        </Pressable>
        <Pressable style={[styles.smallBtn, { marginLeft: 6 }]} onPress={() => onUpdatePos({ y: Math.min(100, (selectedEl?.position?.y || 0) + 1) })}>
          <Text style={styles.smallBtnText}>Y+</Text>
        </Pressable>
      </View>

      <View style={styles.rowGap}>
        <View style={{ flex: 1, marginRight: 6 }}>
          <Text style={styles.propLabel}>Largeur (%)</Text>
          <TextInput style={styles.input} keyboardType="numeric" value={String(selectedEl?.style?.width ?? 20)} onChangeText={(v) => onUpdateStyle({ width: Math.max(1, Math.min(100, parseFloat(v) || 1)) })} />
        </View>
        <View style={{ flex: 1, marginLeft: 6 }}>
          <Text style={styles.propLabel}>Hauteur (%)</Text>
          <TextInput style={styles.input} keyboardType="numeric" value={String(selectedEl?.style?.height ?? 10)} onChangeText={(v) => onUpdateStyle({ height: Math.max(1, Math.min(100, parseFloat(v) || 1)) })} />
        </View>
      </View>

      <View style={styles.rowGap}>
        <View style={{ flex: 1, marginRight: 6 }}>
          <Text style={styles.propLabel}>Rotation (deg)</Text>
          <TextInput style={styles.input} keyboardType="numeric" value={String(selectedEl?.style?.rotation ?? 0)} onChangeText={(v) => onUpdateStyle({ rotation: parseFloat(v) || 0 })} />
        </View>
        <View style={{ flex: 1, marginLeft: 6 }}>
          <Text style={styles.propLabel}>Opacité (0-1)</Text>
          <TextInput style={styles.input} keyboardType="numeric" value={String(selectedEl?.style?.opacity ?? 1)} onChangeText={(v) => onUpdateStyle({ opacity: Math.max(0, Math.min(1, parseFloat(v))) })} />
        </View>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
        <Pressable style={[styles.smallBtn, { backgroundColor: '#fee2e2' }]} onPress={onDelete}>
          <Text style={[styles.smallBtnText, { color: '#991b1b' }]}>Supprimer</Text>
        </Pressable>
        <View style={{ flexDirection: 'row' }}>
          <Pressable style={styles.smallBtn} onPress={onSendBack}>
            <Text style={styles.smallBtnText}>Arrière</Text>
          </Pressable>
          <Pressable style={[styles.smallBtn, { marginLeft: 8 }]} onPress={onBringFront}>
            <Text style={styles.smallBtnText}>Avant</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: spacing.md, marginVertical: spacing.md },
  panelTitle: { fontWeight: '700', marginBottom: 8, color: colors.text },
  propLabel: { color: colors.mutedText, marginTop: 6 },
  rowGap: { flexDirection: 'row', marginTop: 6 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, marginTop: 6, backgroundColor: '#fff' },
  smallBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  smallBtnText: { fontWeight: '600', color: colors.text },
});
