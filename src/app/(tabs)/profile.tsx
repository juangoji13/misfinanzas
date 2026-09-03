import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/screen';
import { useAuth } from '@/lib/auth-context';
import { useRegion } from '@/lib/region-context';
import { REGIONS, type RegionCode } from '@/config/regions';
import { colors, radius, spacing } from '@/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { region, setRegionCode } = useRegion();
  const email = user?.email || '';
  const name = email.split('@')[0] || 'Usuario';
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <Screen>
      <Text style={styles.title}>Perfil</Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.initials}>{initials}</Text>
          </View>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.email}>{email}</Text>
        </View>

        <Text style={styles.section}>País y moneda</Text>
        <Text style={styles.hint}>Cambia formato de miles, decimales y zona. Tus datos no se convierten.</Text>
        <View style={styles.regions}>
          {(Object.keys(REGIONS) as RegionCode[]).map((code) => {
            const r = REGIONS[code];
            const on = region.code === code;
            return (
              <TouchableOpacity
                key={code}
                style={[styles.region, on && styles.regionOn]}
                onPress={() => setRegionCode(code)}
              >
                <Text style={[styles.regionName, on && styles.regionNameOn]}>{r.name}</Text>
                <Text style={styles.regionCur}>{r.currency}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.logout}
          onPress={async () => {
            await signOut();
            router.replace('/login');
          }}
        >
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 28, fontWeight: '800', paddingVertical: spacing.md },
  card: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 28,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  initials: { fontSize: 24, fontWeight: '800', color: colors.bg },
  name: { color: colors.text, fontSize: 22, fontWeight: '800' },
  email: { color: colors.muted, marginTop: 4 },
  section: { color: colors.text, fontWeight: '700', fontSize: 16, marginBottom: 8 },
  hint: { color: colors.muted, fontSize: 13, marginBottom: 12, lineHeight: 18 },
  regions: { gap: 8, marginBottom: 28 },
  region: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  regionOn: { borderColor: colors.accent, backgroundColor: colors.accentDim },
  regionName: { color: colors.text, fontWeight: '600' },
  regionNameOn: { color: colors.accent },
  regionCur: { color: colors.muted, fontWeight: '700' },
  logout: {
    padding: 16,
    borderRadius: radius.md,
    backgroundColor: colors.dangerDim,
    alignItems: 'center',
  },
  logoutText: { color: colors.danger, fontWeight: '700' },
});
