import React, { useState, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  runOnJS,
  withSpring,
} from 'react-native-reanimated';
import MobileCard from '../../MobileCard';
import DraggableElement from './DraggableElement';
import { CARD_WIDTH, CARD_HEIGHT, percentToPx, pxToPercent } from '../../../utils/cardDimensions';

export default function CardCanvas({
  card,
  selectedElementIndex,
  onElementMove,
  onElementResize,
  onElementSelect,
  editable = true,
}) {
  const containerRef = useRef(null);

  console.log('🎯 CardCanvas: Props reçues', { 
    cardLayoutElements: card?.layout?.elements?.length || 0,
    selectedElementIndex,
    editable 
  });

  const handleElementMove = (elementIndex, newX, newY) => {
    if (onElementMove) {
      const percentX = pxToPercent(newX, 'width');
      const percentY = pxToPercent(newY, 'height');
      // Extraire l'index numérique du string "front-0" ou "back-1"
      const index = parseInt(elementIndex.split('-')[1]);
      onElementMove(index, percentX, percentY);
    }
  };

  const handleElementResize = (elementIndex, newWidth, newHeight) => {
    if (onElementResize) {
      const percentWidth = pxToPercent(newWidth, 'width');
      const percentHeight = pxToPercent(newHeight, 'height');
      // Extraire l'index numérique du string "front-0" ou "back-1"
      const index = parseInt(elementIndex.split('-')[1]);
      onElementResize(index, percentWidth, percentHeight);
    }
  };

  const renderElements = (elements, face = 'front') => {
    if (!elements || !Array.isArray(elements)) {
      console.log('❌ CardCanvas: Pas d\'éléments à rendre', { elements, face });
      return null;
    }

    console.log('✅ CardCanvas: Rendu des éléments', { 
      elementsCount: elements.length, 
      face, 
      elements: elements.map(el => ({ type: el.type, content: el.content }))
    });

    return elements.map((element, index) => {
      if (!element || element.enabled === false) return null;

      const elementIndex = `${face}-${index}`;
      const isSelected = selectedElementIndex === elementIndex;

      const x = percentToPx(parseFloat(element.position?.x || 0), 'width');
      const y = percentToPx(parseFloat(element.position?.y || 0), 'height');
      const width = percentToPx(parseFloat(element.style?.width || 20), 'width');
      const height = percentToPx(parseFloat(element.style?.height || 10), 'height');

      console.log(`🎯 CardCanvas: Element ${index} position/size:`, {
        element: { position: element.position, style: element.style },
        computed: { x, y, width, height },
        cardSize: { CARD_WIDTH, CARD_HEIGHT }
      });

      return (
        <DraggableElement
          key={elementIndex}
          element={element}
          elementIndex={elementIndex}
          x={x}
          y={y}
          width={width}
          height={height}
          isSelected={isSelected}
          editable={editable}
          cardWidth={CARD_WIDTH}
          cardHeight={CARD_HEIGHT}
          onMove={(finalX, finalY) => handleElementMove(elementIndex, finalX, finalY)}
          onResize={(newWidth, newHeight) => handleElementResize(elementIndex, newWidth, newHeight)}
          onSelect={() => onElementSelect?.(elementIndex)}
        />
      );
    });
  };

  return (
    <View style={styles.container}>
      <View 
        ref={containerRef}
        style={[styles.cardContainer, { width: CARD_WIDTH, height: CARD_HEIGHT }]}
      >
        {/* Carte de base - MobileCard sans éléments pour le background */}
        <MobileCard
          card={{
            ...card,
            layout: {
              ...card.layout,
              elements: [] // Forcer la liste d'éléments vide pour éviter les doublons
            }
          }}
          style={[styles.baseCard]}
          editable={false}
        />
        
        {/* Fallback background si MobileCard ne fonctionne pas */}
        {(!card?.recto && !card?.layout?.background) && (
          <View style={[styles.fallbackBackground, { backgroundColor: '#f0f0f0' }]} />
        )}

        {/* Overlay pour les éléments éditables */}
        {editable && (
          <View style={styles.elementsOverlay}>
            {/* Éléments du recto */}
            {renderElements(card?.layout?.elements, 'front')}
            
            {/* Si on affiche le verso, rendre ses éléments aussi */}
            {card?.showBack && renderElements(card?.backLayout?.elements, 'back')}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  cardContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  baseCard: {
    width: '100%',
    height: '100%',
  },
  fallbackBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  elementsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
});
