import { useEffect, useState } from "react";
import { LoadFonts } from "./utils/LoadFonts";
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider } from './contexts/AuthContext';
import {Blank} from "./screens/Blank";
import HomeScreen from "./screens/HomeScreen"
import {screenConfig} from "./constants/ScreenConfig";
import { Contacts } from "./screens/Contacts";
import { SplashScreen } from "./screens/SplashScreen";
import TicketsScreen from "./screens/TicketsScreen";
 
// ── TROY — Auth screens ──────────────────────────────────────
import LoginScreen           from "./screens/LoginScreen";
import OfflineLoginScreen    from "./screens/OfflineLoginScreen";
import BiometricScreen       from "./screens/BiometricScreen";
import PasswordResetScreen   from "./screens/PasswordResetScreen";
import OfflinePinResetScreen from "./screens/OfflinePinResetScreen";
 
// ── TROY — Profile screens ───────────────────────────────────
import ProfileScreen from "./screens/ProfileScreen";
import LicenseScreen from "./screens/LicenseScreen";
 
export type RootStackParamList = {
  // ── Jonathan — App screens ───────────────────────────────────
  SplashScreen:  undefined;
  Home:          undefined;
  Blank:         undefined;
  Contacts:      undefined;
  Tickets:       undefined;

  // ── Jonathan — Work Orders (placeholder until real screen built) ──
  WorkOrders:    undefined;
  JobDetail:     { jobId: string; workOrderId: string };

  // ── Troy — Auth screens ──────────────────────────────────────
  Login:           undefined;
  OfflineLogin:    undefined;
  BiometricCheck:  undefined;
  PasswordReset:   undefined;
  OfflinePinReset: undefined;

  // ── Troy — Profile screens ───────────────────────────────────
  Profile:         undefined;
  LicenseDetails:  undefined;

  // ── Charlie — Dashboard (placeholder until real screen is built) ──
  Dashboard:       undefined;
};

const StackNavigator = createNativeStackNavigator();
        
export default function App() {
  const [externalFontsLoaded, setExternalFontsLoaded] = useState(false);
 
  useEffect(() => {
    const load = async () => {
      let isLoaded = await LoadFonts();
      setExternalFontsLoaded(isLoaded);
    };
    load();
  }, []);
 
  return (
   (externalFontsLoaded) &&
  <AuthProvider>
  <NavigationContainer>

    <StackNavigator.Navigator screenOptions={screenConfig.window} initialRouteName="SplashScreen">

      <StackNavigator.Screen name="SplashScreen"  component={SplashScreen}/>
      <StackNavigator.Screen name="Blank" component={Blank}/>
      <StackNavigator.Screen name="Home" component={HomeScreen}/>
      <StackNavigator.Screen name="Dashboard" component={HomeScreen}/>

      <StackNavigator.Screen name="Login"           component={LoginScreen}           />
      <StackNavigator.Screen name="OfflineLogin"    component={OfflineLoginScreen}    />
      <StackNavigator.Screen name="BiometricCheck"  component={BiometricScreen}       />
      <StackNavigator.Screen name="PasswordReset"   component={PasswordResetScreen}   />
      <StackNavigator.Screen name="OfflinePinReset" component={OfflinePinResetScreen} />
      <StackNavigator.Screen name="Profile"        component={ProfileScreen} />
      <StackNavigator.Screen name="LicenseDetails" component={LicenseScreen} />
      <StackNavigator.Screen name="Contacts"       component={Contacts}   />
      <StackNavigator.Screen name="Tickets"        component={TicketsScreen} />

    </StackNavigator.Navigator>

  </NavigationContainer>
  </AuthProvider>
  );
}
