import { Styles } from "./Styles";

export const screenConfig = {
  // ── Window ────────────────────────────────────────────────
  // window is used in App.tsx as the shared screenOptions object for StackNavigator.Navigator.
  // headerShown disables the default React Navigation header so the app can render its own custom headers.
  // contentStyle sets the screen background so the safe area / home indicator area stays dark.
  window: {
    headerShown: false,
    contentStyle: { backgroundColor: '#0a0e1a' },
  },
};
