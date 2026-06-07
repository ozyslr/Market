import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { apiGet } from '../services/api';

export function SellerDashboardScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  useEffect(() => {
    apiGet('/seller/orders')
      .then(setOrders)
      .catch(() => {});
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Satıcı Paneli</Text>
      <Text style={styles.subtitle}>Son Siparişler</Text>
      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        renderItem={({ item }) => (
          <View style={styles.order}>
            <Text style={styles.orderId}>#{item.id?.slice(0, 8)}</Text>
            <Text style={styles.orderStatus}>{item.status}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#18181b', padding: 16 },
  title: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 16 },
  subtitle: { color: '#a1a1aa', fontSize: 14, marginBottom: 8 },
  order: {
    backgroundColor: '#27272a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderId: { color: '#fff', fontSize: 13, fontWeight: '600' },
  orderStatus: { color: '#6418E5', fontSize: 13 },
});
