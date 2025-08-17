import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Modal,
  Switch,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Slider from '@react-native-community/slider';
import { colors, spacing } from '../../../theme/theme';

export default function ElementPropertiesPanel({
  visible,
  element,
  onClose,
  onElementChange,
}) {
  const [properties, setProperties] = useState({
    content: '',
    color: '#000000',
    backgroundColor: 'transparent',
    fontSize: 16,
    fontWeight: 'normal',
    textAlign: 'center',
    opacity: 1,
    borderRadius: 0,
    borderWidth: 0,
    borderColor: '#000000',
    ...element?.style,
    content: element?.content || '',
  });

  useEffect(() => {
    if (element) {
      setProperties({
        content: element.content || '',
        color: element.style?.color || '#000000',
        backgroundColor: element.style?.backgroundColor || 'transparent',
        fontSize: element.style?.fontSize || 16,
        fontWeight: element.style?.fontWeight || 'normal',
        textAlign: element.style?.textAlign || 'center',
        opacity: element.style?.opacity !== undefined ? element.style.opacity : 1,
        borderRadius: element.style?.borderRadius || 0,
        borderWidth: element.style?.borderWidth || 0,
        borderColor: element.style?.borderColor || '#000000',
      });
    }
  }, [element]);

  const handleSave = () => {
    if (onElementChange) {
      onElementChange({
        ...element,
        content: properties.content,
        style: {
          ...element.style,
          color: properties.color,
          backgroundColor: properties.backgroundColor,
          fontSize: properties.fontSize,
          fontWeight: properties.fontWeight,
          textAlign: properties.textAlign,
          opacity: properties.opacity,
          borderRadius: properties.borderRadius,
          borderWidth: properties.borderWidth,
          borderColor: properties.borderColor,
        },
      });
    }
    onClose();
  };

  const updateProperty = (key, value) => {
    setProperties(prev => ({ ...prev, [key]: value }));
  };

  const textAlignOptions = [
    { value: 'left', icon: 'format-align-left', label: 'Gauche' },
    { value: 'center', icon: 'format-align-center', label: 'Centre' },
    { value: 'right', icon: 'format-align-right', label: 'Droite' },
  ];

  const fontWeightOptions = [
    { value: 'normal', label: 'Normal' },
    { value: 'bold', label: 'Gras' },
  ];

  const predefinedColors = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
  ];

  if (!element) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <MaterialCommunityIcons name="close" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Propriétés de l'élément</Text>
          <Pressable onPress={handleSave} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Sauver</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.content}>
          {/* Contenu */}
          {element.type === 'text' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contenu</Text>
              <TextInput
                style={styles.textInput}
                value={properties.content}
                onChangeText={(value) => updateProperty('content', value)}
                placeholder="Texte..."
                multiline
                maxLength={200}
              />
            </View>
          )}

          {/* Couleurs */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Couleurs</Text>
            
            {element.type === 'text' && (
              <>
                <Text style={styles.label}>Couleur du texte</Text>
                <View style={styles.colorGrid}>
                  {predefinedColors.map((color) => (
                    <Pressable
                      key={color}
                      style={[
                        styles.colorOption,
                        { backgroundColor: color },
                        properties.color === color && styles.colorOptionSelected,
                      ]}
                      onPress={() => updateProperty('color', color)}
                    >
                      {properties.color === color && (
                        <MaterialCommunityIcons 
                          name="check" 
                          size={16} 
                          color={color === '#000000' ? '#FFFFFF' : '#000000'} 
                        />
                      )}
                    </Pressable>
                  ))}
                </View>
              </>
            )}

            <Text style={styles.label}>Couleur de fond</Text>
            <View style={styles.colorGrid}>
              <Pressable
                style={[
                  styles.colorOption,
                  styles.transparentOption,
                  properties.backgroundColor === 'transparent' && styles.colorOptionSelected,
                ]}
                onPress={() => updateProperty('backgroundColor', 'transparent')}
              >
                <MaterialCommunityIcons name="close" size={16} color="#666" />
              </Pressable>
              {predefinedColors.map((color) => (
                <Pressable
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    properties.backgroundColor === color && styles.colorOptionSelected,
                  ]}
                  onPress={() => updateProperty('backgroundColor', color)}
                >
                  {properties.backgroundColor === color && (
                    <MaterialCommunityIcons 
                      name="check" 
                      size={16} 
                      color={color === '#000000' ? '#FFFFFF' : '#000000'} 
                    />
                  )}
                </Pressable>
              ))}
            </View>
          </View>

          {/* Texte spécifique */}
          {element.type === 'text' && (
            <>
              {/* Taille du texte */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Taille du texte</Text>
                <View style={styles.sliderContainer}>
                  <Text style={styles.sliderLabel}>{properties.fontSize}px</Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={8}
                    maximumValue={48}
                    value={properties.fontSize}
                    onValueChange={(value) => updateProperty('fontSize', Math.round(value))}
                    step={1}
                    minimumTrackTintColor={colors.primary}
                    maximumTrackTintColor="#d3d3d3"
                    thumbStyle={{ backgroundColor: colors.primary }}
                  />
                </View>
              </View>

              {/* Alignement */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Alignement</Text>
                <View style={styles.alignmentOptions}>
                  {textAlignOptions.map((option) => (
                    <Pressable
                      key={option.value}
                      style={[
                        styles.alignmentOption,
                        properties.textAlign === option.value && styles.alignmentOptionSelected,
                      ]}
                      onPress={() => updateProperty('textAlign', option.value)}
                    >
                      <MaterialCommunityIcons 
                        name={option.icon} 
                        size={20} 
                        color={properties.textAlign === option.value ? colors.primary : colors.text} 
                      />
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Poids de police */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Style</Text>
                <View style={styles.fontWeightOptions}>
                  {fontWeightOptions.map((option) => (
                    <Pressable
                      key={option.value}
                      style={[
                        styles.fontWeightOption,
                        properties.fontWeight === option.value && styles.fontWeightOptionSelected,
                      ]}
                      onPress={() => updateProperty('fontWeight', option.value)}
                    >
                      <Text
                        style={[
                          styles.fontWeightText,
                          { fontWeight: option.value },
                          properties.fontWeight === option.value && { color: colors.primary },
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </>
          )}

          {/* Opacité */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Opacité</Text>
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>{Math.round(properties.opacity * 100)}%</Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                value={properties.opacity}
                onValueChange={(value) => updateProperty('opacity', value)}
                step={0.1}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor="#d3d3d3"
                thumbStyle={{ backgroundColor: colors.primary }}
              />
            </View>
          </View>

          {/* Bordure */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bordure</Text>
            
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>Épaisseur: {properties.borderWidth}px</Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={10}
                value={properties.borderWidth}
                onValueChange={(value) => updateProperty('borderWidth', Math.round(value))}
                step={1}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor="#d3d3d3"
                thumbStyle={{ backgroundColor: colors.primary }}
              />
            </View>

            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>Rayon: {properties.borderRadius}px</Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={20}
                value={properties.borderRadius}
                onValueChange={(value) => updateProperty('borderRadius', Math.round(value))}
                step={1}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor="#d3d3d3"
                thumbStyle={{ backgroundColor: colors.primary }}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  closeButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: colors.primary,
  },
  transparentOption: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  sliderContainer: {
    marginBottom: spacing.sm,
  },
  sliderLabel: {
    fontSize: 14,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  alignmentOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  alignmentOption: {
    padding: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
  },
  alignmentOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '20',
  },
  fontWeightOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  fontWeightOption: {
    padding: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
    flex: 1,
  },
  fontWeightOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '20',
  },
  fontWeightText: {
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
  },
});
