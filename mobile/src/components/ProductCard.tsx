import React from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
} from 'react-native';
import { Product } from '../types';
import { theme } from '../theme';

interface Props {
  product: Product;
  onPress: (product: Product) => void;
}

export function ProductCard({ product, onPress }: Props) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(product)}
      activeOpacity={0.9}
    >
      <Image
        source={{ uri: product.images?.[0] || 'https://via.placeholder.com/300' }}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {product.title}
        </Text>
        <View style={styles.row}>
          <Text style={styles.price}>
            {product.price.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
          </Text>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <Text style={styles.oldPrice}>
              {product.compareAtPrice.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
            </Text>
          )}
        </View>
        <View style={styles.ratingRow}>
          <Text style={styles.rating}>★ {product.rating.toFixed(1)}</Text>
          <Text style={styles.reviewCount}>({product.reviewCount})</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    ...theme.shadow.sm,
  },
  image: {
    width: '100%',
    height: 200,
    backgroundColor: theme.colors.bgLight,
  },
  body: {
    padding: theme.spacing.md,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  price: {
    fontSize: 16,
    fontWeight: '900',
    color: theme.colors.accent,
  },
  oldPrice: {
    fontSize: 12,
    color: theme.colors.textMuted,
    textDecorationLine: 'line-through',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.warning,
  },
  reviewCount: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
});
