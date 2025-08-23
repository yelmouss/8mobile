import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ScrollView,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "../theme/theme";
import AccountHeader from "../components/settings/AccountHeader";
import AccountSection from "../components/settings/AccountSection";
import useAutoRefreshUser from "../hooks/useAutoRefreshUser";
import Avatar from "../components/Avatar";
import * as ImagePicker from "expo-image-picker";
import { uploadImageFile, apiFetch } from "../api/client";
import OrganigramScreen from "./account/OrganigramScreen";
import SettingsTabs from "../components/settings/SettingsTabs";
import UserTypeSelector from "../components/settings/UserTypeSelector";
import CommonInfoForm from "../components/settings/CommonInfoForm";
import TypeSpecificForm from "../components/settings/TypeSpecificForm";

export default function SettingsScreen() {
  const { logout, user, deleteAccount, refreshUser } = useAuth();
  useAutoRefreshUser();
  const [organigramOpen, setOrganigramOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tab, setTab] = useState('profile'); // profile | userType | specific

  const pickAndUploadAvatar = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== "granted") {
        Alert.alert("Photos", "Permission refusée pour accéder à la galerie.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
         mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset?.uri) return;
      setUploading(true);
      const name = asset.fileName || `avatar_${Date.now()}.jpg`;
      const file = {
        uri: asset.uri,
        name,
        type: asset.mimeType || "image/jpeg",
      };
      const up = await uploadImageFile(file);
      const imageUrl =
        up?.fileUrl || up?.dockerFileUrl || up?.url || up?.imageUrl;
      if (!imageUrl) throw new Error("Upload échoué: URL manquante");
      await apiFetch("/api/user/profile", {
        method: "PUT",
        body: JSON.stringify({ profile: { image: imageUrl } }),
      });
      await refreshUser();
    } catch (e) {
      Alert.alert(
        "Photo de profil",
        e?.message || "Impossible de mettre à jour la photo"
      );
    } finally {
      setUploading(false);
    }
  };
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <AccountHeader
          title="Paramètres"
          subtitle={user ? `Bienvenue ${user.name || ""}`.trim() : undefined}
        />

        <SettingsTabs
          tabs={[
            { key: 'profile', label: 'Profil', icon: 'account' },
            { key: 'userType', label: "Type d'utilisateur", icon: 'account-switch' },
            { key: 'specific', label: 'Spécifique', icon: 'tune' },
          ]}
          value={tab}
          onChange={setTab}
        />

        {tab === 'profile' && (
          <>
            {/* Avatar preview + change */}
            <View style={styles.avatarWrap}>
              <Pressable
                onPress={uploading ? undefined : pickAndUploadAvatar}
                accessibilityLabel="Changer la photo de profil"
              >
                <View>
                  <Avatar uri={user?.image} name={user?.name} size={96} />
                  {uploading ? (
                    <View style={styles.avatarOverlay}>
                      <ActivityIndicator size={24} color="#fff" />
                    </View>
                  ) : (
                    <View style={styles.editBadge}>
                      <Text style={styles.editBadgeText}>Modifier</Text>
                    </View>
                  )}
                </View>
              </Pressable>
              <Text style={styles.avatarHint}>
                Touchez pour changer votre photo
              </Text>
            </View>

            <AccountSection title="Compte">
              <Text style={styles.row}>
                Nom: <Text style={styles.value}>{user?.name || "-"}</Text>
              </Text>
              <Text style={styles.row}>
                Email: <Text style={styles.value}>{user?.email || "-"}</Text>
              </Text>
            </AccountSection>

            <CommonInfoForm user={user} onSaved={refreshUser} />
          </>
        )}

        {tab === 'userType' && (
          <UserTypeSelector user={user} onSaved={refreshUser} />
        )}

        {tab === 'specific' && (
          <TypeSpecificForm user={user} onSaved={refreshUser} />
        )}

        <AccountSection>
          <Pressable
            style={[styles.btn, styles.btnDanger]}
            onPress={logout}
            accessibilityLabel="Déconnexion"
          >
            <Text style={styles.btnDangerText}>Déconnexion</Text>
          </Pressable>
        </AccountSection>

  {/* Organisation features (organigram) */}
  {user?.userType === "ETABLISSEMENT" || user?.userType === "SCHOOL" ? (
          <AccountSection title="Organisation">
            <Pressable
              style={[styles.btn]}
              onPress={() => setOrganigramOpen(true)}
              accessibilityLabel="Voir l'organigramme"
            >
              <Text style={styles.linkText}>
                Organigramme de l'organisation
              </Text>
            </Pressable>
          </AccountSection>
        ) : null}

        {/* Delete account */}
        <AccountSection title="Sécurité">
          <Pressable
            style={[styles.btn, styles.btnDelete]}
            onPress={() => {
              Alert.alert(
                "Supprimer le compte",
                "Cette action est irréversible. Confirmez-vous la suppression ? ",
                [
                  { text: "Annuler", style: "cancel" },
                  {
                    text: "Supprimer",
                    style: "destructive",
                    onPress: async () => {
                      try {
                        await deleteAccount();
                      } catch (e) {
                        Alert.alert(
                          "Suppression",
                          e?.message || "Échec de la suppression"
                        );
                      }
                    },
                  },
                ]
              );
            }}
            accessibilityLabel="Supprimer mon compte"
          >
            <Text style={styles.btnDeleteText}>Supprimer mon compte</Text>
          </Pressable>
        </AccountSection>
      </ScrollView>

      {/* Organigram Modal */}
      <Modal visible={organigramOpen} animationType="slide">
        <OrganigramScreen
          navigation={{ goBack: () => setOrganigramOpen(false) }}
        />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { paddingBottom: spacing.lg, paddingHorizontal: spacing.md },
  avatarWrap: {
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  avatarOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
  },
  editBadge: {
    position: "absolute",
    bottom: -6,
    right: -6,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "#fff",
  },
  editBadgeText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  avatarHint: { marginTop: 8, color: colors.mutedText, fontSize: 12 },
  row: { marginTop: 6, color: colors.text },
  value: { fontWeight: "600" },
  btn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#fff",
  },
  btnDanger: { borderColor: "#ef9a9a", backgroundColor: "#ffebee" },
  btnDangerText: { color: "#b00020", fontWeight: "700" },
  linkText: { color: colors.primary, fontWeight: "700" },
});
