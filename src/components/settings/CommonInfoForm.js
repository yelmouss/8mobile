import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { colors, spacing } from '../../theme/theme';
import { apiFetch } from '../../api/client';

export default function CommonInfoForm({ user, onSaved }) {
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [postalCode, setPostalCode] = useState(user?.postalCode || '');
  const [city, setCity] = useState(user?.city || '');
  const [country, setCountry] = useState(user?.country || '');
  const [website, setWebsite] = useState(user?.website || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(user?.name || '');
    setPhone(user?.phone || '');
    setAddress(user?.address || '');
    setPostalCode(user?.postalCode || '');
    setCity(user?.city || '');
    setCountry(user?.country || '');
    setWebsite(user?.website || '');
  }, [user]);

  const onSave = async () => {
    try {
      setSaving(true);
      await apiFetch('/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify({ profile: { name, phone, address, postalCode, city, country, website } }),
      });
      onSaved?.();
    } catch (e) {
      alert(e?.message || 'Échec de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.panel}>
      <Text style={styles.title}>Informations communes</Text>
      <TextInput style={styles.input} placeholder="Nom complet" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Téléphone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <TextInput style={styles.input} placeholder="Adresse" value={address} onChangeText={setAddress} />
      <View style={styles.rowGap}>
        <TextInput style={[styles.input, { flex: 1, marginRight: 6 }]} placeholder="Code postal" value={postalCode} onChangeText={setPostalCode} />
        <TextInput style={[styles.input, { flex: 1, marginLeft: 6 }]} placeholder="Ville" value={city} onChangeText={setCity} />
      </View>
      <TextInput style={styles.input} placeholder="Pays" value={country} onChangeText={setCountry} />
      <TextInput style={styles.input} placeholder="Site web" value={website} onChangeText={setWebsite} autoCapitalize="none" />

      <Pressable style={[styles.btn, saving && { opacity: 0.6 }]} onPress={saving ? undefined : onSave}>
        {saving ? <ActivityIndicator /> : <Text style={styles.btnText}>Enregistrer</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    margin: spacing.md,
    padding: spacing.md,
  },
  title: { fontWeight: '700', color: colors.text, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  rowGap: { flexDirection: 'row', marginTop: 8 },
  btn: { marginTop: spacing.md, backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
});
