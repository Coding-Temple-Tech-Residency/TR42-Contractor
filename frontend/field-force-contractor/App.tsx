import { useEffect, useState } from "react";
import { LoadFonts } from "./utils/LoadFonts";
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { screenConfig } from "./constants/ScreenConfig";
 
// ── TROY — Auth screens ──────────────────────────────────────
import LoginScreen           from "./screens/LoginScreen";
import OfflineLoginScreen    from "./screens/OfflineLoginScreen";
import BiometricScreen       from "./screens/BiometricScreen";
import PasswordResetScreen   from "./screens/PasswordResetScreen";
import OfflinePinResetScreen from "./screens/OfflinePinResetScreen";
 
// ── TROY — Profile screens ───────────────────────────────────
import ProfileScreen from "./screens/ProfileScreen";
import LicenseScreen from "./screens/LicenseScreen";
 
// ── CHARLIE — Dashboard ──────────────────────────────────────
// TODO (Charlie): When your Dashboard screen is ready:
//   1. Remove the DashboardPlaceholder import below
//   2. Add:  import DashboardScreen from "./screens/DashboardScreen";
//   3. Change component={DashboardPlaceholder} → component={DashboardScreen}
import DashboardPlaceholder from "./screens/placeholders/DashboardPlaceholder";
 
// ── JONATHAN — Work Orders ───────────────────────────────────
// TODO (Jonathan): When your screens are ready:
//   1. Remove the two placeholder imports below
//   2. Add:  import WorkOrdersScreen from "./screens/WorkOrdersScreen";
//            import JobDetailScreen  from "./screens/JobDetailScreen";
//   3. Swap the component={} props on those Stack.Screens below
import WorkOrdersPlaceholder from "./screens/placeholders/WorkOrdersPlaceholder";
import JobDetailPlaceholder  from "./screens/placeholders/JobDetailPlaceholder";
 
// ─────────────────────────────────────────────────────────────
// RootStackParamList
// Import this type in any screen to get typed navigation:
//   useNavigation<NativeStackNavigationProp<RootStackParamList>>()
// ─────────────────────────────────────────────────────────────
export type RootStackParamList = {
  // Troy — auth
  Login:           undefined;
  OfflineLogin:    undefined;
  BiometricCheck:  undefined;
  PasswordReset:   undefined;
  OfflinePinReset: undefined;
  // Troy — profile
  Profile:         undefined;
  LicenseDetails:  undefined;
  // Charlie
  Dashboard:       undefined;
  // Jonathan
  WorkOrders:      undefined;
  JobDetail:       { jobId: string; workOrderId: string };
};
 
const StackNavigator = createNativeStackNavigator<RootStackParamList>();
 
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
    <NavigationContainer>
      <StackNavigator.Navigator
        screenOptions={screenConfig.window}
        initialRouteName="Login"
      >
        {/* ── TROY — AUTH ─────────────────────────────── */}
        <StackNavigator.Screen name="Login"           component={LoginScreen}           />
        <StackNavigator.Screen name="OfflineLogin"    component={OfflineLoginScreen}    />
        <StackNavigator.Screen name="BiometricCheck"  component={BiometricScreen}       />
        <StackNavigator.Screen name="PasswordReset"   component={PasswordResetScreen}   />
        <StackNavigator.Screen name="OfflinePinReset" component={OfflinePinResetScreen} />
 
        {/* ── TROY — PROFILE ──────────────────────────── */}
        <StackNavigator.Screen name="Profile"        component={ProfileScreen} />
        <StackNavigator.Screen name="LicenseDetails" component={LicenseScreen} />
 
        {/* ── CHARLIE — DASHBOARD ─────────────────────── */}
        {/* TODO (Charlie): swap DashboardPlaceholder for your real screen */}
        <StackNavigator.Screen name="Dashboard"  component={DashboardPlaceholder} />
 
        {/* ── JONATHAN — WORK ORDERS ──────────────────── */}
        {/* TODO (Jonathan): swap placeholders for your real screens */}
        <StackNavigator.Screen name="WorkOrders" component={WorkOrdersPlaceholder} />
        <StackNavigator.Screen name="JobDetail"  component={JobDetailPlaceholder}  />
 
      </StackNavigator.Navigator>
    </NavigationContainer>
  );
}
