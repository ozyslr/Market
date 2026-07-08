import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 36) / 2;

export function ProductCard({ product, onPress }: { product: any; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Image
        source={{ uri: product.images?.[0] || 'https://picsum.photos/200' }}
        style={styles.image}
      />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {product.title}
        </Text>
        <Text style={styles.price}>{product.price?.toFixed(2)} TL</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#27272a',
    borderRadius: 12,
    margin: 4,
    overflow: 'hidden',
  },
  image: { width: '100%', height: CARD_WIDTH * 1.2, resizeMode: 'cover' },
  info: { padding: 8 },
  title: { color: '#fff', fontSize: 12, fontWeight: '600', lineHeight: 16 },
  price: { color: '#6418E5', fontSize: 14, fontWeight: '700', marginTop: 4 },
});
