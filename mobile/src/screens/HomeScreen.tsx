import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { apiGet } from '../services/api';
import { ProductCard } from '../components/ProductCard';

interface Product {
  id: string;
  title: string;
  price: number;
  images: string[];
  storeId: string;
  rating: number;
}

export function HomeScreen({ navigation }: any) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    apiGet<Product[]>('/products?limit=20').then(setProducts).finally(() => setLoading(false));
  }, []);

  const searchProducts = (q: string) => {
    setLoading(true);
    apiGet<Product[]>('/products?q=' + encodeURIComponent(q)).then(setProducts).finally(() => setLoading(false));
  };

  return (
    <View style={styles.container}>
      <TextInput style={styles.searchBar} placeholder="Ürün, marka veya kategori ara..." value={query} onChangeText={setQuery} onSubmitEditing={() => searchProducts(query)} />
      {loading ? <ActivityIndicator size="large" color="#6418E5" /> : (
        <FlatList data={products} keyExtractor={(item) => item.id} numColumns={2}
          renderItem={({ item }) => <ProductCard product={item} onPress={() => navigation.navigate('ProductDetail', { id: item.id })} />} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#18181b', padding: 12 },
  searchBar: { backgroundColor: '#27272a', color: '#fff', borderRadius: 8, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#3f3f46' },
});
