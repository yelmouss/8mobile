import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Audio } from 'expo-av';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../theme/theme';
import Constants from 'expo-constants';

const NEXT = Constants?.expoConfig?.extra?.NEXT_BASE_URL || 'http://localhost:3000';
const toAbs = (u) => {
  if (!u) return null;
  const s = String(u);
  if (s.startsWith('http')) return s;
  return `${NEXT}${s.startsWith('/') ? s : '/' + s}`;
};

export default function AudioPlayer({ audioUrl, title = 'Audio' }) {
  const [isPlaying, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const soundRef = useRef(null);

  useEffect(() => {
    (async () => {
      const sound = new Audio.Sound();
      const uri = toAbs(audioUrl);
      try {
        await sound.loadAsync({ uri }, {}, true);
        const status = await sound.getStatusAsync();
        if (status.isLoaded) setDuration(status.durationMillis || 0);
        sound.setOnPlaybackStatusUpdate((st) => {
          if (!st.isLoaded) return;
          setPosition(st.positionMillis || 0);
          setPlaying(!!st.isPlaying);
        });
        soundRef.current = sound;
      } catch {}
    })();
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
    };
  }, [audioUrl]);

  const toggle = async () => {
    if (!soundRef.current) return;
    const st = await soundRef.current.getStatusAsync();
    if (!st.isLoaded) return;
    if (st.isPlaying) await soundRef.current.pauseAsync();
    else await soundRef.current.playAsync();
  };

  const mmss = (ms) => {
    const s = Math.floor((ms || 0) / 1000);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
  };

  return (
    <View style={styles.wrap}>
      <Pressable onPress={toggle} style={styles.playBtn} accessibilityLabel={isPlaying ? 'Pause' : 'Lecture'}>
        <MaterialCommunityIcons name={isPlaying ? 'pause' : 'play'} size={22} color="#fff" />
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <Text style={styles.time}>{mmss(position)} / {mmss(duration)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10, backgroundColor: '#fff' },
  playBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  title: { color: colors.text, fontWeight: '600' },
  time: { color: colors.mutedText, marginTop: 2 },
});
