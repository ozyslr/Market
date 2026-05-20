import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ActivityIndicator, StyleSheet, SafeAreaView,
  TouchableOpacity, Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { doc, setDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { API_BASE_URL, IYZICO_CALLBACK_PATTERNS } from '../config/api';
import { theme } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { CartItem } from '../types';

interface Props {
  navigation: any;
  route: any;
}

export function PaymentWebViewScreen({ navigation, route }: Props) {
  const { user } = useAuth();
  const { clearCart } = useCart();
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [checkoutHtml, setCheckoutHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const completedRef = useRef(false);

  // Frozen order data from navigation params
  const orderItems: CartItem[] = route.params?.items || [];
  const orderTotal: number = route.params?.total || 0;

  useEffect(() => {
    initializePayment();
  }, []);

  const initializePayment = async () => {
    if (!user) return;

    try {
      const orderId = `order_${Date.now()}_${user.id.slice(0, 8)}`;

      const response = await fetch(`${API_BASE_URL}/api/iyzico/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          userName: user.name,
          total: orderTotal,
          currency: 'TRY',
          installment: '1',
          orderId,
          items: orderItems.map(i => ({
            productId: i.productId,
            name: i.name,
            price: i.price,
            category: 'General',
          })),
          shippingAddress: {
            fullName: user.name,
            line1: 'Mobil uygulama adresi',
            city: 'İstanbul',
            country: 'Turkey',
          },
          buyerPhone: '+905555555555',
        }),
      });

      const data = await response.json();

      if (data.paymentPageUrl) {
        setPaymentUrl(data.paymentPageUrl);
      } else if (data.checkoutFormContent) {
        setCheckoutHtml(data.checkoutFormContent);
      } else {
        setError(data.error || 'Ödeme başlatılamadı');
      }
    } catch (err: any) {
      setError('Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async () => {
    if (!user || completedRef.current) return;
    completedRef.current = true;

    try {
      const orderRef = doc(collection(db, 'orders'));
      await setDoc(orderRef, {
        buyerId: user.id,
        sellerIds: [...new Set(orderItems.map(i => i.sellerId))],
        items: orderItems.map(i => ({
          productId: i.productId,
          sellerId: i.sellerId,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          image: i.image,
        })),
        total: orderTotal,
        totalAmount: orderTotal,
        status: 'paid',
        paymentMethod: 'card',
        shippingAddress: {
          fullName: user.name,
          line1: 'Mobil uygulama adresi',
          city: '',
          state: '',
          postalCode: '',
          country: 'TR',
          phone: '',
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await clearCart();
      Alert.alert('Ödeme Başarılı!', 'Siparişiniz başarıyla alındı.', [
        { text: 'Siparişlerim', onPress: () => navigation.navigate('OrdersTab') },
      ]);
    } catch (err) {
      Alert.alert(
        'Uyarı',
        'Ödeme alındı ancak sipariş kaydedilemedi. Lütfen destek ekibimizle iletişime geçin.',
        [{ text: 'Tamam', onPress: () => navigation.navigate('OrdersTab') }]
      );
    }
  };

  const handleNavigationChange = (navState: any) => {
    const url = navState.url || '';

    if (url.includes(IYZICO_CALLBACK_PATTERNS.success)) {
      createOrder();
    } else if (
      url.includes(IYZICO_CALLBACK_PATTERNS.failed) ||
      url.includes(IYZICO_CALLBACK_PATTERNS.error)
    ) {
      if (!completedRef.current) {
        completedRef.current = true;
        Alert.alert('Ödeme Başarısız', 'Ödeme işlemi tamamlanamadı. Lütfen tekrar deneyin.', [
          { text: 'Geri Dön', onPress: () => navigation.goBack() },
        ]);
      }
    }
  };

  const handleClose = () => {
    if (!completedRef.current) {
      Alert.alert(
        'Ödemeyi İptal Et',
        'Ödeme işlemini iptal etmek istediğinize emin misiniz?',
        [
          { text: 'Vazgeç', style: 'cancel' },
          { text: 'İptal Et', style: 'destructive', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  // Error state
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Ionicons name="close-circle-outline" size={64} color={theme.colors.error} />
          <Text style={styles.errorTitle}>Ödeme Başlatılamadı</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              setError(null);
              setLoading(true);
              setPaymentUrl(null);
              initializePayment();
            }}
          >
            <Text style={styles.buttonText}>Tekrar Dene</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.buttonOutline]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.buttonText, styles.buttonOutlineText]}>Geri Dön</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.colors.accent} />
          <Text style={styles.loadingText}>Güvenli ödeme sayfası yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.headerBtn}>
          <Ionicons name="close" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Güvenli Ödeme</Text>
        <View style={styles.headerBtn} />
      </View>

      {paymentUrl ? (
        <WebView
          ref={webViewRef}
          source={{ uri: paymentUrl }}
          onNavigationStateChange={handleNavigationChange}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          renderLoading={() => (
            <View style={styles.webviewLoading}>
              <ActivityIndicator size="large" color={theme.colors.accent} />
            </View>
          )}
          style={styles.webview}
        />
      ) : checkoutHtml ? (
        <WebView
          ref={webViewRef}
          source={{ html: checkoutHtml }}
          onNavigationStateChange={handleNavigationChange}
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={['*']}
          style={styles.webview}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bgLight,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: theme.colors.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  webview: {
    flex: 1,
  },
  webviewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
  },
  loadingText: {
    marginTop: theme.spacing.lg,
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: theme.colors.text,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 20,
  },
  button: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: theme.colors.accent,
  },
  buttonOutlineText: {
    color: theme.colors.accent,
  },
});
