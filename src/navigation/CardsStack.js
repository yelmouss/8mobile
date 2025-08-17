import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import CardsScreen from '../screens/CardsScreen';
import CardEditorScreenSimple from '../screens/CardEditorScreenSimple';

const Stack = createStackNavigator();

export default function CardsStack() {
  return (
    <Stack.Navigator
      initialRouteName="CardsList"
      screenOptions={{
        headerShown: false,
        presentation: 'card',
        animationTypeForReplace: 'push',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen 
        name="CardsList" 
        component={CardsScreen}
        options={{
          title: 'Mes Cartes'
        }}
      />
      <Stack.Screen 
        name="CardEditor" 
        component={CardEditorScreenSimple}
        options={{
          title: 'Éditer Carte',
          gestureEnabled: true,
        }}
      />
    </Stack.Navigator>
  );
}
