import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { PrimaryButton } from '@/components/primary-button';
import { Segmented } from '@/components/segmented';
import { useAuth } from '@/lib/auth-context';
import { useRegion } from '@/lib/region-context';
import { supabase } from '@/lib/supabase';
import { formatAmountInput, parseAmount } from '@/lib/money';
import { queryKeys } from '@/lib/queries';
import { useQueryClient } from '@tanstack/react-query';
import { colors, radius, spacing } from '@/theme';

export default function AddPlanScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const { region } = useRegion();
  const [type, setType] = useState<'goal' | 'budget'>('goal');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  if (!authLoading && !user) return <Redirect href="/login" />;

  const save = async () => {
    if (!name || !amount) {
      Alert.alert('Campos', 'Nombre y monto son obligatorios.');
      return;
    }
    if (!user) return;
    setLoading(true);
    try {
      const num = parseAmount(amount, region.fractionDigits);
      if (type === 'goal') {
        const { error } = await supabase.from('goals').insert({
          user_id: user.id,
          name,
          target_amount: num,
          current_amount: 0,
          color: colors.danger,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('budgets').insert({
          user_id: user.id,
          name,
          total_amount: num,
          spent_amount: 0,
          color: colors.accent,
        });
        if (error) throw error;
      }
      queryClient.invalidateQueries({ queryKey: type === 'goal' ? queryKeys.goals(user.id) : queryKeys.budgets(user.id) });
      router.back();
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo crear');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <ScreenHeader title="Nuevo plan" onClose={() => router.back()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView>
          <Segmented
            value={type}
            onChange={setType}
            options={[
              { value: 'goal', label: 'Meta' },
              { value: 'budget', label: 'Presupuesto' },
            ]}
            activeColor={type === 'goal' ? colors.dangerDim : colors.accentDim}
          />
          <Text style={styles.hint}>
            {type === 'budget'
              ? 'Usa el mismo nombre que una categoría (ej. Comida) para que los gastos se descuenten solos.'
              : 'Toca la meta en Gestión para aportar desde tu primera cuenta.'}
          </Text>
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            style={styles.input}
            placeholder={type === 'goal' ? 'Viaje a Cartagena' : 'Comida'}
            placeholderTextColor={colors.muted}
            value={name}
            onChangeText={setName}
          />
          <Text style={styles.label}>{type === 'goal' ? 'Objetivo' : 'Límite mensual'}</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            placeholderTextColor={colors.muted}
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={(t) => setAmount(formatAmountInput(t, region))}
          />
        </ScrollView>
        <PrimaryButton
          label={type === 'goal' ? 'Crear meta' : 'Crear presupuesto'}
          onPress={save}
          loading={loading}
          color={type === 'goal' ? colors.danger : colors.accent}
          textColor={type === 'goal' ? colors.white : colors.black}
          style={{ marginBottom: spacing.md }}
        />
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hint: { color: colors.muted, fontSize: 13, lineHeight: 18, marginBottom: 20, marginTop: 16 },
  label: {
    color: colors.muted,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.text,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 16,
    marginBottom: 16,
  },
});
