import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Image, Pressable, PanResponder } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import Constants from 'expo-constants';

const BASE_W = 1050;
const BASE_H = 600;

function toNum(v, fallback) {
  if (typeof v === 'number' && isFinite(v)) return v;
  const n = parseFloat(v);
  return isFinite(n) ? n : fallback;
}

const NEXT_EXTRA = Constants?.expoConfig?.extra?.NEXT_BASE_URL;
const BASE = (typeof NEXT_EXTRA === 'string'
  ? NEXT_EXTRA
  : (NEXT_EXTRA?.production || NEXT_EXTRA?.development)) || 'http://localhost:3000';
function toAbs(u) {
  if (!u) return null;
  if (u.startsWith('http://') || u.startsWith('https://') || u.startsWith('data:')) return u;
  const path = u.startsWith('/') ? u : `/${u}`;
  return `${BASE}${path}`;
}

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const toResizeMode = (fit) => {
  switch ((fit || 'contain').toLowerCase()) {
    case 'cover': return 'cover';
    case 'fill': return 'stretch';
    case 'contain':
    default: return 'contain';
  }
};
const mapFontFamily = (f) => {
  if (!f) return undefined;
  const s = String(f).toLowerCase();
  if (s.includes('mono')) return 'monospace';
  if (s.includes('serif') && !s.includes('sans')) return 'serif';
  return 'sans-serif';
};

export default function CanvasEditor({
  side = 'recto',
  layout,
  onChange,
  selectedIdx,
  onSelectIdx,
}) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const scale = useMemo(() => ({
    w: size.w ? size.w / BASE_W : 1,
    h: size.h ? size.h / BASE_H : 1,
  }), [size]);

  const elements = Array.isArray(layout?.elements) ? layout.elements : [];

  const updateElement = useCallback((idx, patch) => {
    const next = elements.map((el, i) => (i === idx ? { ...el, ...patch } : el));
    onChange({ ...layout, elements: next });
  }, [elements, layout, onChange]);

  const panRefs = useRef({});

  const onLayout = (e) => {
    const { width, height } = e.nativeEvent.layout;
    if (width && height) setSize({ w: width, h: height });
  };

  const renderElement = (el, idx) => {
    const xPct = toNum(el?.position?.x, 0);
    const yPct = toNum(el?.position?.y, 0);
    const wPct = toNum(el?.style?.width, 20);
    const hPct = toNum(el?.style?.height, 10);
    const left = (xPct / 100) * size.w;
    const top = (yPct / 100) * size.h;
    const width = (wPct / 100) * size.w;
    const height = (hPct / 100) * size.h;
    const isSelected = idx === selectedIdx;

    if (!panRefs.current[idx]) {
      panRefs.current[idx] = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          onSelectIdx(idx);
        },
        onPanResponderMove: (evt, gesture) => {
          const dxPct = (gesture.dx / size.w) * 100;
          const dyPct = (gesture.dy / size.h) * 100;
          const nx = Math.max(0, Math.min(100, xPct + dxPct));
          const ny = Math.max(0, Math.min(100, yPct + dyPct));
          updateElement(idx, { position: { ...(el.position || {}), x: nx, y: ny } });
        },
      });
    }

    const borderStyle = isSelected ? { borderColor: '#2563eb', borderWidth: 2 } : {};

    if (el.type === 'text') {
      const color = el?.style?.color || '#111827';
      const providedFontSize = el?.style?.fontSize;
      const fontSize = providedFontSize != null ? toNum(providedFontSize, 16) : Math.max(8, 16 * scale.w);
      const fontWeight = el?.style?.fontWeight || '400';
      const fontStyle = el?.style?.fontStyle || 'normal';
      const textAlign = el?.style?.textAlign || 'left';
      const letterSpacing = el?.style?.letterSpacing != null ? toNum(el.style.letterSpacing, undefined) : undefined;
      const lineHeight = el?.style?.lineHeight != null ? toNum(el.style.lineHeight, undefined) : undefined;
      const fontFamily = mapFontFamily(el?.style?.fontFamily);
      const alignItems = textAlign === 'left' ? 'flex-start' : textAlign === 'right' ? 'flex-end' : 'center';
      const padding = toNum(el?.style?.padding, 0) * scale.w;
      const borderWidth = toNum(el?.style?.borderWidth, 0) * scale.w;
      const borderColor = el?.style?.borderColor || 'transparent';
      const backgroundColor = el?.style?.backgroundColor || 'transparent';
      return (
        <Pressable key={idx} style={[styles.abs, { left, top, width, height }, borderStyle]} onPress={() => onSelectIdx(idx)} {...panRefs.current[idx].panHandlers}>
          <View style={[styles.fill, { justifyContent: 'center', alignItems, padding, borderWidth, borderColor, backgroundColor }]}> 
            <Text style={{ color, fontSize, fontWeight, fontStyle, textAlign, letterSpacing, lineHeight, fontFamily, includeFontPadding: false }} numberOfLines={0}>
              {String(el.content || 'Texte')}
            </Text>
          </View>
          {isSelected ? renderResizeHandles(idx, { left, top, width, height }, { xPct, yPct, wPct, hPct }, el) : null}
        </Pressable>
      );
    }
    if (el.type === 'image' || el.type === 'socialIcon') {
      const uri = toAbs(String(el.content || ''));
      const svg = uri && (uri.endsWith('.svg') || uri.startsWith('data:image/svg'));
      const resizeMode = toResizeMode(el?.style?.objectFit || 'contain');
      return (
        <Pressable key={idx} style={[styles.abs, { left, top, width, height }, borderStyle]} onPress={() => onSelectIdx(idx)} {...panRefs.current[idx].panHandlers}>
          {svg ? (
            <SvgUri uri={uri} width="100%" height="100%" />
          ) : (
            <Image source={{ uri }} style={styles.fill} resizeMode={resizeMode} />
          )}
          {isSelected ? renderResizeHandles(idx, { left, top, width, height }, { xPct, yPct, wPct, hPct }, el) : null}
        </Pressable>
      );
    }
    if (el.type === 'audio') {
      return (
        <Pressable key={idx} style={[styles.abs, { left, top, width, height }, borderStyle, { justifyContent: 'center', alignItems: 'center' }]} onPress={() => onSelectIdx(idx)} {...panRefs.current[idx].panHandlers}>
          <Text style={{ fontSize: 22 }}>🔊</Text>
        </Pressable>
      );
    }
    return null;
  };

  const renderResizeHandles = (idx, rect, pct, el) => {
    const sizePx = 14;
    const half = sizePx / 2;
    const common = { position: 'absolute', width: sizePx, height: sizePx, backgroundColor: '#2563eb', borderRadius: 2, borderWidth: 1, borderColor: '#fff' };
    // Handle types: n, s, e, w, ne, nw, se, sw
    return (
      <>
        {/* Corners */}
        <View style={[common, { left: -half, top: -half }]} {...getHandlePan(idx, pct, 'nw').panHandlers} />
        <View style={[common, { right: -half, top: -half }]} {...getHandlePan(idx, pct, 'ne').panHandlers} />
        <View style={[common, { left: -half, bottom: -half }]} {...getHandlePan(idx, pct, 'sw').panHandlers} />
        <View style={[common, { right: -half, bottom: -half }]} {...getHandlePan(idx, pct, 'se').panHandlers} />
        {/* Sides */}
        <View style={[common, { left: '50%', marginLeft: -half, top: -half }]} {...getHandlePan(idx, pct, 'n').panHandlers} />
        <View style={[common, { left: '50%', marginLeft: -half, bottom: -half }]} {...getHandlePan(idx, pct, 's').panHandlers} />
        <View style={[common, { top: '50%', marginTop: -half, left: -half }]} {...getHandlePan(idx, pct, 'w').panHandlers} />
        <View style={[common, { top: '50%', marginTop: -half, right: -half }]} {...getHandlePan(idx, pct, 'e').panHandlers} />
      </>
    );
  };

  const handleRefs = useRef({});
  const getHandlePan = (idx, pct, type) => {
    const key = `${idx}:${type}`;
    if (handleRefs.current[key]) return handleRefs.current[key];
    const start = { x: pct.xPct, y: pct.yPct, w: pct.wPct, h: pct.hPct };
    handleRefs.current[key] = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => onSelectIdx(idx),
      onPanResponderMove: (evt, gesture) => {
        const dxPct = (gesture.dx / (size.w || 1)) * 100;
        const dyPct = (gesture.dy / (size.h || 1)) * 100;
        let nx = start.x;
        let ny = start.y;
        let nw = start.w;
        let nh = start.h;
        if (type.includes('e')) nw = start.w + dxPct;
        if (type.includes('s')) nh = start.h + dyPct;
        if (type.includes('w')) { nw = start.w - dxPct; nx = start.x + dxPct; }
        if (type.includes('n')) { nh = start.h - dyPct; ny = start.y + dyPct; }
        // Clamp within [0,100]
        nw = clamp(nw, 1, 100 - nx);
        nh = clamp(nh, 1, 100 - ny);
        nx = clamp(nx, 0, 100 - nw);
        ny = clamp(ny, 0, 100 - nh);
        const arr = elements.slice();
        const el = arr[idx] || {};
        arr[idx] = { ...el, position: { ...(el.position || {}), x: nx, y: ny }, style: { ...(el.style || {}), width: nw, height: nh } };
        onChange({ ...layout, elements: arr });
      },
    });
    return handleRefs.current[key];
  };

  return (
    <View style={styles.container} onLayout={onLayout}>
      <View style={styles.canvas}>
        <Background background={layout?.background} />
        {elements.map((el, idx) => renderElement(el, idx))}
      </View>
    </View>
  );
}

function Background({ background }) {
  if (!background) return <View style={[StyleSheet.absoluteFill, { backgroundColor: '#f3f4f6' }]} />;
  const { type, value } = background;
  if (type === 'color' && value) {
    return <View style={[StyleSheet.absoluteFill, { backgroundColor: value }]} />;
  }
  if (type === 'gradient' && value) {
    const colors = value.match(/#[0-9a-fA-F]{3,8}/g) || ['#e5e7eb', '#d1d5db'];
    return <LinearGradient colors={colors.slice(0, 2)} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />;
  }
  if (type === 'image' && value) {
    const uri = toAbs(String(value));
    const isSvg = uri && (uri.endsWith('.svg') || uri.startsWith('data:image/svg'));
    if (isSvg) return <SvgUri uri={uri} width="100%" height="100%" />;
    return <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />;
  }
  return <View style={[StyleSheet.absoluteFill, { backgroundColor: '#f3f4f6' }]} />;
}

const styles = StyleSheet.create({
  container: { width: '100%', aspectRatio: 7 / 4, borderRadius: 8, overflow: 'hidden', backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb' },
  canvas: { flex: 1 },
  abs: { position: 'absolute' },
  fill: { width: '100%', height: '100%' },
});
