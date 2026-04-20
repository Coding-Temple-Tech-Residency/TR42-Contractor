// SplashScreen.tsx  —  Jonathan
//
// Shows the Field Force logo for 3 seconds on app launch, then routes
// based on whether the user has a valid existing session:
//
//   Valid token found → Home   (user stays logged in, skips login)
//   No token / expired → Login (user must log in again)
//
// ── IMPORTANT: WHY replace() AND NOT navigate() ───────────────────────────────
// Using navigate() leaves SplashScreen in the navigation stack. If anything
// later changes isAuthenticated (e.g. login() being called after biometrics),
// the useEffect would fire again, start a new timer, and navigate the user back
// to Home mid-session — pulling them off whatever screen they were on.
//
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
  const { isAuthenticated, isLoading } = useAuth();

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

      if (isAuthenticated) {
        // Valid unexpired token — skip login entirely
        // replace() removes SplashScreen from the stack so it can never
        // fire navigation again after the user is in the app
        nav.replace('Home' as any);
      } else {
        // No token or expired — go to Login
        nav.replace('Login' as any);
      }
    }, SPLASH_TIME);

    return () => clearTimeout(timer);

    // Only isLoading is a dependency — we intentionally do NOT include
    // isAuthenticated here. We read it once when isLoading becomes false.
    // If isAuthenticated were a dependency, any later call to login() would
    // re-trigger this effect and navigate the user mid-session.
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