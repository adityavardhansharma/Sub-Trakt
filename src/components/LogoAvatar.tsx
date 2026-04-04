import { Image } from "expo-image";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import type { ThemeColors } from "../theme/colors";

export function isRemoteLogoUri(logo: string | null): logo is string {
  if (!logo) return false;
  return logo.startsWith("http://") || logo.startsWith("https://");
}

type LogoAvatarProps = {
  logo: string | null;
  name: string;
  size: number;
  colors: ThemeColors;
  style?: ViewStyle;
};

export function LogoAvatar({ logo, name, size, colors, style }: LogoAvatarProps) {
  const initial = name.trim()[0]?.toUpperCase() ?? "?";
  const borderRadius = 14;

  return (
    <View
      style={[
        styles.box,
        {
          width: size,
          height: size,
          borderRadius,
          backgroundColor: colors.surfaceRaised,
          borderColor: colors.borderSubtle,
          borderWidth: 1,
        },
        style,
      ]}
    >
      {isRemoteLogoUri(logo) ? (
        <Image
          source={{ uri: logo }}
          style={{ width: "80%", height: "80%", borderRadius: borderRadius - 2 }}
          contentFit="contain"
          onError={() => {}}
        />
      ) : logo && !isRemoteLogoUri(logo) ? (
        <Text style={{ fontSize: size * 0.45 }}>{logo}</Text>
      ) : (
        <Text
          style={[
            styles.initial,
            {
              color: colors.textSecondary,
              fontSize: size * 0.38,
            },
          ]}
        >
          {initial}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  initial: {
    fontWeight: "800",
  },
});
