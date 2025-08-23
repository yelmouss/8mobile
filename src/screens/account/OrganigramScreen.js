import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  Pressable,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "../../theme/theme";
import { apiFetch } from "../../api/client";

export default function OrganigramScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes] = useState([]);

  // Utilitaire pour obtenir l'URL complète de l'image
  const getImageUrl = (img) => {
    if (!img) return null;
    if (img.startsWith("http")) return img;
    if (img.startsWith("/uploads/")) {
      // Utilise la même logique que api/client.js
      const base =
        typeof global?.expoConfig?.extra?.NEXT_BASE_URL === "string"
          ? global.expoConfig.extra.NEXT_BASE_URL
          : "https://resolved-marten-smashing.ngrok-free.app";
      return base.replace(/\/$/, "") + img;
    }
    return img;
  };

  // Pour mapping parentId -> nom du responsable
  const idToName = useMemo(() => {
    const map = {};
    nodes.forEach((n) => {
      map[String(n._id)] = `${n.prenom || ""} ${n.nom || ""}`.trim();
    });
    return map;
  }, [nodes]);
  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch("/api/user/organisation/collaborateurs");
        const list = Array.isArray(res?.collaborateurs)
          ? res.collaborateurs
          : [];
        setNodes(list);
      } catch (e) {
        Alert.alert("Organigramme", e?.message || "Chargement impossible");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.link}>Retour</Text>
        </Pressable>
        <Text style={styles.title}>Organigramme</Text>
        <View style={{ width: 60 }} />
      </View>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size={28} color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={nodes}
          keyExtractor={(item) => String(item._id || item.id || Math.random())}
          contentContainerStyle={{ padding: spacing.md }}
          renderItem={({ item }) => {
            const responsable = item.parentId
              ? idToName[String(item.parentId)]
              : null;
            return (
              <View style={styles.item}>
                <View style={styles.row}>
                  {item.image ? (
                    <Image
                      source={{ uri: getImageUrl(item.image) }}
                      style={styles.avatar}
                    />
                  ) : (
                    <View style={[styles.avatar, styles.avatarFallback]}>
                      <Text style={styles.avatarInitials}>
                        {`${(item.prenom?.[0] || '').toUpperCase()}${(item.nom?.[0] || '').toUpperCase()}`}
                      </Text>
                    </View>
                  )}

                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <Text style={styles.itemName}>
                        {item.prenom} {item.nom}
                      </Text>
                      {item.estDirigeant ? (
                        <Text style={styles.dirigeant}> ★</Text>
                      ) : null}
                    </View>
                    <Text style={styles.itemFonction}>{item.fonction}</Text>
                    {item.departement ? (
                      <Text style={styles.itemDepartement}>
                        {item.departement}
                      </Text>
                    ) : null}
                    {responsable ? (
                      <Text style={styles.itemResp}>
                        Responsable : {responsable}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <Text style={{ color: colors.mutedText, textAlign: "center" }}>
              Aucun collaborateur.
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  link: { color: colors.primary, fontWeight: "700" },
  title: { fontSize: 18, fontWeight: "700", color: colors.text },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  row: { flexDirection: "row", alignItems: "center" },
  item: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#eee" },
  avatarFallback: {
    backgroundColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#697565',
    fontWeight: '700',
    fontSize: 22,
  },
  itemName: { color: colors.text, fontWeight: "700", fontSize: 16 },
  itemFonction: { color: colors.primary, fontWeight: "600", marginTop: 2 },
  itemDepartement: {
    color: colors.mutedText,
    fontStyle: "italic",
    marginTop: 2,
  },
  itemResp: { color: colors.mutedText, marginTop: 2 },
  dirigeant: { color: "#eab308", fontSize: 18, marginLeft: 4 },
});
