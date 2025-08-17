import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, PanResponder, Animated, Dimensions, Text, Image } from 'react-native';
import { colors } from '../../../theme/theme';

// Note: SvgUri peut être optionnel, l'importer seulement si disponible
let SvgUri;
try {
  const SvgModule = require('react-native-svg');
  SvgUri = SvgModule.SvgUri;
} catch (e) {
  // SvgUri non disponible, utiliser un placeholder
  SvgUri = ({ uri, width, height, style }) => (
    <View style={[{ width, height, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }, style]}>
      <Text style={{ fontSize: 12, color: '#666' }}>SVG</Text>
    </View>
  );
}

const BASE_W = 350; // Largeur de base de la carte
const BASE_H = 200; // Hauteur de base de la carte

export default function CardCanvasEditor({
  side = 'recto',
  layout,
  onChange,
  selectedIdx,
  onSelectIdx,
  onInteractStart,
  onInteractEnd,
  disabled = false,
  // Options de snap
  snapStep = 2, // pourcentage
  snapEnabled = true,
  // Options visuelles
  showGrid = false,
  gridStep = 5, // pourcentage
}) {
  const [size, setSize] = useState({ w: BASE_W, h: BASE_H });
  const [dragState, setDragState] = useState({});
  const [resizeState, setResizeState] = useState({});
  
  // Refs pour gérer les animations et interactions
  const panRefs = useRef({});
  const resizeRefs = useRef({});
  const lastMoveTime = useRef({});
  
  const elements = Array.isArray(layout?.elements) ? layout.elements : [];
  
  // Calcul du scale basé sur la taille du conteneur
  const scale = useMemo(() => ({
    w: size.w / BASE_W,
    h: size.h / BASE_H,
  }), [size]);

  // Utilitaires de conversion
  const toNum = (val, def = 0) => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? def : parsed;
    }
    return def;
  };

  const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

  const snap = (value, step) => {
    if (!snapEnabled || step <= 0) return value;
    return Math.round(value / step) * step;
  };

  // Fonction pour mettre à jour un élément
  const updateElement = (idx, patch) => {
    if (!onChange || !layout) return;
    const newElements = [...elements];
    newElements[idx] = { ...elements[idx], ...patch };
    onChange({ ...layout, elements: newElements });
  };

  // Initialiser les PanResponder pour chaque élément
  useEffect(() => {
    elements.forEach((el, idx) => {
      if (!panRefs.current[idx]) {
        panRefs.current[idx] = {
          anim: new Animated.ValueXY(),
          pan: null,
          dragging: false,
          lastPos: { x: 0, y: 0 },
        };
      }
      
      if (!panRefs.current[idx].pan) {
        panRefs.current[idx].pan = PanResponder.create({
          onStartShouldSetPanResponder: () => !disabled,
          onMoveShouldSetPanResponder: (evt, gesture) => {
            return !disabled && (Math.abs(gesture.dx) > 2 || Math.abs(gesture.dy) > 2);
          },
          
          onPanResponderGrant: (evt, gesture) => {
            onSelectIdx && onSelectIdx(idx);
            onInteractStart && onInteractStart('drag', idx);
            panRefs.current[idx].dragging = true;
            panRefs.current[idx].anim.setOffset({
              x: panRefs.current[idx].lastPos.x,
              y: panRefs.current[idx].lastPos.y,
            });
            panRefs.current[idx].anim.setValue({ x: 0, y: 0 });
          },
          
          onPanResponderMove: (evt, gesture) => {
            const now = Date.now();
            const key = `move_${idx}`;
            
            // Throttle pour améliorer les performances
            if (lastMoveTime.current[key] && now - lastMoveTime.current[key] < 16) {
              return;
            }
            lastMoveTime.current[key] = now;
            
            Animated.event([
              null,
              { dx: panRefs.current[idx].anim.x, dy: panRefs.current[idx].anim.y }
            ], { useNativeDriver: false })(evt, gesture);
          },
          
          onPanResponderRelease: (evt, gesture) => {
            panRefs.current[idx].dragging = false;
            onInteractEnd && onInteractEnd('drag', idx);
            
            // Calculer la nouvelle position
            const el = elements[idx];
            const currentX = toNum(el.position?.x, 0);
            const currentY = toNum(el.position?.y, 0);
            const currentW = toNum(el.style?.width, 10);
            const currentH = toNum(el.style?.height, 10);
            
            // Convertir le delta en pourcentage
            const deltaXPct = (gesture.dx / size.w) * 100;
            const deltaYPct = (gesture.dy / size.h) * 100;
            
            let newX = currentX + deltaXPct;
            let newY = currentY + deltaYPct;
            
            // Appliquer le snap
            if (snapEnabled && snapStep > 0) {
              newX = snap(newX, snapStep);
              newY = snap(newY, snapStep);
            }
            
            // Contraindre dans les limites
            newX = clamp(newX, 0, 100 - currentW);
            newY = clamp(newY, 0, 100 - currentH);
            
            // Mettre à jour la position
            updateElement(idx, {
              position: { ...(el.position || {}), x: newX, y: newY }
            });
            
            // Reset animation
            panRefs.current[idx].anim.flattenOffset();
            panRefs.current[idx].lastPos = { x: 0, y: 0 };
            panRefs.current[idx].anim.setValue({ x: 0, y: 0 });
          },
        });
      }
    });
  }, [elements, size, disabled, snapEnabled, snapStep, onChange, onSelectIdx, onInteractStart, onInteractEnd]);

  // Gérer les events de layout pour obtenir les dimensions
  const onLayout = (event) => {
    const { width, height } = event.nativeEvent.layout;
    if (width && height) {
      setSize({ w: width, h: height });
    }
  };

  // Processeur de background
  const getBackgroundStyle = () => {
    const bg = layout?.background;
    if (!bg) return { backgroundColor: '#f0f0f0' };
    
    switch (bg.type) {
      case 'color':
        return { backgroundColor: bg.value || '#ffffff' };
      case 'gradient':
        // Pour les gradients, on devra utiliser react-native-linear-gradient
        return { backgroundColor: bg.value || '#ffffff' };
      case 'image':
        return { backgroundColor: '#f0f0f0' };
      default:
        return { backgroundColor: '#f0f0f0' };
    }
  };

  // Render d'un élément
  const renderElement = (element, idx) => {
    const isSelected = idx === selectedIdx;
    const xPct = toNum(element.position?.x, 0);
    const yPct = toNum(element.position?.y, 0);
    const wPct = toNum(element.style?.width, 10);
    const hPct = toNum(element.style?.height, 10);
    const zIndex = toNum(element.position?.zIndex, 1);
    
    const left = (xPct / 100) * size.w;
    const top = (yPct / 100) * size.h;
    const width = (wPct / 100) * size.w;
    const height = (hPct / 100) * size.h;
    
    const animatedStyle = {
      transform: [
        { translateX: panRefs.current[idx]?.anim?.x || 0 },
        { translateY: panRefs.current[idx]?.anim?.y || 0 }
      ]
    };
    
    const elementStyle = {
      position: 'absolute',
      left,
      top,
      width,
      height,
      zIndex: isSelected ? 1000 : zIndex,
      borderWidth: isSelected ? 2 : 0,
      borderColor: isSelected ? colors.primary : 'transparent',
    };

    if (element.type === 'text') {
      return (
        <Animated.View
          key={`text_${idx}`}
          style={[elementStyle, animatedStyle]}
          {...(panRefs.current[idx]?.pan?.panHandlers || {})}
        >
          <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: element.style?.textAlign === 'center' ? 'center' : 
                      element.style?.textAlign === 'right' ? 'flex-end' : 'flex-start',
            backgroundColor: element.style?.backgroundColor || 'transparent',
            borderRadius: toNum(element.style?.borderRadius, 0),
            borderWidth: toNum(element.style?.borderWidth, 0),
            borderColor: element.style?.borderColor || 'transparent',
            padding: toNum(element.style?.padding, 0) * scale.w,
          }}>
            <Text style={{
              fontSize: toNum(element.style?.fontSize, 16) * scale.w,
              fontWeight: element.style?.fontWeight || 'normal',
              fontStyle: element.style?.fontStyle || 'normal',
              color: element.style?.color || '#000000',
              textAlign: element.style?.textAlign || 'left',
              textDecorationLine: element.style?.textDecoration === 'underline' ? 'underline' : 'none',
              letterSpacing: toNum(element.style?.letterSpacing, 0),
              lineHeight: toNum(element.style?.lineHeight, 0) || undefined,
            }}>
              {String(element.content || 'Texte')}
            </Text>
          </View>
          
          {/* Handles de redimensionnement pour éléments sélectionnés */}
          {isSelected && renderResizeHandles(idx, width, height)}
        </Animated.View>
      );
    }

    if (element.type === 'image') {
      const imageUri = element.content;
      const isSvg = imageUri && (imageUri.includes('.svg') || imageUri.includes('svg'));
      
      return (
        <Animated.View
          key={`image_${idx}`}
          style={[elementStyle, animatedStyle]}
          {...(panRefs.current[idx]?.pan?.panHandlers || {})}
        >
          <View style={{
            flex: 1,
            borderRadius: toNum(element.style?.borderRadius, 0),
            overflow: 'hidden',
            backgroundColor: element.style?.backgroundColor || 'transparent',
            borderWidth: toNum(element.style?.borderWidth, 0),
            borderColor: element.style?.borderColor || 'transparent',
          }}>
            {isSvg ? (
              <SvgUri 
                uri={imageUri} 
                width="100%" 
                height="100%" 
                style={{ opacity: toNum(element.style?.opacity, 1) }}
              />
            ) : (
              <Image
                source={{ uri: imageUri }}
                style={{
                  width: '100%',
                  height: '100%',
                  opacity: toNum(element.style?.opacity, 1),
                }}
                resizeMode={element.style?.objectFit || 'cover'}
              />
            )}
          </View>
          
          {/* Handles de redimensionnement pour éléments sélectionnés */}
          {isSelected && renderResizeHandles(idx, width, height)}
        </Animated.View>
      );
    }

    if (element.type === 'audio') {
      return (
        <Animated.View
          key={`audio_${idx}`}
          style={[elementStyle, animatedStyle]}
          {...(panRefs.current[idx]?.pan?.panHandlers || {})}
        >
          <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: element.style?.backgroundColor || colors.primary + '20',
            borderRadius: toNum(element.style?.borderRadius, 8),
            borderWidth: 2,
            borderColor: colors.primary,
          }}>
            <Text style={{ fontSize: 22 }}>🔊</Text>
          </View>
          
          {isSelected && renderResizeHandles(idx, width, height)}
        </Animated.View>
      );
    }

    return null;
  };

  // Render des handles de redimensionnement
  const renderResizeHandles = (idx, width, height) => {
    const handleSize = 12;
    const handles = [
      { key: 'tl', style: { top: -handleSize/2, left: -handleSize/2 } },
      { key: 'tr', style: { top: -handleSize/2, right: -handleSize/2 } },
      { key: 'bl', style: { bottom: -handleSize/2, left: -handleSize/2 } },
      { key: 'br', style: { bottom: -handleSize/2, right: -handleSize/2 } },
      { key: 't', style: { top: -handleSize/2, left: width/2 - handleSize/2 } },
      { key: 'b', style: { bottom: -handleSize/2, left: width/2 - handleSize/2 } },
      { key: 'l', style: { left: -handleSize/2, top: height/2 - handleSize/2 } },
      { key: 'r', style: { right: -handleSize/2, top: height/2 - handleSize/2 } },
    ];

    return handles.map(handle => (
      <View
        key={handle.key}
        style={[
          {
            position: 'absolute',
            width: handleSize,
            height: handleSize,
            backgroundColor: colors.primary,
            borderRadius: handleSize / 2,
            borderWidth: 2,
            borderColor: '#fff',
          },
          handle.style
        ]}
      />
    ));
  };

  // Render de la grille si activée
  const renderGrid = () => {
    if (!showGrid) return null;
    
    const lines = [];
    const stepPx = (gridStep / 100) * size.w;
    
    // Lignes verticales
    for (let x = stepPx; x < size.w; x += stepPx) {
      lines.push(
        <View
          key={`v_${x}`}
          style={{
            position: 'absolute',
            left: x,
            top: 0,
            bottom: 0,
            width: 1,
            backgroundColor: colors.border,
            opacity: 0.3,
          }}
        />
      );
    }
    
    // Lignes horizontales
    const stepPxH = (gridStep / 100) * size.h;
    for (let y = stepPxH; y < size.h; y += stepPxH) {
      lines.push(
        <View
          key={`h_${y}`}
          style={{
            position: 'absolute',
            top: y,
            left: 0,
            right: 0,
            height: 1,
            backgroundColor: colors.border,
            opacity: 0.3,
          }}
        />
      );
    }
    
    return lines;
  };

  return (
    <View
      style={{
        width: '100%',
        aspectRatio: BASE_W / BASE_H,
        ...getBackgroundStyle(),
        borderRadius: 8,
        overflow: 'hidden',
        position: 'relative',
      }}
      onLayout={onLayout}
    >
      {/* Background image si applicable */}
      {layout?.background?.type === 'image' && layout.background.value && (
        <Image
          source={{ uri: layout.background.value }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
          resizeMode="cover"
        />
      )}
      
      {/* Grille */}
      {renderGrid()}
      
      {/* Éléments */}
      {elements.map((element, idx) => renderElement(element, idx))}
    </View>
  );
}
