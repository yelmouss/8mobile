import React, { useEffect, useState, useCallback } from "react";
import CreateAnnouncementModal from "../components/annonces/CreateAnnouncementModal";
import ImageWithLoader from "./ImageWithLoader";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Image,
  Alert,
  RefreshControl,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "../theme/theme";
import { apiFetch, uploadImageFile } from "../api/client";
import Constants from "expo-constants";
import { useAuth } from "../context/AuthContext";
import { styles } from "../theme/AdsScreenStyles";

const CATEGORIES = [
  { value: "", label: "Toutes" },
  { value: "Services", label: "Services" },
  { value: "Emploi", label: "Emploi" },
  { value: "Immobilier", label: "Immobilier" },
  { value: "Événements", label: "Événements" },
  { value: "Ventes", label: "Ventes" },
  { value: "Formation", label: "Formation" },
  { value: "Partenariats", label: "Partenariats" },
  { value: "Autres", label: "Autres" },
];

const ANNOUNCEMENTS_PER_PAGE = 10;

export default function AdsScreen() {
  const [announcements, setAnnouncements] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [tab, setTab] = useState(0); // 0: toutes, 1: mes annonces
  const [createMode, setCreateMode] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [detail, setDetail] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const { user } = useAuth();
  const userId = user?._id || user?.id || null;
  const [deleting, setDeleting] = useState(false);

  // Simule l'utilisateur connecté (à remplacer par ton contexte auth)
  // useEffect inutile : userId est déjà dérivé du contexte d'authentification

  // Récupère les annonces
  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      let url = "/api/annonces";
      if (tab === 1) url += "?user=current";
      const data = await apiFetch(url);
      if (data.success) {
        setAnnouncements(data.announcements || []);
      } else {
        Alert.alert("Erreur", data.message || "Erreur de chargement");
        setAnnouncements([]);
      }
    } catch (e) {
      Alert.alert("Erreur", e.message || "Impossible de charger les annonces");
      setAnnouncements([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tab]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  // Filtrage local
  useEffect(() => {
    let result = [...announcements];
    if (search) {
      const term = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(term) ||
          a.description.toLowerCase().includes(term)
      );
    }
    if (category) {
      result = result.filter((a) => a.category === category);
    }
    if (location) {
      const loc = location.toLowerCase();
      result = result.filter(
        (a) => a.location && a.location.toLowerCase().includes(loc)
      );
    }
    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    setFiltered(result);
    setTotalPages(
      Math.max(1, Math.ceil(result.length / ANNOUNCEMENTS_PER_PAGE))
    );
    setPage(1);
  }, [announcements, search, category, location]);

  // Pagination
  const getPageData = () => {
    const start = (page - 1) * ANNOUNCEMENTS_PER_PAGE;
    return filtered.slice(start, start + ANNOUNCEMENTS_PER_PAGE);
  };

  // Vue détail
  const openDetail = (item) => {
    setDetail(item);
    setDetailVisible(true);
  };
  const closeDetail = () => {
    setDetailVisible(false);
    setDetail(null);
    setEditMode(false);
  };

  // Edition avancée avec gestion images
  const [editMode, setEditMode] = useState(false);
  const [editFields, setEditFields] = useState({});
  const [editImages, setEditImages] = useState([]); // fichiers ajoutés
  const [editImagesToDelete, setEditImagesToDelete] = useState([]); // urls à supprimer
  const [saving, setSaving] = useState(false);
  const openEdit = () => {
    if (!detail) return;
    setEditFields({
      title: detail.title,
      description: detail.description,
      category: detail.category,
      location: detail.location,
      contactEmail: detail.contactInfo?.email || "",
      contactPhone: detail.contactInfo?.phone || "",
    });
    setEditImages([]);
    setEditImagesToDelete([]);
    setEditMode(true);
  };
  const closeEdit = () => {
    setEditMode(false);
  };
  const handleEditField = (field, value) => {
    setEditFields((prev) => ({ ...prev, [field]: value }));
  };
  // Supprimer une image existante (url)
  const handleRemoveExistingImage = (url) => {
    setEditImagesToDelete((prev) => [...prev, url]);
  };
  // Ajouter une nouvelle image (file)
  const handleAddImage = async () => {
    let ImagePicker;
    try {
      ImagePicker = await import("expo-image-picker");
    } catch {
      Alert.alert(
        "ImagePicker manquant",
        "Ajoute expo-image-picker à ton projet"
      );
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!(perm.status === "granted" || perm.granted)) {
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
      // Si la sélection multiple n'est pas supportée, certains environnements renvoient une structure inattendue
      if (
        !result ||
        typeof result.canceled !== "boolean" ||
        !Array.isArray(result.assets)
      ) {
        throw new Error("Sélection multiple non supportée");
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
    setEditImages((prev) => [...prev, ...result.assets]);
    if (usedFallback || result.assets.length === 1) {
      Alert.alert(
        "Ajout d'image",
        "Votre appareil ne supporte pas la sélection multiple. Vous pouvez ajouter plusieurs images une par une."
      );
    }
  };
  // Supprimer une image ajoutée
  const handleRemoveNewImage = (uri) => {
    setEditImages((prev) => prev.filter((img) => img.uri !== uri));
  };
  const saveEdit = async () => {
    if (!detail) return;
    setSaving(true);
    try {
      // 1. Upload des nouvelles images locales via /api/upload
      let uploadedImages = [];
      for (const img of editImages) {
        if (img && img.uri && img.uri.startsWith("file://")) {
          // Vérification de la taille de l'image (max 10 Mo)
          if (img.fileSize && img.fileSize > 10 * 1024 * 1024) {
            Alert.alert(
              "Image trop lourde",
              `L'image ${img.fileName || img.uri} dépasse 10 Mo.`
            );
            setSaving(false);
            return;
          }
          let name =
            img.fileName ||
            img.uri.split("/").pop() ||
            `photo_${Date.now()}.jpg`;
          let type =
            img.type && img.type.startsWith("image/")
              ? img.type
              : name.endsWith(".png")
              ? "image/png"
              : "image/jpeg";
          try {
            const up = await uploadImageFile({ uri: img.uri, name, type });
            const imageUrl =
              up?.fileUrl || up?.dockerFileUrl || up?.url || up?.imageUrl;
            if (imageUrl) {
              uploadedImages.push({ url: imageUrl, alt: editFields.title });
            } else {
              Alert.alert("Erreur upload", `Aucune URL retournée pour ${name}`);
              setSaving(false);
              return;
            }
          } catch (e) {
            console.log("Erreur upload image", img.uri, e);
            Alert.alert(
              "Erreur upload",
              `Impossible d'uploader ${name} : ${e.message || e}`
            );
            setSaving(false);
            return;
          }
        } else if (img && img.url) {
          // Image déjà uploadée (édition)
          uploadedImages.push({ url: img.url, alt: editFields.title });
        }
      }
      // 2. Supprimer les images marquées à supprimer
      let finalImages = [];
      if (detail.images && Array.isArray(detail.images)) {
        finalImages = detail.images.filter(
          (img) => !editImagesToDelete.includes(img.url)
        );
      }
      // 3. Ajouter les nouvelles images uploadées
      finalImages = [...finalImages, ...uploadedImages];

      // 4. Construire le FormData avec images[][url] et images[][alt]
      const formData = new FormData();
      formData.append("title", editFields.title || "");
      formData.append("description", editFields.description || "");
      formData.append("category", editFields.category || "");
      formData.append("location", editFields.location || "");
      formData.append("contactEmail", editFields.contactEmail || "");
      formData.append("contactPhone", editFields.contactPhone || "");
      // Ajoute chaque image comme images[][url] et images[][alt]
      for (const img of finalImages) {
        if (img && img.url) {
          formData.append("images[][url]", img.url);
          formData.append("images[][alt]", img.alt || editFields.title || "");
        }
      }
      // LOG: Affiche le FormData (debug)
      if (__DEV__) {
        const debugObj = {};
        formData._parts?.forEach?.(([k, v]) => {
          if (!debugObj[k]) debugObj[k] = [];
          debugObj[k].push(v);
        });
        console.log("FormData PUT annonce:", JSON.stringify(debugObj, null, 2));
      }
      await apiFetch(`/api/annonces/${detail._id}`, {
        method: "PUT",
        body: formData,
        headers: {
          // Ne pas définir Content-Type, laisser fetch le faire
        },
      });
      Alert.alert("Succès", "Annonce modifiée");
      setEditMode(false);
      fetchAnnouncements();
      closeDetail();
    } catch (e) {
      console.log("Erreur saveEdit:", e);
      Alert.alert("Erreur", e.message || "Modification impossible");
    } finally {
      setSaving(false);
    }
  };

  // Suppression
  const deleteAnnouncement = async (id) => {
    setDeleting(true);
    try {
      const data = await apiFetch(`/api/annonces/${id}`, { method: "DELETE" });
      if (data.success) {
        setAnnouncements((prev) => prev.filter((a) => a._id !== id));
        Alert.alert("Succès", "Annonce supprimée");
        closeDetail();
      } else {
        Alert.alert("Erreur", data.message || "Suppression impossible");
      }
    } catch (e) {
      Alert.alert("Erreur", e.message || "Suppression impossible");
    } finally {
      setDeleting(false);
    }
  };

  // UI
  return (
    <>
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          {/* Header + Tabs */}
          <View style={styles.header}>
            <Text style={styles.title}>Annonces</Text>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => setCreateMode(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.addBtnText}>
                Nouvelle annonce
              </Text>
            </TouchableOpacity>
            <View style={styles.tabs}>
              <TouchableOpacity
                style={[
                  styles.tab,
                  tab === 0 && styles.tabActive,
                ]}
                onPress={() => setTab(0)}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.tabText,
                  tab === 0 && styles.tabTextActive,
                ]}>
                  Toutes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tab,
                  tab === 1 && styles.tabActive,
                ]}
                onPress={() => setTab(1)}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.tabText,
                  tab === 1 && styles.tabTextActive,
                ]}>
                  Mes annonces
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Filtres */}
          <View style={styles.filters}>
            <TextInput
              style={styles.input}
              placeholder="Recherche..."
              value={search}
              onChangeText={setSearch}
              placeholderTextColor={colors.mutedText}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  style={[
                    styles.chip,
                    category === cat.value && styles.chipActive,
                  ]}
                  onPress={() => setCategory(cat.value)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      category === cat.value && styles.chipTextActive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TextInput
              style={styles.input}
              placeholder="Lieu..."
              value={location}
              onChangeText={setLocation}
              placeholderTextColor={colors.mutedText}
            />
          </View>

          {/* Liste annonces */}
          {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : filtered.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Aucune annonce</Text>
            </View>
          ) : (
            <FlatList
              data={getPageData()}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.card}
                  onPress={() => openDetail(item)}
                >
                  {item.images && item.images.length > 0 ? (
                    <Image
                      source={{
                        uri: item.images[0].url?.startsWith("http")
                          ? item.images[0].url
                          : `${Constants.expoConfig.extra.NEXT_BASE_URL}${item.images[0].url}`,
                      }}
                      style={styles.cardImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.noImage}>
                      <Text style={styles.noImageText}>Pas d'image</Text>
                    </View>
                  )}
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.cardCategory}>{item.category}</Text>
                    <Text style={styles.cardDesc} numberOfLines={2}>
                      {item.description}
                    </Text>
                    <Text style={styles.cardLocation}>
                      {item.location || "Lieu non précisé"}
                    </Text>
                    <Text style={styles.cardDate}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => {
                    setRefreshing(true);
                    fetchAnnouncements();
                  }}
                />
              }
              ListFooterComponent={
                totalPages > 1 ? (
                  <View style={styles.pagination}>
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <TouchableOpacity
                        key={i}
                        style={[
                          styles.pageDot,
                          page === i + 1 && styles.pageDotActive,
                        ]}
                        onPress={() => setPage(i + 1)}
                      />
                    ))}
                  </View>
                ) : null
              }
            />
          )}

          {/* Modal détail */}
          <Modal
            visible={detailVisible}
            animationType="slide"
            onRequestClose={closeDetail}
          >
            {detail && (
              <SafeAreaView style={styles.modalSafe}>
                <ScrollView contentContainerStyle={styles.modalContent}>
                  <Text style={styles.modalTitle}>{detail.title}</Text>
                  {detail.images && detail.images.length > 0 ? (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={{ marginBottom: 16 }}
                    >
                      {detail.images.map((img, idx) => (
                        <ImageWithLoader
                          key={img.url + idx}
                          uri={
                            img.url?.startsWith("http")
                              ? img.url
                              : `${Constants.expoConfig.extra.NEXT_BASE_URL}${img.url}`
                          }
                          style={styles.modalImageCarousel}
                        />
                      ))}
                    </ScrollView>
                  ) : (
                    <View style={styles.noImage}>
                      <Text style={styles.noImageText}>Pas d'image</Text>
                    </View>
                  )}

                  <Text style={styles.modalDesc}>{detail.description}</Text>
                  <Text style={styles.modalLabel}>
                    Catégorie :{" "}
                    <Text style={styles.modalValue}>{detail.category}</Text>
                  </Text>
                  <Text style={styles.modalLabel}>
                    Lieu :{" "}
                    <Text style={styles.modalValue}>
                      {detail.location || "Non précisé"}
                    </Text>
                  </Text>
                  <Text style={styles.modalLabel}>
                    Publié le :{" "}
                    <Text style={styles.modalValue}>
                      {new Date(detail.createdAt).toLocaleDateString()}
                    </Text>
                  </Text>
                  <Text style={styles.modalLabel}>Contact :</Text>
                  {detail.contactInfo?.email && (
                    <Text style={styles.modalValue}>
                      Email : {detail.contactInfo.email}
                    </Text>
                  )}
                  {detail.contactInfo?.phone && (
                    <Text style={styles.modalValue}>
                      Téléphone : {detail.contactInfo.phone}
                    </Text>
                  )}
                  <View style={styles.modalActions}>
                    {/* TODO: voir la carte associée */}
                    {/* Bouton éditer si propriétaire */}
                    {((userId &&
                      (detail.user === userId ||
                        detail.user?._id === userId)) ||
                      tab === 1) && (
                      <>
                        <TouchableOpacity
                          style={styles.editBtn}
                          onPress={openEdit}
                          disabled={deleting}
                        >
                          <Text style={styles.editBtnText}>Modifier</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.deleteBtn}
                          onPress={() => deleteAnnouncement(detail._id)}
                          disabled={deleting}
                        >
                          <Text style={styles.deleteBtnText}>
                            {deleting ? "Suppression..." : "Supprimer"}
                          </Text>
                        </TouchableOpacity>
                      </>
                    )}
                    {/* Modal édition */}
                    <Modal
                      visible={editMode}
                      animationType="slide"
                      onRequestClose={closeEdit}
                    >
                      <SafeAreaView style={styles.modalSafe}>
                        <ScrollView contentContainerStyle={styles.modalContent}>
                          <Text style={styles.modalTitle}>
                            Modifier l'annonce
                          </Text>
                          <TextInput
                            style={styles.input}
                            placeholder="Titre"
                            value={editFields.title}
                            onChangeText={(v) => handleEditField("title", v)}
                          />
                          <TextInput
                            style={styles.input}
                            placeholder="Description"
                            value={editFields.description}
                            onChangeText={(v) =>
                              handleEditField("description", v)
                            }
                            multiline
                            numberOfLines={4}
                          />
                          <TextInput
                            style={styles.input}
                            placeholder="Catégorie"
                            value={editFields.category}
                            onChangeText={(v) => handleEditField("category", v)}
                          />
                          <TextInput
                            style={styles.input}
                            placeholder="Lieu"
                            value={editFields.location}
                            onChangeText={(v) => handleEditField("location", v)}
                          />
                          <TextInput
                            style={styles.input}
                            placeholder="Email de contact"
                            value={editFields.contactEmail}
                            onChangeText={(v) =>
                              handleEditField("contactEmail", v)
                            }
                          />
                          <TextInput
                            style={styles.input}
                            placeholder="Téléphone de contact"
                            value={editFields.contactPhone}
                            onChangeText={(v) =>
                              handleEditField("contactPhone", v)
                            }
                          />
                          {/* Images existantes (suppression) */}
                          {detail.images && detail.images.length > 0 && (
                            <ScrollView
                              horizontal
                              showsHorizontalScrollIndicator={false}
                              style={{ marginBottom: 12 }}
                            >
                              {detail.images.map((img, idx) =>
                                editImagesToDelete.includes(img.url) ? null : (
                                  <View
                                    key={img.url + idx}
                                    style={{ marginRight: 10 }}
                                  >
                                    <Image
                                      source={{
                                        uri: img.url?.startsWith("http")
                                          ? img.url
                                          : `${Constants.expoConfig.extra.NEXT_BASE_URL}${img.url}`,
                                      }}
                                      style={{
                                        width: 80,
                                        height: 80,
                                        borderRadius: 8,
                                        marginBottom: 4,
                                      }}
                                      resizeMode="cover"
                                    />
                                    <TouchableOpacity
                                      onPress={() =>
                                        handleRemoveExistingImage(img.url)
                                      }
                                    >
                                      <Text
                                        style={{
                                          color: "red",
                                          fontSize: 12,
                                          textAlign: "center",
                                        }}
                                      >
                                        Supprimer
                                      </Text>
                                    </TouchableOpacity>
                                  </View>
                                )
                              )}
                            </ScrollView>
                          )}
                          {/* Nouvelles images ajoutées */}
                          {editImages.length > 0 && (
                            <ScrollView
                              horizontal
                              showsHorizontalScrollIndicator={false}
                              style={{ marginBottom: 12 }}
                            >
                              {editImages.map((img, idx) => (
                                <View
                                  key={img.uri + idx}
                                  style={{ marginRight: 10 }}
                                >
                                  <Image
                                    source={{ uri: img.uri }}
                                    style={{
                                      width: 80,
                                      height: 80,
                                      borderRadius: 8,
                                      marginBottom: 4,
                                    }}
                                    resizeMode="cover"
                                  />
                                  <TouchableOpacity
                                    onPress={() =>
                                      handleRemoveNewImage(img.uri)
                                    }
                                  >
                                    <Text
                                      style={{
                                        color: "red",
                                        fontSize: 12,
                                        textAlign: "center",
                                      }}
                                    >
                                      Supprimer
                                    </Text>
                                  </TouchableOpacity>
                                </View>
                              ))}
                            </ScrollView>
                          )}
                          <TouchableOpacity
                            style={[
                              styles.chip,
                              { alignSelf: "flex-start", marginBottom: 12 },
                            ]}
                            onPress={handleAddImage}
                          >
                            <Text
                              style={{
                                color: colors.primary,
                                fontWeight: "700",
                              }}
                            >
                              Ajouter des images
                            </Text>
                          </TouchableOpacity>
                          <View style={styles.modalActions}>
                            <TouchableOpacity
                              style={styles.deleteBtn}
                              onPress={saveEdit}
                              disabled={saving}
                            >
                              <Text style={styles.deleteBtnText}>
                                {saving ? "Enregistrement..." : "Enregistrer"}
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.closeBtn}
                              onPress={closeEdit}
                            >
                              <Text style={styles.closeBtnText}>Annuler</Text>
                            </TouchableOpacity>
                          </View>
                        </ScrollView>
                      </SafeAreaView>
                    </Modal>

                    <TouchableOpacity
                      style={styles.closeBtn}
                      onPress={closeDetail}
                    >
                      <Text style={styles.closeBtnText}>Fermer</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </SafeAreaView>
            )}
          </Modal>
        </View>
      </SafeAreaView>

      <CreateAnnouncementModal
        visible={createMode}
        onClose={() => setCreateMode(false)}
        onCreated={() => {
          setCreateMode(false);
          fetchAnnouncements();
        }}
      />
    </>
  );
}
