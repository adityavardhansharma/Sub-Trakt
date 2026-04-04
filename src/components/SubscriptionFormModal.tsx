import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Trash2 } from "lucide-react-native";
import { faviconUrlFromName, newSubscriptionId, saveSubscription, updateSubscription, deleteSubscription, type Subscription } from "../storage/subscriptions";
import { useAppTheme } from "../context/AppThemeContext";
import { LogoAvatar, isRemoteLogoUri } from "./LogoAvatar";
import { Image } from "expo-image";

type Props = {
  visible: boolean;
  mode: "add" | "edit";
  subscription?: Subscription | null;
  initialDate?: Date | null;
  onClose: () => void;
  onSaved: () => void;
};

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

export function SubscriptionFormModal({ visible, mode, subscription, initialDate, onClose, onSaved }: Props) {
  const { colors } = useAppTheme();
  const [name, setName] = useState("");
  const [logo, setLogo] = useState<string | null>(null);
  const [price, setPrice] = useState("");
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const backdrop = useRef(new Animated.Value(0)).current;
  const sheet = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdrop, { toValue: 1, duration: 180, easing: Easing.bezier(0.23, 1, 0.32, 1), useNativeDriver: true }),
        Animated.timing(sheet, { toValue: 1, duration: 250, easing: Easing.bezier(0.23, 1, 0.32, 1), useNativeDriver: true }),
      ]).start();
    } else {
      backdrop.setValue(0);
      sheet.setValue(0);
    }
  }, [visible, backdrop, sheet]);

  useEffect(() => {
    if (!visible) return;
    if (mode === "edit" && subscription) {
      setName(subscription.name);
      setLogo(subscription.logo);
      setPrice(String(subscription.price));
      setCycle(subscription.cycle);
      setDate(new Date(subscription.startDate));
    } else {
      setName("");
      setLogo(null);
      setPrice("");
      setCycle("monthly");
      setDate(initialDate || new Date());
    }
  }, [visible, mode, subscription, initialDate]);

  async function submit() {
    const trimmed = name.trim();
    const amount = Number(price);
    if (!trimmed || Number.isNaN(amount)) return;

    const payload = {
      name: trimmed,
      logo,
      price: amount,
      cycle,
      startDate: date.toISOString(),
    };

    if (mode === "add") {
      await saveSubscription({ id: newSubscriptionId(), createdAt: new Date().toISOString(), ...payload });
    } else if (subscription) {
      await updateSubscription(subscription.id, payload);
    }
    onSaved();
    onClose();
  }

  async function handleDelete() {
    if (!subscription) return;
    await deleteSubscription(subscription.id);
    onSaved();
    onClose();
  }

  function inferLogo() {
    const url = faviconUrlFromName(name);
    if (url) setLogo(url);
  }

  function onDateChange(_: DateTimePickerEvent, next?: Date) {
    if (Platform.OS === "android") setShowPicker(false);
    if (next) setDate(next);
  }

  const offsetY = sheet.interpolate({ inputRange: [0, 1], outputRange: [600, 0] });

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <Animated.View style={[styles.backdrop, { opacity: backdrop }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

          <Animated.View style={[styles.sheet, { backgroundColor: colors.surface, transform: [{ translateY: offsetY }] }]}>
            <View style={[styles.grab, { backgroundColor: colors.textMuted, opacity: 0.25 }]} />

            <View style={styles.headerArea}>
              <Text style={[styles.title, { color: colors.text }]}>
                {mode === "add" ? "New Subscription" : "Edit Subscription"}
              </Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
              <Field label="Service" colors={colors}>
                <View style={styles.serviceRow}>
                  <View style={styles.avatarBox}>
                    {isRemoteLogoUri(logo) ? (
                      <View style={[styles.avatar, { backgroundColor: colors.surfaceRaised }]}>
                        <Image source={{ uri: logo || undefined }} style={styles.avatarImage} contentFit="contain" onError={() => setLogo(null)} />
                      </View>
                    ) : (
                      <LogoAvatar logo={logo} name={name} size={48} colors={colors} style={{ borderRadius: 14 }} />
                    )}
                  </View>

                  <TextInput
                    style={[styles.input, { backgroundColor: colors.surfaceRaised, color: colors.text, borderColor: colors.border }]}
                    placeholder="Netflix, Spotify..."
                    placeholderTextColor={colors.textMuted}
                    value={name}
                    onChangeText={setName}
                    onBlur={inferLogo}
                    autoCapitalize="words"
                  />
                </View>
              </Field>

              <Field label="Amount" colors={colors}>
                <View style={styles.amountRow}>
                  <Text style={[styles.currency, { color: colors.textMuted }]}>$</Text>
                  <TextInput
                    style={[styles.input, styles.amountInput, { backgroundColor: colors.surfaceRaised, color: colors.text, borderColor: colors.border }]}
                    placeholder="9.99"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                    value={price}
                    onChangeText={setPrice}
                  />
                </View>
              </Field>

              <Field label="Billing cycle" colors={colors}>
                <View style={[styles.segmented, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
                  {(["monthly", "yearly"] as const).map((item) => {
                    const active = cycle === item;
                    return (
                      <Pressable key={item} onPress={() => setCycle(item)} style={[styles.segment, active && { backgroundColor: colors.accent }]}>
                        <Text style={[styles.segmentLabel, { color: active ? '#FFFFFF' : colors.textSecondary, fontWeight: active ? "700" : "500" }]}>
                          {item === "monthly" ? "Monthly" : "Yearly"}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </Field>

              <Field label="First billing date" colors={colors}>
                <Pressable style={[styles.dateButton, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]} onPress={() => setShowPicker((s) => !s)}>
                  <CalendarIcon size={16} color={colors.textMuted} />
                  <Text style={[styles.dateText, { color: colors.text }]}>{format(date, "MMMM d, yyyy")}</Text>
                </Pressable>
                {showPicker ? (
                  <View style={[styles.pickerCard, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
                    <DateTimePicker value={date} mode="date" display={Platform.OS === "ios" ? "spinner" : "default"} onChange={onDateChange} />
                  </View>
                ) : null}
              </Field>

              <ScaleButton onPress={submit} style={[styles.primary, { backgroundColor: colors.accent }]}>
                <Text style={[styles.primaryText, { color: '#FFFFFF' }]}>
                  {mode === "add" ? "Save subscription" : "Save changes"}
                </Text>
              </ScaleButton>

              {mode === "edit" && (
                <ScaleButton onPress={handleDelete} style={[styles.deleteBtn, { backgroundColor: colors.surfaceRaised }]}>
                  <Trash2 size={15} color={colors.destructive} />
                  <Text style={[styles.deleteText, { color: colors.destructive }]}>Delete subscription</Text>
                </ScaleButton>
              )}
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Field({ label, children, colors }: { label: string; children: React.ReactNode; colors: any }) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.65)",
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 28,
    paddingTop: 14,
    paddingBottom: 40,
    maxHeight: "90%",
  },
  grab: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 28,
  },
  headerArea: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 32,
    gap: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.8,
  },
  body: {
    paddingBottom: 12,
  },
  field: {
    marginBottom: 26,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 10,
    opacity: 0.65,
  },
  serviceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarBox: {},
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  input: {
    flex: 1,
    height: 54,
    borderRadius: 14,
    paddingHorizontal: 18,
    fontSize: 16,
    fontWeight: "600",
    borderWidth: 1,
  },
  amountRow: {
    position: "relative",
  },
  currency: {
    position: "absolute",
    left: 18,
    top: 16,
    fontSize: 16,
    fontWeight: "700",
    zIndex: 1,
  },
  amountInput: {
    paddingLeft: 34,
  },
  segmented: {
    flexDirection: "row",
    borderRadius: 14,
    padding: 5,
    gap: 5,
    borderWidth: 1,
  },
  segment: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: 46,
    borderRadius: 11,
  },
  segmentLabel: {
    fontSize: 15,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    height: 54,
    borderRadius: 14,
    paddingHorizontal: 18,
    borderWidth: 1,
  },
  dateText: {
    fontSize: 16,
    fontWeight: "600",
  },
  pickerCard: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 18,
    overflow: "hidden",
  },
  primary: {
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  primaryText: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  deleteBtn: {
    height: 54,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    gap: 10,
  },
  deleteText: {
    fontSize: 15,
    fontWeight: "700",
  },
});
