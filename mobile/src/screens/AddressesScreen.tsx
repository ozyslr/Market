import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, SafeAreaView, ActivityIndicator,
  TouchableOpacity, Alert,
} from 'react-native';
import { collection, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { Address } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

interface Props {
  navigation: any;
}

export function AddressesScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const q = query(
      collection(db, 'addresses'),
      where('userId', '==', user.id),
    );
    getDocs(q).then(snap => {
      setAddresses(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Address));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  const handleDelete = (addr: Address) => {
    Alert.alert('Adresi Sil', `${addr.label || 'Adres'} silinsin mi?`, [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil', style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'addresses', (addr as any).id));
            setAddresses(prev => prev.filter(a => (a as any).id !== (addr as any).id));
          } catch { /* silent */ }
        },
      },
    ]);
  };

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
        <Ionicons name="location-outline" size={48} color={theme.colors.textMuted} />
        <Text style={styles.emptyTitle}>Giriş Yapın</Text>
        <Text style={styles.emptySub}>Adreslerinizi görüntülemek için giriş yapın.</Text>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Auth')}>
          <Text style={styles.actionBtnText}>Giriş Yap</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={addresses}
        keyExtractor={item => (item as any).id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.labelRow}>
                <Ionicons name="location" size={16} color={theme.colors.accent} />
                <Text style={styles.label}>{item.label || 'Adres'}</Text>
              </View>
              <TouchableOpacity onPress={() => handleDelete(item)}>
                <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
              </TouchableOpacity>
            </View>
            <Text style={styles.name}>{item.fullName}</Text>
            <Text style={styles.line1}>{item.line1}</Text>
            {item.line2 ? <Text style={styles.line1}>{item.line2}</Text> : null}
            <Text style={styles.city}>
              {item.city}, {item.state} {item.postalCode}
            </Text>
            <Text style={styles.country}>{item.country}</Text>
            <Text style={styles.phone}>{item.phone}</Text>
          </View>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="location-outline" size={48} color={theme.colors.textMuted} />
            <Text style={styles.emptyTitle}>Adres bulunamadı</Text>
            <Text style={styles.emptySub}>Henüz bir adres eklemediniz.</Text>
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
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    ...theme.shadow.sm,
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { fontSize: 12, fontWeight: '900', color: theme.colors.accent, textTransform: 'uppercase' },
  name: { fontSize: 14, fontWeight: '700', color: theme.colors.text, marginBottom: 2 },
  line1: { fontSize: 13, color: theme.colors.text, opacity: 0.7, marginBottom: 1 },
  city: { fontSize: 13, color: theme.colors.text, opacity: 0.7, marginBottom: 1 },
  country: { fontSize: 13, fontWeight: '600', color: theme.colors.text, opacity: 0.7, marginBottom: 1 },
  phone: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 4 },
});
