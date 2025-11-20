import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
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
    Alert,
    Linking,
    Modal,
    ScrollView,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
// IMPORTANT: GestureHandlerRootView is imported for Swipeable functionality
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';

// This file is required for the app to work
import initialContacts from './data/contact_sample_data.json';

// CONSTANTS & INITIAL DATA 
const MY_INITIAL_PROFILE = {
    id: 'my-profile',
    name: 'Rinesa Bislimi',
    title: 'Design Lead',
    phone: '+383 44 777 777',
    email: 'rinesa.bislimi@example.com',
    avatar: 'https://i.pravatar.cc/150?u=my-profile-rinesa',
    status: 'Available',
};

// UTILITY FUNCTIONS (Linking & Grouping Logic) 🔗
/**
 Displays a cross-platform alert.
 * @param {string} title 
 * @param {string} message 
 */
const showAlert = (title, message) => {
    if (Platform.OS === 'web') {
        window.alert(`${title}\n\n${message}`);
    } else {
        Alert.alert(title, message, [{ text: 'OK' }]);
    }
};

/**
 * Handles initiating a phone call.
 * @param {string} phone 
 */
const handleCall = (phone) => {
    const url = `tel:${phone}`;
    Linking.canOpenURL(url).then(supported => {
        if (supported) {
            Linking.openURL(url);
        } else {
            showAlert('Action Unavailable', `Calling not supported on this platform for: ${phone}`);
        }
    });
};

/**
 * Handles initiating an email composition.
 * @param {string} email 
 */
const handleEmail = (email) => {
    const url = `mailto:${email}`;
    Linking.canOpenURL(url).then(supported => {
        if (supported) {
            Linking.openURL(url);
        } else {
            showAlert('Action Unavailable', `Email function not supported on this platform for: ${email}`);
        }
    });
};

/**
 * Handles initiating an SMS message.
 * @param {string} phone 
 */
const handleSMS = (phone) => {
    const url = `sms:${phone}`;
    Linking.canOpenURL(url).then(supported => {
        if (supported) {
            Linking.openURL(url);
        } else {
            showAlert('Action Unavailable', `SMS function not supported on this platform for: ${phone}`);
        }
    });
};

/**
 * Groups and sorts contacts alphabetically for SectionList.
 * @param {Array<Object>} contactArray 
 * @returns {{sections: Array<Object>, sectionTitles: Array<string>}}
 */
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
    Array.from(groupedMap.keys()).sort().forEach(letter => {
        sections.push({
            title: letter,
            data: groupedMap.get(letter),
        });
        sectionTitles.push(letter);
    });
    return { sections, sectionTitles };
};


// COMPONENTS 🧩
// Swipe Actions Component
const RightSwipeActions = ({ onDelete, onEdit }) => {
    return (
        <View style={styles.swipeActionContainer}>
            <TouchableOpacity
                style={[styles.swipeButton, { backgroundColor: styles.EDIT_COLOR.backgroundColor }]}
                onPress={onEdit}
            >
                <Text style={styles.swipeButtonText}>✏️</Text>
                <Text style={styles.swipeButtonText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.swipeButton, { backgroundColor: styles.DELETE_COLOR.backgroundColor }]}
                onPress={onDelete}
            >
                <Text style={styles.swipeButtonText}>🗑️</Text>
                <Text style={styles.swipeButtonText}>Delete</Text>
            </TouchableOpacity>
        </View>
    );
};


// Contact Form Modal
const ContactFormModal = ({ isVisible, onClose, initialData, onSave, isMyProfile, onDelete }) => {
    const [name, setName] = useState(initialData?.name || '');
    const [phone, setPhone] = useState(initialData?.phone || '');
    const [email, setEmail] = useState(initialData?.email || '');
    const [title, setTitle] = useState(initialData?.title || '');
    const isEditMode = initialData && initialData.id && initialData.id !== 'my-profile';

    // Effect to reset form when modal opens with new data
    useEffect(() => {
        if (initialData) {
            setName(initialData.name || '');
            setPhone(initialData.phone || '');
            setEmail(initialData.email || '');
            setTitle(initialData.title || '');
        }
    }, [initialData]);

    const handleSave = () => {
        if (!name.trim() || !phone.trim() || !email.trim()) {
            showAlert('Required Fields', 'Name, Phone, and Email are required.');
            return;
        }

        const updatedData = {
            ...initialData,
            name: name.trim(),
            phone: phone.trim(),
            email: email.trim(),
        };

        if (isMyProfile) {
            updatedData.title = title.trim();
        } else if (!isEditMode) {
            // New contact is being added, title is optional
            updatedData.title = title.trim() || 'Colleague';
        }

        onSave(updatedData);
    };

    const handleDeleteConfirmation = () => {
        if (!isEditMode || isMyProfile) return;

        Alert.alert(
            "Confirm Delete",
            `Are you sure you want to delete ${initialData.name}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {
                        onDelete(initialData.id);
                        onClose();
                    }
                },
            ]
        );
    };

    const headerText = isMyProfile
        ? "Edit My Profile"
        : (isEditMode ? "Edit Contact" : "Add New Contact");

    return (
        <Modal
            animationType="slide"
            transparent={false}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.modalSafeArea}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{headerText}</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Text style={styles.closeButtonText}>❌</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.modalContent}>
                    <Text style={styles.inputLabel}>Full Name</Text>
                    <TextInput
                        style={styles.modalInput}
                        value={name}
                        onChangeText={setName}
                        placeholder="e.g. Rinesa Bislimi"
                    />

                    {(isMyProfile || isEditMode) && ( // Show title for profile and existing contacts
                        <>
                            <Text style={styles.inputLabel}>Title</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={title}
                                onChangeText={setTitle}
                                placeholder="e.g. Design Lead or Colleague"
                            />
                        </>
                    )}

                    <Text style={styles.inputLabel}>Phone Number</Text>
                    <TextInput
                        style={styles.modalInput}
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="e.g. +383 44 111 222"
                        keyboardType="phone-pad"
                    />

                    <Text style={styles.inputLabel}>Email</Text>
                    <TextInput
                        style={styles.modalInput}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="e.g. test@example.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                        <Text style={styles.saveButtonText}>Save Changes</Text>
                    </TouchableOpacity>

                    {isEditMode && !isMyProfile && (
                        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteConfirmation}>
                            <Text style={styles.deleteButtonText}>Delete Contact</Text>
                        </TouchableOpacity>
                    )}
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
};


// Action Button Component
const ActionButton = ({ icon, color, action, isCardPressed, size = 40, iconSize = 20 }) => {
    const [isPressed, setIsPressed] = useState(false);

    const buttonStyle = [
        styles.actionButtonBase,
        { backgroundColor: color, width: size, height: size, borderRadius: size / 2 },
        isPressed && { transform: [{ scale: 0.9 }], opacity: 0.8 },
        isCardPressed && { opacity: 0.8 }
    ];

    return (
        <TouchableOpacity
            style={buttonStyle}
            onPress={(e) => {
                e.stopPropagation();
                action();
            }}
            onPressIn={() => setIsPressed(true)}
            onPressOut={() => setIsPressed(false)}
        >
            <Text style={[styles.actionIconText, { fontSize: iconSize }]}>{icon}</Text>
        </TouchableOpacity>
    );
};


// My Profile Card
const MyProfileCard = ({ item, onEdit }) => {
    return (
        <View style={[styles.contactCard, styles.contactCardRaised, styles.profileCardContainer]}>
            <View style={styles.avatarWrapper}>
                <Image
                    source={{ uri: item.avatar }}
                    style={[styles.avatar, styles.profileAvatar]}
                />
                <View style={styles.statusBadge} />
            </View>

            <View style={styles.infoContainer}>
                <Text style={styles.profileNameText}>{item.name} (Me)</Text>
                <Text style={styles.profileTitleText}>⭐️ {item.title}</Text>
                <Text style={styles.detailText}>📞 {item.phone}</Text>
                <Text style={styles.emailText}>✉️ {item.email}</Text>
            </View>

            <View style={styles.profileActionButtonsContainer}>
                <ActionButton
                    icon="⚙️" // Settings/Edit icon
                    color={styles.ACCENT_COLOR.color}
                    action={onEdit}
                    isCardPressed={false}
                    size={38}
                    iconSize={20}
                />
            </View>
        </View>
    );
};


// Single Contact Card Component (List Item)
const ContactItem = ({ item, onEdit, onDelete }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const swipeableRef = useRef(null);

    // Close the swipeable if a CRUD action is initiated from outside
    useEffect(() => {
        if (!isPressed && swipeableRef.current) {
            swipeableRef.current.close();
        }
    }, [isPressed]);

    const cardStyle = [
        styles.contactCard,
        isPressed ? styles.contactCardPressed : styles.contactCardRaised,
        Platform.OS === 'web' && isHovered && styles.contactCardHover,
    ];

    const renderRightActions = useCallback(() => (
        <RightSwipeActions
            onDelete={() => onDelete(item.id)}
            onEdit={() => onEdit(item)}
        />
    ), [item, onDelete, onEdit]);

    return (
        <View style={styles.contactWrapper}>
            <Swipeable
                ref={swipeableRef}
                overshootRight={false}
                // Disable swipe actions on web as they conflict with hover and don't work as expected
                renderRightActions={Platform.OS === 'web' ? null : renderRightActions}
            >
                <TouchableOpacity
                    style={cardStyle}
                    // Prevent default on web to allow hover to work correctly on non-native components
                    // on web, we handle the edit/delete via a separate button or context menu if needed
                    onPress={() => Platform.OS !== 'web' && console.log(`Opening detail for ${item.name}`)}
                    onPressIn={() => setIsPressed(true)}
                    onPressOut={() => setIsPressed(false)}
                    onMouseEnter={() => Platform.OS === 'web' && setIsHovered(true)}
                    onMouseLeave={() => Platform.OS === 'web' && setIsHovered(false)}
                >
                    <View style={styles.avatarWrapper}>
                        <Image
                            source={{ uri: item.avatar || `https://i.pravatar.cc/150?u=${item.id}` }}
                            style={styles.avatar}
                        />
                        <View style={styles.statusBadge} />
                    </View>

                    <View style={styles.infoContainer}>
                        <Text style={styles.nameText}>{item.name}</Text>
                        <Text style={styles.detailText}>📞 {item.phone}</Text>
                        <Text style={styles.emailText}>✉️ {item.email}</Text>
                    </View>

                    <View style={styles.actionButtonsContainer}>
                        {/* 1. Call Button */}
                        <ActionButton
                            icon="📞"
                            color={styles.CALL_COLOR.backgroundColor}
                            action={() => handleCall(item.phone)}
                            isCardPressed={isPressed}
                            size={38}
                            iconSize={18}
                        />

                        {/* 2. SMS Button */}
                        <ActionButton
                            icon="📨"
                            color={styles.SMS_COLOR.backgroundColor}
                            action={() => handleSMS(item.phone)}
                            isCardPressed={isPressed}
                            size={38}
                            iconSize={20}
                        />

                        {/* 3. Email Button */}
                        <ActionButton
                            icon="📧"
                            color={styles.EMAIL_COLOR.backgroundColor}
                            action={() => handleEmail(item.email)}
                            isCardPressed={isPressed}
                            size={38}
                            iconSize={20}
                        />
                    </View>
                </TouchableOpacity>
            </Swipeable>
        </View>
    );
};

// Section Header Component 
const SectionHeader = ({ title }) => (
    <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
);

// Alphabet Index Bar Component 
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


// MAIN APPLICATION COMPONENT 
function MainApp() {
    const [myProfile, setMyProfile] = useState(MY_INITIAL_PROFILE);
    const [allContacts, setAllContacts] = useState(initialContacts);
    const [searchText, setSearchText] = useState('');

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [isEditingMyProfile, setIsEditingMyProfile] = useState(false);

    const sectionListRef = useRef(null);

    // CRUD LOGIC
    const handleSaveContact = (updatedItem) => {
        if (isEditingMyProfile) {
            setMyProfile(updatedItem);
            showAlert('Success', 'Profile updated successfully!');
        } else if (updatedItem.id) {
            setAllContacts(prevContacts => prevContacts.map(c =>
                c.id === updatedItem.id ? updatedItem : c
            ));
            showAlert('Success', `${updatedItem.name} updated successfully!`);
        } else {
            const newId = `contact-${Date.now()}`;
            const newContact = {
                ...updatedItem,
                id: newId,
                avatar: `https://i.pravatar.cc/150?u=${newId}`,
            };
            setAllContacts(prevContacts => [...prevContacts, newContact]);
            showAlert('Success', `${newContact.name} added successfully!`);
        }
        setIsModalVisible(false);
    };

    const handleDeleteContact = (idToDelete) => {
        setAllContacts(prevContacts => prevContacts.filter(c => c.id !== idToDelete));
        showAlert('Success', 'Contact deleted successfully.');
    };

    const openEditModal = (item) => {
        setEditingItem(item);
        setIsEditingMyProfile(false);
        setIsModalVisible(true);
    };

    const openMyProfileEditModal = () => {
        setEditingItem(myProfile);
        setIsEditingMyProfile(true);
        setIsModalVisible(true);
    };

    const openAddContactModal = () => {
        setEditingItem({});
        setIsEditingMyProfile(false);
        setIsModalVisible(true);
    };

    const { sections: contactSections, sectionTitles } = useMemo(() => {
        const filteredContacts = allContacts.filter(contact =>
            contact.name.toLowerCase().includes(searchText.toLowerCase())
        );
        return groupContactsByLetter(filteredContacts);
    }, [searchText, allContacts]);

    // Function to scroll to the selected alphabet section
    const handleIndexLetterPress = useCallback((letter) => {
        if (sectionListRef.current) {
            const sectionIndex = contactSections.findIndex(section => section.title === letter);
            if (sectionIndex !== -1) {
                // Use a slight timeout to ensure layout updates are done before scrolling
                setTimeout(() => {
                    if (sectionListRef.current) {
                        sectionListRef.current.scrollToLocation({
                            sectionIndex: sectionIndex,
                            itemIndex: 0,
                            animated: true,
                            viewOffset: 30, // Adjust this offset for better positioning
                        });
                    }
                }, 10);
            }
        }
    }, [contactSections]);

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor={styles.PRIMARY_NAVY.backgroundColor} />

            {/* Header and Search */}
            <View style={styles.headerContainer}>
                <View style={styles.headerTitleRow}>
                    <Text style={styles.headerTitle}>My Contacts</Text>
                    {/* Add Button */}
                    <ActionButton
                        icon="➕"
                        color={styles.CALL_COLOR.backgroundColor}
                        action={openAddContactModal}
                        size={35}
                        iconSize={18}
                    />
                </View>

                <View style={styles.searchContainer}>
                    <View style={styles.searchInputWrapper}>
                        <Text style={styles.searchIcon}>🔍</Text>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search contacts..."
                            placeholderTextColor={styles.TEXT_GRAY.color}
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
            </View>

            {/* Content Container (List and Index Bar side-by-side) */}
            <View style={styles.contentWrapper}>
                <SectionList
                    ref={sectionListRef}
                    style={styles.sectionList}
                    sections={contactSections}
                    renderItem={({ item }) => (
                        <ContactItem
                            item={item}
                            onEdit={openEditModal}
                            onDelete={handleDeleteContact}
                        />
                    )}
                    renderSectionHeader={({ section: { title } }) => (
                        <SectionHeader title={title} />
                    )}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    stickySectionHeadersEnabled={true}
                    ListEmptyComponent={() => (
                        <Text style={styles.emptyListText}>
                            {searchText ? `No contacts found for "${searchText}".` : 'Your contact list is empty.'}
                        </Text>
                    )}
                    ListHeaderComponent={() => (
                        <View style={styles.listHeaderComponent}>
                            <MyProfileCard item={myProfile} onEdit={openMyProfileEditModal} />
                            <SectionHeader title="Team & Contacts" />
                        </View>
                    )}
                />

                {/* Index Bar is hidden during search or when no contacts are available */}
                {contactSections.length > 0 && searchText.length === 0 && (
                    <IndexBar
                        sectionTitles={sectionTitles}
                        onLetterPress={handleIndexLetterPress}
                    />
                )}
            </View>

            {/* Contact Edit/Add Modal */}
            <ContactFormModal
                isVisible={isModalVisible}
                onClose={() => setIsModalVisible(false)}
                initialData={editingItem}
                onSave={handleSaveContact}
                isMyProfile={isEditingMyProfile}
                onDelete={handleDeleteContact}
            />

        </SafeAreaView>
    );
}


// APP WRAPPER WITH GestureHandlerRootView
export default function App() {
    return (
        <SafeAreaProvider>
            {/* This is the required wrapper for react-native-gesture-handler to work */}
            <GestureHandlerRootView style={{ flex: 1 }}>
                <MainApp />
            </GestureHandlerRootView>
        </SafeAreaProvider>
    );
}


// STYLING & COLOR PALETTE 💅
const styles = StyleSheet.create({
    // --- COLOR PALETTE ---
    PRIMARY_NAVY: { backgroundColor: '#1A237E' },
    ACCENT_COLOR: { color: '#1A237E', backgroundColor: '#1A237E' }, // Use primary as accent
    LIGHT_BG: { backgroundColor: '#F5F8FA' },
    CARD_BG: { backgroundColor: '#FFFFFF' },
    TEXT_DARK: { color: '#263238' },
    TEXT_GRAY: { color: '#607D8B' },
    CALL_COLOR: { backgroundColor: '#4CAF50' },
    EDIT_COLOR: { backgroundColor: '#FFC107' },
    DELETE_COLOR: { backgroundColor: '#E53935' },
    EMAIL_COLOR: { backgroundColor: '#03A9F4' },
    SMS_COLOR: { backgroundColor: '#8BC34A' },

    // BASE & LAYOUT
    safeArea: {
        flex: 1,
        backgroundColor: '#F5F8FA',
    },

    // Header
    headerContainer: {
        paddingHorizontal: 20,
        paddingVertical: 20,
        backgroundColor: '#1A237E',
        shadowColor: 'transparent',
        elevation: 0,
    },
    headerTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    headerTitle: {
        fontSize: 30,
        fontWeight: '900',
        color: '#FFFFFF',
        paddingTop: Platform.OS === 'android' ? 0 : 5,
    },

    // Search Bar 
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
        marginTop: 10,
    },
    searchInputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    },
    searchIcon: {
        fontSize: 18,
        color: '#FFFFFF',
        marginRight: 10,
        opacity: 0.8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#FFFFFF',
        fontWeight: '500',
        height: Platform.OS === 'android' ? 36 : null,
    },
    clearButton: {
        marginLeft: 15,
        paddingVertical: 10,
        backgroundColor: 'transparent',
    },
    clearButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 15,
    },

    // List Layout & Cards
    contentWrapper: {
        flex: 1,
        flexDirection: 'row',
        paddingHorizontal: 10,
        backgroundColor: '#F5F8FA',
    },
    sectionList: {
        flex: 1,
    },
    listContent: {
        paddingTop: 10,
        paddingBottom: 40,
        paddingRight: 5,
    },
    emptyListText: {
        textAlign: 'center',
        marginTop: 50,
        fontSize: 18,
        color: '#607D8B',
    },

    // Wrapper for each contact row (to hold outer margin)
    contactWrapper: {
        marginVertical: 6,
        marginHorizontal: 5,
        borderRadius: 16,
        overflow: 'hidden',
    },

    // Contact Card (Placed inside Swipeable)
    contactCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#FFFFFF',
        minHeight: 85, // Ensure minimum height for action buttons
    },
    contactCardRaised: {
        shadowColor: '#1A237E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 6,
    },
    contactCardPressed: {
        transform: [{ scale: 1 }],
        opacity: 0.95,
    },
    contactCardHover: {
        transform: [{ scale: 1.01 }],
        shadowOpacity: 0.15,
    },

    // Profile Card Specific Styles
    profileCardContainer: {
        marginBottom: 20,
        backgroundColor: '#CFD8DC',
        borderWidth: 0,
        borderRadius: 16,
        paddingVertical: 20,
    },
    profileAvatar: {
        width: 70,
        height: 70,
        borderRadius: 35,
        borderColor: '#1A237E',
        borderWidth: 4,
    },
    profileNameText: {
        fontSize: 22,
        fontWeight: '800',
        color: '#263238',
    },
    profileTitleText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#607D8B',
        marginBottom: 5,
    },
    profileActionButtonsContainer: {
        width: 40,
    },

    // Avatar & Info
    avatarWrapper: {
        position: 'relative',
        marginRight: 15,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: '#1A237E',
        opacity: 0.8,
    },
    statusBadge: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#4CAF50',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    infoContainer: {
        flex: 1,
        maxWidth: '50%', // Limits width to make space for action buttons
        paddingRight: 10,
    },
    nameText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#263238',
    },
    detailText: {
        fontSize: 14,
        color: '#607D8B',
        marginTop: 4,
    },
    emailText: {
        fontSize: 13,
        color: '#607D8B',
        opacity: 0.8,
    },

    // Action Button Styling (Call, SMS, Email) 
    actionButtonsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: 120, // Width for 3 buttons
        marginLeft: 5,
    },
    actionButtonBase: {
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 3,
    },
    actionIconText: {
        color: '#FFFFFF',
        fontWeight: '900',
    },

    // SWIPE ACTIONS STYLING 
    swipeActionContainer: {
        flexDirection: 'row',
        alignItems: 'stretch',
        justifyContent: 'flex-end',
        width: 170, // Total width (85 * 2)
        borderRadius: 16,
        marginVertical: 6,
        marginRight: 5,
        overflow: 'hidden',
    },
    swipeButton: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 85,
        paddingHorizontal: 5,
    },
    swipeButtonText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 16,
        marginTop: 3,
    },

    // Section Header & Index Bar
    sectionHeader: {
        backgroundColor: '#F5F8FA',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderBottomWidth: 0,
        zIndex: 1,
    },
    sectionHeaderText: {
        fontSize: 17,
        fontWeight: '800',
        color: '#263238',
        textTransform: 'uppercase',
        opacity: 0.7,
    },
    indexBarContainer: {
        paddingVertical: 15,
        width: 30,
        alignItems: 'center',
        justifyContent: 'flex-start',
        backgroundColor: 'transparent',
        position: 'absolute',
        right: 0,
        top: 20,
        bottom: 20,
        zIndex: 10,
    },
    indexLetterWrapper: {
        paddingVertical: 2,
    },
    indexLetterText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#1A237E',
    },

    // MODAL STYLES  
    modalSafeArea: {
        flex: 1,
        backgroundColor: '#1A237E',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 30,
        backgroundColor: '#1A237E',
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    closeButton: {
        padding: 5,
    },
    closeButtonText: {
        fontSize: 20,
        color: '#FFFFFF',
    },
    modalContent: {
        flexGrow: 1,
        padding: 25,
        backgroundColor: '#FFFFFF',
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#263238',
        marginTop: 20,
        marginBottom: 8,
    },
    modalInput: {
        backgroundColor: '#F5F8FA',
        borderRadius: 10,
        padding: 15,
        fontSize: 16,
        borderColor: '#E0E0E0',
        borderWidth: 1,
        color: '#263238',
    },
    saveButton: {
        backgroundColor: '#4CAF50',
        padding: 15,
        borderRadius: 12,
        marginTop: 40,
        alignItems: 'center',
        shadowColor: '#4CAF50',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
    deleteButton: {
        backgroundColor: '#E53935',
        padding: 15,
        borderRadius: 12,
        marginTop: 15,
        alignItems: 'center',
    },
    deleteButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
});