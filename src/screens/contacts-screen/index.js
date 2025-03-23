import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  Pressable,
  TextInput,
  Alert,
  Linking,
  NativeModules,
  Modal,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Geolocation from 'react-native-geolocation-service';
import requestContactsPermission, {
  requestLocationPermission,
} from '../../scripts/permissions';
import {styles} from './styles';
const {ContactsModule} = NativeModules;

export default function ContactsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const loadSelectedContacts = async () => {
      const storedContacts = await AsyncStorage.getItem('selectedContacts');
      if (storedContacts) {
        const data = JSON.parse(storedContacts);
        const uniqueContacts = data.filter(
          (contact, index, self) =>
            index === self.findIndex(c => c.phone === contact.phone),
        );
        setSelectedContacts(uniqueContacts);
      }
    };
    loadSelectedContacts();
  }, []);

  async function fetchContacts() {
    const hasLocationPermission = await requestLocationPermission();
    const hasPermission = await requestContactsPermission();
    if (!hasPermission || !hasLocationPermission) {
      Alert.alert(
        'Permission Required',
        'Enable contacts or location access in settings.',
        [
          {text: 'Cancel', style: 'cancel'},
          {text: 'Open Settings', onPress: () => Linking.openSettings()},
        ],
      );
      return;
    }
    ContactsModule.getContacts().then(setContacts).catch(console.error);
  }

  useEffect(() => {
    fetchContacts();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('selectedContacts', JSON.stringify(selectedContacts));
  }, [selectedContacts]);

  const toggleSelect = contact => {
    setSelectedContacts(prev => {
      const exists = prev.some(item => item.phone === contact.phone);
      return exists
        ? prev.filter(item => item.phone !== contact.phone)
        : [...prev, contact];
    });
  };

  const sendLocation = async () => {
    console.log(selectedContacts);
    if (selectedContacts.length === 0) {
      setModalVisible(true);
      return;
    }
    const name = await AsyncStorage.getItem('driverName');
    const vehicle = await AsyncStorage.getItem('driverVehicleNumber');
    const contact = await AsyncStorage.getItem('driverContact');

    Geolocation.getCurrentPosition(
      position => {
        const {latitude, longitude} = position.coords;
        const locationMessage = `🚨 Emergency Alert! Driver: ${name}, Contact: ${contact}, Vehicle No: ${vehicle}. My Current Location: https://maps.google.com/?q=${latitude},${longitude}`;
        const phoneNumbers = selectedContacts
          .map(c => c.phone.replace(/\D/g, ''))
          .filter(n => n.length > 0);
        if (phoneNumbers.length === 0) {
          Alert.alert('Error', 'No valid phone numbers found!');
          return;
        }
        const smsUrl = `sms:${phoneNumbers.join(',')}?body=${encodeURIComponent(
          locationMessage,
        )}`;
        Linking.openURL(smsUrl).catch(() =>
          Alert.alert('Error', 'SMS app not available.'),
        );
      },
      error => Alert.alert('Error', error.message),
      {enableHighAccuracy: true, timeout: 20000, maximumAge: 1000},
    );
  };

  const renderContact = ({item}) => {
    const isSelected = selectedContacts.some(c => c.phone === item.phone);
    return (
      <Pressable
        style={({pressed}) => [styles.contactCard, pressed && styles.pressed]}
        onPress={() => toggleSelect(item)}>
        <Ionicons
          name={isSelected ? 'checkbox' : 'square-outline'}
          size={24}
          color={isSelected ? '#3182CE' : '#A0AEC0'}
        />
        <Image source={{uri: item.photoUri}} style={styles.avatar} />
        <View style={styles.contactInfo}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.phone}>{item.phone}</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Contacts</Text>
      </View>
      <FlatList
        data={selectedContacts.filter(c =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()),
        )}
        renderItem={renderContact}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
      <View style={styles.footer}>
        <View style={styles.buttonContainer}>
          <Pressable
            style={[styles.button, styles.addButton]}
            onPress={() => {
              setModalVisible(true);
            }}>
            <Text style={styles.buttonText}>Add Contacts</Text>
          </Pressable>
          <Pressable
            style={[styles.button, styles.cancelButton]}
            onPress={sendLocation}>
            <Text style={styles.buttonText}>Send Location</Text>
          </Pressable>
        </View>
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.searchContainer}>
              <Ionicons
                name="search"
                size={20}
                color="#A0AEC0"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search contacts..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#A0AEC0"
              />
            </View>
            <FlatList
              data={contacts.filter(c =>
                c.name.toLowerCase().includes(searchQuery.toLowerCase()),
              )}
              renderItem={renderContact}
              keyExtractor={(item, index) => index.toString()}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
            />
            <View style={styles.buttonContainer}>
              <Pressable
                style={[styles.button, styles.cancelButton]}
                onPress={() => setModalVisible(false)}>
                <Text style={styles.buttonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.button, styles.addButton]}
                onPress={() => {
                  fetchContacts();
                  setModalVisible(false);
                }}>
                <Text style={styles.buttonText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
