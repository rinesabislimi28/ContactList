import React, { useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  StatusBar, 
  Image, 
  TouchableOpacity, 
  TextInput, 
  Platform, 
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Import contact data
import contacts from './contact_sample_data.json'; 

// Cross-platform alert
const showAlert = (title, message) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message, [{ text: 'OK' }]);
  }
};

// Single contact card
const ContactItem = ({ item }) => {
  const handlePress = () => {
    showAlert(
      item.name,
      `📞 Phone: ${item.phone}\n✉️ Email: ${item.email}`
    );
  };

  return (
    <TouchableOpacity style={styles.contactCard} onPress={handlePress}>
      <Image 
        source={{ uri: item.avatar || `https://i.pravatar.cc/150?u=${item.id}` }} 
        style={styles.avatar}
      />
      <View style={styles.infoContainer}>
        <Text style={styles.nameText}>{item.name}</Text>
        <Text style={styles.detailText}>📞 {item.phone}</Text>
        <Text style={styles.detailText}>✉️ {item.email}</Text>
      </View>
    </TouchableOpacity>
  );
};

// Separator
const ItemSeparator = () => <View style={styles.separator} />;

export default function App() {
  const [searchText, setSearchText] = useState('');

  // Filter contacts (case-insensitive)
  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#4A90E2" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>My Contact List ({filteredContacts.length})</Text>
      </View>

      {/* Search input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name..."
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText.length > 0 && (
          <TouchableOpacity 
            style={styles.clearButton} 
            onPress={() => setSearchText('')}
          >
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Contact list */}
      <FlatList
        data={filteredContacts}
        renderItem={({ item }) => <ContactItem item={item} />}
        keyExtractor={(item) => item.id.toString()}
        ItemSeparatorComponent={ItemSeparator}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

// Styling (same as before)
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#E8EBF0',
  },
  header: {
    padding: 15,
    backgroundColor: '#4A90E2',
    alignItems: 'center',
    marginBottom: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  headerText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    paddingTop: 25,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 10,
  },
  searchInput: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  clearButton: {
    marginLeft: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
  },
  clearButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D6E4FF',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
    borderWidth: 2,
    borderColor: '#4A90E2',
  },
  infoContainer: {
    flex: 1,
  },
  nameText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#555',
  },
  separator: {
    height: 12,
  },
});
