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
import { Link, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { translateAuthError } from '@/lib/finance';
import { useRegion } from '@/lib/region-context';
import { PrimaryButton } from '@/components/primary-button';
import { colors, radius, spacing } from '@/theme';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const { region } = useRegion();

  async function signUp() {
    if (!email || !password) {
      setError('Correo y contraseña son obligatorios.');
      return;
    }
    setLoading(true);
    setError('');
    const { error: authError } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (authError) {
      setError(translateAuthError(authError.message));
      return;
    }
    setMessage('Revisa tu correo para confirmar, luego entra.');
    setTimeout(() => router.back(), 1600);
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View>
        <Text style={styles.title}>Crear cuenta</Text>
        <Text style={styles.subtitle}>Una sola persona, tus cuentas · {region.name} ({region.currency})</Text>
      </View>
      <View>
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
          placeholder="Mínimo 6 caracteres"
          placeholderTextColor={colors.muted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {message ? <Text style={styles.ok}>{message}</Text> : null}
        <PrimaryButton
          label={loading ? 'Creando…' : 'Registrarme'}
          onPress={signUp}
          loading={loading}
          color={colors.blue}
          textColor={colors.white}
          style={{ marginTop: 16 }}
        />
        <Link href="/login" asChild>
          <TouchableOpacity style={styles.linkBtn}>
            <Text style={styles.link}>Ya tengo cuenta</Text>
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
    gap: 28,
  },
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  subtitle: { color: colors.muted, marginTop: 8 },
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
  error: { color: colors.danger, marginTop: 12 },
  ok: { color: colors.accent, marginTop: 12 },
  linkBtn: { marginTop: 18, alignItems: 'center' },
  link: { color: colors.muted, fontWeight: '600' },
});
