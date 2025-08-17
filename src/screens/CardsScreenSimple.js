import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Button,
  Alert,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import CardList from "../components/cards/CardList";
import {
  getMyCards,
  deleteCard,
} from "../api/client";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { colors, spacing } from "../theme/theme";
import { useFocusEffect } from "@react-navigation/native";

export default function CardsScreen({ navigation }) {
  const { token } = useAuth();
  const [cards, setCards] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setError(null);
      const result = await getMyCards();
      setCards(Array.isArray(result) ? result : []);
    } catch (e) {
      console.warn("Failed to load cards", e);
      setError("Impossible de charger vos cartes");
    }
  }, [token]);

  useEffect(() => {
    if (token) load();
  }, [token, load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const openNew = () => {
    navigation.navigate('CardEditor', { mode: 'create' });
  };

  const openEdit = (card) => {
    navigation.navigate('CardEditor', { editing: card, mode: 'edit' });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes cartes</Text>
        <Pressable
          onPress={openNew}
          style={styles.iconBtn}
          accessibilityLabel="Nouvelle carte"
        >
          <MaterialCommunityIcons name="plus" size={24} color={colors.primaryDark} />
        </Pressable>
      </View>
      <CardList
        style={styles.list}
        contentContainerStyle={styles.listContent}
        cards={cards}
        onEdit={openEdit}
        onDelete={(card) => {
          Alert.alert("Confirmer", "Supprimer cette carte ?", [
            { text: "Annuler" },
            {
              text: "Supprimer",
              onPress: async () => {
                try {
                  await deleteCard(card._id);
                  await load();
                } catch (e) {
                  Alert.alert("Erreur", e?.message || "Échec");
                }
              },
            },
          ]);
        }}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          !error ? (
            <View style={{ padding: spacing.lg }}>
              <Text style={{ color: colors.mutedText }}>
                Aucune carte pour l'instant.
              </Text>
            </View>
          ) : null
        }
      />
      {error ? (
        <View style={{ padding: spacing.md }}>
          <Text style={{ color: "tomato", marginTop: 8 }}>{error}</Text>
          <View style={{ height: spacing.sm }} />
          <Button title="Recharger" onPress={onRefresh} />
        </View>
      ) : null}
      <Pressable
        onPress={openNew}
        style={styles.fab}
        accessibilityLabel="Créer une nouvelle carte"
      >
        <MaterialCommunityIcons name="plus" size={26} color="#fff" />
      </Pressable>
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
  headerTitle: { fontSize: 20, fontWeight: "700", color: colors.text },
  iconBtn: { padding: 8, borderRadius: 20 },
  list: { flex: 1 },
  listContent: { padding: spacing.md },
  fab: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
