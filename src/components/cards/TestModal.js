import React from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TestModal({ visible, onRequestClose, testData }) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onRequestClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'red' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 24, color: 'white', marginBottom: 20, textAlign: 'center' }}>
            TEST MODAL FONCTIONNE
          </Text>
          
          <Text style={{ fontSize: 16, color: 'white', marginBottom: 10 }}>
            visible: {visible ? 'true' : 'false'}
          </Text>
          
          {testData && (
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: 'white', marginBottom: 5 }}>
                editMode: {testData.editMode ? 'true' : 'false'}
              </Text>
              <Text style={{ color: 'white', marginBottom: 5 }}>
                editing: {testData.editing ? 'true' : 'false'}
              </Text>
              <Text style={{ color: 'white', marginBottom: 5 }}>
                recto: {testData.recto || 'empty'}
              </Text>
              <Text style={{ color: 'white', marginBottom: 5 }}>
                verso: {testData.verso || 'empty'}
              </Text>
            </View>
          )}
          
          <Pressable 
            onPress={onRequestClose} 
            style={{ 
              backgroundColor: 'white', 
              padding: 15, 
              borderRadius: 8,
              minWidth: 100,
              alignItems: 'center'
            }}
          >
            <Text style={{ color: 'red', fontWeight: 'bold', fontSize: 16 }}>
              FERMER
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
