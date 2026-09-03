import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Link, Redirect, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { translateAuthError } from '@/lib/finance';
import { useAuth } from '@/lib/auth-context';
import { useRegion } from '@/lib/region-context';
import { PrimaryButton } from '@/components/primary-button';
import { colors, radius, spacing } from '@/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { region } = useRegion();
  const { session, loading: authLoading } = useAuth();

  if (!authLoading && session) return <Redirect href="/(tabs)" />;

  async function signIn() {
    if (!email || !password) {
      setError('Ingresa correo y contraseña.');
      return;
    }
    setLoading(true);
    setError('');
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (authError) {
      setError(translateAuthError(authError.message));
      return;
    }
    router.replace('/(tabs)');
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View>
        <Text style={styles.kicker}>
          {region.name} · {region.currency}
        </Text>
        <Text style={styles.logo}>
          FINANZAS <Text style={styles.accent}>JG</Text>
        </Text>
        <Text style={styles.subtitle}>Control personal, sin ruido.</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Correo</Text>
        <TextInput
          style={styles.input}
          placeholder="tu@correo.com"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <Text style={styles.label}>Contraseña</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor={colors.muted}
          secureTextEntry
          autoCapitalize="none"
          value={password}
          onChangeText={setPassword}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton label={loading ? 'Entrando…' : 'Entrar'} onPress={signIn} loading={loading} />
        <Link href="/forgot-password" asChild>
          <TouchableOpacity style={styles.linkBtn}>
            <Text style={styles.link}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>
        </Link>
        <Link href="/register" asChild>
          <TouchableOpacity style={styles.linkBtn}>
            <Text style={styles.link}>Crear cuenta</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    gap: 36,
  },
  kicker: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  logo: {
    fontSize: 30,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: 1.5,
  },
  accent: { color: colors.accent },
  subtitle: { color: colors.muted, marginTop: 8, fontSize: 15 },
  form: { width: '100%' },
  label: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.text,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  error: { color: colors.danger, marginTop: 12, marginBottom: 4 },
  linkBtn: { marginTop: 18, alignItems: 'center' },
  link: { color: colors.muted, fontWeight: '600' },
});
