import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { apiGet } from '../services/api';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

interface Product {
  id: string;
  title: string;
  price: number;
  images: string[];
}

export function WishlistScreen({ navigation }: any) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const wishlistIds: string[] = await apiGet<string[]>('/wishlist');
      if (!wishlistIds || wishlistIds.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }
      const productPromises = wishlistIds.map((id) =>
        apiGet<Product>(`/products/${id}`).catch(() => null),
      );
      const results = await Promise.all(productPromises);
      setProducts(results.filter(Boolean) as Product[]);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6418E5" />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  if (products.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyIcon}>♡</Text>
        <Text style={styles.emptyText}>Favori ürününüz yok</Text>
      </View>
    );
  }

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
    >
      <Image
        source={{
          uri: item.images?.[0] || 'https://via.placeholder.com/200',
        }}
        style={styles.image}
      />
      <View style={styles.cardBody}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.price}>
          {Number(item.price).toLocaleString('tr-TR', {
            style: 'currency',
            currency: 'TRY',
          })}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Favorilerim</Text>
      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#18181b',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  centered: {
    flex: 1,
    backgroundColor: '#18181b',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },
  loadingText: {
    color: '#a1a1aa',
    fontSize: 14,
    marginTop: 12,
  },
  emptyIcon: {
    fontSize: 48,
    color: '#6418E5',
    marginBottom: 12,
  },
  emptyText: {
    color: '#a1a1aa',
    fontSize: 16,
  },
  list: {
    paddingBottom: 24,
  },
  row: {
    gap: 16,
    marginBottom: 16,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#27272a',
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: CARD_WIDTH,
    height: CARD_WIDTH,
    backgroundColor: '#3f3f46',
  },
  cardBody: {
    padding: 10,
  },
  title: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  price: {
    color: '#22c55e',
    fontSize: 14,
    fontWeight: '700',
  },
});
