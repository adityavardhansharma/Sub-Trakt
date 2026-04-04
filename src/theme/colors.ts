export type ThemeColors = {
  background: string;
  surface: string;
  surfaceRaised: string;
  border: string;
  borderSubtle: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentMuted: string;
  monthly: string;
  yearly: string;
  destructive: string;
};

export const lightColors: ThemeColors = {
  background: "#F4F1EB",
  surface: "#FEFDFB",
  surfaceRaised: "#F9F7F3",
  border: "rgba(30, 24, 18, 0.08)",
  borderSubtle: "rgba(30, 24, 18, 0.04)",
  text: "#1E1914",
  textSecondary: "#7D756A",
  textMuted: "#B0A99E",
  accent: "#B87430",
  accentMuted: "rgba(184, 116, 48, 0.09)",
  monthly: "#3D7EC5",
  yearly: "#3C9E6E",
  destructive: "#C24040",
};

export const darkColors: ThemeColors = {
  background: "#0A0A0A",
  surface: "#121212",
  surfaceRaised: "#1A1A1A",
  border: "rgba(255, 255, 255, 0.08)",
  borderSubtle: "rgba(255, 255, 255, 0.04)",
  text: "#F5F5F5",
  textSecondary: "#A3A3A3",
  textMuted: "#525252",
  accent: "#E5A040",
  accentMuted: "rgba(229, 160, 64, 0.12)",
  monthly: "#5B9EE3",
  yearly: "#48C28A",
  destructive: "#EF4444",
};
