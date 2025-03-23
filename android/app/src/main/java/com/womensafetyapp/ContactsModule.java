package com.womensafetyapp;

import android.database.Cursor;
import android.provider.ContactsContract;
import android.content.Context;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;
import java.util.HashSet;
import java.util.ArrayList;
import android.util.Log;
import android.content.ContentResolver;


public class ContactsModule extends ReactContextBaseJavaModule {

    private final ReactApplicationContext reactContext;

    public ContactsModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @NonNull
    @Override
    public String getName() {
        return "ContactsModule";
    }

    @ReactMethod
    public void getContacts(Promise promise) {
        Log.d("ContactsModule", "getContacts() called");

        try {
            WritableArray contactsArray = Arguments.createArray();
            HashSet<String> uniqueContacts = new HashSet<>(); // To store unique contacts
            ContentResolver contentResolver = getReactApplicationContext().getContentResolver();

            Cursor cursor = contentResolver.query(
                    ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
                    new String[] {
                            ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME,
                            ContactsContract.CommonDataKinds.Phone.NUMBER
                    },
                    null,
                    null,
                    ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME + " ASC" // Sort by name
            );

            if (cursor != null) {
                while (cursor.moveToNext()) {
                    String name = cursor.getString(
                            cursor.getColumnIndexOrThrow(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME));
                    String phone = cursor
                            .getString(cursor.getColumnIndexOrThrow(ContactsContract.CommonDataKinds.Phone.NUMBER));

                    // Avoid duplicates
                    String contactKey = name + phone;
                    if (!uniqueContacts.contains(contactKey)) {
                        uniqueContacts.add(contactKey);

                        WritableMap contact = Arguments.createMap();
                        contact.putString("name", name);
                        contact.putString("phone", phone);
                        contactsArray.pushMap(contact);
                    }
                }
                cursor.close();
            }

            Log.d("ContactsModule", "Total Contacts Fetched: " + contactsArray.size());
            promise.resolve(contactsArray);
        } catch (Exception e) {
            Log.e("ContactsModule", "Error fetching contacts: " + e.getMessage());
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void getAllInfoContacts(Promise promise) {
        Log.d("ContactsModule", "getContacts() called");

        try {
            WritableArray contactsArray = Arguments.createArray();
            ContentResolver contentResolver = getReactApplicationContext().getContentResolver();

            Cursor cursor = contentResolver.query(
                    ContactsContract.Contacts.CONTENT_URI,
                    null, // Fetch all available fields
                    null,
                    null,
                    ContactsContract.Contacts.DISPLAY_NAME + " ASC" // Sort by name
            );

            if (cursor != null) {
                while (cursor.moveToNext()) {
                    String contactId = cursor.getString(cursor.getColumnIndexOrThrow(ContactsContract.Contacts._ID));
                    String name = cursor
                            .getString(cursor.getColumnIndexOrThrow(ContactsContract.Contacts.DISPLAY_NAME));

                    WritableMap contact = Arguments.createMap();
                    contact.putString("id", contactId);
                    contact.putString("name", name);

                    // 📞 Fetch phone numbers
                    WritableArray phoneNumbers = Arguments.createArray();
                    Cursor phoneCursor = contentResolver.query(
                            ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
                            new String[] { ContactsContract.CommonDataKinds.Phone.NUMBER,
                                    ContactsContract.CommonDataKinds.Phone.TYPE },
                            ContactsContract.CommonDataKinds.Phone.CONTACT_ID + " = ?",
                            new String[] { contactId },
                            null);

                    if (phoneCursor != null) {
                        while (phoneCursor.moveToNext()) {
                            WritableMap phoneNumber = Arguments.createMap();
                            phoneNumber.putString("number", phoneCursor.getString(
                                    phoneCursor.getColumnIndexOrThrow(ContactsContract.CommonDataKinds.Phone.NUMBER)));
                            phoneNumber.putInt("type", phoneCursor.getInt(
                                    phoneCursor.getColumnIndexOrThrow(ContactsContract.CommonDataKinds.Phone.TYPE)));
                            phoneNumbers.pushMap(phoneNumber);
                        }
                        phoneCursor.close();
                    }
                    contact.putArray("phoneNumbers", phoneNumbers);

                    // 📧 Fetch emails
                    WritableArray emails = Arguments.createArray();
                    Cursor emailCursor = contentResolver.query(
                            ContactsContract.CommonDataKinds.Email.CONTENT_URI,
                            new String[] { ContactsContract.CommonDataKinds.Email.ADDRESS,
                                    ContactsContract.CommonDataKinds.Email.TYPE },
                            ContactsContract.CommonDataKinds.Email.CONTACT_ID + " = ?",
                            new String[] { contactId },
                            null);

                    if (emailCursor != null) {
                        while (emailCursor.moveToNext()) {
                            WritableMap email = Arguments.createMap();
                            email.putString("address", emailCursor.getString(
                                    emailCursor.getColumnIndexOrThrow(ContactsContract.CommonDataKinds.Email.ADDRESS)));
                            email.putInt("type", emailCursor.getInt(
                                    emailCursor.getColumnIndexOrThrow(ContactsContract.CommonDataKinds.Email.TYPE)));
                            emails.pushMap(email);
                        }
                        emailCursor.close();
                    }
                    contact.putArray("emails", emails);

                    // 🏢 Fetch organization details (Company & Job Title)
                    Cursor orgCursor = contentResolver.query(
                            ContactsContract.Data.CONTENT_URI,
                            new String[] { ContactsContract.CommonDataKinds.Organization.COMPANY,
                                    ContactsContract.CommonDataKinds.Organization.TITLE },
                            ContactsContract.Data.CONTACT_ID + " = ? AND " + ContactsContract.Data.MIMETYPE + " = ?",
                            new String[] { contactId, ContactsContract.CommonDataKinds.Organization.CONTENT_ITEM_TYPE },
                            null);

                    if (orgCursor != null && orgCursor.moveToFirst()) {
                        contact.putString("company", orgCursor.getString(orgCursor
                                .getColumnIndexOrThrow(ContactsContract.CommonDataKinds.Organization.COMPANY)));
                        contact.putString("jobTitle", orgCursor.getString(
                                orgCursor.getColumnIndexOrThrow(ContactsContract.CommonDataKinds.Organization.TITLE)));
                        orgCursor.close();
                    }

                    // 🏡 Fetch addresses
                    WritableArray addresses = Arguments.createArray();
                    Cursor addressCursor = contentResolver.query(
                            ContactsContract.CommonDataKinds.StructuredPostal.CONTENT_URI,
                            new String[] { ContactsContract.CommonDataKinds.StructuredPostal.FORMATTED_ADDRESS },
                            ContactsContract.CommonDataKinds.StructuredPostal.CONTACT_ID + " = ?",
                            new String[] { contactId },
                            null);

                    if (addressCursor != null) {
                        while (addressCursor.moveToNext()) {
                            addresses.pushString(addressCursor.getString(addressCursor.getColumnIndexOrThrow(
                                    ContactsContract.CommonDataKinds.StructuredPostal.FORMATTED_ADDRESS)));
                        }
                        addressCursor.close();
                    }
                    contact.putArray("addresses", addresses);

                    // 🖼️ Fetch profile photo URI
                    String photoUri = cursor
                            .getString(cursor.getColumnIndexOrThrow(ContactsContract.Contacts.PHOTO_URI));
                    contact.putString("photoUri", photoUri != null ? photoUri : "");

                    contactsArray.pushMap(contact);
                }
                cursor.close();
            }

            Log.d("ContactsModule", "Total Contacts Fetched: " + contactsArray.size());
            promise.resolve(contactsArray);
        } catch (Exception e) {
            Log.e("ContactsModule", "Error fetching contacts: " + e.getMessage());
            promise.reject("ERROR", e.getMessage());
        }
    }

}
