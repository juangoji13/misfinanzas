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
import { PrimaryButton } from '@/components/primary-button';
import { colors, radius, spacing } from '@/theme';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const router = useRouter();

  async function handleReset() {
    if (!email) {
      setError('Ingresa tu correo.');
      return;
    }
    setLoading(true);
    setError('');
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo: 'finanzasapp://reset-password' },
    );
    setLoading(false);
    if (resetError) {
      setError(translateAuthError(resetError.message));
      return;
    }
    setSent(true);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View>
        <Text style={styles.title}>Recuperar contraseña</Text>
        <Text style={styles.subtitle}>
          Te enviaremos un enlace para restablecer tu contraseña.
        </Text>
      </View>

      {sent ? (
        <View style={styles.successCard}>
          <Text style={styles.successIcon}>✉️</Text>
          <Text style={styles.successTitle}>Correo enviado</Text>
          <Text style={styles.successText}>
            Revisa tu bandeja de entrada y sigue el enlace para crear una nueva
            contraseña.
          </Text>
          <TouchableOpacity
            style={styles.linkBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.link}>Volver al inicio de sesión</Text>
          </TouchableOpacity>
        </View>
      ) : (
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
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <PrimaryButton
            label={loading ? 'Enviando…' : 'Enviar enlace'}
            onPress={handleReset}
            loading={loading}
            color={colors.blue}
            textColor={colors.white}
            style={{ marginTop: 16 }}
          />
          <Link href="/login" asChild>
            <TouchableOpacity style={styles.linkBtn}>
              <Text style={styles.link}>Volver al login</Text>
            </TouchableOpacity>
          </Link>
        </View>
      )}
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
  subtitle: { color: colors.muted, marginTop: 8, lineHeight: 20 },
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
  linkBtn: { marginTop: 18, alignItems: 'center' },
  link: { color: colors.muted, fontWeight: '600' },
  successCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  successIcon: { fontSize: 48, marginBottom: 16 },
  successTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  successText: {
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
});
