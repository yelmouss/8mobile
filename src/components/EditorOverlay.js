import React, { useMemo, useRef } from 'react';
import { View, StyleSheet, Pressable, PanResponder } from 'react-native';

function toNum(v, fallback) {
  if (typeof v === 'number' && isFinite(v)) return v;
  const n = parseFloat(v);
  return isFinite(n) ? n : fallback;
}

export default function EditorOverlay({
  elements = [],
  selectedIdx = -1,
  onSelectIdx = () => {},
  onChangeElements = () => {},
}) {
  const panRefs = useRef({});

  const handlers = useMemo(() => {
    const map = {};
    elements.forEach((el, idx) => {
      map[idx] = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: () => onSelectIdx(idx),
        onPanResponderMove: (evt, gesture) => {
          const { width: W, height: H } = evt.nativeEvent.targetMeasurements || {};
          // Fallback: gesture coordinates only adjust relatively; we infer from container via gesture.moveX/moveY not available here in stable way.
          // Instead, we compute delta in percent using container layout captured from onLayout pass-through via targetMeasurements if present.
        },
      });
    });
    return map;
  }, [elements, onSelectIdx]);

  // We rely on onMove updated from parent passing container size. Keep simple: parent should provide move handler instead for robustness.
  return (
    <View style={styles.fill} pointerEvents="box-none">
      {elements.map((el, idx) => {
        const xPct = toNum(el?.position?.x, 0);
        const yPct = toNum(el?.position?.y, 0);
        const wPct = toNum(el?.style?.width, 20);
        const hPct = toNum(el?.style?.height, 10);
        return (
          <View key={idx} style={StyleSheet.absoluteFill} pointerEvents="box-none">
            <Pressable
              onPress={() => onSelectIdx(idx)}
              style={({ pressed }) => [styles.box, { left: `${xPct}%`, top: `${yPct}%`, width: `${wPct}%`, height: `${hPct}%`, borderColor: idx === selectedIdx ? '#2563eb' : 'transparent' }, pressed && { opacity: 0.8 }]}
            />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  box: { position: 'absolute', borderWidth: 2, backgroundColor: 'rgba(37,99,235,0.05)' },
});
