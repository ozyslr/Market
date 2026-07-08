import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useCartStore } from '../context/cartStore';
import { useAuth } from '../context/AuthContext';
import { apiPost } from '../services/api';

type PaymentMethod = 'stripe' | 'iyzico';

export function CheckoutScreen() {
  const navigation = useNavigation<any>();
  const { items, total, clearCart } = useCartStore();
  const { user } = useAuth();

  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('stripe');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!fullName.trim() || !address.trim() || !city.trim() || !phone.trim()) {
      Alert.alert('Hata', 'Lutfen tum zorunlu alanlari doldurun.');
      return;
    }

    if (items.length === 0) {
      Alert.alert('Hata', 'Sepetiniz bos.');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        items: items.map((item) => ({
          id: item.id,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
        })),
        total,
        shippingAddress: {
          fullName: fullName.trim(),
          address: address.trim(),
          city: city.trim(),
          postalCode: postalCode.trim(),
          phone: phone.trim(),
        },
        paymentMethod,
        userId: user?.uid,
        email: user?.email,
      };

      await apiPost('/create-payment-intent', orderData);
      clearCart();
      navigation.navigate('Main', { success: 'Siparisiniz basariyla alindi!' });
    } catch (err: any) {
      Alert.alert('Hata', err.message || 'Odeme islemi sirasinda bir hata olustu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Order Summary */}
      <Text style={styles.sectionTitle}>Siparis Ozeti</Text>
      {items.length === 0 ? (
        <Text style={styles.emptyText}>Sepetiniz bos</Text>
      ) : (
        <>
          {items.map((item) => (
            <View key={item.id} style={styles.cartItem}>
              <View style={styles.cartItemLeft}>
                <Text style={styles.itemName}>{item.title}</Text>
                <Text style={styles.itemQty}>x{item.quantity}</Text>
              </View>
              <Text style={styles.itemPrice}>{(item.price * item.quantity).toFixed(2)} TL</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Toplam</Text>
            <Text style={styles.totalText}>{total.toFixed(2)} TL</Text>
          </View>
        </>
      )}

      {/* Address Form */}
      <Text style={styles.sectionTitle}>Teslimat Adresi</Text>
      <TextInput
        style={styles.input}
        placeholder="Ad Soyad *"
        placeholderTextColor="#71717a"
        value={fullName}
        onChangeText={setFullName}
        autoCapitalize="words"
      />
      <TextInput
        style={[styles.input, styles.inputMultiline]}
        placeholder="Adres *"
        placeholderTextColor="#71717a"
        value={address}
        onChangeText={setAddress}
        multiline
        numberOfLines={3}
      />
      <TextInput
        style={styles.input}
        placeholder="Sehir *"
        placeholderTextColor="#71717a"
        value={city}
        onChangeText={setCity}
      />
      <TextInput
        style={styles.input}
        placeholder="Posta Kodu"
        placeholderTextColor="#71717a"
        value={postalCode}
        onChangeText={setPostalCode}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Telefon *"
        placeholderTextColor="#71717a"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />

      {/* Payment Method */}
      <Text style={styles.sectionTitle}>Odeme Yontemi</Text>
      <View style={styles.paymentRow}>
        <TouchableOpacity
          style={[styles.paymentBtn, paymentMethod === 'stripe' && styles.paymentBtnActive]}
          onPress={() => setPaymentMethod('stripe')}
        >
          <Text
            style={[styles.paymentText, paymentMethod === 'stripe' && styles.paymentTextActive]}
          >
            Stripe
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.paymentBtn, paymentMethod === 'iyzico' && styles.paymentBtnActive]}
          onPress={() => setPaymentMethod('iyzico')}
        >
          <Text
            style={[styles.paymentText, paymentMethod === 'iyzico' && styles.paymentTextActive]}
          >
            Iyzico
          </Text>
        </TouchableOpacity>
      </View>

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>Siparisi Tamamla</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#18181b',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
    marginTop: 8,
  },
  emptyText: {
    color: '#71717a',
    fontSize: 14,
    marginBottom: 16,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  cartItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    color: '#e4e4e7',
    fontSize: 14,
    flex: 1,
  },
  itemQty: {
    color: '#71717a',
    fontSize: 13,
    marginLeft: 8,
  },
  itemPrice: {
    color: '#e4e4e7',
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#3f3f46',
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    color: '#a1a1aa',
    fontSize: 16,
    fontWeight: '600',
  },
  totalText: {
    color: '#6418E5',
    fontSize: 20,
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#27272a',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  paymentRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  paymentBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#3f3f46',
    alignItems: 'center',
    backgroundColor: '#27272a',
  },
  paymentBtnActive: {
    borderColor: '#6418E5',
    backgroundColor: '#6418E520',
  },
  paymentText: {
    color: '#a1a1aa',
    fontSize: 14,
    fontWeight: '600',
  },
  paymentTextActive: {
    color: '#6418E5',
  },
  submitBtn: {
    backgroundColor: '#6418E5',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
