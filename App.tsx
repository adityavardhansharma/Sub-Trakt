import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import {
  Animated,
  Easing,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
  useWindowDimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, Moon, Plus, Sun, Settings, X, List, User, Link, Home, ArrowUpRight, ArrowDownRight } from "lucide-react-native";
import { AppThemeProvider, useAppTheme } from "./src/context/AppThemeContext";
import { getSubscriptions, type Subscription } from "./src/storage/subscriptions";
import { getProfile, saveProfile, type UserProfile } from "./src/storage/profile";
import {
  buildCalendarDays,
  getSubscriptionsForDay,
  toCalendarDay,
} from "./src/lib/calendarLogic";
import { spendForMonth as calcSpendForMonth } from "./src/lib/spend";
import { format, isSameDay, addMonths, startOfMonth } from "date-fns";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { SubscriptionFormModal } from "./src/components/SubscriptionFormModal";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";

function ScaleButton({ onPress, children, style, scaleTo = 0.96, flex }: any) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      onPress={onPress}
      style={flex ? { flex } : undefined}
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
  const [showProfile, setShowProfile] = useState(false);
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  
  // Profile form state
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const menuAnim = useRef(new Animated.Value(0)).current;

  const animateMenu = (open: boolean) => {
    setIsMenuOpen(open);
    Animated.spring(menuAnim, {
      toValue: open ? 1 : 0,
      stiffness: 250,
      damping: 24,
      mass: 0.8,
      useNativeDriver: true
    }).start();
  };

  const activeTab: "home" | "settings" =
    isMenuOpen || showAllSubs || showProfile ? "settings" : "home";

  const goHome = () => {
    setShowAllSubs(false);
    setShowProfile(false);
    animateMenu(false);
  };

  const goSettings = () => {
    setShowAllSubs(false);
    setShowProfile(false);
    setSelectedDate(null);
    animateMenu(true);
  };

  const reload = useCallback(async () => {
    setSubs(await getSubscriptions());
    const profile = await getProfile();
    setProfileData(profile);
    if (profile) {
      setEditName(profile.name);
      setEditEmail(profile.email);
    }
  }, []);
  
  useEffect(() => { reload(); }, [reload]);

  const handleSaveProfile = async () => {
    const p = { name: editName.trim(), email: editEmail.trim() };
    await saveProfile(p);
    setProfileData(p);
  };

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

  const monthSpend = useMemo(() => calcSpendForMonth(month, subs), [month, subs]);
  const prevMonthSpend = useMemo(
    () => calcSpendForMonth(addMonths(month, -1), subs),
    [month, subs],
  );
  const spendDelta = monthSpend - prevMonthSpend;

  const displaySubs = useMemo(
    () => (selectedDate ? getSubscriptionsForDay(selectedDate, subs) : []),
    [selectedDate, subs],
  );

  const cellW = Math.floor((width - 48) / 7);
  const cellH = cellW + 8;

  const renderSubRow = (s: Subscription, meta?: string) => {
    const subtitle =
      typeof meta === "string"
        ? meta
        : s.cycle === "monthly"
          ? "Monthly"
          : "Yearly";

    return (
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
          <Text style={[styles.subCycle, { color: colors.textSecondary }]}>{subtitle}</Text>
        </View>
        <Text style={[styles.subPrice, { color: colors.text }]}>${s.price.toFixed(2)}</Text>
      </ScaleButton>
    );
  };

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
                onPress={() => {
                  if (!cd.inMonth) return;
                  setShowAllSubs(false);
                  setShowProfile(false);
                  if (isMenuOpen) animateMenu(false);
                  setSelectedDate(isSel ? null : d);
                }}
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
          {(showAllSubs || showProfile) && (
            <ScaleButton onPress={() => { setShowAllSubs(false); setShowProfile(false); }} style={[styles.iconBtn, { backgroundColor: colors.surfaceRaised, marginRight: 12 }]}>
              <ChevronLeft size={17} color={colors.textSecondary} />
            </ScaleButton>
          )}
          <Text style={[styles.panelTitle, { color: colors.text, flex: 1 }]} numberOfLines={1}>
            {isMenuOpen ? 'Settings' : showAllSubs ? 'All Subscriptions' : showProfile ? 'Profile' : (selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Overview')}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {!isMenuOpen && !showAllSubs && !showProfile && selectedDate && (
              <Pressable onPress={() => setSelectedDate(null)} hitSlop={12}>
                <Text style={[styles.clearBtn, { color: colors.accent }]}>Clear</Text>
              </Pressable>
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

            <ScrollView showsVerticalScrollIndicator={true} indicatorStyle={resolvedTheme === 'dark' ? 'white' : 'black'} contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 4, paddingBottom: insets.bottom + 110 }}>
              {showProfile ? (
                profileData ? (
                  <View style={styles.profileContainer}>
                    <View style={[styles.profileAvatar, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
                      <Text style={[styles.profileInitials, { color: colors.text }]}>{profileData.name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={[styles.profileName, { color: colors.text }]}>{profileData.name}</Text>
                    <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{profileData.email}</Text>
                    
                    <ScaleButton onPress={() => setProfileData(null)} style={[styles.editProfileBtn, { backgroundColor: colors.surfaceRaised }]}>
                      <Text style={[styles.editProfileText, { color: colors.text }]}>Edit Profile</Text>
                    </ScaleButton>
                  </View>
                ) : (
                  <View style={styles.profileForm}>
                    <View style={styles.field}>
                      <Text style={[styles.fieldLabel, { color: colors.text }]}>Your Name</Text>
                      <TextInput
                        style={[styles.input, { backgroundColor: colors.surfaceRaised, color: colors.text, borderColor: colors.borderSubtle }]}
                        placeholder="John Doe"
                        placeholderTextColor={colors.textMuted}
                        value={editName}
                        onChangeText={setEditName}
                        autoCorrect={false}
                      />
                    </View>
                    <View style={styles.field}>
                      <Text style={[styles.fieldLabel, { color: colors.text }]}>Email Address</Text>
                      <TextInput
                        style={[styles.input, { backgroundColor: colors.surfaceRaised, color: colors.text, borderColor: colors.borderSubtle }]}
                        placeholder="john@example.com"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        value={editEmail}
                        onChangeText={setEditEmail}
                      />
                    </View>
                    <ScaleButton 
                      onPress={handleSaveProfile} 
                      style={[styles.primaryBtn, { backgroundColor: colors.text, opacity: (!editName.trim() || !editEmail.trim()) ? 0.5 : 1 }]}
                    >
                      <Text style={[styles.primaryBtnText, { color: colors.background }]}>Save Profile</Text>
                    </ScaleButton>
                  </View>
                )
              ) : showAllSubs ? (
                subs.length === 0 ? (
                  <View style={styles.emptyState}>
                    <View style={[styles.emptyIcon, { backgroundColor: colors.surfaceRaised }]}>
                      <List size={22} color={colors.textMuted} />
                    </View>
                    <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>No subscriptions found</Text>
                  </View>
                ) : [...subs].sort((a,b) => b.price - a.price).map((s) => renderSubRow(s))
              ) : !selectedDate ? (
                subs.length === 0 ? (
                  <View style={styles.emptyState}>
                    <View style={[styles.emptyIcon, { backgroundColor: colors.surfaceRaised }]}>
                      <Plus size={22} color={colors.textMuted} />
                    </View>
                    <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
                      No subscriptions yet
                    </Text>
                    <Text style={[styles.emptyHint, { color: colors.textMuted }]}>
                      Tap + to add your first one
                    </Text>
                  </View>
                ) : (() => {
                  const hasDelta = Math.abs(spendDelta) > 0.005;
                  const up = spendDelta > 0;
                  const deltaColor = up ? colors.destructive : colors.yearly;
                  const deltaTint = up
                    ? resolvedTheme === "dark" ? "rgba(239,68,68,0.16)" : "rgba(194,64,64,0.10)"
                    : resolvedTheme === "dark" ? "rgba(72,194,138,0.16)" : "rgba(60,158,110,0.10)";
                  const DeltaIcon = up ? ArrowUpRight : ArrowDownRight;
                  return (
                    <View style={styles.overview}>
                      {/* kicker */}
                      <View style={styles.ovHeadRow}>
                        <View style={[styles.ovDot, { backgroundColor: colors.accent }]} />
                        <Text style={[styles.ovKicker, { color: colors.textSecondary }]}>Total spend</Text>
                        <Text style={[styles.ovMonth, { color: colors.textMuted }]}>
                          {format(month, "MMMM").toUpperCase()}
                        </Text>
                      </View>

                      {/* hero amount + delta */}
                      <View style={styles.ovAmountRow}>
                        <View style={styles.ovAmount}>
                          <Text style={[styles.ovCurrency, { color: colors.textMuted }]}>$</Text>
                          <Text style={[styles.ovDollars, { color: colors.text }]}>
                            {monthSpend.toFixed(2).split(".")[0]}
                          </Text>
                          <Text style={[styles.ovCents, { color: colors.textMuted }]}>
                            .{monthSpend.toFixed(2).split(".")[1]}
                          </Text>
                        </View>
                        {hasDelta && (
                          <View style={styles.ovDeltaCol}>
                            <View style={[styles.ovChip, { backgroundColor: deltaTint }]}>
                              <DeltaIcon size={13} color={deltaColor} strokeWidth={2.8} />
                              <Text style={[styles.ovChipText, { color: deltaColor }]}>
                                ${Math.abs(spendDelta).toFixed(2)}
                              </Text>
                            </View>
                            <Text style={[styles.ovDeltaCaption, { color: colors.textMuted }]}>
                              vs {format(addMonths(month, -1), "MMM")}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* divider */}
                      <View style={[styles.ovDivider, { backgroundColor: colors.border }]} />

                      {/* active subs */}
                      <View style={styles.ovFoot}>
                        <Text style={[styles.ovStatLabel, { color: colors.textSecondary }]}>Active subscriptions</Text>
                        <Text style={[styles.ovStatValue, { color: colors.text }]}>{subs.length}</Text>
                      </View>
                    </View>
                  );
                })()
              ) : displaySubs.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={[styles.emptyIcon, { backgroundColor: colors.surfaceRaised }]}>
                    <Plus size={22} color={colors.textMuted} />
                  </View>
                  <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>No subscriptions today</Text>
                  <Text style={[styles.emptyHint, { color: colors.textMuted }]}>Tap + to add one</Text>
                </View>
              ) : displaySubs.map((s) => renderSubRow(s))}
            </ScrollView>
          </Animated.View>

          {/* MENU */}
          <Animated.View style={[StyleSheet.absoluteFill, {
            paddingBottom: insets.bottom,
            opacity: menuAnim,
            transform: [{ translateY: menuAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
            zIndex: isMenuOpen ? 1 : 0
          }]} pointerEvents={isMenuOpen ? 'box-none' : 'none'}>
            <ScrollView showsVerticalScrollIndicator={true} indicatorStyle={resolvedTheme === 'dark' ? 'white' : 'black'} contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 4, paddingBottom: insets.bottom + 110 }}>
              <ScaleButton onPress={() => { animateMenu(false); setShowAllSubs(true); }} style={[styles.menuRow, { backgroundColor: colors.surfaceRaised }]}>
                <View style={[styles.menuIcon, { backgroundColor: colors.surface }]}>
                  <List size={19} color={colors.textSecondary} />
                </View>
                <Text style={[styles.menuLabel, { color: colors.text }]}>All Subscriptions</Text>
              </ScaleButton>

              <ScaleButton onPress={() => { animateMenu(false); setShowProfile(true); }} style={[styles.menuRow, { backgroundColor: colors.surfaceRaised }]}>
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

      {/* ── FLOATING PILL NAV ── */}
      <View style={[styles.navWrap, { bottom: insets.bottom + 6 }]} pointerEvents="box-none">
        <View style={[styles.navPill, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.text }]}>
          <ScaleButton onPress={goHome} scaleTo={0.9} style={styles.navTab}>
            <View style={styles.navTabRow}>
              <Home size={19} color={activeTab === 'home' ? colors.accent : colors.textSecondary} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
              <Text style={[styles.navTabLabel, { color: activeTab === 'home' ? colors.accent : colors.textSecondary }]}>Home</Text>
            </View>
            <View style={[styles.navDot, { backgroundColor: activeTab === 'home' ? colors.accent : 'transparent' }]} />
          </ScaleButton>

          <View style={styles.navCenterGap} />

          <ScaleButton onPress={goSettings} scaleTo={0.9} style={styles.navTab}>
            <View style={styles.navTabRow}>
              <Settings size={19} color={activeTab === 'settings' ? colors.accent : colors.textSecondary} strokeWidth={activeTab === 'settings' ? 2.5 : 2} />
              <Text style={[styles.navTabLabel, { color: activeTab === 'settings' ? colors.accent : colors.textSecondary }]}>Settings</Text>
            </View>
            <View style={[styles.navDot, { backgroundColor: activeTab === 'settings' ? colors.accent : 'transparent' }]} />
          </ScaleButton>
        </View>

        {/* Center floating + */}
        <View style={styles.navFabWrap} pointerEvents="box-none">
          <ScaleButton onPress={() => setEditingSub('new')} scaleTo={0.9} style={[styles.navFab, { shadowColor: colors.accent }]}>
            <View style={[styles.navFabInner, { backgroundColor: colors.accent }]}>
              <LinearGradient
                colors={['rgba(255,255,255,0.30)', 'rgba(255,255,255,0.02)']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            </View>
            <Plus size={26} color={'#FFFFFF'} strokeWidth={2.9} />
          </ScaleButton>
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

  /* ── Overview (boxless, compact) ── */
  overview: {
    paddingTop: 10,
  },
  ovHeadRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  ovDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  ovKicker: {
    flex: 1,
    fontSize: 11.5,
    fontWeight: "800",
    letterSpacing: 1.3,
    textTransform: "uppercase",
  },
  ovMonth: {
    fontSize: 11.5,
    fontWeight: "700",
    letterSpacing: 1,
  },
  ovAmountRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  ovAmount: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  ovCurrency: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.5,
    marginTop: 8,
    marginRight: 2,
  },
  ovDollars: {
    fontSize: 68,
    fontWeight: "800",
    letterSpacing: -3.6,
    lineHeight: 70,
    fontVariant: ["tabular-nums"],
  },
  ovCents: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.9,
    marginTop: 8,
    fontVariant: ["tabular-nums"],
  },
  ovDeltaCol: {
    alignItems: "flex-end",
    paddingBottom: 12,
  },
  ovChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingLeft: 6,
    paddingRight: 9,
    paddingVertical: 5,
    borderRadius: 10,
  },
  ovChipText: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: -0.3,
    fontVariant: ["tabular-nums"],
  },
  ovDeltaCaption: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 5,
  },
  ovDivider: {
    height: 1,
    marginTop: 22,
    marginBottom: 18,
  },
  ovFoot: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ovStatLabel: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  ovStatValue: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -1,
    fontVariant: ["tabular-nums"],
  },

  /* ── Floating pill nav ── */
  navWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  navPill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 12,
  },
  navCenterGap: {
    width: 74,
  },
  navTab: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    height: 48,
    minWidth: 104,
    paddingHorizontal: 12,
  },
  navTabRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  navTabLabel: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  navDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  navFabWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    top: -26,
    alignItems: "center",
  },
  navFab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 16,
  },
  navFabInner: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 30,
    overflow: "hidden",
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

  /* ── Profile View ── */
  profileContainer: {
    alignItems: 'center',
    paddingTop: 20,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 16,
  },
  profileInitials: {
    fontSize: 32,
    fontWeight: '800',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 24,
  },
  editProfileBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  editProfileText: {
    fontSize: 14,
    fontWeight: '600',
  },
  profileForm: {
    paddingTop: 10,
  },
  field: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
    opacity: 0.7,
  },
  input: {
    height: 54,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '600',
    borderWidth: 1,
  },
  primaryBtn: {
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
