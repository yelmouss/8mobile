import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Button,
  Linking,
  Pressable,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import Avatar from "../components/Avatar";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { colors, spacing } from "../theme/theme";
import { SafeAreaView } from 'react-native-safe-area-context';
// navigation prop will be provided when rendered inside React Navigation



export default function HomeScreen({ onStartOAuth, navigation }) {
  const { user, token, logout } = useAuth();



  if (!token) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.title}>Bienvenue sur 8mobile</Text>
        <Text style={styles.hint}>
          Connectez-vous pour voir votre profil et vos cartes
        </Text>
        <View style={{ height: 12 }} />
        <Button title="Se connecter avec Google"   onPress={onStartOAuth} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.header}>
        <Avatar uri={user?.image} name={user?.name} size={72} />
        <View style={{ marginLeft: spacing.md, flex: 1 }}>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>
        <Pressable
          onPress={logout}
          accessibilityLabel="Déconnexion"
          hitSlop={8}
          style={styles.iconButton}
        >
          <MaterialCommunityIcons
            name="power"
            size={26}
            color={colors.primaryDark}
          />
        </Pressable>
      </View>

      {Boolean(user?.socialMedia) && (
        <View style={styles.socialRow}>
          {renderSocialIcon(
            "facebook",
            user?.socialMedia?.facebook,
            "facebook"
          )}
          {renderSocialIcon("twitter", user?.socialMedia?.twitter, "twitter")}
          {renderSocialIcon(
            "linkedin",
            user?.socialMedia?.linkedin,
            "linkedin"
          )}
          {renderSocialIcon(
            "instagram",
            user?.socialMedia?.instagram,
            "instagram"
          )}
          {renderSocialIcon("youtube", user?.socialMedia?.youtube, "youtube")}
          {renderSocialIcon("tiktok", user?.socialMedia?.tiktok, "tiktok")}
          {renderSocialIcon("github", user?.socialMedia?.github, "github")}
          {renderSocialIcon(
            "whatsapp",
            user?.socialMedia?.whatsapp,
            "whatsapp"
          )}
          {renderSocialIcon(
            "telegram",
            user?.socialMedia?.telegram,
            "telegram"
          )}
        </View>
      )}

      <View style={{ height: spacing.md }} />
      <Button
        title="Voir mes cartes"
        color={colors.primary}
        onPress={() => navigation && navigation.navigate("Cards")}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
  },
  title: { fontSize: 22, fontWeight: "700", color: colors.text },
  hint: { color: colors.mutedText, marginTop: spacing.sm },
  page: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  header: {
    flexDirection: "row",
    alignItems: "center",
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },
  name: { fontSize: 18, fontWeight: "700", color: colors.text },
  email: { color: colors.mutedText },
  empty: {
    textAlign: "center",
    color: colors.mutedText,
    marginTop: spacing.lg,
  },
  socialRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingVertical: spacing.sm,
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
  },
});

function renderSocialIcon(key, url, iconName) {
  if (!url) return null;
  const open = () => Linking.openURL(url).catch(() => {});
  return (
    <Pressable key={key} onPress={open} style={{ marginRight: 10 }}>
      <MaterialCommunityIcons
        name={iconName}
        size={26}
        color={colors.primaryDark}
      />
    </Pressable>
  );
}
