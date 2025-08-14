import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Button, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme/theme';
import { createCard, updateCard, deleteCard } from '../api/client';

export default function CardFormScreen({ route, navigation }) {
  const existing = route?.params?.card;
  const [name, setName] = useState(existing?.name || '');
  const [matricule, setMatricule] = useState(existing?.matricule || '');
  const [recto, setRecto] = useState(existing?.layout?.background?.value || '');
  const [verso, setVerso] = useState(existing?.backLayout?.background?.value || '');
  const [bgType, setBgType] = useState(existing?.layout?.background?.type || 'image');
  const [busy, setBusy] = useState(false);

  const isEditing = !!existing?._id;

  const onSave = async () => {
    try {
      setBusy(true);
      if (isEditing) {
        await updateCard(existing._id, { name, matricule, recto, verso, backgroundType: bgType });
        Alert.alert('Enregistré', 'Carte mise à jour');
      } else {
        await createCard({ name, matricule, recto, verso, backgroundType: bgType });
        Alert.alert('Créée', 'Carte créée');
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('Erreur', e?.message || 'Échec');
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async () => {
    if (!isEditing) return;
    Alert.alert('Supprimer', 'Confirmer la suppression de cette carte ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        try { setBusy(true); await deleteCard(existing._id); navigation.goBack(); }
        catch (e) { Alert.alert('Erreur', e?.message || 'Échec'); }
        finally { setBusy(false); }
      }}
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{isEditing ? 'Modifier la carte' : 'Nouvelle carte'}</Text>
        <Text style={styles.label}>Nom</Text>
        <TextInput style={styles.input} placeholder="Ex: Carte pro" value={name} onChangeText={setName} />

        <Text style={styles.label}>Matricule</Text>
        <TextInput style={styles.input} placeholder="Ex: ABC123" value={matricule} onChangeText={setMatricule} />

        <Text style={styles.label}>Recto (image URL ou chemin)</Text>
        <TextInput style={styles.input} placeholder="/uploads/recto.png" value={recto} onChangeText={setRecto} />

        <Text style={styles.label}>Verso (image URL ou chemin)</Text>
        <TextInput style={styles.input} placeholder="/uploads/verso.png" value={verso} onChangeText={setVerso} />

        <View style={{ height: spacing.md }} />
        <Button title={busy ? 'Veuillez patienter...' : (isEditing ? 'Enregistrer' : 'Créer')} onPress={onSave} disabled={busy} />
        {isEditing ? (
          <View style={{ marginTop: spacing.sm }}>
            <Button title="Supprimer" color="#d9534f" onPress={onDelete} disabled={busy} />
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.md },
  title: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  label: { marginTop: spacing.sm, color: colors.mutedText },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, marginTop: 6, backgroundColor: '#fff' },
});
