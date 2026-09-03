import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import * as LocalAuthentication from 'expo-local-authentication';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { AuthProvider, useAuth } from '@/lib/auth-context';
import { RegionProvider } from '@/lib/region-context';
import { AnimatedButton } from '@/components/ui/animated-button';
import { colors, typography, spacing } from '@/theme';
import { StyleSheet, View, Text } from 'react-native';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
  },
});

function BiometricWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [hasBiometrics, setHasBiometrics] = useState(false);

  useEffect(() => {
    (async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setHasBiometrics(compatible && enrolled);
    })();
  }, []);

  useEffect(() => {
    if (user && hasBiometrics && !isUnlocked) {
      handleBiometricAuth();
    }
  }, [user, hasBiometrics]);

  const handleBiometricAuth = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Desbloquea Finanzas JG',
        fallbackLabel: 'Usar código',
        cancelLabel: 'Cancelar',
        disableDeviceFallback: false,
      });
      if (result.success) {
        setIsUnlocked(true);
      }
    } catch (e) {
      console.log(e);
    }
  };

  if (loading) return null;
  
  if (user && hasBiometrics && !isUnlocked) {
    return (
      <View style={styles.lockContainer}>
        <Ionicons name="lock-closed" size={64} color={colors.accent} style={{ marginBottom: spacing.lg }} />
        <Text style={styles.lockTitle}>Finanzas JG</Text>
        <Text style={styles.lockSubtitle}>Protegido con Biometría</Text>
        <AnimatedButton style={styles.unlockButton} onPress={handleBiometricAuth}>
          <Text style={styles.unlockText}>Desbloquear</Text>
        </AnimatedButton>
      </View>
    );
  }

  return <>{children}</>;
}

export default function Layout() {
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RegionProvider>
          <BiometricWrapper>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.bg },
                animation: 'fade',
              }}
            />
          </BiometricWrapper>
        </RegionProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  lockContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  lockTitle: {
    color: colors.text,
    fontSize: 28,
    fontFamily: typography.bold,
    marginBottom: spacing.xs,
  },
  lockSubtitle: {
    color: colors.muted,
    fontSize: 16,
    fontFamily: typography.medium,
    marginBottom: spacing.xl * 2,
  },
  unlockButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 100,
  },
  unlockText: {
    color: colors.bg,
    fontSize: 16,
    fontFamily: typography.bold,
  },
});
