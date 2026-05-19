import React, { useState } from 'react';
import {
  View, Text, Image, ScrollView, StyleSheet, TouchableOpacity,
  SafeAreaView, Alert, ActivityIndicator,
} from 'react-native';
import { theme } from '../theme';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Product } from '../types';

interface Props {
  route: { params: { product: Product } };
  navigation: any;
}

export function ProductDetailScreen({ route, navigation }: Props) {
  const { product } = route.params;
  const { user } = useAuth();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  const handleAddToCart = async () => {
    if (!user) {
      Alert.alert('Giriş Yapın', 'Sepete eklemek için giriş yapmalısınız.', [
        { text: 'Giriş Yap', onPress: () => navigation.navigate('Auth') },
        { text: 'İptal', style: 'cancel' },
      ]);
      return;
    }
    setAdding(true);
    addItem({
      productId: product.id,
      sellerId: product.sellerId,
      name: product.title,
      price: product.price,
      quantity,
      image: product.images?.[0] || '',
      stock: product.stock,
    });
    setAdding(false);
    Alert.alert('Sepete Eklendi', `${product.title} (${quantity} adet)`, [
      { text: 'Alışverişe Devam Et', style: 'cancel' },
      { text: 'Sepete Git', onPress: () => navigation.navigate('CartTab') },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll}>
        {/* Image */}
        <Image
          source={{ uri: product.images?.[0] || 'https://via.placeholder.com/600' }}
          style={styles.image}
          resizeMode="cover"
        />

        <View style={styles.body}>
          {/* Title */}
          <Text style={styles.title}>{product.title}</Text>

          {/* Price */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>
              {product.price.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
            </Text>
            {product.compareAtPrice && (
              <Text style={styles.oldPrice}>
                {product.compareAtPrice.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
              </Text>
            )}
          </View>

          {/* Rating */}
          <View style={styles.ratingRow}>
            <Text style={styles.rating}>★ {product.rating.toFixed(1)}</Text>
            <Text style={styles.reviewCount}>({product.reviewCount} değerlendirme)</Text>
          </View>

          {/* Stock */}
          <View style={styles.stockRow}>
            <Text style={[styles.stockText, product.stock > 0 ? styles.inStock : styles.outOfStock]}>
              {product.stock > 0 ? `Stokta (${product.stock} adet)` : 'Stokta Yok'}
            </Text>
            {product.estimatedDelivery && (
              <Text style={styles.delivery}>Tahmini Teslimat: {product.estimatedDelivery}</Text>
            )}
          </View>

          {/* Quantity */}
          <View style={styles.qtyRow}>
            <Text style={styles.label}>Adet:</Text>
            <View style={styles.qtyControl}>
              <TouchableOpacity
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                style={styles.qtyBtn}
              >
                <Text style={styles.qtyBtnText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.qtyValue}>{quantity}</Text>
              <TouchableOpacity
                onPress={() => setQuantity(Math.min(product.stock || 99, quantity + 1))}
                style={styles.qtyBtn}
              >
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.sectionTitle}>Açıklama</Text>
          <Text style={styles.description}>{product.description}</Text>

          {/* Add to Cart */}
          <TouchableOpacity
            style={[styles.addBtn, (adding || product.stock <= 0) && styles.addBtnDisabled]}
            onPress={handleAddToCart}
            disabled={adding || product.stock <= 0}
            activeOpacity={0.9}
          >
            {adding ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.addBtnText}>
                {product.stock > 0 ? 'Sepete Ekle' : 'Stokta Yok'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.white },
  scroll: { flex: 1 },
  image: {
    width: '100%',
    height: 350,
    backgroundColor: theme.colors.bgLight,
  },
  body: { padding: theme.spacing.lg },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text,
    lineHeight: 28,
    marginBottom: theme.spacing.sm,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  price: {
    fontSize: 24,
    fontWeight: '900',
    color: theme.colors.accent,
  },
  oldPrice: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textDecorationLine: 'line-through',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: theme.spacing.md,
  },
  rating: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.warning,
  },
  reviewCount: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  stockText: { fontSize: 12, fontWeight: '700' },
  inStock: { color: theme.colors.success },
  outOfStock: { color: theme.colors.error },
  delivery: { fontSize: 11, color: theme.colors.textSecondary },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  label: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  qtyBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.bgLight,
  },
  qtyBtnText: { fontSize: 18, fontWeight: '900', color: theme.colors.text },
  qtyValue: {
    width: 48,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  description: {
    fontSize: 13,
    color: theme.colors.text,
    lineHeight: 20,
    opacity: 0.6,
    marginBottom: theme.spacing.xl,
  },
  addBtn: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    ...theme.shadow.md,
  },
  addBtnDisabled: { opacity: 0.5 },
  addBtnText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
});
