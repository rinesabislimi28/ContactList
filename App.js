import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  StatusBar,
  Image,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';

// You might need to install 'react-native-vector-icons' for a real mobile app, 
// but for cross-platform compatibility, we'll use a simple text icon.
import { Feather } from '@expo/vector-icons';

// Import contact data
import contacts from './data/contact_sample_data.json';


// Cross-platform alert
const showAlert = (title, message) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message, [{ text: 'OK' }]);
  }
};

// Data Transformation Function (Unchanged) 
const groupContactsByLetter = (contactArray) => {
  const sortedContacts = [...contactArray].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const groupedMap = sortedContacts.reduce((acc, contact) => {
    const firstLetter = contact.name.charAt(0).toUpperCase();

    if (!acc.has(firstLetter)) {
      acc.set(firstLetter, []);
    }
    acc.get(firstLetter).push(contact);
    return acc;
  }, new Map());

  const sections = [];
  const sectionTitles = [];

  Array.from(groupedMap.keys()).forEach(letter => {
    sections.push({
      title: letter,
      data: groupedMap.get(letter),
    });
    sectionTitles.push(letter);
  });

  return { sections, sectionTitles };
};

// Single contact card 
const ContactItem = ({ item }) => {
  const [isHovered, setIsHovered] = useState(false);

  const handlePress = () => {
    showAlert(
      item.name,
      `📞 Phone: ${item.phone}\n✉️ Email: ${item.email}`
    );
  };

  const cardStyle = [
    styles.contactCard,
    Platform.OS === 'web' && isHovered && styles.contactCardHover
  ];

  return (
    <TouchableOpacity
      style={cardStyle}
      onPress={handlePress}
      onMouseEnter={() => Platform.OS === 'web' && setIsHovered(true)}
      onMouseLeave={() => Platform.OS === 'web' && setIsHovered(false)}
    >
      <Image
        source={{ uri: item.avatar || `https://i.pravatar.cc/150?u=${item.id}` }}
        style={styles.avatar}
      />
      <View style={styles.infoContainer}>
        <Text style={styles.nameText}>{item.name}</Text>
        <Text style={styles.detailText}>📞 {item.phone}</Text>
        <Text style={styles.detailText}>✉️ {item.email}</Text>
      </View>
      <View style={styles.chevronContainer}>
        <Text style={styles.chevronText}>〉</Text>
      </View>
    </TouchableOpacity>
  );
};

// Section Header Component (Unchanged)
const SectionHeader = ({ title }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionHeaderText}>{title}</Text>
  </View>
);

// Separator (Unchanged)
const ItemSeparator = () => <View style={styles.separator} />;

// Alphabet Index Bar Component (Styling updated)
const IndexBar = ({ sectionTitles, onLetterPress }) => (
  <View style={styles.indexBarContainer}>
    {sectionTitles.map(letter => (
      <TouchableOpacity
        key={letter}
        style={styles.indexLetterWrapper}
        onPress={() => onLetterPress(letter)}
      >
        <Text style={styles.indexLetterText}>{letter}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

// App component
function MainApp() {
  const [searchText, setSearchText] = useState('');
  const sectionListRef = useRef(null);

  const { sections: contactSections, sectionTitles } = useMemo(() => {
    const filteredContacts = contacts.filter(contact =>
      contact.name.toLowerCase().includes(searchText.toLowerCase())
    );
    return groupContactsByLetter(filteredContacts);
  }, [searchText]);

  const handleIndexLetterPress = (letter) => {
    if (sectionListRef.current) {
      const sectionIndex = contactSections.findIndex(section => section.title === letter);

      if (sectionIndex !== -1) {
        sectionListRef.current.scrollToLocation({
          sectionIndex: sectionIndex,
          itemIndex: 0,
          animated: true,
          viewOffset: 0,
        });
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#2C57A0" />

      {/* Header (Updated with gradient) */}
      <View style={styles.header}>
        <Text style={styles.headerText}>My Contact List ({contactSections.reduce((acc, section) => acc + section.data.length, 0)})</Text>
      </View>

      {/* Search input (Updated with icon and better focus) */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name..."
            placeholderTextColor="#888"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {searchText.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setSearchText('')}
          >
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content Container (List and Index Bar side-by-side) */}
      <View style={styles.contentWrapper}>
        <SectionList
          ref={sectionListRef}
          style={styles.sectionList}
          sections={contactSections}
          renderItem={({ item }) => <ContactItem item={item} />}
          renderSectionHeader={({ section: { title } }) => (
            <SectionHeader title={title} />
          )}
          keyExtractor={(item) => item.id.toString()}
          ItemSeparatorComponent={ItemSeparator}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={true}
        />

        {/* Index Bar */}
        {contactSections.length > 0 && (
          <IndexBar
            sectionTitles={sectionTitles}
            onLetterPress={handleIndexLetterPress}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

// Wrap MainApp inside SafeAreaProvider
export default function App() {
  return (
    <SafeAreaProvider>
      <MainApp />
    </SafeAreaProvider>
  );
}

// Styling
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F9FC', // Very light background
  },
  // Enhanced Header Style 
  header: {
    padding: 15,
    // Simulate a subtle gradient using two colors
    backgroundColor: '#4A90E2',
    borderBottomColor: '#2C57A0',
    borderBottomWidth: 1,
    alignItems: 'center',
    marginBottom: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 6,
  },
  headerText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    paddingTop: 25,
  },
  // Enhanced Search Style 
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 10,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 10 : 0,
    borderWidth: 1,
    borderColor: '#E1E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  searchIcon: {
    fontSize: 16,
    color: '#999',
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    height: 40,
  },
  clearButton: {
    marginLeft: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FF5757',
    borderRadius: 20,
  },
  clearButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  // General List & Layout 
  contentWrapper: {
    flex: 1,
    flexDirection: 'row',
  },
  sectionList: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  // Enhanced Contact Card Style 
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E0E7FF',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  contactCardHover: {
    backgroundColor: '#F5F8FF',
    borderColor: '#4A90E2',
    transform: [{ scale: 1.01 }],
    transition: 'all 0.1s ease',
  },
  avatar: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    marginRight: 15,
    borderWidth: 3,
    borderColor: '#4A90E2',
  },
  infoContainer: {
    flex: 1,
  },
  nameText: {
    fontSize: 19,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  detailText: {
    fontSize: 13,
    color: '#666',
  },
  chevronContainer: {
    paddingLeft: 10,
    justifyContent: 'center',
  },
  chevronText: {
    fontSize: 18,
    color: '#AAB8C2',
    fontWeight: '300'
  },
  separator: {
    height: 10,
  },
  // Enhanced Section Header Styles 
  sectionHeader: {
    backgroundColor: '#E8F0FE',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderLeftWidth: 5,
    borderLeftColor: '#4A90E2',
  },
  sectionHeaderText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C57A0',
  },
  // Enhanced Index Bar Styles 
  indexBarContainer: {
    paddingVertical: 15,
    width: 30,
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 10,
    position: 'absolute',
    right: 5,
    top: 50,
    bottom: 50,
    zIndex: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  indexLetterWrapper: {
    paddingVertical: 2,
  },
  indexLetterText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
});