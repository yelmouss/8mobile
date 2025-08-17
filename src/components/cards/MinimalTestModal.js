import React from 'react';
import { View, Text, Pressable, Modal } from 'react-native';

export default function MinimalTestModal({ visible, onRequestClose }) {
  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      onRequestClose={onRequestClose}
      transparent={false}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'red',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
      }}>
        <Text style={{
          fontSize: 24,
          color: 'white',
          fontWeight: 'bold',
          marginBottom: 20,
          textAlign: 'center'
        }}>
          MODAL TEST
        </Text>
        
        <Text style={{
          fontSize: 18,
          color: 'white',
          marginBottom: 20,
          textAlign: 'center'
        }}>
          Si vous voyez ce texte,
          le modal fonctionne !
        </Text>
        
        <Pressable 
          onPress={onRequestClose}
          style={{
            backgroundColor: 'white',
            paddingHorizontal: 30,
            paddingVertical: 15,
            borderRadius: 10
          }}
        >
          <Text style={{
            color: 'red',
            fontSize: 18,
            fontWeight: 'bold'
          }}>
            FERMER
          </Text>
        </Pressable>
      </View>
    </Modal>
  );
}
