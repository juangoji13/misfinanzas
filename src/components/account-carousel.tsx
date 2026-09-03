import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { Account } from '@/types/models';
import type { RegionConfig } from '@/config/regions';
import { formatMoney } from '@/lib/money';
import { colors, radius, gradients, typography, shadows } from '@/theme';

const { width } = Dimensions.get('window');
const CARD_W = width * 0.72;
const ITEM = CARD_W + 12;
const COPIES = 3;

type Props = {
  accounts: Account[];
  region: RegionConfig;
  onIndexChange: (index: number) => void;
  onPress: (account: Account) => void;
  onLongPress: (account: Account) => void;
};

export function AccountCarousel({ accounts, region, onIndexChange, onPress, onLongPress }: Props) {
  const scrollX = useRef(new Animated.Value(0)).current;
  const listRef = useRef<Animated.FlatList<Account>>(null);
  const n = accounts.length;
  const middleStart = n;
  const [booted, setBooted] = useState(false);

  const data = useMemo(() => {
    if (n === 0) return [];
    return Array.from({ length: COPIES }, () => accounts).flat();
  }, [accounts, n]);

  const ids = accounts.map((a) => a.id).join('|');

  useEffect(() => {
    if (n === 0) return;
    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({ offset: middleStart * ITEM, animated: false });
      setBooted(true);
      onIndexChange(0);
    });
  }, [ids, middleStart, n, onIndexChange]);

  const snapToReal = (offset: number) => {
    if (n === 0) return;
    const i = Math.round(offset / ITEM);
    const real = ((i % n) + n) % n;
    onIndexChange(real);
    if (i < n || i >= n * 2) {
      listRef.current?.scrollToOffset({ offset: (middleStart + real) * ITEM, animated: false });
    }
  };

  if (n === 0) {
    return (
      <View style={styles.emptyWrap}>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyKicker}>Sin cuentas</Text>
          <Text style={styles.emptyTitle}>Crea tu primer producto</Text>
          <Text style={styles.emptyHint}>Banco, tarjeta o efectivo — elige un color y un saldo inicial.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Animated.FlatList
        ref={listRef}
        data={data}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={ITEM}
        decelerationRate="fast"
        bounces={false}
        contentContainerStyle={{ paddingHorizontal: (width - CARD_W) / 2 - 6 }}
        getItemLayout={(_, index) => ({ length: ITEM, offset: ITEM * index, index })}
        initialScrollIndex={n > 0 ? middleStart : 0}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: true,
        })}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => snapToReal(e.nativeEvent.contentOffset.x)}
        onScrollEndDrag={(e) => {
          const v = e.nativeEvent.velocity?.x ?? 0;
          if (Math.abs(v) < 0.2) snapToReal(e.nativeEvent.contentOffset.x);
        }}
        renderItem={({ item, index }) => {
          const inputRange = [(index - 1) * ITEM, index * ITEM, (index + 1) * ITEM];
          const rotateY = scrollX.interpolate({
            inputRange,
            outputRange: ['32deg', '0deg', '-32deg'],
            extrapolate: 'clamp',
          });
          const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.88, 1, 0.88],
            extrapolate: 'clamp',
          });
          const translateX = scrollX.interpolate({
            inputRange,
            outputRange: [18, 0, -18],
            extrapolate: 'clamp',
          });
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.45, 1, 0.45],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              style={[
                styles.item,
                {
                  opacity: booted ? opacity : 1,
                  transform: [{ perspective: 900 }, { translateX }, { rotateY }, { scale }],
                },
              ]}
            >
              <TouchableWithoutFeedback onPress={() => onPress(item)} onLongPress={() => onLongPress(item)}>
                <LinearGradient 
                  colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.01)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.card, { borderColor: 'rgba(255,255,255,0.1)' }]}
                >
                  <LinearGradient
                    colors={[item.color || colors.accent, item.color ? item.color + '40' : colors.accent + '40']}
                    start={{ x: 0.8, y: -0.2 }}
                    end={{ x: 0.2, y: 1.2 }}
                    style={StyleSheet.absoluteFillObject}
                    opacity={0.3}
                  />
                  
                  <View style={[styles.orb, { backgroundColor: item.color || colors.accent }]} />
                  <View style={styles.cardTop}>
                    <Text style={styles.type}>{item.type}</Text>
                    <Text style={styles.digits}>
                      {item.last_digits ? `•••• ${item.last_digits}` : 'Producto'}
                    </Text>
                  </View>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.balance} numberOfLines={1}>
                    {formatMoney(item.balance || 0, region)}
                  </Text>
                </LinearGradient>
              </TouchableWithoutFeedback>
            </Animated.View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 228,
    overflow: 'visible',
  },
  item: {
    width: ITEM,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: CARD_W,
    height: 196,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 22,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    ...shadows.glow,
  },
  orb: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    top: -60,
    right: -60,
    opacity: 0.4,
    transform: [{ scale: 1.5 }],
  },
  cardTop: {
    position: 'absolute',
    top: 22,
    left: 22,
    right: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  type: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontWeight: '700',
    fontFamily: typography.bold,
  },
  digits: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    letterSpacing: 2,
    fontFamily: typography.medium,
  },
  name: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: typography.semiBold,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  balance: {
    color: colors.white,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
    fontFamily: typography.bold,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  emptyWrap: {
    height: 196,
    justifyContent: 'center',
  },
  emptyCard: {
    height: 176,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    backgroundColor: colors.surface,
    padding: 24,
    justifyContent: 'center',
  },
  emptyKicker: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
    fontFamily: typography.bold,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
    fontFamily: typography.bold,
  },
  emptyHint: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: typography.regular,
  },
});
