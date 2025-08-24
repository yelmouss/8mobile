import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  Linking,
  ScrollView,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { colors, spacing } from "../theme/theme";
import Constants from "expo-constants";

// / Resolve Next base URL from Expo config (supports string or {development,production})
const NEXT_EXTRA = Constants?.expoConfig?.extra?.NEXT_BASE_URL;
let NEXT_BASE_URL =
  (typeof NEXT_EXTRA === "string"
    ? NEXT_EXTRA
    : NEXT_EXTRA?.production || NEXT_EXTRA?.development) ||
  "http://localhost:3000";

export default function LoginPrompt({ onStartOAuth }) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>
          Bienvenue sur <Text style={styles.brand}>8cartes</Text>
        </Text>
        <View style={styles.logoWrap}>
          <Image
            source={require("../../assets/Logo8.png")}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="Logo 8mobile"
          />
        </View>

        <Text style={styles.subtitle}>
          La carte de visite nouvelle génération
        </Text>
        <Pressable
          style={styles.googleBtn}
          onPress={onStartOAuth}
          accessibilityLabel="Connexion Google"
        >
          <MaterialCommunityIcons
            name="google"
            size={24}
            color="#fff"
            style={{ marginRight: 10 }}
          />
          <Text style={styles.googleBtnText}>Se connecter avec Google</Text>
        </Pressable>
        <Text style={styles.blabla}>
          Créez, partagez et gérez vos cartes de visite digitales, annonces,
          contacts et bien plus encore. Rejoignez la communauté 8mobile et
          boostez votre réseau professionnel et personnel en toute simplicité.
        </Text>
        <View style={styles.infoRow}>
          <Pressable
            style={styles.infoBtn}
            onPress={() => Linking.openURL(`${NEXT_BASE_URL}/cgu`)}
          >
            <MaterialCommunityIcons
              name="file-document-outline"
              size={18}
              color={colors.primary}
            />
            <Text style={styles.infoBtnText}>CGU</Text>
          </Pressable>
          <Pressable
            style={styles.infoBtn}
            onPress={() => Linking.openURL(`${NEXT_BASE_URL}/mentions-legales`)}
          >
            <MaterialCommunityIcons
              name="information-outline"
              size={18}
              color={colors.primary}
            />
            <Text style={styles.infoBtnText}>Mentions légales</Text>
          </Pressable>
        </View>
      </ScrollView>
      <Text style={styles.footnote}>
        © {new Date().getFullYear()} 8cartes. Tous droits réservés.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    backgroundColor: colors.background,
    minHeight: "100vh",
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    // backgroundColor: colors.surface,
    marginTop: "auto",
  },
  scrollContent: {
    display: "flex",
    flexDirection: "column",
    minHeight: "100%",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    paddingTop: '50%',
    // backgroundColor: colors.surface,
  },
  logoWrap: {
    backgroundColor: colors.primary,
    borderRadius: 32,
    padding: 18,
    marginBottom: spacing.lg,
    elevation: 14,
    shadowColor: colors.primary,
    shadowOpacity: 0.1,
    shadowRadius: 16,
  },
  logo: {
    width: 110,
    height: 110,
  },
  title: {
    fontSize: 48,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 2,
    textAlign: "center",
    letterSpacing: 0.2,
    paddingBottom: spacing.md,
  },
  brand: {
    color: colors.primary,
    fontWeight: "900",
    fontSize: 48,
  },
  subtitle: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: "700",
    marginBottom: spacing.md,
    textAlign: "center",
    letterSpacing: 0.1,
  },
  blabla: {
    color: colors.text,
    fontSize: 15,
    textAlign: "center",
    marginBottom: spacing.lg,
    lineHeight: 22,
    fontWeight: "500",
    marginTop:'auto'
  },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginBottom: spacing.lg,
    elevation: 2,
    shadowColor: colors.primary,
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  googleBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 17,
    letterSpacing: 0.3,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 18,
    marginBottom: spacing.md,
  },
  infoBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoBtnText: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 14,
    marginLeft: 6,
  },
  footnote: {
    color: colors.mutedText,
    fontSize: 12,
    textAlign: "center",
    marginTop: "auto",
    marginBottom: spacing.md,
  },
});
