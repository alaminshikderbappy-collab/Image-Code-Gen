const palette = {
  black: "#0A0A0A",
  dark: "#141414",
  darkCard: "#1E1E1E",
  darkBorder: "#2A2A2A",
  gold: "#F5B800",
  white: "#FFFFFF",
  offWhite: "#E8E8E8",
  gray: "#8A8A8A",
  lightGray: "#555555",
  red: "#FF453A",
};

const dark = {
  text: palette.white,
  tint: palette.gold,
  background: palette.black,
  foreground: palette.white,
  card: palette.darkCard,
  cardForeground: palette.white,
  primary: palette.gold,
  primaryForeground: palette.black,
  secondary: palette.dark,
  secondaryForeground: palette.white,
  muted: palette.darkCard,
  mutedForeground: palette.gray,
  accent: palette.gold,
  accentForeground: palette.black,
  destructive: palette.red,
  destructiveForeground: palette.white,
  border: palette.darkBorder,
  input: palette.darkBorder,
};

const colors = {
  light: dark,
  dark,
  radius: 14,
};

export default colors;
