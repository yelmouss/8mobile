import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, spacing } from '../../../theme/theme';

export default function EditorToolbar({
  editMode,
  onToggleMode,
  side,
  onSwitchSide,
  onAddText,
  onAddImage,
  onAddAudio,
  disabled = false,
}) {
  const tools = [
    {
      icon: 'format-text',
      label: 'Texte',
      onPress: onAddText,
      disabled: !editMode,
    },
    {
      icon: 'image',
      label: 'Image',
      onPress: onAddImage,
      disabled: !editMode,
    },
    {
      icon: 'microphone',
      label: 'Audio',
      onPress: onAddAudio,
      disabled: !editMode,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.modeSection}>
          <Text style={styles.sectionTitle}>Mode</Text>
          <Pressable
            style={[styles.modeButton, editMode && styles.modeButtonActive]}
            onPress={onToggleMode}
            disabled={disabled}
          >
            <MaterialCommunityIcons
              name={editMode ? 'pencil' : 'eye'}
              size={20}
              color={editMode ? '#fff' : colors.text}
            />
            <Text style={[styles.modeButtonText, editMode && styles.modeButtonTextActive]}>
              {editMode ? 'Édition' : 'Aperçu'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.sideSection}>
          <Text style={styles.sectionTitle}>Face</Text>
          <Pressable
            style={[styles.sideButton, side === 'recto' && styles.sideButtonActive]}
            onPress={() => onSwitchSide('recto')}
            disabled={disabled}
          >
            <Text style={[styles.sideButtonText, side === 'recto' && styles.sideButtonTextActive]}>
              Recto
            </Text>
          </Pressable>
          <Pressable
            style={[styles.sideButton, side === 'verso' && styles.sideButtonActive]}
            onPress={() => onSwitchSide('verso')}
            disabled={disabled}
          >
            <Text style={[styles.sideButtonText, side === 'verso' && styles.sideButtonTextActive]}>
              Verso
            </Text>
          </Pressable>
        </View>
      </View>

      {editMode && (
        <View style={styles.toolsSection}>
          <Text style={styles.sectionTitle}>Outils</Text>
          <View style={styles.toolsRow}>
            {tools.map((tool, index) => (
              <Pressable
                key={index}
                style={[styles.toolButton, tool.disabled && styles.toolButtonDisabled]}
                onPress={tool.onPress}
                disabled={tool.disabled || disabled}
              >
                <MaterialCommunityIcons
                  name={tool.icon}
                  size={24}
                  color={tool.disabled ? colors.mutedText : colors.primary}
                />
                <Text style={[styles.toolButtonText, tool.disabled && styles.toolButtonTextDisabled]}>
                  {tool.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: spacing.sm,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  modeSection: {
    flex: 1,
    marginRight: spacing.sm,
  },
  sideSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.mutedText,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
  },
  modeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  modeButtonText: {
    marginLeft: spacing.xs,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  modeButtonTextActive: {
    color: '#fff',
  },
  sideButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
    marginBottom: 4,
  },
  sideButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sideButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  sideButtonTextActive: {
    color: '#fff',
  },
  toolsSection: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  toolsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  toolButton: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 6,
    minWidth: 60,
  },
  toolButtonDisabled: {
    opacity: 0.5,
  },
  toolButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
    marginTop: 4,
  },
  toolButtonTextDisabled: {
    color: colors.mutedText,
  },
});
