import 'react-native-gesture-handler';
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, SectionList, StyleSheet, StatusBar, Image, 
  TouchableOpacity, TextInput, Alert, Modal, Linking, Platform, 
  RefreshControl, Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView, ScrollView
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer, useFocusEffect } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import initialContactsData from './data/contact_sample_data.json'; 

const Stack = createNativeStackNavigator();

/**
 * Helper function to organize contacts into alphabetical sections.
 * This satisfies the "Alphabetical Grouping" requirement for optimized list navigation.
 */
const groupContactsAlphabetically = (data) => {
  if (!data || data.length === 0) return [];
  // Sort alphabetically by name
  const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name));
  const map = {};
  sorted.forEach(contact => {
    const letter = contact.name?.charAt(0).toUpperCase() || '#';
    if (!map[letter]) map[letter] = [];
    map[letter].push(contact);
  });
  // Convert map to array format required by SectionList
  return Object.keys(map).sort().map(key => ({ title: key, data: map[key] }));
};

// --- DETAIL SCREEN ---
function DetailScreen({ route, navigation }) {
  const { contact } = route.params;
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [editForm, setEditForm] = useState({ ...contact });

  /**
   * Updates contact information in AsyncStorage and local state.
   */
  const handleUpdate = async () => {
    try {
      const saved = await AsyncStorage.getItem('@contact_list_v3');
      let allContacts = JSON.parse(saved);
      const index = allContacts.findIndex(c => c.id === contact.id);
      if (index !== -1) {
        allContacts[index] = { ...editForm };
        await AsyncStorage.setItem('@contact_list_v3', JSON.stringify(allContacts));
        setEditModalVisible(false);
        navigation.goBack(); // Return to home to see changes
      }
    } catch (e) { console.log("Update Error:", e); }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom Detail Header */}
      <View style={styles.detailHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.detailTitle}>Contact Profile</Text>
        <TouchableOpacity onPress={() => setEditModalVisible(true)} style={styles.editHeaderBtn}>
          <Text style={styles.editHeaderText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.detailBody}>
        <View style={styles.avatarLargeContainer}>
          <Image source={{ uri: contact.avatar }} style={styles.avatarLarge} />
        </View>
        <Text style={styles.detailName}>{contact.name}</Text>
        <Text style={styles.detailSubText}>{contact.email || 'No email'}</Text>

        {/* Deep Linking Actions: Call, SMS, Email */}
        <View style={styles.actionGrid}>
          <TouchableOpacity onPress={() => Linking.openURL(`tel:${contact.phone}`)} style={styles.actionItem}>
            <View style={[styles.iconCircle, { backgroundColor: '#EEF2FF' }]}><Ionicons name="call" size={26} color="#4F46E5" /></View>
            <Text style={styles.actionLabel}>Call</Text>
            <Text style={styles.actionValue}>{contact.phone}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => Linking.openURL(`sms:${contact.phone}`)} style={styles.actionItem}>
            <View style={[styles.iconCircle, { backgroundColor: '#ECFDF5' }]}><Ionicons name="chatbubble" size={26} color="#10B981" /></View>
            <Text style={styles.actionLabel}>Message</Text>
            <Text style={styles.actionValue}>SMS</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => Linking.openURL(`mailto:${contact.email}`)} style={styles.actionItem}>
            <View style={[styles.iconCircle, { backgroundColor: '#FFF1F2' }]}><Ionicons name="mail" size={26} color="#E11D48" /></View>
            <Text style={styles.actionLabel}>Email</Text>
            <Text style={styles.actionValue}>Send</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal for Editing Contact Info */}
      <Modal visible={isEditModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeading}>Edit Info</Text>
            <TextInput style={styles.input} value={editForm.name} onChangeText={t => setEditForm({...editForm, name: t})} />
            <TextInput style={styles.input} value={editForm.phone} keyboardType="phone-pad" onChangeText={t => setEditForm({...editForm, phone: t})} />
            <TextInput style={styles.input} value={editForm.email} onChangeText={t => setEditForm({...editForm, email: t})} />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleUpdate}><Text style={styles.saveButtonText}>Update</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// --- HOME SCREEN ---
function HomeScreen({ navigation }) {
  // Global state for contact list and search filter
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });

  // useFocusEffect ensures data reloads whenever we return to this screen
  useFocusEffect(useCallback(() => { loadData(); }, []));

  /**
   * Fetches data from AsyncStorage or falls back to local JSON
   */
  const loadData = async () => {
    const saved = await AsyncStorage.getItem('@contact_list_v3');
    if (saved) setContacts(JSON.parse(saved));
    else setContacts(initialContactsData);
  };

  /**
   * Syncs local state with AsyncStorage for data persistence
   */
  const syncStorage = async (list) => {
    setContacts(list);
    await AsyncStorage.setItem('@contact_list_v3', JSON.stringify(list));
  };

  /**
   * Handles deletion with user confirmation (Slide 59 - CRUD operations)
   */
  const deleteContact = (id) => {
    Alert.alert("Delete", "Remove this contact?", [
      { text: "Cancel" },
      { text: "Delete", style: 'destructive', onPress: () => syncStorage(contacts.filter(c => c.id !== id)) }
    ]);
  };

  /**
   * Renders the delete button when swiping left on a contact card
   */
  const renderRightActions = (id) => (
    <TouchableOpacity style={styles.deleteSwipe} onPress={() => deleteContact(id)}>
      <Ionicons name="trash" size={24} color="#FFF" />
    </TouchableOpacity>
  );

  /**
   * Filters contact list based on name or email search query
   */
  const filtered = useMemo(() => contacts.filter(c => 
    c.name?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase())
  ), [contacts, search]);

  // Regroup data whenever filtered results change
  const sections = useMemo(() => groupContactsAlphabetically(filtered), [filtered]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View style={styles.headerTop}>
            <View>
                <Text style={styles.brand}>Directory</Text>
                <Text style={styles.title}>Contacts</Text>
            </View>
            {/* Contact Counter Badge */}
            <View style={styles.counterBadge}>
                <Text style={styles.counterText}>{filtered.length}</Text>
            </View>
        </View>
        
        {/* Search Bar Implementation */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#6366F1" />
          <TextInput 
            placeholder="Search name or email..." 
            placeholderTextColor="#94A3B8"
            style={styles.searchInput} 
            value={search} 
            onChangeText={setSearch} 
          />
        </View>
      </View>

      {/* Optimized List using SectionList (Alphabetical Groups) */}
      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <Swipeable renderRightActions={() => renderRightActions(item.id)}>
            <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Detail', { contact: item })}>
              <Image source={{ uri: item.avatar }} style={styles.avatar} />
              <View style={styles.cardInfo}>
                <Text style={styles.contactName}>{item.name}</Text>
                <Text style={styles.contactSub}>{item.phone}</Text> 
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            </TouchableOpacity>
          </Swipeable>
        )}
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{title}</Text></View>
        )}
      />

      {/* Floating Action Button for Adding New Contacts */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={32} color="#FFF" />
      </TouchableOpacity>

      {/* Modal for Creating a New Contact with Keyboard Handling */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView 
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ width: '100%' }}
            >
              <View style={styles.modalContent}>
                <Text style={styles.modalHeading}>New Contact</Text>
                <TextInput style={styles.input} placeholder="Name" placeholderTextColor="#94A3B8" onChangeText={t => setForm({...form, name: t})} />
                <TextInput style={styles.input} placeholder="Phone" placeholderTextColor="#94A3B8" keyboardType="phone-pad" onChangeText={t => setForm({...form, phone: t})} />
                <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#94A3B8" keyboardType="email-address" onChangeText={t => setForm({...form, email: t})} />
                
                <View style={styles.modalActions}>
                  <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.saveButton} onPress={() => {
                    if(!form.name || !form.phone) return Alert.alert("Error", "Fill Name and Phone");
                    const newC = { 
                      id: Date.now().toString(), 
                      ...form, 
                      avatar: `https://ui-avatars.com/api/?name=${form.name}&background=6366F1&color=fff` 
                    };
                    syncStorage([newC, ...contacts]);
                    setModalVisible(false);
                  }}>
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

// --- ROOT NAVIGATION SETUP ---
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Detail" component={DetailScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// --- STYLESHEET ---
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8FAFC' 
  },
  header: { 
    padding: 25, 
    backgroundColor: '#FFF', 
    borderBottomLeftRadius: 30, 
    borderBottomRightRadius: 30, 
    elevation: 5 
  },
  headerTop: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 15 
  },
  brand: { 
    color: '#6366F1', 
    fontWeight: '800', 
    fontSize: 12, 
    textTransform: 'uppercase', 
    letterSpacing: 1 
  },
  title: { 
    fontSize: 30, 
    fontWeight: '900', 
    color: '#0F172A'
  },
  // Counter Style
  counterBadge: { 
    backgroundColor: '#6366F1', 
    paddingHorizontal: 12, 
    paddingVertical: 4, 
    borderRadius: 10 
  },
  counterText: { 
    color: '#FFF', 
    fontWeight: 'bold', 
    fontSize: 14 
  },
  searchBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F1F5F9', 
    paddingHorizontal: 15, 
    borderRadius: 15, 
    height: 50 
  },
  searchInput: { 
    flex: 1, 
    marginLeft: 10, 
    color: '#000', 
    fontSize: 16 
  },
  sectionHeader: { 
    paddingHorizontal: 25, 
    paddingVertical: 10, 
    backgroundColor: '#F8FAFC' 
  },
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: '900', 
    color: '#6366F1' 
  },
  card: { 
    flexDirection: 'row',
    padding: 15, 
    backgroundColor: '#FFF', 
    marginHorizontal: 20, 
    borderRadius: 20, 
    marginBottom: 10, 
    alignItems: 'center', 
    elevation: 2 
  },
  avatar: { 
    width: 55, 
    height: 55, 
    borderRadius: 18, 
    marginRight: 15 
  },
  cardInfo: { 
    flex: 1 
  },
  contactName: { 
    fontSize: 17, 
    fontWeight: '700', 
    color: '#1E293B' 
  },
  contactSub: { 
    fontSize: 13, 
    color: '#64748B', 
    marginTop: 2 
  },
  fab: { 
    position: 'absolute', 
    bottom: 30, 
    right: 25, 
    width: 65, 
    height: 65, 
    borderRadius: 22, 
    backgroundColor: '#6366F1', 
    justifyContent: 'center', 
    alignItems: 'center', 
    elevation: 8 
  },
  deleteSwipe: { 
    backgroundColor: '#EF4444', 
    justifyContent: 'center', 
    alignItems: 'center', 
    width: 80, 
    height: 75, 
    borderRadius: 20, 
    marginBottom: 10, 
    marginRight: 20 
  },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(15, 23, 42, 0.6)', 
    justifyContent: 'flex-end' 
  },
  modalContent: { 
    backgroundColor: '#FFF', 
    borderTopLeftRadius: 35, 
    borderTopRightRadius: 35, 
    padding: 30, 
    paddingBottom: 50 },
  modalHeading: { 
    fontSize: 24, 
    fontWeight: '900', 
    color: '#0F172A', 
    marginBottom: 25 
  },
  input: { 
    backgroundColor: '#F8FAFC', 
    padding: 15, 
    borderRadius: 15, 
    borderWidth: 1, 
    borderColor: '#E2E8F0', 
    fontSize: 16, 
    color: '#000', 
    marginBottom: 15 
  },
  modalActions: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  cancelText: { 
    color: '#94A3B8', 
    fontWeight: '700', 
    fontSize: 16 
  },
  saveButton: { 
    backgroundColor: '#6366F1', 
    paddingVertical: 15, 
    paddingHorizontal: 30, 
    borderRadius: 15 
  },
  saveButtonText: { 
    color: '#FFF', fontWeight: '800' },
  detailHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 20 
  },
  backButton: { 
    padding: 10, 
    backgroundColor: '#F1F5F9', 
    borderRadius: 12 },
  editHeaderBtn: { 
    padding: 10 
  },
  editHeaderText: { 
    color: '#6366F1', 
    fontWeight: 'bold', 
    fontSize: 16 
  },
  detailTitle: { 
    fontSize: 18, 
    fontWeight: '800' 
  },
  detailBody: { 
    alignItems: 'center', 
    padding: 25 
  },
  avatarLargeContainer: { 
    padding: 5, 
    backgroundColor: '#FFF', 
    borderRadius: 45, 
    elevation: 15, 
    marginBottom: 20 
  },
  avatarLarge: { 
    width: 130, 
    height: 130, 
    borderRadius: 40 
  },
  detailName: { 
    fontSize: 28, 
    fontWeight: '900', 
    color: '#1E293B' 
  },
  detailSubText: { 
    fontSize: 16, 
    color: '#64748B', 
    marginBottom: 35 
  },
  actionGrid: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    width: '100%' 
  },
  actionItem: { 
    alignItems: 'center', 
    flex: 1 
  },
  iconCircle: { 
    width: 60, 
    height: 60, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 10 
  },
  actionLabel: { 
    fontSize: 14, 
    fontWeight: '800', 
    color: '#1E293B' 
  },
  actionValue: { 
    fontSize: 12,
    color: '#94A3B8', 
    marginTop: 2 
  }
});