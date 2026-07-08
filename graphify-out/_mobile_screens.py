import os
m = r"O:\AI\E-tic 2026\mobile\src"

files = {
    "context/AuthContext.tsx": """import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../services/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';

interface AuthState {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({ user: null, loading: true, signIn: async () => {}, logout: async () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); });
    return unsub;
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return <AuthContext.Provider value={{ user, loading, signIn, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
""",

    "navigation/AppNavigator.tsx": """import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/HomeScreen';
import { ProductDetailScreen } from '../screens/ProductDetailScreen';
import { CartScreen } from '../screens/CartScreen';
import { CheckoutScreen } from '../screens/CheckoutScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SellerDashboardScreen } from '../screens/SellerDashboardScreen';
import { AuthProvider } from '../context/AuthContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Ana Sayfa' }} />
      <Tab.Screen name="Cart" component={CartScreen} options={{ tabBarLabel: 'Sepet' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profil' }} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: 'Ürün Detayı' }} />
          <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Ödeme' }} />
          <Stack.Screen name="SellerDashboard" component={SellerDashboardScreen} options={{ title: 'Satıcı Paneli' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}
""",

    "screens/HomeScreen.tsx": """import React, { useState, useEffect } from 'react';
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
""",

    "screens/ProductDetailScreen.tsx": """import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { apiGet } from '../services/api';

export function ProductDetailScreen({ route, navigation }: any) {
  const { id } = route.params;
  const [product, setProduct] = useState<any>(null);

  useEffect(() => { apiGet('/products/' + id).then(setProduct); }, [id]);

  if (!product) return <ActivityIndicator size="large" color="#6418E5" style={{ marginTop: 100 }} />;

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: product.images?.[0] }} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.title}>{product.title}</Text>
        <Text style={styles.price}>{product.price?.toFixed(2)} TL</Text>
        {product.brand && <Text style={styles.brand}>{product.brand}</Text>}
        <Text style={styles.description}>{product.description}</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('Cart')}>
          <Text style={styles.addButtonText}>Sepete Ekle</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#18181b' },
  image: { width: '100%', height: 320, resizeMode: 'cover' },
  info: { padding: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 8 },
  price: { fontSize: 24, fontWeight: '800', color: '#6418E5', marginBottom: 4 },
  brand: { fontSize: 14, color: '#a1a1aa', marginBottom: 12 },
  description: { fontSize: 14, color: '#d4d4d8', lineHeight: 20, marginBottom: 20 },
  addButton: { backgroundColor: '#6418E5', borderRadius: 12, padding: 16, alignItems: 'center' },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
""",

    "screens/CartScreen.tsx": """import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useCartStore } from '../context/cartStore';

export function CartScreen({ navigation }: any) {
  const { items, total, removeItem } = useCartStore();

  return (
    <View style={styles.container}>
      {items.length === 0 ? (
        <View style={styles.empty}><Text style={styles.emptyText}>Sepetiniz boş</Text></View>
      ) : (
        <>
          <FlatList data={items} keyExtractor={(i) => i.id}
            renderItem={({ item }) => (
              <View style={styles.item}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemPrice}>{item.price?.toFixed(2)} TL x {item.quantity}</Text>
                <TouchableOpacity onPress={() => removeItem(item.id)}><Text style={styles.remove}>Kaldır</Text></TouchableOpacity>
              </View>
            )} />
          <View style={styles.footer}>
            <Text style={styles.total}>Toplam: {total.toFixed(2)} TL</Text>
            <TouchableOpacity style={styles.checkoutButton} onPress={() => navigation.navigate('Checkout')}>
              <Text style={styles.checkoutText}>Ödemeye Geç</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#18181b', padding: 16 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#71717a', fontSize: 16 },
  item: { backgroundColor: '#27272a', borderRadius: 8, padding: 12, marginBottom: 8 },
  itemTitle: { color: '#fff', fontSize: 14, fontWeight: '600' },
  itemPrice: { color: '#a1a1aa', fontSize: 13, marginTop: 4 },
  remove: { color: '#ef4444', fontSize: 12, marginTop: 8 },
  footer: { borderTopWidth: 1, borderTopColor: '#3f3f46', paddingTop: 16, marginTop: 8 },
  total: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  checkoutButton: { backgroundColor: '#6418E5', borderRadius: 12, padding: 16, alignItems: 'center' },
  checkoutText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
""",

    "screens/CheckoutScreen.tsx": """import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function CheckoutScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Ödeme Sayfası</Text>
      <Text style={styles.sub}>Stripe / Iyzico entegrasyonu mevcut web API üzerinden</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#18181b', justifyContent: 'center', alignItems: 'center', padding: 20 },
  text: { color: '#fff', fontSize: 20, fontWeight: '700' },
  sub: { color: '#71717a', fontSize: 14, marginTop: 8, textAlign: 'center' },
});
""",

    "screens/ProfileScreen.tsx": """import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';

export function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profil</Text>
      {user ? (
        <>
          <Text style={styles.email}>{user.email}</Text>
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('SellerDashboard')}>
            <Text style={styles.buttonText}>Satıcı Paneli</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutText}>Çıkış Yap</Text>
          </TouchableOpacity>
        </>
      ) : (
        <Text style={styles.email}>Giriş yapılmadı</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#18181b', padding: 20, alignItems: 'center', justifyContent: 'center' },
  title: { color: '#fff', fontSize: 24, fontWeight: '700', marginBottom: 16 },
  email: { color: '#a1a1aa', fontSize: 16, marginBottom: 24 },
  button: { backgroundColor: '#6418E5', borderRadius: 12, padding: 14, width: '100%', alignItems: 'center', marginBottom: 12 },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  logoutButton: { padding: 14 },
  logoutText: { color: '#ef4444', fontSize: 15 },
});
""",

    "screens/SellerDashboardScreen.tsx": """import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { apiGet } from '../services/api';

export function SellerDashboardScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  useEffect(() => { apiGet('/seller/orders').then(setOrders).catch(() => {}); }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Satıcı Paneli</Text>
      <Text style={styles.subtitle}>Son Siparişler</Text>
      <FlatList data={orders} keyExtractor={(o) => o.id}
        renderItem={({ item }) => (
          <View style={styles.order}>
            <Text style={styles.orderId}>#{item.id?.slice(0, 8)}</Text>
            <Text style={styles.orderStatus}>{item.status}</Text>
          </View>
        )} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#18181b', padding: 16 },
  title: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 16 },
  subtitle: { color: '#a1a1aa', fontSize: 14, marginBottom: 8 },
  order: { backgroundColor: '#27272a', borderRadius: 8, padding: 12, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between' },
  orderId: { color: '#fff', fontSize: 13, fontWeight: '600' },
  orderStatus: { color: '#6418E5', fontSize: 13 },
});
""",

    "components/ProductCard.tsx": """import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 36) / 2;

export function ProductCard({ product, onPress }: { product: any; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Image source={{ uri: product.images?.[0] || 'https://picsum.photos/200' }} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{product.title}</Text>
        <Text style={styles.price}>{product.price?.toFixed(2)} TL</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { width: CARD_WIDTH, backgroundColor: '#27272a', borderRadius: 12, margin: 4, overflow: 'hidden' },
  image: { width: '100%', height: CARD_WIDTH * 1.2, resizeMode: 'cover' },
  info: { padding: 8 },
  title: { color: '#fff', fontSize: 12, fontWeight: '600', lineHeight: 16 },
  price: { color: '#6418E5', fontSize: 14, fontWeight: '700', marginTop: 4 },
});
""",

    "context/cartStore.ts": """import { create } from 'zustand';

interface CartItem { id: string; title: string; price: number; quantity: number; }

interface CartStore {
  items: CartItem[];
  total: number;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartStore>((set) => ({
  items: [],
  total: 0,
  addItem: (item) => set((s) => {
    const existing = s.items.find((i) => i.id === item.id);
    const items = existing ? s.items.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i) : [...s.items, { ...item, quantity: 1 }];
    return { items, total: items.reduce((t, i) => t + i.price * i.quantity, 0) };
  }),
  removeItem: (id) => set((s) => { const items = s.items.filter((i) => i.id !== id); return { items, total: items.reduce((t, i) => t + i.price * i.quantity, 0) }; }),
  clearCart: () => set({ items: [], total: 0 }),
}));
""",

    "services/notifications.ts": """import messaging from '@react-native-firebase/messaging';

export async function requestPermission(): Promise<boolean> {
  const status = await messaging().requestPermission();
  return status === messaging.AuthorizationStatus.AUTHORIZED || status === messaging.AuthorizationStatus.PROVISIONAL;
}

export async function getFcmToken(): Promise<string | null> {
  try {
    return await messaging().getToken();
  } catch {
    return null;
  }
}

export function onMessageReceived(callback: (message: any) => void): () => void {
  return messaging().onMessage(callback);
}

export function onNotificationOpened(callback: (message: any) => void): () => void {
  return messaging().onNotificationOpenedApp(callback);
}
""",
}

for filename, content in files.items():
    filepath = os.path.join(m, filename)
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Written: {filename}")
