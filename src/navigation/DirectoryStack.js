import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import DirectoryScreen from '../screens/DirectoryScreen';
import CardDetailScreen from '../screens/CardDetailScreen';

const Stack = createStackNavigator();

export default function DirectoryStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="DirectoryHome" component={DirectoryScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CardDetail" component={CardDetailScreen} options={{ title: 'Carte' }} />
    </Stack.Navigator>
  );
}
