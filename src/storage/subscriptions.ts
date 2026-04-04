import AsyncStorage from "@react-native-async-storage/async-storage";

export type Subscription = {
  id: string;
  name: string;
  logo: string | null;
  price: number;
  cycle: "monthly" | "yearly";
  startDate: string;
  createdAt: string;
};

const STORAGE_KEY = "@subscriptions";

export function newSubscriptionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function faviconUrlFromName(name: string): string | null {
  const t = name.trim();
  if (!t) return null;
  const slug = t.toLowerCase().replace(/\s+/g, "");
  return `https://www.google.com/s2/favicons?domain=${slug}.com&sz=128`;
}

export async function getSubscriptions(): Promise<Subscription[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as Subscription[]) : [];
  } catch {
    return [];
  }
}

export async function saveSubscription(sub: Subscription): Promise<void> {
  const subs = await getSubscriptions();
  subs.push(sub);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(subs));
}

export async function deleteSubscription(id: string): Promise<void> {
  const subs = (await getSubscriptions()).filter((s) => s.id !== id);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(subs));
}

export async function updateSubscription(
  id: string,
  updates: Partial<Omit<Subscription, "id">>,
): Promise<void> {
  const subs = (await getSubscriptions()).map((s) =>
    s.id === id ? { ...s, ...updates } : s,
  );
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(subs));
}
