import React from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Image,
  SafeAreaView, Alert,
} from 'react-native';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';

interface Props {
  navigation: any;
}

export function CartScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { items, updateQuantity, removeItem, total, itemCount } = useCart();

  if (!user) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.emptyTitle}>Sepetiniz boş</Text>
        <Text style={styles.emptySub}>Giriş yaparak sepetinizi görüntüleyin.</Text>
        <TouchableOpacity
          style={styles.loginBtn}
          onPress={() => navigation.navigate('Auth')}
        >
          <Text style={styles.loginBtnText}>Giriş Yap</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.emptyTitle}>Sepetiniz boş</Text>
        <Text style={styles.emptySub}>Alışverişe başlamak için ürünleri keşfedin.</Text>
        <TouchableOpacity
          style={styles.loginBtn}
          onPress={() => navigation.navigate('HomeTab')}
        >
          <Text style={styles.loginBtnText}>Alışverişe Başla</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.header}>Sepet ({itemCount} ürün)</Text>

        <FlatList
          data={items}
          keyExtractor={item => item.productId}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <Image source={{ uri: item.image }} style={styles.itemImage} />
              <View style={styles.itemBody}>
                <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.itemPrice}>
                  {item.price.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                </Text>
                <View style={styles.qtyRow}>
                  <TouchableOpacity
                    onPress={() => updateQuantity(item.productId, item.quantity - 1)}
                    style={styles.qtyBtn}
                  >
                    <Text style={styles.qtyBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyValue}>{item.quantity}</Text>
                  <TouchableOpacity
                    onPress={() => updateQuantity(item.productId, item.quantity + 1)}
                    style={styles.qtyBtn}
                  >
                    <Text style={styles.qtyBtnText}>+</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert('Sil', `${item.name} sepetten kaldırılsın mı?`, [
                        { text: 'İptal', style: 'cancel' },
                        { text: 'Sil', style: 'destructive', onPress: () => removeItem(item.productId) },
                      ]);
                    }}
                    style={styles.deleteBtn}
                  >
                    <Text style={styles.deleteBtnText}>Sil</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
          contentContainerStyle={styles.list}
        />

        {/* Bottom */}
        <View style={styles.footer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Toplam</Text>
            <Text style={styles.totalValue}>
              {total.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.checkoutBtn}
            onPress={() => navigation.navigate('Checkout')}
            activeOpacity={0.9}
          >
            <Text style={styles.checkoutBtnText}>Ödemeye Geç</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bgLight },
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.bgLight, padding: theme.spacing.lg },
  emptyTitle: { fontSize: 18, fontWeight: '900', color: theme.colors.text, marginBottom: 8 },
  emptySub: { fontSize: 13, color: theme.colors.textSecondary, marginBottom: theme.spacing.lg, textAlign: 'center' },
  loginBtn: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.lg,
  },
  loginBtnText: { color: '#FFF', fontWeight: '900', fontSize: 12, textTransform: 'uppercase', letterSpacing: 2 },
  header: {
    fontSize: 18, fontWeight: '900', color: theme.colors.text,
    padding: theme.spacing.lg, paddingBottom: theme.spacing.sm,
  },
  list: { paddingHorizontal: theme.spacing.lg, paddingBottom: 180 },
  item: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadow.sm,
  },
  itemImage: {
    width: 80, height: 80, borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.bgLight, marginRight: theme.spacing.md,
  },
  itemBody: { flex: 1 },
  itemName: { fontSize: 13, fontWeight: '700', color: theme.colors.text, marginBottom: 4 },
  itemPrice: { fontSize: 15, fontWeight: '900', color: theme.colors.accent, marginBottom: 8 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: theme.colors.bgLight, alignItems: 'center', justifyContent: 'center',
  },
  qtyBtnText: { fontSize: 16, fontWeight: '900', color: theme.colors.text },
  qtyValue: { fontSize: 14, fontWeight: '700', minWidth: 24, textAlign: 'center' },
  deleteBtn: { marginLeft: 'auto' },
  deleteBtnText: { fontSize: 11, fontWeight: '700', color: theme.colors.error },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: theme.colors.white,
    padding: theme.spacing.lg,
    paddingBottom: 32,
    borderTopWidth: 1, borderTopColor: theme.colors.border,
  },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  totalLabel: { fontSize: 14, fontWeight: '700', color: theme.colors.textSecondary },
  totalValue: { fontSize: 22, fontWeight: '900', color: theme.colors.text },
  checkoutBtn: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: 16, alignItems: 'center',
  },
  checkoutBtnText: {
    color: '#FFF', fontSize: 13, fontWeight: '900',
    textTransform: 'uppercase', letterSpacing: 2,
  },
});
