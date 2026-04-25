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

import { FC, useEffect, useRef,useContext } from "react"
import { useNavigation }          from "@react-navigation/native"
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList }     from "@/App"
import { MainFrame }              from "@/components/MainFrame";
import { View, Image }            from "react-native"
import { Styles }                 from "@/constants/Styles";
import { Assets }                 from "@/constants/Assets";
import { useAuth }                from "@/contexts/AuthContext";
import { AppContext }             from "@/contexts/AppContext";

export const SplashScreen: FC = () => {
  const nav  = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isLoading,isAuthenticated } = useAuth();
  const {mount,setMounted,devMode} = useContext(AppContext);


  // Prevents multiple navigations if the effect fires more than once
  const hasNavigated = useRef(false);

  const SPLASH_TIME:number = 2500; // 3 seconds to show the logo

  useEffect(() => {
  if (isLoading || hasNavigated.current) return;

  const timer = setTimeout(() => {
    hasNavigated.current = true;
    if(!mount){
    setMounted(true);
    }
    if(devMode === false){
      if (isAuthenticated) {
        nav.replace('Home');
      } else {
        nav.replace('Login');
      }
    }
    else{
      nav.replace("Home");
    }
  
 
  }, SPLASH_TIME);

  return () => clearTimeout(timer);
}, [isLoading, isAuthenticated,mount]);

  return (
    <MainFrame header="none" headerMenu={["none"]} footerMenu={["none"]}>
      <View style={Styles.SplashScreen.Block}>
        <Image source={Assets.logos.FieldForceLogo}     style={Styles.SplashScreen.LogoImage} />
        <Image source={Assets.logos.FieldForceLogoText} style={Styles.SplashScreen.LogoText}  />
      </View>
    </MainFrame>
  );
};
