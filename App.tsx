import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { Animated, Easing, PanResponder, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, ChevronRight, Moon, Plus, Sun, Settings, X, List, User, Link, CreditCard, Activity } from "lucide-react-native";
import { AppThemeProvider, useAppTheme } from "./src/context/AppThemeContext";
import { getSubscriptions, type Subscription } from "./src/storage/subscriptions";
import { buildCalendarDays, computeMonthlyTotal, getSubscriptionsForDay, toCalendarDay } from "./src/lib/calendarLogic";
import { format, isSameDay, addMonths, startOfMonth } from "date-fns";
import { SubscriptionFormModal } from "./src/components/SubscriptionFormModal";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";

function ScaleButton({ onPress, children, style, scaleTo = 0.96 }: any) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => Animated.timing(scale, { toValue: scaleTo, duration: 120, easing: Easing.bezier(0.25, 0.1, 0.25, 1), useNativeDriver: true }).start()}
      onPressOut={() => Animated.timing(scale, { toValue: 1, duration: 200, easing: Easing.bezier(0.25, 0.1, 0.25, 1), useNativeDriver: true }).start()}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

const isRemote = (url: string | null) => url?.startsWith('http');

function AppContent() {
  const { colors, resolvedTheme, toggleLightDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingSub, setEditingSub] = useState<Subscription | 'new' | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAllSubs, setShowAllSubs] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const menuAnim = useRef(new Animated.Value(0)).current;

  const toggleMenu = () => {
    const toValue = isMenuOpen ? 0 : 1;
    setIsMenuOpen(!isMenuOpen);
    Animated.spring(menuAnim, {
      toValue,
      stiffness: 250,
      damping: 24,
      mass: 0.8,
      useNativeDriver: true
    }).start();
  };

  const reload = useCallback(async () => setSubs(await getSubscriptions()), []);
  useEffect(() => { reload(); }, [reload]);

  const changeMonth = (delta: number) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 80, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: delta > 0 ? -40 : 40, duration: 150, easing: Easing.out(Easing.quad), useNativeDriver: true })
    ]).start(() => {
      setMonth(m => addMonths(m, delta));
      slideAnim.setValue(delta > 0 ? 40 : -40);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 150, easing: Easing.out(Easing.poly(3)), useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, damping: 18, stiffness: 200, mass: 0.5, useNativeDriver: true })
      ]).start();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, state) => Math.abs(state.dx) > 15,
      onPanResponderMove: (_, state) => {
        slideAnim.setValue(state.dx * 0.5);
        fadeAnim.setValue(1 - Math.min(Math.abs(state.dx) / width, 0.5));
      },
      onPanResponderRelease: (_, state) => {
        if (state.dx > 60) {
          Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: width * 0.5, duration: 150, useNativeDriver: true })
          ]).start(() => {
            setMonth(m => addMonths(m, -1));
            slideAnim.setValue(-width * 0.5);
            Animated.parallel([
              Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
              Animated.spring(slideAnim, { toValue: 0, damping: 18, stiffness: 200, mass: 0.5, useNativeDriver: true })
            ]).start();
          });
        } else if (state.dx < -60) {
          Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: -width * 0.5, duration: 150, useNativeDriver: true })
          ]).start(() => {
            setMonth(m => addMonths(m, 1));
            slideAnim.setValue(width * 0.5);
            Animated.parallel([
              Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
              Animated.spring(slideAnim, { toValue: 0, damping: 18, stiffness: 200, mass: 0.5, useNativeDriver: true })
            ]).start();
          });
        } else {
          Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
            Animated.spring(slideAnim, { toValue: 0, damping: 18, stiffness: 200, mass: 0.5, useNativeDriver: true })
          ]).start();
        }
      }
    })
  ).current;

  const days = useMemo(() => buildCalendarDays(month, 0), [month]);
  const monthTotal = useMemo(() => computeMonthlyTotal(month, subs), [month, subs]);

  const displaySubs = useMemo(() => {
    if (selectedDate) return getSubscriptionsForDay(selectedDate, subs);
    const active = new Set<Subscription>();
    days.filter(d => toCalendarDay(d, month).inMonth).forEach(d => {
      getSubscriptionsForDay(d, subs).forEach(s => active.add(s));
    });
    return Array.from(active).sort((a,b) => b.price - a.price);
  }, [selectedDate, subs, month, days]);

  const cellW = Math.floor((width - 48) / 7);
  const cellH = cellW + 8;

  const renderSubRow = (s: Subscription) => (
    <ScaleButton key={s.id} onPress={() => setEditingSub(s)} style={[styles.subRow, { backgroundColor: colors.surfaceRaised }]}>
      <View style={[styles.rowAccent, { backgroundColor: s.cycle === 'monthly' ? colors.monthly : colors.yearly }]} />
      <View style={[styles.avatar, { backgroundColor: colors.surface }]}>
        {isRemote(s.logo) ? (
          <Image source={{ uri: s.logo || undefined }} style={styles.avatarImg} contentFit="contain" />
        ) : (
          <Text style={{ color: colors.text, fontWeight: '700', fontSize: 16 }}>{s.name[0]?.toUpperCase()}</Text>
        )}
      </View>
      <View style={styles.subInfo}>
        <Text style={[styles.subName, { color: colors.text }]} numberOfLines={1}>{s.name}</Text>
        <Text style={[styles.subCycle, { color: colors.textSecondary }]}>{s.cycle === 'monthly' ? 'Monthly' : 'Yearly'}</Text>
      </View>
      <Text style={[styles.subPrice, { color: colors.text }]}>${s.price.toFixed(2)}</Text>
    </ScaleButton>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <StatusBar style={resolvedTheme === "dark" ? "light" : "dark"} />

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.monthName, { color: colors.text }]}> 
            {format(month, 'MMMM yyyy')}
          </Text>
        </View>
        <View style={[styles.premiumBrandIcon, { backgroundColor: resolvedTheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: resolvedTheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
          <View style={[styles.sDot, { backgroundColor: colors.text, alignSelf: 'flex-end', marginRight: 4 }]} />
          <LinearGradient
            colors={[colors.accent, colors.monthly]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.sMinus}
          />
          <View style={[styles.sDot, { backgroundColor: colors.text, alignSelf: 'flex-start', marginLeft: 4, opacity: 0.4 }]} />
        </View>
      </View>

      {/* ── CALENDAR ── */}
      <Animated.View {...panResponder.panHandlers} style={{ opacity: fadeAnim, transform: [{ translateX: slideAnim }], paddingHorizontal: 24, paddingBottom: 8 }}>
        <View style={styles.weekdays}>
          {['S','M','T','W','T','F','S'].map((d, i) => (
            <Text key={i} style={[styles.weekdayLabel, { color: colors.textMuted, width: cellW }]}>{d}</Text>
          ))}
        </View>

        <View style={styles.grid}>
          {days.map(d => {
            const cd = toCalendarDay(d, month);
            const isSel = !!(selectedDate && isSameDay(d, selectedDate));
            const daySubs = cd.inMonth ? getSubscriptionsForDay(d, subs) : [];

            return (
              <Pressable
                key={d.toISOString()}
                onPress={() => cd.inMonth && setSelectedDate(isSel ? null : d)}
                style={{ width: cellW, height: cellH, padding: 2 }}
              >
                <View style={[
                  styles.cell,
                  !cd.inMonth && { opacity: 0.15 },
                  isSel && { backgroundColor: colors.accent },
                ]}>
                  <Text style={[
                    styles.cellNum,
                    { color: colors.text },
                    !cd.inMonth && { color: colors.text },
                    isSel && { color: '#FFFFFF', fontWeight: '800' },
                  ]}>
                    {format(d, 'd')}
                  </Text>

                  {daySubs.length > 0 && (
                    <View style={styles.dotsRow}>
                      {daySubs.slice(0, 3).map((s, idx) => (
                        <View
                          key={idx}
                          style={[
                            styles.dot,
                            { backgroundColor: s.cycle === 'monthly' ? colors.monthly : colors.yearly }
                          ]}
                        />
                      ))}
                      {daySubs.length > 3 && (
                        <View style={[styles.dot, { backgroundColor: colors.textMuted }]} />
                      )}
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      </Animated.View>

      {/* ── BOTTOM PANEL ── */}
      <View style={[styles.panel, { backgroundColor: colors.surface }]}>
        {/* Panel top edge glow */}
        <LinearGradient
          colors={[resolvedTheme === 'dark' ? 'rgba(237,233,226,0.03)' : 'rgba(30,25,20,0.02)', 'transparent']}
          style={styles.panelGlow}
        />
        <View style={styles.panelGrab}>
          <View style={[styles.grabBar, { backgroundColor: colors.textMuted, opacity: 0.3 }]} />
        </View>

        <View style={styles.panelHeader}>
          {showAllSubs && (
            <ScaleButton onPress={() => setShowAllSubs(false)} style={[styles.iconBtn, { backgroundColor: colors.surfaceRaised, marginRight: 12 }]}>
              <ChevronLeft size={17} color={colors.textSecondary} />
            </ScaleButton>
          )}
          <Text style={[styles.panelTitle, { color: colors.text, flex: 1 }]} numberOfLines={1}>
            {isMenuOpen ? 'Settings' : showAllSubs ? 'All Subscriptions' : (selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Dashboard')}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {!isMenuOpen && !showAllSubs && selectedDate && (
              <Pressable onPress={() => setSelectedDate(null)} hitSlop={12}>
                <Text style={[styles.clearBtn, { color: colors.accent }]}>Clear</Text>
              </Pressable>
            )}
            {!isMenuOpen && !showAllSubs && (
              <ScaleButton onPress={() => setEditingSub('new')} style={[styles.iconBtn, { backgroundColor: colors.surfaceRaised }]}>
                <Plus size={17} color={colors.textSecondary} />
              </ScaleButton>
            )}
            {!showAllSubs && (
              <ScaleButton onPress={toggleMenu} style={[styles.iconBtn, { backgroundColor: colors.surfaceRaised }]}>
                {isMenuOpen ? <X size={17} color={colors.textSecondary} /> : <Settings size={17} color={colors.textSecondary} />}
              </ScaleButton>
            )}
          </View>
        </View>

        <View style={{ flex: 1, position: 'relative' }}>
          {/* SUBSCRIPTIONS LIST */}
          <Animated.View style={[StyleSheet.absoluteFill, {
            paddingBottom: insets.bottom,
            opacity: menuAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
            transform: [{ scale: menuAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.97] }) }],
            zIndex: isMenuOpen ? 0 : 1
          }]} pointerEvents={isMenuOpen ? 'none' : 'box-none'}>

            <ScrollView showsVerticalScrollIndicator={true} indicatorStyle={resolvedTheme === 'dark' ? 'white' : 'black'} contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 4, paddingBottom: insets.bottom + 80 }}>
              {showAllSubs ? (
                subs.length === 0 ? (
                  <View style={styles.emptyState}>
                    <View style={[styles.emptyIcon, { backgroundColor: colors.surfaceRaised }]}>
                      <List size={22} color={colors.textMuted} />
                    </View>
                    <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>No subscriptions found</Text>
                  </View>
                ) : [...subs].sort((a,b) => b.price - a.price).map(renderSubRow)
              ) : !selectedDate ? (
                <>
                  <View style={styles.dashboard}>
                    <View style={[styles.dashCard, { backgroundColor: colors.surfaceRaised }]}>
                      <View style={[styles.dashIconBox, { backgroundColor: colors.surface }]}>
                        <CreditCard size={20} color={colors.accent} />
                      </View>
                      <Text style={[styles.dashLabel, { color: colors.textSecondary }]}>Monthly Spend</Text>
                      <Text style={[styles.dashValue, { color: colors.text }]}>${monthTotal.toFixed(2)}</Text>
                    </View>
                    <View style={[styles.dashCard, { backgroundColor: colors.surfaceRaised }]}>
                      <View style={[styles.dashIconBox, { backgroundColor: colors.surface }]}>
                        <Activity size={20} color={colors.monthly} />
                      </View>
                      <Text style={[styles.dashLabel, { color: colors.textSecondary }]}>Active Subs</Text>
                      <Text style={[styles.dashValue, { color: colors.text }]}>{displaySubs.length}</Text>
                    </View>
                  </View>
                </>
              ) : displaySubs.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={[styles.emptyIcon, { backgroundColor: colors.surfaceRaised }]}>
                    <Plus size={22} color={colors.textMuted} />
                  </View>
                  <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>No subscriptions today</Text>
                  <Text style={[styles.emptyHint, { color: colors.textMuted }]}>Tap + to add one</Text>
                </View>
              ) : displaySubs.map(renderSubRow)}
            </ScrollView>
          </Animated.View>

          {/* MENU */}
          <Animated.View style={[StyleSheet.absoluteFill, {
            paddingBottom: insets.bottom,
            opacity: menuAnim,
            transform: [{ translateY: menuAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
            zIndex: isMenuOpen ? 1 : 0
          }]} pointerEvents={isMenuOpen ? 'box-none' : 'none'}>
            <ScrollView showsVerticalScrollIndicator={true} indicatorStyle={resolvedTheme === 'dark' ? 'white' : 'black'} contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 4, paddingBottom: insets.bottom + 80 }}>
              <ScaleButton onPress={() => { toggleMenu(); setShowAllSubs(true); }} style={[styles.menuRow, { backgroundColor: colors.surfaceRaised }]}>
                <View style={[styles.menuIcon, { backgroundColor: colors.surface }]}>
                  <List size={19} color={colors.textSecondary} />
                </View>
                <Text style={[styles.menuLabel, { color: colors.text }]}>All Subscriptions</Text>
              </ScaleButton>

              <ScaleButton style={[styles.menuRow, { backgroundColor: colors.surfaceRaised }]}>
                <View style={[styles.menuIcon, { backgroundColor: colors.surface }]}>
                  <User size={19} color={colors.textSecondary} />
                </View>
                <Text style={[styles.menuLabel, { color: colors.text }]}>Profile</Text>
              </ScaleButton>

              <ScaleButton onPress={toggleLightDark} style={[styles.menuRow, { backgroundColor: colors.surfaceRaised }]}>
                <View style={[styles.menuIcon, { backgroundColor: colors.surface }]}>
                  {resolvedTheme === 'dark' ? <Sun size={19} color={colors.textSecondary} /> : <Moon size={19} color={colors.textSecondary} />}
                </View>
                <Text style={[styles.menuLabel, { color: colors.text }]}>Theme Toggle</Text>
              </ScaleButton>

              <ScaleButton style={[styles.menuRow, { backgroundColor: colors.surfaceRaised }]}>
                <View style={[styles.menuIcon, { backgroundColor: colors.surface }]}>
                  <Link size={19} color={colors.textSecondary} />
                </View>
                <Text style={[styles.menuLabel, { color: colors.text }]}>Connectors</Text>
              </ScaleButton>
            </ScrollView>
          </Animated.View>
        </View>
      </View>

      <SubscriptionFormModal
        visible={!!editingSub}
        mode={editingSub === 'new' ? 'add' : 'edit'}
        subscription={editingSub !== 'new' ? editingSub : null}
        initialDate={selectedDate}
        onClose={() => setEditingSub(null)}
        onSaved={reload}
      />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppThemeProvider>
        <AppContent />
      </AppThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  /* ── Header ── */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  monthName: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1.2,
  },
  premiumBrandIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginLeft: 12,
  },
  sDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  sMinus: {
    width: '100%',
    height: 4,
    borderRadius: 2,
  },

  /* ── Calendar ── */
  weekdays: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  weekdayLabel: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    flex: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 7,
    paddingBottom: 5,
  },
  cellNum: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  dot: {
    width: 4.5,
    height: 4.5,
    borderRadius: 2.25,
  },

  /* ── Bottom Panel ── */
  panel: {
    flex: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: 4,
    overflow: 'hidden',
  },
  panelGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  panelGrab: {
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 4,
  },
  grabBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 16,
  },
  panelTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  clearBtn: {
    fontSize: 14,
    fontWeight: '600',
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Dashboard ── */
  dashboard: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 8,
  },
  dashCard: {
    flex: 1,
    borderRadius: 24,
    padding: 20,
    alignItems: 'flex-start',
  },
  dashIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  dashLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  dashValue: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -1,
  },

  /* ── Empty State ── */
  emptyState: {
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptyHint: {
    fontSize: 13,
    fontWeight: '500',
  },

  /* ── Subscription Rows ── */
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    marginBottom: 8,
  },
  rowAccent: {
    width: 3,
    borderRadius: 1.5,
    alignSelf: 'stretch',
    marginVertical: 2,
    marginRight: 14,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '80%',
    height: '80%',
  },
  subInfo: {
    flex: 1,
    marginLeft: 14,
  },
  subName: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  subCycle: {
    fontSize: 12,
    fontWeight: '500',
  },
  subPrice: {
    fontSize: 16,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },

  /* ── Menu Rows ── */
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    marginBottom: 8,
  },
  menuIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 14,
    letterSpacing: -0.3,
  },
});
