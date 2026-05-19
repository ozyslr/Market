import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, SafeAreaView, ActivityIndicator,
  TextInput, TouchableOpacity,
} from 'react-native';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

interface Props {
  route: { params: { query: string } };
  navigation: any;
}

const SUGGESTED = [
  { label: 'Elektronik', icon: 'laptop-outline' as const },
  { label: 'Spor', icon: 'fitness-outline' as const },
  { label: 'Ev & Yaşam', icon: 'home-outline' as const },
  { label: 'Moda', icon: 'shirt-outline' as const },
  { label: 'Aksesuar', icon: 'watch-outline' as const },
  { label: 'Oyuncak', icon: 'game-controller-outline' as const },
];

export function SearchScreen({ route, navigation }: Props) {
  const initialQuery = route.params?.query || '';
  const [search, setSearch] = useState(initialQuery);
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (initialQuery) performSearch(initialQuery);
  }, [initialQuery]);

  const performSearch = useCallback(async (term: string) => {
    if (!term.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const snap = await getDocs(query(
        collection(db, 'products'),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc'),
        limit(30),
      ));
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }) as Product);
      const q = term.toLowerCase();
      const filtered = all.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.categoryId?.toLowerCase().includes(q),
      );
      setResults(filtered);
    } catch {
      // Fallback: try without composite index
      try {
        const snap = await getDocs(collection(db, 'products'));
        const all = snap.docs.filter(d => d.data().isActive === true).map(d => ({ id: d.id, ...d.data() }) as Product);
        const q = term.toLowerCase();
        setResults(all.filter(p =>
          p.title.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.categoryId?.toLowerCase().includes(q),
        ));
      } catch {
        setResults([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCategory = (cat: string) => {
    setSearch(cat);
    performSearch(cat);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchRow}>
          <View style={styles.searchInputWrap}>
            <Ionicons name="search" size={18} color={theme.colors.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Ürün, kategori ara..."
              placeholderTextColor={theme.colors.textSecondary}
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={() => performSearch(search)}
              returnKeyType="search"
              autoFocus={!initialQuery}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => { setSearch(''); setResults([]); setSearched(false); }}>
                <Ionicons name="close-circle" size={18} color={theme.colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={theme.colors.accent} />
          </View>
        ) : searched ? (
          <FlatList
            data={results}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <ProductCard product={item} onPress={(p) => navigation.navigate('ProductDetail', { product: p })} />
            )}
            contentContainerStyle={styles.list}
            numColumns={2}
            columnWrapperStyle={styles.row}
            ListEmptyComponent={
              <View style={styles.center}>
                <Ionicons name="search-outline" size={48} color={theme.colors.textMuted} />
                <Text style={styles.emptyTitle}>Sonuç bulunamadı</Text>
                <Text style={styles.emptySub}>Farklı bir arama terimi deneyin.</Text>
              </View>
            }
          />
        ) : (
          <View style={styles.suggestionsWrap}>
            <Text style={styles.suggestTitle}>Kategoriler</Text>
            <View style={styles.suggestGrid}>
              {SUGGESTED.map(cat => (
                <TouchableOpacity
                  key={cat.label}
                  style={styles.suggestCard}
                  onPress={() => handleCategory(cat.label)}
                  activeOpacity={0.7}
                >
                  <Ionicons name={cat.icon} size={24} color={theme.colors.accent} />
                  <Text style={styles.suggestLabel}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bgLight },
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.xl },
  searchRow: { padding: theme.spacing.lg, paddingBottom: theme.spacing.sm },
  searchInputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.colors.white, borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md, height: 48,
    ...theme.shadow.sm,
  },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '600', color: theme.colors.text },
  list: { paddingHorizontal: theme.spacing.lg, paddingBottom: 40 },
  row: { justifyContent: 'space-between' },
  emptyTitle: { fontSize: 16, fontWeight: '900', color: theme.colors.text, marginTop: 16, marginBottom: 4 },
  emptySub: { fontSize: 13, color: theme.colors.textSecondary },
  suggestionsWrap: { padding: theme.spacing.lg },
  suggestTitle: {
    fontSize: 14, fontWeight: '900', color: theme.colors.text,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: theme.spacing.md,
  },
  suggestGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  suggestCard: {
    width: '30%', aspectRatio: 1,
    backgroundColor: theme.colors.white, borderRadius: theme.borderRadius.lg,
    alignItems: 'center', justifyContent: 'center', gap: 8,
    ...theme.shadow.sm,
  } as any,
  suggestLabel: { fontSize: 10, fontWeight: '700', color: theme.colors.text },
});
