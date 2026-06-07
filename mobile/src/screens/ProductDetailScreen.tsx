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

export function ProductDetailScreen({ route, navigation }: any) {
  const { id } = route.params;
  const [product, setProduct] = useState<any>(null);

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
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('Cart')}>
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
  addButton: { backgroundColor: '#6418E5', borderRadius: 12, padding: 16, alignItems: 'center' },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
