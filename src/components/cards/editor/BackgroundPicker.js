import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, spacing } from '../../../theme/theme';

export default function BackgroundPicker({
  tab,
  onTabChange,
  currentValue,
  onSelect,
  backgrounds = [],
  uploads = [],
  onUploadPress,
  loading = false,
}) {
  const [selectedTab, setSelectedTab] = useState(tab || 'images');

  const tabs = [
    { key: 'images', label: 'Images', icon: 'image' },
    { key: 'gradients', label: 'Dégradés', icon: 'gradient-vertical' },
    { key: 'colors', label: 'Couleurs', icon: 'palette' },
  ];

  const predefinedGradients = [
    { type: 'gradient', value: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)', name: 'Purple Blue' },
    { type: 'gradient', value: 'linear-gradient(45deg, #f093fb 0%, #f5576c 100%)', name: 'Pink Red' },
    { type: 'gradient', value: 'linear-gradient(45deg, #4facfe 0%, #00f2fe 100%)', name: 'Blue Cyan' },
    { type: 'gradient', value: 'linear-gradient(45deg, #43e97b 0%, #38f9d7 100%)', name: 'Green Mint' },
    { type: 'gradient', value: 'linear-gradient(45deg, #fa709a 0%, #fee140 100%)', name: 'Pink Yellow' },
    { type: 'gradient', value: 'linear-gradient(45deg, #a8edea 0%, #fed6e3 100%)', name: 'Soft Pastel' },
    { type: 'gradient', value: 'linear-gradient(45deg, #ff9a9e 0%, #fecfef 100%)', name: 'Rose Pink' },
    { type: 'gradient', value: 'linear-gradient(45deg, #ffecd2 0%, #fcb69f 100%)', name: 'Peach' },
  ];

  const predefinedColors = [
    '#ffffff', '#f8f9fa', '#e9ecef', '#dee2e6', '#ced4da', '#adb5bd',
    '#6c757d', '#495057', '#343a40', '#212529', '#000000',
    '#dc3545', '#fd7e14', '#ffc107', '#28a745', '#20c997', '#17a2b8',
    '#6f42c1', '#e83e8c', '#007bff', '#6610f2', '#d63384', '#198754',
  ];

  const handleTabChange = (tabKey) => {
    setSelectedTab(tabKey);
    onTabChange && onTabChange(tabKey);
  };

  const handleSelect = (background) => {
    onSelect && onSelect(background);
  };

  const isSelected = (bg) => {
    if (!currentValue) return false;
    return currentValue.type === bg.type && currentValue.value === bg.value;
  };

  const renderImages = () => (
    <View style={styles.gridContainer}>
      {/* Bouton upload */}
      <Pressable
        style={styles.uploadButton}
        onPress={onUploadPress}
        disabled={loading}
      >
        <MaterialCommunityIcons
          name="plus"
          size={24}
          color={colors.primary}
        />
        <Text style={styles.uploadText}>Ajouter</Text>
      </Pressable>

      {/* Images uploadées */}
      {uploads.map((url, index) => (
        <Pressable
          key={`upload_${index}`}
          style={[
            styles.imageItem,
            isSelected({ type: 'image', value: url }) && styles.selectedItem
          ]}
          onPress={() => handleSelect({ type: 'image', value: url })}
        >
          <View style={styles.imageContainer}>
            {/* Placeholder pour l'image - dans une vraie app, utiliser Image component */}
            <View style={[styles.imagePlaceholder, { backgroundColor: colors.border }]}>
              <MaterialCommunityIcons name="image" size={20} color={colors.mutedText} />
            </View>
          </View>
        </Pressable>
      ))}

      {/* Images prédéfinies */}
      {backgrounds.map((bg, index) => (
        <Pressable
          key={`bg_${index}`}
          style={[
            styles.imageItem,
            isSelected(bg) && styles.selectedItem
          ]}
          onPress={() => handleSelect(bg)}
        >
          <View style={styles.imageContainer}>
            <View style={[styles.imagePlaceholder, { backgroundColor: colors.border }]}>
              <MaterialCommunityIcons name="image" size={20} color={colors.mutedText} />
            </View>
          </View>
        </Pressable>
      ))}
    </View>
  );

  const renderGradients = () => (
    <View style={styles.gridContainer}>
      {predefinedGradients.map((gradient, index) => (
        <Pressable
          key={`gradient_${index}`}
          style={[
            styles.colorItem,
            isSelected(gradient) && styles.selectedItem
          ]}
          onPress={() => handleSelect(gradient)}
        >
          <View style={[
            styles.gradientPreview,
            { backgroundColor: gradient.value.includes('linear-gradient') ? '#f0f0f0' : gradient.value }
          ]}>
            {/* Simulation de gradient - dans une vraie app, utiliser react-native-linear-gradient */}
            <MaterialCommunityIcons name="gradient-vertical" size={20} color={colors.mutedText} />
          </View>
        </Pressable>
      ))}
    </View>
  );

  const renderColors = () => (
    <View style={styles.gridContainer}>
      {predefinedColors.map((color, index) => (
        <Pressable
          key={`color_${index}`}
          style={[
            styles.colorItem,
            isSelected({ type: 'color', value: color }) && styles.selectedItem
          ]}
          onPress={() => handleSelect({ type: 'color', value: color })}
        >
          <View style={[styles.colorPreview, { backgroundColor: color }]} />
        </Pressable>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Arrière-plan</Text>
      
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            style={[
              styles.tab,
              selectedTab === tab.key && styles.activeTab
            ]}
            onPress={() => handleTabChange(tab.key)}
          >
            <MaterialCommunityIcons
              name={tab.icon}
              size={18}
              color={selectedTab === tab.key ? '#fff' : colors.text}
            />
            <Text style={[
              styles.tabText,
              selectedTab === tab.key && styles.activeTabText
            ]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {selectedTab === 'images' && renderImages()}
        {selectedTab === 'gradients' && renderGradients()}
        {selectedTab === 'colors' && renderColors()}
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
    maxHeight: 300,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    borderRadius: 4,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
    marginLeft: 4,
  },
  activeTabText: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  uploadButton: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: colors.border,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  uploadText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
    marginTop: 4,
  },
  imageItem: {
    width: '30%',
    aspectRatio: 1,
    marginBottom: spacing.xs,
    borderRadius: 6,
    overflow: 'hidden',
  },
  selectedItem: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  imageContainer: {
    flex: 1,
    borderRadius: 6,
    overflow: 'hidden',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
  colorItem: {
    width: '20%',
    aspectRatio: 1,
    marginBottom: spacing.xs,
    borderRadius: 6,
    overflow: 'hidden',
  },
  colorPreview: {
    flex: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gradientPreview: {
    flex: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
