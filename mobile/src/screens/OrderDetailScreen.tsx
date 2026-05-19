import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Order } from '../types';
import { theme } from '../theme';

interface Props {
  route: { params: { order: Order } };
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

const STATUS_STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

export function OrderDetailScreen({ route }: Props) {
  const { order } = route.params;
  const currentStep = STATUS_STEPS.indexOf(order.status);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: (STATUS_COLORS[order.status] || '#999') + '15' }]}>
          <Ionicons name={order.status === 'delivered' ? 'checkmark-circle' : 'time'} size={32} color={STATUS_COLORS[order.status] || '#999'} />
          <View style={styles.statusTextWrap}>
            <Text style={[styles.statusTitle, { color: STATUS_COLORS[order.status] || '#999' }]}>
              {STATUS_LABELS[order.status] || order.status}
            </Text>
            <Text style={styles.statusDate}>
              {new Date(order.createdAt).toLocaleDateString('tr-TR', {
                day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
              })}
            </Text>
          </View>
        </View>

        {/* Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sipariş Durumu</Text>
          <View style={styles.timeline}>
            {STATUS_STEPS.map((step, i) => {
              const isDone = i <= currentStep;
              const isCurrent = i === currentStep;
              return (
                <View key={step} style={styles.timelineRow}>
                  <View style={styles.timelineLeft}>
                    <View style={[styles.dot, isDone && styles.dotDone, isCurrent && styles.dotCurrent]}>
                      {isDone && <Ionicons name="checkmark" size={10} color="#FFF" />}
                    </View>
                    {i < STATUS_STEPS.length - 1 && <View style={[styles.line, isDone && styles.lineDone]} />}
                  </View>
                  <Text style={[styles.timelineLabel, isDone && styles.timelineLabelDone]}>
                    {STATUS_LABELS[step]}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ürünler ({order.items?.length || 0})</Text>
          {order.items?.map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <Image source={{ uri: item.image }} style={styles.itemImage} />
              <View style={styles.itemBody}>
                <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                <View style={styles.itemMeta}>
                  <Text style={styles.itemQty}>×{item.quantity}</Text>
                  <Text style={styles.itemPrice}>
                    {(item.price * item.quantity).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sipariş Özeti</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Sipariş No</Text>
            <Text style={styles.summaryValue}>#{order.id.slice(0, 12)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Ödeme</Text>
            <Text style={styles.summaryValue}>{order.paymentMethod === 'card' ? 'Kredi Kartı' : order.paymentMethod}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Teslimat</Text>
            <Text style={styles.summaryValue}>
              {order.shippingAddress?.city ? `${order.shippingAddress.city}, ${order.shippingAddress.country}` : 'Belirtilmedi'}
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Toplam</Text>
            <Text style={styles.totalValue}>
              {order.total.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bgLight },
  content: { padding: theme.spacing.lg, paddingBottom: 40 },
  statusBanner: {
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md,
    borderRadius: theme.borderRadius.lg, padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  statusTextWrap: { flex: 1 },
  statusTitle: { fontSize: 18, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  statusDate: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 },
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
  timeline: { paddingLeft: 4 },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', minHeight: 40 },
  timelineLeft: { alignItems: 'center', width: 24 },
  dot: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: theme.colors.border, alignItems: 'center', justifyContent: 'center',
  },
  dotDone: { backgroundColor: theme.colors.success },
  dotCurrent: {
    backgroundColor: theme.colors.accent,
    shadowColor: theme.colors.accent, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 4,
  },
  line: { width: 2, flex: 1, backgroundColor: theme.colors.border, marginVertical: 2 },
  lineDone: { backgroundColor: theme.colors.success },
  timelineLabel: { fontSize: 13, fontWeight: '600', color: theme.colors.textMuted, marginLeft: 12, marginTop: 1 },
  timelineLabelDone: { fontWeight: '700', color: theme.colors.text },
  itemRow: {
    flexDirection: 'row', gap: theme.spacing.md,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  itemImage: { width: 60, height: 60, borderRadius: theme.borderRadius.sm, backgroundColor: theme.colors.bgLight },
  itemBody: { flex: 1, justifyContent: 'center' },
  itemName: { fontSize: 13, fontWeight: '700', color: theme.colors.text, marginBottom: 4 },
  itemMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemQty: { fontSize: 12, fontWeight: '600', color: theme.colors.textSecondary },
  itemPrice: { fontSize: 13, fontWeight: '900', color: theme.colors.accent },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  summaryLabel: { fontSize: 13, color: theme.colors.textSecondary, fontWeight: '600' },
  summaryValue: { fontSize: 13, fontWeight: '700', color: theme.colors.text },
  totalRow: { borderBottomWidth: 0, marginTop: 4, paddingTop: 12 },
  totalLabel: { fontSize: 15, fontWeight: '900', color: theme.colors.text },
  totalValue: { fontSize: 18, fontWeight: '900', color: theme.colors.accent },
});
