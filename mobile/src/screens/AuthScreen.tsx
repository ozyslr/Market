import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';

interface Props {
  navigation: any;
}

export function AuthScreen({ navigation }: Props) {
  const { signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Hata', 'E-posta ve şifre gerekli.');
      return;
    }
    if (!isLogin && !name.trim()) {
      Alert.alert('Hata', 'Ad soyad gerekli.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Hata', 'Şifre en az 6 karakter olmalıdır.');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await signIn(email.trim(), password);
      } else {
        await signUp(email.trim(), password, name.trim());
      }
      navigation.goBack();
    } catch (err: any) {
      const message =
        err.code === 'auth/user-not-found' ? 'Kullanıcı bulunamadı.' :
        err.code === 'auth/wrong-password' ? 'Hatalı şifre.' :
        err.code === 'auth/email-already-in-use' ? 'Bu e-posta zaten kayıtlı.' :
        err.code === 'auth/invalid-credential' ? 'Hatalı e-posta veya şifre.' :
        err.code === 'auth/too-many-requests' ? 'Çok fazla deneme. Lütfen bekleyin.' :
        'Bir hata oluştu. Lütfen tekrar deneyin.';
      Alert.alert('Hata', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Logo */}
          <View style={styles.logoSection}>
            <Text style={styles.brand}>MERCORA</Text>
            <Text style={styles.tagline}>ARTISAN MARKETPLACE</Text>
          </View>

          {/* Tabs */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tab, isLogin && styles.tabActive]}
              onPress={() => setIsLogin(true)}
            >
              <Text style={[styles.tabText, isLogin && styles.tabTextActive]}>Giriş Yap</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, !isLogin && styles.tabActive]}
              onPress={() => setIsLogin(false)}
            >
              <Text style={[styles.tabText, !isLogin && styles.tabTextActive]}>Kayıt Ol</Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {!isLogin && (
              <TextInput
                style={styles.input}
                placeholder="Ad Soyad"
                placeholderTextColor={theme.colors.textSecondary}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            )}
            <TextInput
              style={styles.input}
              placeholder="E-posta"
              placeholderTextColor={theme.colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Şifre"
              placeholderTextColor={theme.colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.9}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitBtnText}>
                  {isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.white },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: theme.spacing.lg },
  logoSection: { alignItems: 'center', marginBottom: theme.spacing.xxl },
  brand: { fontSize: 36, fontWeight: '900', color: theme.colors.text, letterSpacing: 6 },
  tagline: { fontSize: 9, fontWeight: '900', color: theme.colors.textSecondary, letterSpacing: 4, marginTop: 4 },
  tabRow: { flexDirection: 'row', backgroundColor: theme.colors.bgLight, borderRadius: theme.borderRadius.md, padding: 4, marginBottom: theme.spacing.xl },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: theme.borderRadius.sm },
  tabActive: { backgroundColor: theme.colors.white, ...theme.shadow.sm },
  tabText: { fontSize: 13, fontWeight: '700', color: theme.colors.textSecondary },
  tabTextActive: { color: theme.colors.accent },
  form: { gap: theme.spacing.md },
  input: {
    backgroundColor: theme.colors.bgLight,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 14,
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  submitBtn: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    ...theme.shadow.md,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#FFF', fontSize: 14, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 },
});
