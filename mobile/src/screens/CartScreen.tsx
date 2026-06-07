import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useCartStore } from '../context/cartStore';

export function CartScreen({ navigation }: any) {
  const { items, total, removeItem } = useCartStore();

  return (
    <View style={styles.container}>
      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Sepetiniz boş</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(i) => i.id}
            renderItem={({ item }) => (
              <View style={styles.item}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemPrice}>
                  {item.price?.toFixed(2)} TL x {item.quantity}
                </Text>
                <TouchableOpacity onPress={() => removeItem(item.id)}>
                  <Text style={styles.remove}>Kaldır</Text>
                </TouchableOpacity>
              </View>
            )}
          />
          <View style={styles.footer}>
            <Text style={styles.total}>Toplam: {total.toFixed(2)} TL</Text>
            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={() => navigation.navigate('Checkout')}
            >
              <Text style={styles.checkoutText}>Ödemeye Geç</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#18181b', padding: 16 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#71717a', fontSize: 16 },
  item: { backgroundColor: '#27272a', borderRadius: 8, padding: 12, marginBottom: 8 },
  itemTitle: { color: '#fff', fontSize: 14, fontWeight: '600' },
  itemPrice: { color: '#a1a1aa', fontSize: 13, marginTop: 4 },
  remove: { color: '#ef4444', fontSize: 12, marginTop: 8 },
  footer: { borderTopWidth: 1, borderTopColor: '#3f3f46', paddingTop: 16, marginTop: 8 },
  total: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  checkoutButton: {
    backgroundColor: '#6418E5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  checkoutText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
