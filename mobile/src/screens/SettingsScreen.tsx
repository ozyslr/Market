import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Alert, Switch,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

interface Props {
  navigation: any;
}

export function SettingsScreen({ navigation }: Props) {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = React.useState(true);

  const handleLogout = () => {
    Alert.alert('Çıkış Yap', 'Hesabınızdan çıkış yapmak istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Çıkış Yap', style: 'destructive', onPress: logout },
    ]);
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.center}>
        <Ionicons name="settings-outline" size={48} color={theme.colors.textMuted} />
        <Text style={styles.emptyTitle}>Giriş Yapın</Text>
        <Text style={styles.emptySub}>Ayarları görüntülemek için giriş yapın.</Text>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Auth')}>
          <Text style={styles.actionBtnText}>Giriş Yap</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Summary */}
        <TouchableOpacity style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.name?.charAt(0)?.toUpperCase() || '?'}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user.name}</Text>
            <Text style={styles.profileEmail}>{user.email}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
        </TouchableOpacity>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tercihler</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications-outline" size={20} color={theme.colors.textSecondary} />
              <Text style={styles.settingLabel}>Bildirimler</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: theme.colors.border, true: theme.colors.accent + '60' }}
              thumbColor={notifications ? theme.colors.accent : '#f4f3f4'}
            />
          </View>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="language-outline" size={20} color={theme.colors.textSecondary} />
              <Text style={styles.settingLabel}>Dil</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue}>Türkçe</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
            </View>
          </View>
          <View style={[styles.settingRow, styles.settingRowLast]}>
            <View style={styles.settingLeft}>
              <Ionicons name="cash-outline" size={20} color={theme.colors.textSecondary} />
              <Text style={styles.settingLabel}>Para Birimi</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue}>{user.currency || 'TRY'}</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
            </View>
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Uygulama</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="information-circle-outline" size={20} color={theme.colors.textSecondary} />
              <Text style={styles.settingLabel}>Sürüm</Text>
            </View>
            <Text style={styles.settingValue}>1.0.0</Text>
          </View>
          <View style={[styles.settingRow, styles.settingRowLast]}>
            <View style={styles.settingLeft}>
              <Ionicons name="shield-outline" size={20} color={theme.colors.textSecondary} />
              <Text style={styles.settingLabel}>Gizlilik Politikası</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
          </View>
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.xl },
  content: { padding: theme.spacing.lg, paddingBottom: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '900', color: theme.colors.text, marginTop: 16, marginBottom: 4 },
  emptySub: { fontSize: 13, color: theme.colors.textSecondary, textAlign: 'center', marginBottom: 24 },
  actionBtn: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 32, paddingVertical: 14,
    borderRadius: theme.borderRadius.lg,
  },
  actionBtnText: { color: '#FFF', fontWeight: '900', fontSize: 12, textTransform: 'uppercase', letterSpacing: 2 },
  profileCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.colors.white, borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg, marginBottom: theme.spacing.md,
    ...theme.shadow.sm,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: theme.colors.accent, alignItems: 'center', justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  avatarText: { fontSize: 20, fontWeight: '900', color: '#FFF' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 15, fontWeight: '900', color: theme.colors.text },
  profileEmail: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 1 },
  section: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden', marginBottom: theme.spacing.md,
    ...theme.shadow.sm,
  },
  sectionTitle: {
    fontSize: 10, fontWeight: '900', color: theme.colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 1,
    padding: theme.spacing.lg, paddingBottom: theme.spacing.sm,
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  settingRowLast: { borderBottomWidth: 0 },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingLabel: { fontSize: 14, fontWeight: '600', color: theme.colors.text },
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  settingValue: { fontSize: 13, color: theme.colors.textSecondary, fontWeight: '600' },
  logoutBtn: {
    flexDirection: 'row', paddingVertical: 16, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FEE2E2', borderRadius: theme.borderRadius.lg, marginTop: theme.spacing.md,
  },
  logoutBtnText: { fontSize: 13, fontWeight: '900', color: theme.colors.error },
});
