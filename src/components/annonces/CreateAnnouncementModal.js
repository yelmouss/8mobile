import React, { useState, useEffect } from "react";
import { Modal, View, Text, TextInput, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { apiFetch, uploadImageFile } from "../../api/client";
import { styles } from "../../theme/AdsScreenStyles";

const CATEGORIES = [
  { value: "Services", label: "Services" },
  { value: "Emploi", label: "Emploi" },
  { value: "Immobilier", label: "Immobilier" },
  { value: "Événements", label: "Événements" },
  { value: "Ventes", label: "Ventes" },
  { value: "Formation", label: "Formation" },
  { value: "Partenariats", label: "Partenariats" },
  { value: "Autres", label: "Autres" },
];

export default function CreateAnnouncementModal({ visible, onClose, onCreated }) {
  const { user } = useAuth();
  const [cards, setCards] = useState([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [fields, setFields] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    card: '',
    contactEmail: '',
    contactPhone: '',
  });
  const [images, setImages] = useState([]);
  const [creating, setCreating] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!visible) return;
    setLoadingCards(true);
    apiFetch('/api/cartes?user=current')
      .then(data => {
        setCards(Array.isArray(data.cards) ? data.cards : []);
        if (data.cards && data.cards.length > 0) {
          setFields(f => ({ ...f, card: data.cards[0]._id }));
        }
      })
      .catch(() => setCards([]))
      .finally(() => setLoadingCards(false));
  }, [visible]);

  const handleField = (field, value) => {
    setFields(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleAddImage = async () => {
    let ImagePicker;
    try {
      ImagePicker = await import('expo-image-picker');
    } catch {
      Alert.alert("ImagePicker manquant", "Ajoute expo-image-picker à ton projet");
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!(perm.status === 'granted' || perm.granted)) {
      Alert.alert("Photos", "Permission refusée pour accéder à la galerie.");
      return;
    }
    let result;
    let usedFallback = false;
    try {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });
      if (!result || typeof result.canceled !== 'boolean' || !Array.isArray(result.assets)) {
        throw new Error('Sélection multiple non supportée');
      }
    } catch (e) {
      usedFallback = true;
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
    }
    if (!result || result.canceled) return;
    if (!result.assets || result.assets.length === 0) {
      Alert.alert("Aucune image sélectionnée");
      return;
    }
    if (images.length + result.assets.length > 5) {
      Alert.alert("Limite", "Maximum 5 images par annonce.");
      return;
    }
    setImages(prev => [...prev, ...result.assets]);
    if (usedFallback || result.assets.length === 1) {
      Alert.alert(
        "Ajout d'image",
        "Votre appareil ne supporte pas la sélection multiple. Vous pouvez ajouter plusieurs images une par une."
      );
    }
  };

  const handleRemoveImage = (uri) => {
    setImages(prev => prev.filter(img => img.uri !== uri));
  };

  const validate = () => {
    const errs = {};
    if (!fields.title.trim()) errs.title = 'Titre requis';
    if (!fields.description.trim()) errs.description = 'Description requise';
    if (!fields.category) errs.category = 'Catégorie requise';
    if (!fields.card) errs.card = 'Carte requise';
    if (fields.title.length > 100) errs.title = '100 caractères max';
    if (fields.description.length > 2000) errs.description = '2000 caractères max';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setCreating(true);
    try {
      // Upload images
      let uploadedImages = [];
      for (const img of images) {
        if (img && img.uri && img.uri.startsWith('file://')) {
          if (img.fileSize && img.fileSize > 10 * 1024 * 1024) {
            Alert.alert('Image trop lourde', `L'image ${img.fileName || img.uri} dépasse 10 Mo.`);
            setCreating(false);
            return;
          }
          let name = img.fileName || img.uri.split("/").pop() || `photo_${Date.now()}.jpg`;
          let type = (img.type && img.type.startsWith('image/')) ? img.type : (name.endsWith('.png') ? 'image/png' : 'image/jpeg');
          try {
            console.log('Uploading image', { uri: img.uri, name, type });
            const up = await uploadImageFile({ uri: img.uri, name, type });
            console.log('Upload response:', up);
            const imageUrl = up?.fileUrl || up?.dockerFileUrl || up?.url || up?.imageUrl;
            if (imageUrl) {
              uploadedImages.push({ url: imageUrl, alt: fields.title });
            } else {
              Alert.alert('Erreur upload', `Aucune URL retournée pour ${name}`);
              setCreating(false);
              return;
            }
          } catch (e) {
            console.log('Erreur upload image', img.uri, e);
            Alert.alert('Erreur upload', `Impossible d'uploader ${name} : ${e.message || e}`);
            setCreating(false);
            return;
          }
        } else {
          console.log('Image non locale ou format inattendu', img);
        }
      }
      if (uploadedImages.length !== images.length) {
        Alert.alert('Erreur', `Certaines images n'ont pas pu être uploadées (${uploadedImages.length}/${images.length})`);
        setCreating(false);
        return;
      }
      // Construire le FormData
      const formData = new FormData();
      formData.append('title', fields.title || '');
      formData.append('description', fields.description || '');
      formData.append('category', fields.category || '');
      formData.append('location', fields.location || '');
      formData.append('card', fields.card || '');
      formData.append('contactInfo', JSON.stringify({ email: fields.contactEmail, phone: fields.contactPhone }));
      for (const img of uploadedImages) {
        if (img && img.url) {
          formData.append('images[][url]', img.url);
          formData.append('images[][alt]', img.alt || fields.title || '');
        }
      }
      // Debug: afficher le contenu du FormData
      if (__DEV__ && formData._parts) {
        const debugObj = {};
        formData._parts.forEach(([k, v]) => { debugObj[k] = v; });
        console.log('FormData POST annonce:', JSON.stringify(debugObj, null, 2));
      }
      await apiFetch('/api/annonces', {
        method: 'POST',
        body: formData,
        headers: {},
      });
      Alert.alert('Succès', 'Annonce créée');
      setCreating(false);
      setFields({ title: '', description: '', category: '', location: '', card: cards[0]?._id || '', contactEmail: '', contactPhone: '' });
      setImages([]);
      onClose && onClose();
      onCreated && onCreated();
    } catch (e) {
      console.log('Erreur création annonce:', e);
      Alert.alert('Erreur', e.message || 'Création impossible');
      setCreating(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      transparent={false}
    >
      <View style={styles.modalSafe}>
        <ScrollView contentContainerStyle={styles.modalContent}>
          <Text style={styles.modalTitle}>Nouvelle annonce</Text>
          {loadingCards ? (
            <ActivityIndicator size="large" color="#007AFF" style={{ marginVertical: 32 }} />
          ) : cards.length === 0 ? (
            <Text style={{ color: 'red', marginBottom: 16 }}>Vous devez d'abord créer une carte pour publier une annonce.</Text>
          ) : (
            <>
              <TextInput
                style={[styles.input, errors.title && { borderColor: 'red' }]}
                placeholder="Titre de l'annonce"
                value={fields.title}
                onChangeText={v => handleField('title', v)}
                maxLength={100}
              />
              {errors.title ? <Text style={{ color: 'red', marginBottom: 4 }}>{errors.title}</Text> : null}
              <TextInput
                style={[styles.input, errors.description && { borderColor: 'red' }]}
                placeholder="Description"
                value={fields.description}
                onChangeText={v => handleField('description', v)}
                multiline
                numberOfLines={5}
                maxLength={2000}
              />
              {errors.description ? <Text style={{ color: 'red', marginBottom: 4 }}>{errors.description}</Text> : null}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat.value}
                    style={[styles.chip, fields.category === cat.value && styles.chipActive]}
                    onPress={() => handleField('category', cat.value)}
                  >
                    <Text style={[styles.chipText, fields.category === cat.value && styles.chipTextActive]}>{cat.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {errors.category ? <Text style={{ color: 'red', marginBottom: 4 }}>{errors.category}</Text> : null}
              <TextInput
                style={styles.input}
                placeholder="Lieu (ville, pays)"
                value={fields.location}
                onChangeText={v => handleField('location', v)}
              />
              <Text style={{ marginTop: 12, fontWeight: '600' }}>Carte associée *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                {cards.map(card => (
                  <TouchableOpacity
                    key={card._id}
                    style={{
                      padding: 10,
                      borderRadius: 8,
                      backgroundColor: fields.card === card._id ? '#007AFF' : '#eee',
                      marginRight: 8,
                    }}
                    onPress={() => handleField('card', card._id)}
                  >
                    <Text style={{ color: fields.card === card._id ? '#fff' : '#333', fontWeight: '600' }}>{card.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {errors.card ? <Text style={{ color: 'red', marginBottom: 4 }}>{errors.card}</Text> : null}
              <Text style={{ marginTop: 12, fontWeight: '600' }}>Contact</Text>
              <TextInput
                style={styles.input}
                placeholder="Email de contact"
                value={fields.contactEmail}
                onChangeText={v => handleField('contactEmail', v)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextInput
                style={styles.input}
                placeholder="Téléphone de contact"
                value={fields.contactPhone}
                onChangeText={v => handleField('contactPhone', v)}
                keyboardType="phone-pad"
              />
              <Text style={{ marginTop: 12, fontWeight: '600' }}>Images (max 5)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {images.map((img, idx) => (
                  <View key={img.uri + idx} style={{ marginRight: 10 }}>
                    <Image source={{ uri: img.uri }} style={{ width: 80, height: 80, borderRadius: 8, marginBottom: 4 }} resizeMode="cover" />
                    <TouchableOpacity onPress={() => handleRemoveImage(img.uri)}>
                      <Text style={{ color: 'red', fontSize: 12, textAlign: 'center' }}>Supprimer</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                {images.length < 5 && (
                  <TouchableOpacity
                    style={[styles.chip, { alignSelf: 'center', backgroundColor: '#f5f5f5' }]}
                    onPress={handleAddImage}
                  >
                    <Text style={{ color: '#007AFF', fontWeight: '700' }}>Ajouter</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.closeBtn} onPress={onClose} disabled={creating}>
                  <Text style={styles.closeBtnText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={handleCreate} disabled={creating}>
                  <Text style={styles.deleteBtnText}>{creating ? 'Création...' : 'Créer'}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}
