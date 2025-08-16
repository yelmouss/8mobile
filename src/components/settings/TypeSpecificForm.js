import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { colors, spacing } from '../../theme/theme';
import { apiFetch } from '../../api/client';

export default function TypeSpecificForm({ user, onSaved }) {
  const userType = user?.userType;
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  // Initialize based on current user section
  useEffect(() => {
    switch (userType) {
      case 'ETABLISSEMENT':
      case 'SCHOOL':
        setForm(user?.organisation || {});
        break;
      case 'PROFESSIONNEL':
      case 'PROFESSION_LIBERALE':
        setForm(user?.professional || {});
        break;
      case 'STUDENT':
        setForm(user?.education || {});
        break;
      case 'ANIMAL_DE_COMPAGNIE':
        setForm(user?.animal || {});
        break;
      case 'PARTICULIER':
        setForm(user?.particulier || {});
        break;
      default:
        setForm({});
    }
  }, [userType, user]);

  const fields = useMemo(() => {
    switch (userType) {
      case 'ETABLISSEMENT':
      case 'SCHOOL':
        return [
          { key: 'raisonSociale', label: "Raison sociale" },
          { key: 'secteur', label: 'Secteur' },
          { key: 'siteWeb', label: 'Site web' },
          { key: 'description', label: 'Description' },
        ];
      case 'PROFESSIONNEL':
      case 'PROFESSION_LIBERALE':
        return [
          { key: 'titre', label: 'Titre' },
          { key: 'categorie', label: 'Catégorie' },
          { key: 'secteurActivite', label: "Secteur d'activité" },
          { key: 'specialite', label: 'Spécialité' },
          { key: 'experience', label: "Années d'expérience" },
        ];
      case 'STUDENT':
        return [
          { key: 'niveau', label: 'Niveau' },
          { key: 'filiere', label: 'Filière' },
          { key: 'diplome', label: 'Diplôme' },
          { key: 'anneeDiplome', label: 'Année de diplôme' },
        ];
      case 'ANIMAL_DE_COMPAGNIE':
        return [
          { key: 'nom', label: 'Nom' },
          { key: 'race', label: 'Race' },
          { key: 'couleur', label: 'Couleur' },
        ];
      case 'PARTICULIER':
        return [
          { key: 'biographie', label: 'Biographie' },
          { key: 'loisirs', label: 'Loisirs (séparés par des virgules)' },
        ];
      default:
        return [];
    }
  }, [userType]);

  const onChange = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const onSave = async () => {
    try {
      setSaving(true);
      const body = { profile: {} };
      switch (userType) {
        case 'ETABLISSEMENT':
        case 'SCHOOL':
          body.profile.organisation = form;
          break;
        case 'PROFESSIONNEL':
        case 'PROFESSION_LIBERALE':
          body.profile.professional = form;
          break;
        case 'STUDENT':
          body.profile.education = form;
          break;
        case 'ANIMAL_DE_COMPAGNIE':
          body.profile.animal = form;
          break;
        case 'PARTICULIER':
          body.profile.particulier = form;
          break;
        default:
          break;
      }
      await apiFetch('/api/user/profile', { method: 'PUT', body: JSON.stringify(body) });
      onSaved?.();
    } catch (e) {
      alert(e?.message || 'Échec');
    } finally {
      setSaving(false);
    }
  };

  if (!userType) {
    return (
      <View style={styles.panel}><Text style={styles.title}>Choisissez d'abord un type d'utilisateur</Text></View>
    );
  }

  return (
    <View style={styles.panel}>
      <Text style={styles.title}>Informations spécifiques: {userType}</Text>
      {fields.map((f) => (
        <TextInput key={f.key} style={styles.input} placeholder={f.label} value={String(form?.[f.key] ?? '')} onChangeText={(v) => onChange(f.key, v)} />
      ))}
      <Pressable style={[styles.btn, saving && { opacity: 0.6 }]} onPress={saving ? undefined : onSave}>
        {saving ? <ActivityIndicator /> : <Text style={styles.btnText}>Enregistrer</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: colors.border, margin: spacing.md, padding: spacing.md },
  title: { fontWeight: '700', color: colors.text, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff', marginTop: 8 },
  btn: { marginTop: spacing.md, backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
});
