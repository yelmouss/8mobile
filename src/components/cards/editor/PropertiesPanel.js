import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Alert } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Slider from '@react-native-community/slider';
import { colors, spacing } from '../../../theme/theme';

export default function PropertiesPanel({
  selectedEl,
  onUpdateContent,
  onUpdateStyle,
  onUpdatePos,
  onDelete,
  onSendBack,
  onBringFront,
  onDuplicate,
}) {
  const [localContent, setLocalContent] = useState('');
  const [activeSection, setActiveSection] = useState('content');

  useEffect(() => {
    if (selectedEl) {
      setLocalContent(selectedEl.content || '');
    }
  }, [selectedEl]);

  if (!selectedEl) {
    return (
      <View style={styles.container}>
        <Text style={styles.noSelectionText}>
          Sélectionnez un élément pour le modifier
        </Text>
      </View>
    );
  }

  const isText = selectedEl.type === 'text';
  const isImage = selectedEl.type === 'image';
  const isAudio = selectedEl.type === 'audio';

  const sections = [
    { key: 'content', label: 'Contenu', icon: 'text' },
    { key: 'style', label: 'Style', icon: 'palette' },
    { key: 'position', label: 'Position', icon: 'move' },
    { key: 'actions', label: 'Actions', icon: 'cog' },
  ];

  const handleContentUpdate = () => {
    onUpdateContent && onUpdateContent(localContent);
  };

  const handleStyleUpdate = (key, value) => {
    onUpdateStyle && onUpdateStyle({ [key]: value });
  };

  const handlePosUpdate = (key, value) => {
    onUpdatePos && onUpdatePos({ [key]: value });
  };

  const renderContentSection = () => (
    <View style={styles.section}>
      {isText && (
        <>
          <Text style={styles.sectionTitle}>Texte</Text>
          <TextInput
            style={styles.textInput}
            value={localContent}
            onChangeText={setLocalContent}
            onBlur={handleContentUpdate}
            placeholder="Saisissez votre texte"
            multiline
          />
        </>
      )}
      
      {isImage && (
        <>
          <Text style={styles.sectionTitle}>Image</Text>
          <View style={styles.imageInfo}>
            <MaterialCommunityIcons name="image" size={24} color={colors.mutedText} />
            <Text style={styles.imageText} numberOfLines={2}>
              {selectedEl.content || 'Aucune image'}
            </Text>
          </View>
          <Pressable style={styles.button} onPress={() => Alert.alert('Info', 'Fonctionnalité à implémenter')}>
            <MaterialCommunityIcons name="image-edit" size={20} color={colors.primary} />
            <Text style={styles.buttonText}>Changer l'image</Text>
          </Pressable>
        </>
      )}
      
      {isAudio && (
        <>
          <Text style={styles.sectionTitle}>Audio</Text>
          <View style={styles.audioInfo}>
            <MaterialCommunityIcons name="microphone" size={24} color={colors.mutedText} />
            <Text style={styles.audioText}>Élément audio</Text>
          </View>
          <Pressable style={styles.button} onPress={() => Alert.alert('Info', 'Fonctionnalité à implémenter')}>
            <MaterialCommunityIcons name="microphone-plus" size={20} color={colors.primary} />
            <Text style={styles.buttonText}>Enregistrer</Text>
          </Pressable>
        </>
      )}
    </View>
  );

  const renderStyleSection = () => (
    <View style={styles.section}>
      {isText && (
        <>
          <Text style={styles.sectionTitle}>Apparence du texte</Text>
          
          {/* Taille de police */}
          <View style={styles.styleItem}>
            <Text style={styles.styleLabel}>Taille: {Math.round(selectedEl.style?.fontSize || 16)}px</Text>
            <Slider
              style={styles.slider}
              minimumValue={8}
              maximumValue={72}
              value={selectedEl.style?.fontSize || 16}
              onValueChange={(value) => handleStyleUpdate('fontSize', Math.round(value))}
              thumbStyle={{ backgroundColor: colors.primary }}
              trackStyle={{ backgroundColor: colors.border }}
              minimumTrackTintColor={colors.primary}
            />
          </View>

          {/* Couleur du texte */}
          <View style={styles.styleItem}>
            <Text style={styles.styleLabel}>Couleur</Text>
            <View style={styles.colorRow}>
              {['#000000', '#333333', '#666666', '#999999', '#ffffff', colors.primary, '#dc3545', '#28a745'].map(color => (
                <Pressable
                  key={color}
                  style={[
                    styles.colorButton,
                    { backgroundColor: color },
                    selectedEl.style?.color === color && styles.selectedColor
                  ]}
                  onPress={() => handleStyleUpdate('color', color)}
                />
              ))}
            </View>
          </View>

          {/* Alignement */}
          <View style={styles.styleItem}>
            <Text style={styles.styleLabel}>Alignement</Text>
            <View style={styles.alignmentRow}>
              {[
                { key: 'left', icon: 'format-align-left' },
                { key: 'center', icon: 'format-align-center' },
                { key: 'right', icon: 'format-align-right' },
              ].map(align => (
                <Pressable
                  key={align.key}
                  style={[
                    styles.alignButton,
                    selectedEl.style?.textAlign === align.key && styles.selectedAlign
                  ]}
                  onPress={() => handleStyleUpdate('textAlign', align.key)}
                >
                  <MaterialCommunityIcons
                    name={align.icon}
                    size={20}
                    color={selectedEl.style?.textAlign === align.key ? '#fff' : colors.text}
                  />
                </Pressable>
              ))}
            </View>
          </View>

          {/* Style de police */}
          <View style={styles.styleItem}>
            <Text style={styles.styleLabel}>Style</Text>
            <View style={styles.fontStyleRow}>
              <Pressable
                style={[
                  styles.fontStyleButton,
                  selectedEl.style?.fontWeight === 'bold' && styles.selectedFontStyle
                ]}
                onPress={() => handleStyleUpdate('fontWeight', 
                  selectedEl.style?.fontWeight === 'bold' ? 'normal' : 'bold')}
              >
                <Text style={[styles.fontStyleText, selectedEl.style?.fontWeight === 'bold' && styles.selectedFontStyleText]}>
                  B
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.fontStyleButton,
                  selectedEl.style?.fontStyle === 'italic' && styles.selectedFontStyle
                ]}
                onPress={() => handleStyleUpdate('fontStyle', 
                  selectedEl.style?.fontStyle === 'italic' ? 'normal' : 'italic')}
              >
                <Text style={[styles.fontStyleText, selectedEl.style?.fontStyle === 'italic' && styles.selectedFontStyleText]}>
                  I
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.fontStyleButton,
                  selectedEl.style?.textDecoration === 'underline' && styles.selectedFontStyle
                ]}
                onPress={() => handleStyleUpdate('textDecoration', 
                  selectedEl.style?.textDecoration === 'underline' ? 'none' : 'underline')}
              >
                <Text style={[styles.fontStyleText, selectedEl.style?.textDecoration === 'underline' && styles.selectedFontStyleText]}>
                  U
                </Text>
              </Pressable>
            </View>
          </View>
        </>
      )}

      {(isImage || isAudio) && (
        <>
          <Text style={styles.sectionTitle}>Apparence</Text>
          
          {/* Opacité */}
          <View style={styles.styleItem}>
            <Text style={styles.styleLabel}>Opacité: {Math.round((selectedEl.style?.opacity || 1) * 100)}%</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              value={selectedEl.style?.opacity || 1}
              onValueChange={(value) => handleStyleUpdate('opacity', value)}
              thumbStyle={{ backgroundColor: colors.primary }}
              trackStyle={{ backgroundColor: colors.border }}
              minimumTrackTintColor={colors.primary}
            />
          </View>

          {/* Border radius */}
          <View style={styles.styleItem}>
            <Text style={styles.styleLabel}>Arrondi: {Math.round(selectedEl.style?.borderRadius || 0)}px</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={50}
              value={selectedEl.style?.borderRadius || 0}
              onValueChange={(value) => handleStyleUpdate('borderRadius', Math.round(value))}
              thumbStyle={{ backgroundColor: colors.primary }}
              trackStyle={{ backgroundColor: colors.border }}
              minimumTrackTintColor={colors.primary}
            />
          </View>
        </>
      )}

      {/* Couleur de fond pour tous les types */}
      <View style={styles.styleItem}>
        <Text style={styles.styleLabel}>Fond</Text>
        <View style={styles.colorRow}>
          <Pressable
            style={[
              styles.colorButton,
              { backgroundColor: 'transparent', borderWidth: 2, borderColor: colors.border },
              selectedEl.style?.backgroundColor === 'transparent' && styles.selectedColor
            ]}
            onPress={() => handleStyleUpdate('backgroundColor', 'transparent')}
          >
            <MaterialCommunityIcons name="close" size={12} color={colors.mutedText} />
          </Pressable>
          {['#ffffff', '#f8f9fa', '#e9ecef', colors.primary, '#dc3545', '#28a745', '#000000'].map(color => (
            <Pressable
              key={color}
              style={[
                styles.colorButton,
                { backgroundColor: color },
                selectedEl.style?.backgroundColor === color && styles.selectedColor
              ]}
              onPress={() => handleStyleUpdate('backgroundColor', color)}
            />
          ))}
        </View>
      </View>
    </View>
  );

  const renderPositionSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Position et taille</Text>
      
      {/* Position X */}
      <View style={styles.styleItem}>
        <Text style={styles.styleLabel}>X: {Math.round(selectedEl.position?.x || 0)}%</Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={100}
          value={selectedEl.position?.x || 0}
          onValueChange={(value) => handlePosUpdate('x', Math.round(value))}
          thumbStyle={{ backgroundColor: colors.primary }}
          trackStyle={{ backgroundColor: colors.border }}
          minimumTrackTintColor={colors.primary}
        />
      </View>

      {/* Position Y */}
      <View style={styles.styleItem}>
        <Text style={styles.styleLabel}>Y: {Math.round(selectedEl.position?.y || 0)}%</Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={100}
          value={selectedEl.position?.y || 0}
          onValueChange={(value) => handlePosUpdate('y', Math.round(value))}
          thumbStyle={{ backgroundColor: colors.primary }}
          trackStyle={{ backgroundColor: colors.border }}
          minimumTrackTintColor={colors.primary}
        />
      </View>

      {/* Largeur */}
      <View style={styles.styleItem}>
        <Text style={styles.styleLabel}>Largeur: {Math.round(selectedEl.style?.width || 10)}%</Text>
        <Slider
          style={styles.slider}
          minimumValue={5}
          maximumValue={100}
          value={selectedEl.style?.width || 10}
          onValueChange={(value) => handleStyleUpdate('width', Math.round(value))}
          thumbStyle={{ backgroundColor: colors.primary }}
          trackStyle={{ backgroundColor: colors.border }}
          minimumTrackTintColor={colors.primary}
        />
      </View>

      {/* Hauteur */}
      <View style={styles.styleItem}>
        <Text style={styles.styleLabel}>Hauteur: {Math.round(selectedEl.style?.height || 10)}%</Text>
        <Slider
          style={styles.slider}
          minimumValue={5}
          maximumValue={100}
          value={selectedEl.style?.height || 10}
          onValueChange={(value) => handleStyleUpdate('height', Math.round(value))}
          thumbStyle={{ backgroundColor: colors.primary }}
          trackStyle={{ backgroundColor: colors.border }}
          minimumTrackTintColor={colors.primary}
        />
      </View>

      {/* Z-Index */}
      <View style={styles.styleItem}>
        <Text style={styles.styleLabel}>Calque: {selectedEl.position?.zIndex || 1}</Text>
        <View style={styles.zIndexRow}>
          <Pressable style={styles.zIndexButton} onPress={onSendBack}>
            <MaterialCommunityIcons name="arrow-down" size={20} color={colors.primary} />
            <Text style={styles.zIndexText}>Arrière</Text>
          </Pressable>
          <Pressable style={styles.zIndexButton} onPress={onBringFront}>
            <MaterialCommunityIcons name="arrow-up" size={20} color={colors.primary} />
            <Text style={styles.zIndexText}>Avant</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );

  const renderActionsSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Actions</Text>
      
      <Pressable style={[styles.actionButton, { backgroundColor: colors.primary }]} onPress={onDuplicate}>
        <MaterialCommunityIcons name="content-duplicate" size={20} color="#fff" />
        <Text style={[styles.actionButtonText, { color: '#fff' }]}>Dupliquer</Text>
      </Pressable>

      <Pressable style={[styles.actionButton, { backgroundColor: '#dc3545' }]} onPress={onDelete}>
        <MaterialCommunityIcons name="delete" size={20} color="#fff" />
        <Text style={[styles.actionButtonText, { color: '#fff' }]}>Supprimer</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Propriétés</Text>
      
      {/* Section tabs */}
      <View style={styles.tabsContainer}>
        {sections.map((section) => (
          <Pressable
            key={section.key}
            style={[
              styles.tab,
              activeSection === section.key && styles.activeTab
            ]}
            onPress={() => setActiveSection(section.key)}
          >
            <MaterialCommunityIcons
              name={section.icon}
              size={16}
              color={activeSection === section.key ? '#fff' : colors.text}
            />
          </Pressable>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeSection === 'content' && renderContentSection()}
        {activeSection === 'style' && renderStyleSection()}
        {activeSection === 'position' && renderPositionSection()}
        {activeSection === 'actions' && renderActionsSection()}
      </ScrollView>
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
    maxHeight: 400,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  noSelectionText: {
    textAlign: 'center',
    color: colors.mutedText,
    fontStyle: 'italic',
    marginTop: spacing.md,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    backgroundColor: colors.border,
    borderRadius: 6,
    padding: 2,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderRadius: 4,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: spacing.sm,
    backgroundColor: '#fff',
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  styleItem: {
    marginBottom: spacing.sm,
  },
  styleLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  colorButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedColor: {
    borderColor: colors.primary,
    borderWidth: 3,
  },
  alignmentRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  alignButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
  },
  selectedAlign: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  fontStyleRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  fontStyleButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedFontStyle: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  fontStyleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  selectedFontStyleText: {
    color: '#fff',
  },
  zIndexRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  zIndexButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
  },
  zIndexText: {
    fontSize: 12,
    color: colors.primary,
    marginLeft: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: 6,
    marginBottom: spacing.xs,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  imageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: colors.border,
    borderRadius: 6,
    marginBottom: spacing.sm,
  },
  imageText: {
    flex: 1,
    fontSize: 12,
    color: colors.text,
    marginLeft: spacing.xs,
  },
  audioInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: colors.border,
    borderRadius: 6,
    marginBottom: spacing.sm,
  },
  audioText: {
    flex: 1,
    fontSize: 12,
    color: colors.text,
    marginLeft: spacing.xs,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: '#fff',
  },
  buttonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
    marginLeft: spacing.xs,
  },
});
