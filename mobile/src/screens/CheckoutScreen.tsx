import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function CheckoutScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Ödeme Sayfası</Text>
      <Text style={styles.sub}>Stripe / Iyzico entegrasyonu mevcut web API üzerinden</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#18181b', justifyContent: 'center', alignItems: 'center', padding: 20 },
  text: { color: '#fff', fontSize: 20, fontWeight: '700' },
  sub: { color: '#71717a', fontSize: 14, marginTop: 8, textAlign: 'center' },
});
