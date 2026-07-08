import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { apiGet } from '../services/api';
import { useCartStore } from '../context/cartStore';

export function ProductDetailScreen({ route, navigation }: any) {
  const { id } = route.params;
  const [product, setProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    apiGet('/products/' + id).then(setProduct);
  }, [id]);

  if (!product)
    return <ActivityIndicator size="large" color="#6418E5" style={{ marginTop: 100 }} />;

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: product.images?.[0] }} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.title}>{product.title}</Text>
        <Text style={styles.price}>{product.price?.toFixed(2)} TL</Text>
        {product.brand && <Text style={styles.brand}>{product.brand}</Text>}
        <Text style={styles.description}>{product.description}</Text>
        <View style={styles.qtyRow}>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => setQuantity((q) => Math.max(1, q - 1))}
          >
            <Text style={styles.qtyBtnText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.qtyValue}>{quantity}</Text>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity((q) => q + 1)}>
            <Text style={styles.qtyBtnText}>+</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            addItem({
              id: product.id,
              title: product.title,
              price: product.price,
              quantity,
            });
            navigation.navigate('Cart');
          }}
        >
          <Text style={styles.addButtonText}>Sepete Ekle</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#18181b' },
  image: { width: '100%', height: 320, resizeMode: 'cover' },
  info: { padding: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 8 },
  price: { fontSize: 24, fontWeight: '800', color: '#6418E5', marginBottom: 4 },
  brand: { fontSize: 14, color: '#a1a1aa', marginBottom: 12 },
  description: { fontSize: 14, color: '#d4d4d8', lineHeight: 20, marginBottom: 20 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  qtyBtn: {
    backgroundColor: '#27272a',
    borderRadius: 8,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  qtyValue: { color: '#fff', fontSize: 18, fontWeight: '600', minWidth: 24, textAlign: 'center' },
  addButton: { backgroundColor: '#6418E5', borderRadius: 12, padding: 16, alignItems: 'center' },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
