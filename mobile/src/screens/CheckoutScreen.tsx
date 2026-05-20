import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, SafeAreaView,
  TextInput, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { doc, setDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

interface Props {
  navigation: any;
}

const PAYMENT_METHODS = [
  { id: 'card', label: 'Kredi Kartı', icon: 'card-outline' as const },
  { id: 'transfer', label: 'Havale/EFT', icon: 'business-outline' as const },
  { id: 'pay_at_door', label: 'Kapıda Ödeme', icon: 'cash-outline' as const },
];

export function CheckoutScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { items, total, clearCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [placing, setPlacing] = useState(false);
  const [couponCode, setCouponCode] = useState('');

  const handlePlaceOrder = async () => {
    if (!user) return;

    // Kredi Kartı → WebView ödeme
    if (paymentMethod === 'card') {
      navigation.navigate('PaymentWebView', {
        items,
        total,
      });
      return;
    }

    // Diğer ödeme yöntemleri (havale/EFT, kapıda ödeme) → direkt sipariş
    setPlacing(true);
    try {
      const orderRef = doc(collection(db, 'orders'));
      const orderData = {
        buyerId: user.id,
        sellerIds: [...new Set(items.map(i => i.sellerId))],
        items: items.map(i => ({
          productId: i.productId,
          sellerId: i.sellerId,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          image: i.image,
        })),
        total,
        totalAmount: total,
        status: 'pending',
        paymentMethod,
        shippingAddress: {
          fullName: user.name,
          line1: 'Teslimat adresi girilmedi',
          city: '',
          state: '',
          postalCode: '',
          country: 'TR',
          phone: '',
        },
        couponCode: couponCode || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(orderRef, orderData);
      await clearCart();
      Alert.alert(
        'Sipariş Alındı!',
        'Siparişiniz başarıyla oluşturuldu. Siparişlerim sayfasından takip edebilirsiniz.',
        [{ text: 'Siparişlerim', onPress: () => navigation.navigate('OrdersTab') }],
      );
    } catch (err) {
      Alert.alert('Hata', 'Sipariş oluşturulamadı. Lütfen tekrar deneyin.');
    } finally {
      setPlacing(false);
    }
  };

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.center}>
        <Ionicons name="cart-outline" size={48} color={theme.colors.textMuted} />
        <Text style={styles.emptyTitle}>Sepetiniz boş</Text>
        <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.navigate('HomeTab')}>
          <Text style={styles.shopBtnText}>Alışverişe Başla</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Items Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sepet ({items.length} ürün)</Text>
          {items.map(item => (
            <View key={item.productId} style={styles.itemRow}>
              <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.itemQty}>×{item.quantity}</Text>
              <Text style={styles.itemPrice}>
                {(item.price * item.quantity).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
              </Text>
            </View>
          ))}
        </View>

        {/* Coupon */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kupon Kodu</Text>
          <View style={styles.couponRow}>
            <TextInput
              style={styles.couponInput}
              placeholder="Kupon kodu girin"
              placeholderTextColor={theme.colors.textSecondary}
              value={couponCode}
              onChangeText={setCouponCode}
            />
            <TouchableOpacity style={styles.couponBtn}>
              <Text style={styles.couponBtnText}>Uygula</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Payment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ödeme Yöntemi</Text>
          {PAYMENT_METHODS.map(m => (
            <TouchableOpacity
              key={m.id}
              style={[styles.paymentOption, paymentMethod === m.id && styles.paymentOptionActive]}
              onPress={() => setPaymentMethod(m.id)}
            >
              <Ionicons
                name={paymentMethod === m.id ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={paymentMethod === m.id ? theme.colors.accent : theme.colors.textMuted}
              />
              <Ionicons name={m.icon} size={20} color={theme.colors.textSecondary} style={{ marginLeft: 8 }} />
              <Text style={styles.paymentLabel}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Total */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Ara Toplam</Text>
            <Text style={styles.totalValue}>
              {total.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Kargo</Text>
            <Text style={[styles.totalValue, { color: theme.colors.success }]}>Ücretsiz</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>Toplam</Text>
            <Text style={styles.grandTotalValue}>
              {total.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.placeBtn, placing && styles.placeBtnDisabled]}
          onPress={handlePlaceOrder}
          disabled={placing}
          activeOpacity={0.9}
        >
          {placing ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.placeBtnText}>Siparişi Tamamla</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bgLight },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.lg },
  scroll: { flex: 1 },
  content: { padding: theme.spacing.lg, paddingBottom: 120 },
  emptyTitle: { fontSize: 16, fontWeight: '900', color: theme.colors.text, marginTop: 16, marginBottom: 16 },
  shopBtn: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 32, paddingVertical: 14,
    borderRadius: theme.borderRadius.lg,
  },
  shopBtnText: { color: '#FFF', fontWeight: '900', fontSize: 12, textTransform: 'uppercase', letterSpacing: 2 },
  section: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadow.sm,
  },
  sectionTitle: {
    fontSize: 12, fontWeight: '900', color: theme.colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: theme.spacing.md,
  },
  itemRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  itemName: { flex: 1, fontSize: 13, fontWeight: '600', color: theme.colors.text },
  itemQty: { fontSize: 12, fontWeight: '700', color: theme.colors.textSecondary, marginHorizontal: 8 },
  itemPrice: { fontSize: 13, fontWeight: '900', color: theme.colors.text },
  couponRow: { flexDirection: 'row', gap: 8 },
  couponInput: {
    flex: 1, height: 44,
    backgroundColor: theme.colors.bgLight, borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md, fontSize: 14, fontWeight: '600', color: theme.colors.text,
  },
  couponBtn: {
    height: 44, paddingHorizontal: 20,
    backgroundColor: theme.colors.accent, borderRadius: theme.borderRadius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  couponBtnText: { color: '#FFF', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  paymentOption: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  paymentOptionActive: { backgroundColor: theme.colors.accent + '05' },
  paymentLabel: { fontSize: 13, fontWeight: '700', color: theme.colors.text, marginLeft: 8 },
  totalSection: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadow.sm,
  },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 8,
  },
  totalLabel: { fontSize: 13, color: theme.colors.textSecondary, fontWeight: '600' },
  totalValue: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
  grandTotalRow: { borderTopWidth: 1, borderTopColor: theme.colors.border, marginTop: 4, paddingTop: 12 },
  grandTotalLabel: { fontSize: 16, fontWeight: '900', color: theme.colors.text },
  grandTotalValue: { fontSize: 20, fontWeight: '900', color: theme.colors.accent },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: theme.spacing.lg, paddingBottom: 32,
    backgroundColor: theme.colors.white,
    borderTopWidth: 1, borderTopColor: theme.colors.border,
  },
  placeBtn: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: 16, alignItems: 'center',
  },
  placeBtnDisabled: { opacity: 0.5 },
  placeBtnText: { color: '#FFF', fontSize: 14, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 },
});
