# Mercora Mobile — React Native (Expo)

## Kurulum

```bash
cd mobile
npm install
npx expo start
```

Ardından Expo Go uygulaması ile QR kod okutarak çalıştırın veya `a` (Android emulator) / `i` (iOS simulator) tuşlarına basın.

## Yapı

```
mobile/
  App.tsx                    # Giriş noktası
  src/
    config/firebase.ts       # Firebase yapılandırması
    types/index.ts           # Paylaşılan tipler
    theme/index.ts           # Renk teması
    context/
      AuthContext.tsx         # Kimlik doğrulama
      CartContext.tsx         # Sepet yönetimi
    navigation/
      AppNavigator.tsx       # Ana gezinti (stack)
      MainTabs.tsx           # Alt sekme gezintisi
    screens/
      HomeScreen.tsx        # Ana sayfa (ürün listesi)
      ProductDetailScreen.tsx # Ürün detay
      CartScreen.tsx         # Sepet
      OrdersScreen.tsx       # Siparişler
      AuthScreen.tsx         # Giriş / Kayıt
      ProfileScreen.tsx      # Profil
    components/
      ProductCard.tsx        # Ürün kartı
```

## Özellikler

- Firebase Auth ile giriş/kayıt
- Firestore gerçek zamanlı ürün listesi
- Anlık senkronize sepet (Firestore üzerinden)
- Sipariş geçmişi
- Web uygulaması ile aynı Firebase projesini kullanır

## Paylaşılan Altyapı

Mobil uygulama, web uygulaması ile aynı Firebase projesini (`market-ecommerce-app`) kullanır. Veriler Firestore üzerinden paylaşılır:

- **Kullanıcılar**: `users/{uid}` koleksiyonu
- **Ürünler**: `products/{id}` koleksiyonu
- **Siparişler**: `orders/{id}` koleksiyonu
- **Sepet**: `carts/{userId}` dokümanı

## Production Build

```bash
# Android APK
npx eas build --platform android --profile production

# iOS IPA
npx eas build --platform ios --profile production
```

## Notlar

- Firebase konfigürasyonu `src/config/firebase.ts` içinde manuel tanımlıdır
- Expo SDK 52 kullanılmaktadır
- React Navigation v7 (native-stack + bottom-tabs)
