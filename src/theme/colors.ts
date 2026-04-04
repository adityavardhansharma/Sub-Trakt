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
  background: "#0E0C0A",
  surface: "#1A1714",
  surfaceRaised: "#24211E",
  border: "rgba(244, 241, 235, 0.07)",
  borderSubtle: "rgba(244, 241, 235, 0.035)",
  text: "#EDE9E2",
  textSecondary: "#918A80",
  textMuted: "#504A43",
  accent: "#D4923A",
  accentMuted: "rgba(212, 146, 58, 0.11)",
  monthly: "#6BA8E0",
  yearly: "#5CC99E",
  destructive: "#D45050",
};
