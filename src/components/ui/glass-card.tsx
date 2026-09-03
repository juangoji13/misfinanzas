import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, gradients, shadows } from '@/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  colors?: readonly [string, string];
  intensity?: 'light' | 'dark' | 'none';
}

export function GlassCard({ 
  children, 
  style, 
  colors: gradientColors = gradients.dark,
  intensity = 'dark' 
}: GlassCardProps) {
  
  const hasGlass = intensity !== 'none';
  const overlayColors = intensity === 'light' 
    ? gradients.glass 
    : ['rgba(255,255,255,0.03)', 'transparent'] as const;

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, shadows.md, style]}
    >
      {hasGlass && (
        <LinearGradient
          colors={overlayColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      )}
      <View style={styles.content}>
        {children}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  content: {
    padding: 18,
    flex: 1,
  },
});
