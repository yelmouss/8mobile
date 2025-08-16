import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, spacing } from '../../theme/theme';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function EditorToolbar({ editMode, onToggleMode, onSwitchSide, side, onAddText, onAddImage, onAddAudio }) {
  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm }}>
        <Pressable onPress={onToggleMode} style={[styles.smallBtn, { backgroundColor: editMode ? colors.primary : '#e5e7eb' }]}> 
          <Text style={[styles.smallBtnText, { color: editMode ? '#fff' : '#111' }]}>{editMode ? 'Prévisualiser' : 'Éditer'}</Text>
        </Pressable>
        <Pressable onPress={onSwitchSide} style={styles.smallBtn}>
          <Text style={styles.smallBtnText}>{side === 'recto' ? 'Aller au verso' : 'Aller au recto'}</Text>
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Pressable style={styles.action} onPress={onAddText}>
          <MaterialCommunityIcons name="format-text" size={18} color={colors.primaryDark} />
          <Text style={styles.actionText}>Texte</Text>
        </Pressable>
        <Pressable style={styles.action} onPress={onAddImage}>
          <MaterialCommunityIcons name="image-plus" size={18} color={colors.primaryDark} />
          <Text style={styles.actionText}>Image</Text>
        </Pressable>
        <Pressable style={styles.action} onPress={onAddAudio}>
          <MaterialCommunityIcons name="microphone-plus" size={18} color={colors.primaryDark} />
          <Text style={styles.actionText}>Audio</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  smallBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  smallBtnText: { fontWeight: '600', color: colors.text },
  action: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, flex: 1, marginHorizontal: 4 },
  actionText: { marginLeft: 6, color: colors.text, fontWeight: '600' },
});
