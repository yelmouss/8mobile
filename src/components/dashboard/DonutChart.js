import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { G, Circle } from 'react-native-svg';

function polarToCartesian(cx, cy, r, angle) {
  const a = ((angle - 90) * Math.PI) / 180.0;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

export default function DonutChart({ size = 140, stroke = 16, values = [], colors = [], labels = [], centerLabel }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = values.reduce((a, b) => a + b, 0) || 1;
  let acc = 0;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          {values.map((v, i) => {
            const pct = v / total;
            const dash = pct * circumference;
            const gap = circumference - dash;
            const circle = (
              <Circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={colors[i] || '#ccc'}
                strokeWidth={stroke}
                strokeDasharray={`${dash} ${gap}`}
                strokeLinecap="butt"
                fill="transparent"
                rotation={(acc / total) * 360}
                origin={`${size / 2}, ${size / 2}`}
              />
            );
            acc += v;
            return circle;
          })}
        </G>
      </Svg>
      {centerLabel ? (
        <View style={styles.center} pointerEvents="none">
          <Text style={styles.centerTop}>{centerLabel.title}</Text>
          <Text style={styles.centerValue}>{centerLabel.value}</Text>
        </View>
      ) : null}
      {labels?.length ? (
        <View style={{ marginTop: 10 }}>
          {labels.map((l, i) => (
            <View style={styles.legend} key={i}>
              <View style={[styles.dot, { backgroundColor: colors[i] || '#ccc' }]} />
              <Text style={styles.legendText}>{l}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  centerTop: { color: '#6b7280', fontSize: 12 },
  centerValue: { color: '#111827', fontSize: 20, fontWeight: '700' },
  legend: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  legendText: { marginLeft: 8, color: '#374151' },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
