// SplashScreen.tsx  —  Jonathan
//
// Shows the Field Force logo for 3 seconds on cold start, then routes
// to Login. SplashScreen is only registered in the unauthenticated stack
// (App.tsx), so isAuthenticated is always false here — no branch needed.
//
// If the user has a valid stored token, AuthContext restores it on mount
// and the protected stack (Inspection-first) renders directly — Splash
// is never shown for returning users.
//
// ── IMPORTANT: WHY replace() AND NOT navigate() ───────────────────────────────
// replace() removes SplashScreen from the stack entirely when it routes. It
// can never fire again after that because it is no longer mounted.
//
// A hasNavigated ref provides a second safety net: even if the effect fires
// multiple times before navigation completes, only one navigation happens.
// ──────────────────────────────────────────────────────────────────────────────

import { FC, useEffect, useRef } from "react"
import { useNavigation }          from "@react-navigation/native"
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList }     from "@/App"
import { MainFrame }              from "@/components/MainFrame";
import { View, Image }            from "react-native"
import { Styles }                 from "@/constants/Styles";
import { Assets }                 from "@/constants/Assets";
import { useAuth }                from "@/contexts/AuthContext";

export const SplashScreen: FC = () => {
  const nav  = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isLoading } = useAuth();

  // Prevents multiple navigations if the effect fires more than once
  const hasNavigated = useRef(false);

  const SPLASH_TIME = 3000; // 3 seconds to show the logo

  useEffect(() => {
    // Don't start the timer until AuthContext has finished reading SecureStore
    if (isLoading) return;
    // Don't navigate again if we already have
    if (hasNavigated.current) return;

    const timer = setTimeout(() => {
      if (hasNavigated.current) return;
      hasNavigated.current = true;

      // SplashScreen is only in the unauthenticated stack — always go to Login.
      // Authenticated users skip Splash entirely: the protected stack mounts
      // with Inspection as its initialRouteName (see App.tsx RootNavigator).
      nav.replace('Login' as any);
    }, SPLASH_TIME);

    return () => clearTimeout(timer);
  }, [isLoading]);

  return (
    <MainFrame header="none" headerMenu={["none"]} footerMenu={["none"]}>
      <View style={Styles.SplashScreen.Block}>
        <Image source={Assets.logos.FieldForceLogo}     style={Styles.SplashScreen.LogoImage} />
        <Image source={Assets.logos.FieldForceLogoText} style={Styles.SplashScreen.LogoText}  />
      </View>
    </MainFrame>
  );
};
