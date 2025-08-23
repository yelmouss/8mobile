import React from "react";
import { View, Text, StyleSheet, Image, ScrollView } from "react-native";
import Svg, { Line } from "react-native-svg";

// Transforme la liste plate en arbre hiérarchique (copie adaptée de orgChartUtils.js)
function buildOrgTree(collaborateurs) {
  if (!collaborateurs || collaborateurs.length === 0) return null;
  const map = {};
  collaborateurs.forEach((c) => {
    map[String(c._id)] = { ...c, children: [] };
  });
  const roots = collaborateurs.filter((c) => c.estDirigeant || !c.parentId);
  collaborateurs.forEach((c) => {
    if (c.parentId && map[String(c.parentId)]) {
      map[String(c.parentId)].children.push(map[String(c._id)]);
    }
  });
  if (roots.length > 1) {
    return {
      _id: "virtual-root",
      nom: "Direction",
      prenom: "Équipe",
      fonction: "Direction Générale",
      children: roots.map((r) => map[String(r._id)]),
    };
  } else if (roots.length === 1) {
    return map[String(roots[0]._id)];
  }
  return null;
}

function OrgChartNode({ node, depth = 0, maxDepth = 4 }) {
  if (!node) return null;
  // Limite la profondeur d'affichage pour éviter les débordements
  if (depth > maxDepth) return null;
  const hasChildren = node.children && node.children.length > 0;
  return (
    <View style={styles.nodeWrap}>
      <View style={styles.cardWrap}>
        <View style={styles.card}>
          {node.image ? (
            <Image source={{ uri: node.image }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitials}>
                {`${(node.prenom?.[0] || '').toUpperCase()}${(node.nom?.[0] || '').toUpperCase()}`}
              </Text>
            </View>
          )}
          <Text style={styles.name}>{node.prenom} {node.nom}</Text>
          <Text style={styles.fonction}>{node.fonction}</Text>
          {node.departement ? (
            <Text style={styles.departement}>{node.departement}</Text>
          ) : null}
        </View>
      </View>
      {hasChildren && (
        <View style={styles.childrenWrap}>
          {/* Lignes SVG: une verticale centrale, une horizontale, puis une courte verticale par enfant */}
          <Svg
            height={32}
            width={Math.max(40 * node.children.length, 40)}
            style={{ alignSelf: 'center' }}
          >
            {/* Ligne verticale du parent vers la ligne horizontale */}
            <Line
              x1={Math.max(40 * node.children.length, 40) / 2}
              y1={0}
              x2={Math.max(40 * node.children.length, 40) / 2}
              y2={16}
              stroke="#697565"
              strokeWidth={2}
            />
            {/* Ligne horizontale reliant tous les enfants (si >1) */}
            {node.children.length > 1 && (
              <Line
                x1={20}
                y1={16}
                x2={Math.max(40 * node.children.length, 40) - 20}
                y2={16}
                stroke="#697565"
                strokeWidth={2}
              />
            )}
            {/* Petite ligne verticale pour chaque enfant */}
            {node.children.map((child, i) => (
              <Line
                key={i}
                x1={20 + i * 40}
                y1={16}
                x2={20 + i * 40}
                y2={32}
                stroke="#697565"
                strokeWidth={2}
              />
            ))}
          </Svg>
          <View style={styles.childrenRow}>
            {node.children.map((child, i) => (
              <OrgChartNode key={child._id} node={child} depth={depth + 1} />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

export default function OrgChart({ collaborateurs }) {
  const tree = buildOrgTree(collaborateurs);
  if (!tree) return (
    <View style={{ alignItems: 'center', marginTop: 32 }}><Text>Aucun collaborateur.</Text></View>
  );
  return (
    <ScrollView horizontal contentContainerStyle={{ padding: 16 }}>
      <View style={styles.orgRoot}>
        <OrgChartNode node={tree} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  orgRoot: { alignItems: 'flex-start', justifyContent: 'center', flexDirection: 'row' },
  nodeWrap: { alignItems: 'center', marginHorizontal: 12 },
  cardWrap: { alignItems: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 12, alignItems: 'center', minWidth: 120, borderWidth: 1, borderColor: '#d1d5db', elevation: 2 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#eee', marginBottom: 6 },
  avatarFallback: { backgroundColor: '#d1d5db', alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { color: '#697565', fontWeight: '700', fontSize: 18 },
  name: { fontWeight: '700', fontSize: 15, color: '#181C14', textAlign: 'center' },
  fonction: { color: '#697565', fontWeight: '600', fontSize: 13, marginTop: 2 },
  departement: { color: '#6b6b6b', fontStyle: 'italic', fontSize: 12, marginTop: 2 },
  childrenWrap: { marginTop: 12, alignItems: 'center' },
  childrenRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start' },
});
