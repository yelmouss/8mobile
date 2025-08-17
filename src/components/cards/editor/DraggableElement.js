import React from 'react';
import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  runOnJS,
  withSpring,
} from 'react-native-reanimated';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { calculateFontSize } from '../../../utils/cardDimensions';

// Fonction pour obtenir la base URL (similaire à client.js)
const getBaseUrl = () => {
  const NEXT_EXTRA = Constants?.expoConfig?.extra?.NEXT_BASE_URL;
  let NEXT_BASE_URL = (typeof NEXT_EXTRA === 'string'
    ? NEXT_EXTRA
    : (NEXT_EXTRA?.production || NEXT_EXTRA?.development)) || 'http://localhost:3000';

  const NGROK_FALLBACK = 'https://d3868a3be7b9.ngrok-free.app';
  try {
    const u = new URL(NEXT_BASE_URL);
    const localHosts = new Set(['localhost', '127.0.0.1', '10.0.2.2']);
    if (localHosts.has(u.hostname)) {
      NEXT_BASE_URL = NGROK_FALLBACK;
    }
  } catch {}

  if (Platform.OS === 'android') {
    try {
      const u = new URL(NEXT_BASE_URL);
      if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') {
        u.hostname = '10.0.2.2';
        NEXT_BASE_URL = u.toString().replace(/\/$/, '');
      }
    } catch {}
  }

  return NEXT_BASE_URL;
};

export default function DraggableElement({
  element,
  elementIndex,
  x: initialX,
  y: initialY,
  width,
  height,
  isSelected,
  editable,
  cardWidth,
  cardHeight,
  onMove,
  onSelect,
  onResize,
}) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scaleX = useSharedValue(1);
  const scaleY = useSharedValue(1);

  // Styles pour l'élément selon son type
  const getElementStyles = () => {
    return {
      width,
      height,
      backgroundColor: element.style?.backgroundColor || 'transparent',
      borderRadius: element.style?.borderRadius || 0,
      borderWidth: element.style?.borderWidth || 0,
      borderColor: element.style?.borderColor || 'transparent',
      opacity: element.style?.opacity !== undefined ? element.style.opacity : 1,
    };
  };

  const renderElementContent = () => {
    switch (element.type) {
      case 'text':
        // Utiliser la fonction de calcul cohérente avec l'app web
        const fontSize = calculateFontSize(width, height, element.style?.fontSize);
        
        return (
          <Text
            style={[
              styles.textContent,
              {
                color: element.style?.color || '#000',
                fontSize: fontSize,
                fontWeight: element.style?.fontWeight || 'normal',
                fontStyle: element.style?.fontStyle || 'normal',
                textDecorationLine: element.style?.textDecoration || 'none',
                textAlign: element.style?.textAlign || 'center',
                fontFamily: element.style?.fontFamily || 'System',
                backgroundColor: element.style?.backgroundColor || 'transparent',
                borderRadius: element.style?.borderRadius || 0,
                padding: 4,
                lineHeight: element.style?.lineHeight || undefined,
                letterSpacing: element.style?.letterSpacing || undefined,
              },
            ]}
            allowFontScaling={false}
            numberOfLines={0}
          >
            {element.content || 'Texte'}
          </Text>
        );

      case 'image':
        if (!element.content || element.content === '') {
          // Fallback pour les images sans contenu
          return (
            <View style={[
              styles.imageContent, 
              styles.imagePlaceholder,
              {
                borderRadius: element.style?.borderRadius ? 
                  (Math.min(width, height) * (element.style.borderRadius / 100)) : 0,
              }
            ]}>
              <MaterialCommunityIcons name="image" size={Math.min(width * 0.3, 40)} color="#666" />
              <Text style={styles.placeholderText}>Image</Text>
            </View>
          );
        }
        
        // Construire l'URL complète pour les images serveur
        let imageUri = element.content;
        if (element.content.startsWith('/uploads/')) {
          // Utiliser la même base URL que l'API
          imageUri = `${getBaseUrl()}${element.content}`;
        }
        
        console.log('🖼️ Tentative chargement image:', imageUri);
        
        return (
          <Image
            source={{ uri: imageUri }}
            style={[
              styles.imageContent,
              {
                borderRadius: element.style?.borderRadius ? 
                  (Math.min(width, height) * (element.style.borderRadius / 100)) : 0,
                borderWidth: element.style?.borderWidth || 0,
                borderColor: element.style?.borderColor || 'transparent',
              }
            ]}
            resizeMode="cover"
            onError={(error) => {
              console.log('❌ Erreur chargement image:', imageUri, error.nativeEvent);
            }}
            onLoad={() => {
              console.log('✅ Image chargée:', imageUri);
            }}
          />
        );

      case 'socialIcon':
        return (
          <Image
            source={{ uri: element.content }}
            style={[
              styles.iconContent,
              {
                borderRadius: element.style?.borderRadius ? 
                  (Math.min(width, height) * (element.style.borderRadius / 100)) : 0,
                opacity: element.style?.opacity || 1,
              }
            ]}
            resizeMode="contain"
          />
        );

      case 'line':
        return (
          <View 
            style={[
              styles.lineContent,
              {
                backgroundColor: element.style?.backgroundColor || '#000000',
                opacity: element.style?.opacity || 1,
                borderRadius: element.style?.borderRadius || 0,
                width: '100%',
                height: '100%',
              }
            ]} 
          />
        );

      default:
        return (
          <View style={styles.unknownElement}>
            <MaterialCommunityIcons name="help" size={20} color="#666" />
            <Text style={styles.unknownText}>{element.type}</Text>
          </View>
        );
    }
  };

  // Gestionnaire de drag principal
  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, context) => {
      context.startX = initialX;
      context.startY = initialY;
      console.log('🎯 DraggableElement: Drag démarré', { elementIndex, initialX, initialY });
      runOnJS(onSelect)();
    },
    onActive: (event, context) => {
      // Calculer la nouvelle position
      const newX = context.startX + event.translationX;
      const newY = context.startY + event.translationY;
      
      // Contraindre le mouvement aux limites de la carte
      const constrainedX = Math.max(0, Math.min(cardWidth - width, newX));
      const constrainedY = Math.max(0, Math.min(cardHeight - height, newY));
      
      translateX.value = constrainedX - initialX;
      translateY.value = constrainedY - initialY;
    },
    onEnd: () => {
      // Calculer la nouvelle position finale
      const finalX = initialX + translateX.value;
      const finalY = initialY + translateY.value;
      
      console.log('🎯 DraggableElement: Drag terminé', { 
        elementIndex, 
        finalX, 
        finalY, 
        translateX: translateX.value, 
        translateY: translateY.value 
      });
      
      // Notifier le parent de la nouvelle position
      runOnJS(onMove)(finalX, finalY);
      
      // Réinitialiser les valeurs de translation
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
    },
  });

  // Gestionnaires de resize pour les zones de texte (un pour chaque coin)
  const topLeftResizeHandler = useAnimatedGestureHandler({
    onStart: (_, context) => {
      context.startWidth = width;
      context.startHeight = height;
      console.log('🔄 DraggableElement: Resize topLeft démarré', { elementIndex, width, height });
    },
    onActive: (event, context) => {
      const deltaX = event.translationX;
      const deltaY = event.translationY;
      
      const newWidth = Math.max(30, context.startWidth - deltaX);
      const newHeight = Math.max(20, context.startHeight - deltaY);
      
      scaleX.value = newWidth / width;
      scaleY.value = newHeight / height;
    },
    onEnd: (event) => {
      const deltaX = event.translationX;
      const deltaY = event.translationY;
      
      const newWidth = Math.max(30, width - deltaX);
      const newHeight = Math.max(20, height - deltaY);
      
      console.log('🔄 DraggableElement: Resize topLeft terminé', { 
        elementIndex, newWidth, newHeight, deltaX, deltaY 
      });
      
      runOnJS(onResize)(newWidth, newHeight);
      
      scaleX.value = withSpring(1);
      scaleY.value = withSpring(1);
    },
  });

  const topRightResizeHandler = useAnimatedGestureHandler({
    onStart: (_, context) => {
      context.startWidth = width;
      context.startHeight = height;
      console.log('🔄 DraggableElement: Resize topRight démarré', { elementIndex, width, height });
    },
    onActive: (event, context) => {
      const deltaX = event.translationX;
      const deltaY = event.translationY;
      
      const newWidth = Math.max(30, context.startWidth + deltaX);
      const newHeight = Math.max(20, context.startHeight - deltaY);
      
      scaleX.value = newWidth / width;
      scaleY.value = newHeight / height;
    },
    onEnd: (event) => {
      const deltaX = event.translationX;
      const deltaY = event.translationY;
      
      const newWidth = Math.max(30, width + deltaX);
      const newHeight = Math.max(20, height - deltaY);
      
      console.log('🔄 DraggableElement: Resize topRight terminé', { 
        elementIndex, newWidth, newHeight, deltaX, deltaY 
      });
      
      runOnJS(onResize)(newWidth, newHeight);
      
      scaleX.value = withSpring(1);
      scaleY.value = withSpring(1);
    },
  });

  const bottomLeftResizeHandler = useAnimatedGestureHandler({
    onStart: (_, context) => {
      context.startWidth = width;
      context.startHeight = height;
      console.log('🔄 DraggableElement: Resize bottomLeft démarré', { elementIndex, width, height });
    },
    onActive: (event, context) => {
      const deltaX = event.translationX;
      const deltaY = event.translationY;
      
      const newWidth = Math.max(30, context.startWidth - deltaX);
      const newHeight = Math.max(20, context.startHeight + deltaY);
      
      scaleX.value = newWidth / width;
      scaleY.value = newHeight / height;
    },
    onEnd: (event) => {
      const deltaX = event.translationX;
      const deltaY = event.translationY;
      
      const newWidth = Math.max(30, width - deltaX);
      const newHeight = Math.max(20, height + deltaY);
      
      console.log('🔄 DraggableElement: Resize bottomLeft terminé', { 
        elementIndex, newWidth, newHeight, deltaX, deltaY 
      });
      
      runOnJS(onResize)(newWidth, newHeight);
      
      scaleX.value = withSpring(1);
      scaleY.value = withSpring(1);
    },
  });

  const bottomRightResizeHandler = useAnimatedGestureHandler({
    onStart: (_, context) => {
      context.startWidth = width;
      context.startHeight = height;
      console.log('🔄 DraggableElement: Resize bottomRight démarré', { elementIndex, width, height });
    },
    onActive: (event, context) => {
      const deltaX = event.translationX;
      const deltaY = event.translationY;
      
      const newWidth = Math.max(30, context.startWidth + deltaX);
      const newHeight = Math.max(20, context.startHeight + deltaY);
      
      scaleX.value = newWidth / width;
      scaleY.value = newHeight / height;
    },
    onEnd: (event) => {
      const deltaX = event.translationX;
      const deltaY = event.translationY;
      
      const newWidth = Math.max(30, width + deltaX);
      const newHeight = Math.max(20, height + deltaY);
      
      console.log('🔄 DraggableElement: Resize bottomRight terminé', { 
        elementIndex, newWidth, newHeight, deltaX, deltaY 
      });
      
      runOnJS(onResize)(newWidth, newHeight);
      
      scaleX.value = withSpring(1);
      scaleY.value = withSpring(1);
    },
  });

  // Style animé pour le drag & drop et resize
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scaleX: scaleX.value },
        { scaleY: scaleY.value },
        { rotate: `${element.style?.rotation || 0}deg` },
      ],
    };
  });

  if (!editable) {
    // Mode lecture seule
    return (
      <View
        style={[
          styles.elementContainer,
          getElementStyles(),
          { position: 'absolute', left: initialX, top: initialY },
        ]}
      >
        {renderElementContent()}
      </View>
    );
  }

  // Mode édition avec drag & drop
  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View
        style={[
          styles.elementContainer,
          getElementStyles(),
          animatedStyle,
          isSelected && styles.selectedElement,
          { position: 'absolute', left: initialX, top: initialY },
        ]}
      >
        <Pressable
          style={styles.elementPressable}
          onPress={onSelect}
        >
          {renderElementContent()}
          
          {/* Indicateurs de sélection et resize handles */}
          {isSelected && (
            <View style={styles.selectionIndicator}>
              {/* Coins de sélection avec resize pour texte et images */}
              {(element.type === 'text' || element.type === 'image') ? (
                <>
                  <PanGestureHandler onGestureEvent={topLeftResizeHandler}>
                    <Animated.View style={[styles.selectionCorner, styles.topLeft, styles.resizeHandle]} />
                  </PanGestureHandler>
                  <PanGestureHandler onGestureEvent={topRightResizeHandler}>
                    <Animated.View style={[styles.selectionCorner, styles.topRight, styles.resizeHandle]} />
                  </PanGestureHandler>
                  <PanGestureHandler onGestureEvent={bottomLeftResizeHandler}>
                    <Animated.View style={[styles.selectionCorner, styles.bottomLeft, styles.resizeHandle]} />
                  </PanGestureHandler>
                  <PanGestureHandler onGestureEvent={bottomRightResizeHandler}>
                    <Animated.View style={[styles.selectionCorner, styles.bottomRight, styles.resizeHandle]} />
                  </PanGestureHandler>
                </>
              ) : (
                <>
                  {/* Coins de sélection simples pour les autres éléments */}
                  <View style={[styles.selectionCorner, styles.topLeft]} />
                  <View style={[styles.selectionCorner, styles.topRight]} />
                  <View style={[styles.selectionCorner, styles.bottomLeft]} />
                  <View style={[styles.selectionCorner, styles.bottomRight]} />
                </>
              )}
            </View>
          )}
        </Pressable>
      </Animated.View>
    </PanGestureHandler>
  );
}

const styles = StyleSheet.create({
  elementContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  elementPressable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedElement: {
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
  },
  textContent: {
    textAlignVertical: 'center',
    paddingHorizontal: 4,
  },
  imageContent: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
    textAlign: 'center',
  },
  iconContent: {
    width: '100%',
    height: '100%',
  },
  lineContent: {
    width: '100%',
    height: '100%',
  },
  unknownElement: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  unknownText: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  selectionIndicator: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    pointerEvents: 'box-none', // Permet aux enfants de recevoir les événements
  },
  selectionCorner: {
    position: 'absolute',
    width: 10,
    height: 10,
    backgroundColor: '#007AFF',
    borderRadius: 5,
  },
  topLeft: {
    top: -10,
    left: -10,
  },
  topRight: {
    top: -10,
    right: -10,
  },
  bottomLeft: {
    bottom: -10,
    left: -10,
  },
  bottomRight: {
    bottom: -10,
    right: -10,
  },
  resizeHandle: {
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 10,
    width: 20,
    height: 20,
    pointerEvents: 'auto', // Important pour que le resize handle soit cliquable
    elevation: 5, // Ombre pour Android
    shadowColor: '#000', // Ombre pour iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 100, // S'assurer que les handles sont au-dessus
  },
});
