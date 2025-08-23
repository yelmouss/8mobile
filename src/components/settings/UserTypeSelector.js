import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Modal,
  FlatList,
} from "react-native";
import { colors, spacing } from "../../theme/theme";
import { apiFetch } from "../../api/client";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

const USER_TYPES = [
  { key: "ETABLISSEMENT", icon: "office-building" },
  { key: "SCHOOL", icon: "school" },
  { key: "STUDENT", icon: "account-school" },
  { key: "ANIMAL_DE_COMPAGNIE", icon: "paw" },
  { key: "PROFESSIONNEL", icon: "briefcase" },
  { key: "PROFESSION_LIBERALE", icon: "account-tie" },
  { key: "PARTICULIER", icon: "account" },
  { key: "SPORTSCLUB", icon: "dumbbell" },
  { key: "AUTRES", icon: "dots-horizontal-circle-outline" },
];

export default function UserTypeSelector({ user, onSaved }) {
  const [value, setValue] = useState(user?.userType || "");
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setValue(user?.userType || "");
  }, [user]);

  const onSave = async () => {
    try {
      setSaving(true);
      await apiFetch("/api/user/profile", {
        method: "PUT",
        body: JSON.stringify({ profile: { userType: value || null } }),
      });
      onSaved?.();
    } catch (e) {
      alert(e?.message || "Échec");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.panel}>
      <Text style={styles.title}>Type d'utilisateur</Text>
      <Pressable style={styles.select} onPress={() => setOpen(true)}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {value ? (
            <MaterialCommunityIcons
              name={USER_TYPES.find((u) => u.key === value)?.icon || "account"}
              size={18}
              color={colors.text}
            />
          ) : (
            <MaterialCommunityIcons
              name={"account-question"}
              size={18}
              color={colors.mutedText}
            />
          )}
          <Text
            style={[styles.selectText, !value && { color: colors.mutedText }]}
          >
            {value || "Sélectionner un type"}
          </Text>
        </View>
        <MaterialCommunityIcons
          name="chevron-down"
          size={20}
          color={colors.mutedText}
        />
      </Pressable>

      <Modal
        visible={open}
        animationType="fade"
        transparent
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <FlatList
              data={USER_TYPES}
              keyExtractor={(item) => item.key}
              renderItem={({ item }) => {
                const active = value === item.key;
                return (
                  <Pressable
                    onPress={() => {
                      setValue(item.key);
                      setOpen(false);
                    }}
                    style={[styles.optionRow, active && styles.optionRowActive]}
                  >
                    <MaterialCommunityIcons
                      name={item.icon}
                      size={18}
                      color={active ? colors.primary : colors.text}
                    />
                    <Text
                      style={[
                        styles.optionText,
                        active && { color: colors.primary },
                      ]}
                    >
                      {item.key}
                    </Text>
                  </Pressable>
                );
              }}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            />
          </View>
        </View>
      </Modal>
      <Pressable
        style={[styles.btn, saving && { opacity: 0.6 }]}
        onPress={saving ? undefined : onSave}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Appliquer</Text>
        )}
      </Pressable>

      <Pressable style={[styles.cancelBtn]} onPress={() => setOpen(false)}>
        <Text style={styles.cancelText}>Annuler</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    margin: spacing.md,
    padding: spacing.md,
  },
  title: { fontWeight: "700", color: colors.text, marginBottom: 8 },
  select: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectText: { color: colors.text, fontWeight: "600" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: spacing.md,
    width: "92%",
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  optionRowActive: { backgroundColor: "#f6fafe" },
  optionText: { marginLeft: 8, color: colors.text },
  btn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "700" },
  cancelBtn: { marginTop: 8, alignItems: "center" },
  cancelText: { color: colors.mutedText },
});
