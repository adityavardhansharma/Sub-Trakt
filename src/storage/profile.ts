import AsyncStorage from "@react-native-async-storage/async-storage";

const PROFILE_KEY = "subtrakt_profile_v1";

export interface UserProfile {
  name: string;
  email: string;
}

export async function getProfile(): Promise<UserProfile | null> {
  try {
    const data = await AsyncStorage.getItem(PROFILE_KEY);
    if (!data) return null;
    return JSON.parse(data) as UserProfile;
  } catch (error) {
    console.error("Failed to load profile:", error);
    return null;
  }
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.error("Failed to save profile:", error);
  }
}
