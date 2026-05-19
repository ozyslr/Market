import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, SafeAreaView, ActivityIndicator,
  TouchableOpacity, Image,
} from 'react-native';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { Product } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

interface Props {
  navigation: any;
}

export function FavoritesScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getDoc(doc(db, 'users', user.id)).then(async snap => {
      if (!snap.exists()) { setLoading(false); return; }
      const data = snap.data();
      const ids: string[] = data.savedItems || data.favorites || [];
      if (ids.length === 0) { setLoading(false); return; }

      // Fetch products for saved IDs
      const prodSnap = await getDocs(collection(db, 'products'));
      const all = prodSnap.docs.map(d => ({ id: d.id, ...d.data() }) as Product);
      setFavorites(all.filter(p => ids.includes(p.id)));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.center}>
        <Ionicons name="heart-outline" size={48} color={theme.colors.textMuted} />
        <Text style={styles.emptyTitle}>Giriş Yapın</Text>
        <Text style={styles.emptySub}>Favorilerinizi görüntülemek için giriş yapın.</Text>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Auth')}>
          <Text style={styles.actionBtnText}>Giriş Yap</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={favorites}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => navigation.navigate('ProductDetail', { product: item })}
            activeOpacity={0.7}
          >
            <Image source={{ uri: item.images?.[0] }} style={styles.image} />
            <View style={styles.body}>
              <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.price}>
                {item.price.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
              </Text>
              <View style={styles.ratingRow}>
                <Text style={styles.rating}>★ {item.rating?.toFixed(1) || '0.0'}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="heart-outline" size={48} color={theme.colors.textMuted} />
            <Text style={styles.emptyTitle}>Favori ürününüz yok</Text>
            <Text style={styles.emptySub}>Beğendiğiniz ürünleri favorilere ekleyin.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bgLight },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.xl },
  list: { padding: theme.spacing.lg, paddingBottom: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '900', color: theme.colors.text, marginTop: 16, marginBottom: 4 },
  emptySub: { fontSize: 13, color: theme.colors.textSecondary, textAlign: 'center', marginBottom: 24 },
  actionBtn: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 32, paddingVertical: 14,
    borderRadius: theme.borderRadius.lg,
  },
  actionBtnText: { color: '#FFF', fontWeight: '900', fontSize: 12, textTransform: 'uppercase', letterSpacing: 2 },
  item: {
    flexDirection: 'row', backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg, padding: theme.spacing.md,
    marginBottom: theme.spacing.sm, ...theme.shadow.sm,
  },
  image: { width: 80, height: 80, borderRadius: theme.borderRadius.sm, backgroundColor: theme.colors.bgLight },
  body: { flex: 1, marginLeft: theme.spacing.md, justifyContent: 'center' },
  title: { fontSize: 13, fontWeight: '700', color: theme.colors.text, marginBottom: 4 },
  price: { fontSize: 16, fontWeight: '900', color: theme.colors.accent, marginBottom: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  rating: { fontSize: 11, fontWeight: '700', color: theme.colors.warning },
});
