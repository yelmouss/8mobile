import React from 'react';
import { View, FlatList, RefreshControl } from 'react-native';
import { spacing } from '../../theme/theme';
import MobileCard from '../MobileCard';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../../theme/theme';
import { Pressable } from 'react-native';

export default function CardList({ cards, onEdit, onDelete, ListEmptyComponent, refreshing, onRefresh }) {
  console.log('CardList reçu:', cards?.length || 0, 'cartes');
  console.log('Premier élément:', cards?.[0]);
  
  return (
    <FlatList
      contentContainerStyle={{ padding: spacing.md }}
      data={cards}
      keyExtractor={(item) => String(item._id)}
  refreshControl={<RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} />}
      renderItem={({ item }) => (
        <View>
          <MobileCard card={item} onPress={() => onEdit(item)} />
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 6 }}>
            <Pressable onPress={() => onEdit(item)} style={{ paddingHorizontal: 8, paddingVertical: 4, marginLeft: 8 }} accessibilityLabel="Modifier">
              <MaterialCommunityIcons name="pencil" size={20} color={colors.primaryDark} />
            </Pressable>
            <Pressable onPress={() => onDelete(item)} style={{ paddingHorizontal: 8, paddingVertical: 4, marginLeft: 8 }} accessibilityLabel="Supprimer">
              <MaterialCommunityIcons name="trash-can-outline" size={20} color="#d9534f" />
            </Pressable>
          </View>
        </View>
      )}
      ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />} 
      ListFooterComponent={<View style={{ height: spacing.lg }} />} 
      ListEmptyComponent={ListEmptyComponent}
    />
  );
}
