import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import CardsScreen from '../screens/CardsScreen';
import CardEditorScreenSimple from '../screens/CardEditorScreenSimple';

const Stack = createStackNavigator();

export default function CardsStackMinimal() {
  return (
    <Stack.Navigator
      initialRouteName="CardsList"
      screenOptions={{
        headerShown: false,
        animationEnabled: false, // Désactiver les animations pour éviter les erreurs
      }}
    >
      <Stack.Screen 
        name="CardsList" 
        component={CardsScreen}
      />
      <Stack.Screen 
        name="CardEditor" 
        component={CardEditorScreenSimple}
      />
    </Stack.Navigator>
  );
}
