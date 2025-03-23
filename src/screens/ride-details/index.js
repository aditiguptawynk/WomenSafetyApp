import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  TouchableOpacity,
  SafeAreaView,
  Keyboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomButton from '../../components/custom-button';
import {styles} from './styles';

export default function RideDetails({navigation}) {
  const [driver, setDriver] = useState({name: '', vehicle: '', contact: ''});
  const [storedDriver, setStoredDriver] = useState(null);

  useEffect(() => {
    (async () => {
      const name = await AsyncStorage.getItem('driverName');
      const vehicle = await AsyncStorage.getItem('driverVehicleNumber');
      const contact = await AsyncStorage.getItem('driverContact');
      if (name) setStoredDriver({name, vehicle, contact});
    })();
  }, []);

  const saveDriver = async () => {
    if (!driver.name.trim())
      return Alert.alert('Error', 'Please enter a driver name');
    if (!driver.vehicle.trim())
      return Alert.alert('Error', 'Please enter a driver vehicle');
    if (!driver.contact.trim())
      return Alert.alert('Error', 'Please enter a driver contact');
    try {
      await AsyncStorage.multiSet([
        ['driverName', driver.name],
        ['driverVehicleNumber', driver.vehicle],
        ['driverContact', driver.contact],
      ]);
      setStoredDriver(driver);
      Alert.alert('Success', 'Driver details saved!');
      Keyboard.dismiss();
    } catch {
      Alert.alert('Error', 'Failed to save driver details');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>Women Safety App</Text>
      <View style={styles.formBox}>
        <Text style={styles.header}>Add Ride Details</Text>
        {['Driver Name', 'Vehicle Number', 'Driver Contact'].map((label, i) => (
          <View key={i}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
              style={styles.input}
              placeholder={`Enter ${label.toLowerCase()}`}
              placeholderTextColor="#999"
              value={driver[['name', 'vehicle', 'contact'][i]]}
              onChangeText={text =>
                setDriver({
                  ...driver,
                  [['name', 'vehicle', 'contact'][i]]: text,
                })
              }
              keyboardType={label === 'Driver Contact' ? 'numeric' : 'default'}
            />
          </View>
        ))}
        <CustomButton title="Save Details" onPress={saveDriver} />
      </View>
      {storedDriver && (
        <View style={styles.infoContainer}>
          <Text style={styles.savedText}>🚗 Driver: {storedDriver.name}</Text>
          <Text style={styles.savedText}>
            🔢 Vehicle No: {storedDriver.vehicle}
          </Text>
          <Text style={styles.savedText}>
            📞 Contact: {storedDriver.contact}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('ContactsScreen')}>
            <Text style={styles.shareText}>📤 Share Details</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
