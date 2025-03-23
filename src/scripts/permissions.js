import {PermissionsAndroid, Platform} from 'react-native';

async function requestContactsPermission() {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
      {
        title: 'Contacts Access Permission',
        message: 'This app needs access to your contacts.',
        buttonPositive: 'OK',
      },
    );

    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      console.log('Contacts permission granted');
      return true;
    } else {
      console.log('Contacts permission denied');
      return false;
    }
  } catch (err) {
    console.warn(err);
    return false;
  }
}

export default requestContactsPermission;

export const requestLocationPermission = async () => {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }
  return true;
};
