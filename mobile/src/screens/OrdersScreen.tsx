import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, SafeAreaView, ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { Order } from '../types';
import { theme } from '../theme';

interface Props {
  navigation: any;
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  confirmed: '#3B82F6',
  processing: '#3B82F6',
  shipped: '#8B5CF6',
  delivered: '#10B981',
  cancelled: '#EF4444',
  refunded: '#EF4444',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Bekliyor',
  confirmed: 'Onaylandı',
  processing: 'Hazırlanıyor',
  shipped: 'Kargoda',
  delivered: 'Teslim Edildi',
  cancelled: 'İptal Edildi',
  refunded: 'İade Edildi',
};

export function OrdersScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const q = query(
      collection(db, 'orders'),
      where('buyerId', '==', user.id),
      orderBy('createdAt', 'desc'),
    );
    getDocs(q).then(snap => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
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
        <Text style={styles.emptyTitle}>Giriş Yapın</Text>
        <Text style={styles.emptySub}>Siparişlerinizi görüntülemek için giriş yapın.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.header}>Siparişlerim</Text>
      <FlatList
        data={orders}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.order}
            onPress={() => navigation.navigate('OrderDetail', { order: item })}
            activeOpacity={0.7}
          >
            <View style={styles.orderHeader}>
              <Text style={styles.orderId}>#{item.id.slice(0, 10)}</Text>
              <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[item.status] || '#999') + '20' }]}>
                <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] || '#999' }]}>
                  {STATUS_LABELS[item.status] || item.status}
                </Text>
              </View>
            </View>
            <Text style={styles.orderDate}>
              {new Date(item.createdAt).toLocaleDateString('tr-TR', {
                day: '2-digit', month: 'long', year: 'numeric',
              })}
            </Text>
            <Text style={styles.orderTotal}>
              {item.total.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
            </Text>
            {item.items?.slice(0, 3).map((oi, i) => (
              <Text key={i} style={styles.orderItem} numberOfLines={1}>
                {oi.name} × {oi.quantity}
              </Text>
            ))}
            {item.items && item.items.length > 3 && (
              <Text style={styles.moreItems}>+{item.items.length - 3} ürün daha</Text>
            )}
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyTitle}>Henüz siparişiniz yok</Text>
            <Text style={styles.emptySub}>İlk siparişinizi vererek alışverişe başlayın.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bgLight },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.lg, backgroundColor: theme.colors.bgLight },
  header: { fontSize: 18, fontWeight: '900', color: theme.colors.text, padding: theme.spacing.lg, paddingBottom: theme.spacing.sm },
  list: { paddingHorizontal: theme.spacing.lg, paddingBottom: 40 },
  order: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadow.sm,
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  orderId: { fontSize: 11, fontWeight: '900', color: theme.colors.textSecondary },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: theme.borderRadius.sm },
  statusText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  orderDate: { fontSize: 11, color: theme.colors.textMuted, marginBottom: 4 },
  orderTotal: { fontSize: 16, fontWeight: '900', color: theme.colors.accent, marginBottom: 8 },
  orderItem: { fontSize: 12, color: theme.colors.text, opacity: 0.6 },
  moreItems: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 },
  emptyTitle: { fontSize: 16, fontWeight: '900', color: theme.colors.text, marginBottom: 6 },
  emptySub: { fontSize: 13, color: theme.colors.textSecondary, textAlign: 'center' },
});
