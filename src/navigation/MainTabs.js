import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { navTheme, colors } from '../theme/theme';
import HomeScreen from '../screens/HomeScreen';
import CardsScreen from '../screens/CardsScreen';
import RolodexScreen from '../screens/RolodexScreen';
import DirectoryScreen from '../screens/DirectoryScreen';
import TeamScreen from '../screens/TeamScreen';
import AdsScreen from '../screens/AdsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const Tab = createBottomTabNavigator();

const theme = navTheme;

export default function MainTabs() {
  return (
    <NavigationContainer
      theme={theme}
      fallback={
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size={32} />
        </View>
      }
    >
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarLabelStyle: { fontSize: 12 },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.mutedText,
          tabBarStyle: { backgroundColor: colors.background, borderTopColor: colors.border },
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="home-variant" color={color} size={size} />
            ),
          }}
        />
        <Tab.Screen
          name="Cards"
          component={CardsScreen}
          options={{
            title: 'Cartes',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="credit-card-multiple" color={color} size={size} />
            ),
          }}
        />
        <Tab.Screen
          name="Rolodex"
          component={RolodexScreen}
          options={{
            title: 'Rolodex',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="card-account-details-outline" color={color} size={size} />
            ),
          }}
        />
        <Tab.Screen
          name="Directory"
          component={DirectoryScreen}
          options={{
            title: 'Annuaire',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="account-search" color={color} size={size} />
            ),
          }}
        />
        <Tab.Screen
          name="Team"
          component={TeamScreen}
          options={{
            title: 'Collaborateurs',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="account-group" color={color} size={size} />
            ),
          }}
        />
        <Tab.Screen
          name="Ads"
          component={AdsScreen}
          options={{
            title: 'Annonces',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="bullhorn" color={color} size={size} />
            ),
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            title: 'Paramètres',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="cog" color={color} size={size} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
