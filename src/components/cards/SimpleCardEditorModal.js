import React, { useState } from 'react';
import { View, Text, Pressable, Modal, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, spacing } from '../../theme/theme';

export default function SimpleCardEditorModal({
  visible,
  onRequestClose,
  onSave,
  busy,
  editing,
  name,
  onChangeName,
  matricule,
  onRegenerateMatricule,
  editMode,
  recto,
  verso,
  bgSide,
  prefs,
}) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onRequestClose}>
      <SafeAreaView style={styles.modalSafe}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editing && editing._id ? 'Modifier la carte' : 'Créer une carte'}
            </Text>
            <Pressable onPress={onRequestClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={22} color={colors.primaryDark} />
            </Pressable>
          </View>

          {/* État de debug */}
          <View style={styles.debugSection}>
            <Text style={styles.debugTitle}>État du modal:</Text>
            <Text style={styles.debugText}>editMode: {editMode ? 'true' : 'false'}</Text>
            <Text style={styles.debugText}>editing: {editing ? 'true' : 'false'}</Text>
            <Text style={styles.debugText}>recto: {recto || 'vide'}</Text>
            <Text style={styles.debugText}>verso: {verso || 'vide'}</Text>
            <Text style={styles.debugText}>bgSide: {bgSide}</Text>
          </View>

          {/* Informations de base */}
          <View style={styles.basicInfoSection}>
            <Text style={styles.label}>Nom</Text>
            <TextInput 
              style={styles.input} 
              value={name} 
              onChangeText={onChangeName} 
              placeholder="Ex: Carte pro" 
            />

            <Text style={styles.label}>Matricule</Text>
            <View style={styles.matriculeRow}>
              <TextInput 
                style={[styles.input, { flex: 1 }]} 
                value={matricule} 
                editable={false} 
                placeholder="Ex: ABC123" 
              />
              <Pressable 
                onPress={onRegenerateMatricule} 
                style={styles.matriculeBtn}
              >
                <MaterialCommunityIcons name="refresh" size={22} color={colors.primaryDark} />
              </Pressable>
            </View>
          </View>

          {/* Zone Canvas simple */}
          <View style={[styles.canvasSection, { backgroundColor: recto || '#e5e7eb' }]}>
            <Text style={styles.canvasText}>Zone Canvas - {bgSide}</Text>
            <Text style={styles.canvasText}>Background: {recto || verso || 'aucun'}</Text>
          </View>

          {/* Boutons d'action */}
          <View style={styles.actionButtons}>
            <Pressable 
              onPress={onRequestClose} 
              style={styles.secondaryBtn}
            >
              <Text style={styles.secondaryBtnText}>Annuler</Text>
            </Pressable>
            <Pressable 
              onPress={onSave} 
              style={styles.primaryBtn}
            >
              <Text style={styles.primaryBtnText}>
                {busy ? 'Patientez...' : (editing && editing._id ? 'Enregistrer' : 'Créer')}
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalSafe: { 
    flex: 1, 
    backgroundColor: colors.background 
  },
  modalContent: { 
    flex: 1,
    padding: spacing.md 
  },
  modalHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    marginBottom: spacing.md 
  },
  modalTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: colors.text 
  },
  closeBtn: { 
    padding: 6, 
    borderRadius: 20 
  },
  debugSection: {
    backgroundColor: '#f0f0f0',
    padding: spacing.sm,
    marginBottom: spacing.md,
    borderRadius: 8,
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.xs,
    color: colors.text,
  },
  debugText: {
    fontSize: 14,
    color: colors.mutedText,
    marginBottom: 2,
  },
  basicInfoSection: {
    marginBottom: spacing.md,
    padding: spacing.sm,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: { 
    marginTop: spacing.sm, 
    marginBottom: 6,
    color: colors.mutedText,
    fontSize: 14,
    fontWeight: '500',
  },
  input: { 
    borderWidth: 1, 
    borderColor: colors.border, 
    borderRadius: 8, 
    padding: 12, 
    backgroundColor: '#fff',
    fontSize: 16,
  },
  matriculeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  matriculeBtn: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
  },
  canvasSection: {
    flex: 1,
    borderRadius: 8,
    marginBottom: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  canvasText: {
    color: '#333',
    fontSize: 16,
    marginBottom: 5,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  primaryBtn: { 
    flex: 1, 
    backgroundColor: colors.primary, 
    paddingVertical: 12, 
    borderRadius: 8, 
    alignItems: 'center' 
  },
  primaryBtnText: { 
    color: '#fff', 
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryBtn: { 
    flex: 1, 
    backgroundColor: '#e5e7eb', 
    paddingVertical: 12, 
    borderRadius: 8, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: colors.border 
  },
  secondaryBtnText: { 
    color: colors.text, 
    fontWeight: '600',
    fontSize: 16,
  },
});
