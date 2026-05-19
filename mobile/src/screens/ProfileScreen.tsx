import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';
import { useCart } from '../context/CartContext';

interface Props {
  navigation: any;
}

const menuItems = [
  { key: 'Orders', label: 'Siparişlerim', icon: 'receipt-outline' as const, route: 'OrdersTab' },
  { key: 'Addresses', label: 'Adreslerim', icon: 'location-outline' as const, route: 'Addresses' },
  { key: 'Favorites', label: 'Favorilerim', icon: 'heart-outline' as const, route: 'Favorites' },
  { key: 'Settings', label: 'Ayarlar', icon: 'settings-outline' as const, route: 'Settings' },
  { key: 'Help', label: 'Yardım & Destek', icon: 'help-circle-outline' as const, route: '' },
];

export function ProfileScreen({ navigation }: Props) {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();

  const handleLogout = () => {
    Alert.alert('Çıkış Yap', 'Hesabınızdan çıkış yapmak istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Çıkış Yap', style: 'destructive', onPress: logout },
    ]);
  };

  const handleMenuPress = (item: typeof menuItems[0]) => {
    if (item.key === 'Orders') {
      navigation.navigate('OrdersTab');
    } else if (item.route) {
      navigation.navigate(item.route);
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.center}>
        <Ionicons name="person-circle-outline" size={64} color={theme.colors.textMuted} />
        <Text style={styles.emptyTitle}>Giriş Yapın</Text>
        <Text style={styles.emptySub}>Profilinizi görüntülemek için giriş yapın.</Text>
        <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.navigate('Auth')}>
          <Text style={styles.loginBtnText}>Giriş Yap</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Avatar & Name */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.name?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {user.role === 'seller' ? 'Satıcı' : user.role === 'admin' ? 'Admin' : 'Alıcı'}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{itemCount}</Text>
            <Text style={styles.statLabel}>Sepet</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{user.country}</Text>
            <Text style={styles.statLabel}>Ülke</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{user.currency}</Text>
            <Text style={styles.statLabel}>Para Birimi</Text>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.menu}>
          {menuItems.map((item, i) => (
            <TouchableOpacity
              key={item.key}
              style={[styles.menuItem, i === menuItems.length - 1 && styles.menuItemLast]}
              onPress={() => handleMenuPress(item)}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons name={item.icon} size={20} color={theme.colors.textSecondary} style={styles.menuIcon} />
                <Text style={styles.menuText}>{item.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color={theme.colors.error} style={{ marginRight: 8 }} />
          <Text style={styles.logoutBtnText}>Çıkış Yap</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bgLight },
  center: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: theme.colors.bgLight, padding: theme.spacing.lg,
  },
  scroll: { padding: theme.spacing.lg },
  emptyTitle: { fontSize: 18, fontWeight: '900', color: theme.colors.text, marginTop: 16, marginBottom: 6 },
  emptySub: { fontSize: 13, color: theme.colors.textSecondary, textAlign: 'center', marginBottom: 24 },
  loginBtn: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 32, paddingVertical: 14,
    borderRadius: theme.borderRadius.lg,
  },
  loginBtnText: { color: '#FFF', fontWeight: '900', fontSize: 12, textTransform: 'uppercase', letterSpacing: 2 },
  profileHeader: { alignItems: 'center', marginBottom: theme.spacing.xl },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: theme.colors.accent, alignItems: 'center', justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  avatarText: { fontSize: 32, fontWeight: '900', color: '#FFF' },
  name: { fontSize: 20, fontWeight: '900', color: theme.colors.text, marginBottom: 4 },
  email: { fontSize: 13, color: theme.colors.textSecondary, marginBottom: theme.spacing.sm },
  roleBadge: {
    backgroundColor: theme.colors.accent + '15',
    paddingHorizontal: 16, paddingVertical: 4,
    borderRadius: theme.borderRadius.round,
  },
  roleText: { fontSize: 10, fontWeight: '900', color: theme.colors.accent, textTransform: 'uppercase', letterSpacing: 1 },
  statsRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    backgroundColor: theme.colors.white, borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg, marginBottom: theme.spacing.lg,
    ...theme.shadow.sm,
  },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '900', color: theme.colors.text },
  statLabel: { fontSize: 10, color: theme.colors.textSecondary, fontWeight: '700', marginTop: 2 },
  menu: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden', marginBottom: theme.spacing.lg,
    ...theme.shadow.sm,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 16, paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  menuItemLast: { borderBottomWidth: 0 },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center' },
  menuIcon: { marginRight: 12 },
  menuText: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
  logoutBtn: {
    flexDirection: 'row', paddingVertical: 16, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FEE2E2', borderRadius: theme.borderRadius.lg,
  },
  logoutBtnText: { fontSize: 13, fontWeight: '900', color: theme.colors.error },
});
