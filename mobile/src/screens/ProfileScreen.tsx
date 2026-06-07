import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';

export function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profil</Text>
      {user ? (
        <>
          <Text style={styles.email}>{user.email}</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('SellerDashboard')}
          >
            <Text style={styles.buttonText}>Satıcı Paneli</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutText}>Çıkış Yap</Text>
          </TouchableOpacity>
        </>
      ) : (
        <Text style={styles.email}>Giriş yapılmadı</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#18181b',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: '#fff', fontSize: 24, fontWeight: '700', marginBottom: 16 },
  email: { color: '#a1a1aa', fontSize: 16, marginBottom: 24 },
  button: {
    backgroundColor: '#6418E5',
    borderRadius: 12,
    padding: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  logoutButton: { padding: 14 },
  logoutText: { color: '#ef4444', fontSize: 15 },
});
