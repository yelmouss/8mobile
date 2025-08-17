import React, { useState } from 'react';
import { View } from 'react-native';
import CardsScreen from '../screens/CardsScreen';
import CardEditorScreenSimple from '../screens/CardEditorScreenSimple';

export default function CardsNavigationSimple() {
  const [currentScreen, setCurrentScreen] = useState('list');
  const [editingCard, setEditingCard] = useState(null);
  const [mode, setMode] = useState('create');

  const navigation = {
    navigate: (screenName, params) => {
      if (screenName === 'CardEditor') {
        setMode(params?.mode || 'create');
        setEditingCard(params?.card || null);
        setCurrentScreen('editor');
      }
    },
    goBack: () => {
      setCurrentScreen('list');
      setEditingCard(null);
    }
  };

  if (currentScreen === 'editor') {
    return (
      <CardEditorScreenSimple 
        navigation={navigation}
        route={{ params: { card: editingCard, mode } }}
      />
    );
  }

  return (
    <CardsScreen navigation={navigation} />
  );
}
