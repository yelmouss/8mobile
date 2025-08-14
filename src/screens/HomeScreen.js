import React, { useEffect, useState, useCallback } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";
import { getMyStats } from "../api/client";
import DonutChart from "../components/dashboard/DonutChart";
import StatTile from "../components/dashboard/StatTile";
// navigation prop will be provided when rendered inside React Navigation

export default function HomeScreen({ onStartOAuth, navigation }) {
  const { user, token, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const s = await getMyStats();
      setStats(s);
    } catch (e) {
      // silent
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);
  // When inside a navigator, refresh stats on focus; safe when rendered standalone
  useEffect(() => {
    if (!navigation || !navigation.addListener) return;
    const unsub = navigation.addListener('focus', () => {
      load();
    });
    return unsub;
  }, [navigation, load]);

  if (!token) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.title}>Bienvenue sur 8mobile</Text>
        <Text style={styles.hint}>
          Connectez-vous pour voir votre profil et vos cartes
        </Text>
        <View style={{ height: 12 }} />
        <Button title="Se connecter avec Google" onPress={onStartOAuth} />
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
      <Button
        title="Voir mes cartes"
        style={styles.showCardsButton}
        color={colors.primary}
        onPress={() => navigation && navigation.navigate("Cards")}
      />
      {stats ? (
        <View>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              alignItems: "center",
              marginTop: spacing.md,
            }}
          >
            <DonutChart
              size={160}
              stroke={20}
              values={[stats.cards?.active || 0, stats.cards?.inactive || 0]}
              colors={[colors.primary, colors.border]}
              labels={["Actives", "Inactives"]}
              centerLabel={{
                title: "Cartes",
                value: String(stats.cards?.total || 0),
              }}
            />
            <View style={{ flex: 1, flexDirection: "row", flexWrap: "wrap" }}>
              <StatTile
                title="Vues"
                value={stats.views?.total || 0}
                subtitle="Total des cartes"
                color={colors.primaryDark}
              />
              <StatTile
                title="Contacts"
                value={stats.rolodex?.total || 0}
                subtitle="Rolodex"
                color={colors.primary}
              />
              <StatTile
                title="Annonces"
                value={stats.announcements?.total || 0}
                subtitle="Publiées"
                color={colors.border}
              />
            </View>
          </View>
        </View>
      ) : null}

      <View style={{ height: spacing.md }} />
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
  row: { flexDirection: "row", flexWrap: "wrap" },
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
  showCardsButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },

  socialRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingVertical: spacing.md,
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
