import { useEffect, useState } from "react";
import { TextInput, View, ActivityIndicator } from "react-native";
import { LoadFonts } from "./utils/LoadFonts";

// Dark translucent keyboard on iOS for every TextInput in the app
(TextInput as any).defaultProps = {
  ...((TextInput as any).defaultProps ?? {}),
  keyboardAppearance: 'dark',
};

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// ── Jonathan ──────────────────────────────────────
import {Blank} from "./screens/Blank";
import HomeScreen from "./screens/HomeScreen"
import {screenConfig} from "./constants/ScreenConfig";
import { Contacts } from "./screens/ContactScreen";
import { SplashScreen } from "./screens/SplashScreen";
import {Chat} from "./screens/ChatScreen";
import TicketsScreen from "./screens/TicketsScreen";
import TicketDetailScreen from "./screens/TicketDetailScreen";
import InspectionScreen from "./screens/InspectionScreen";
import { InspectionAssistScreen } from "./screens/InspectionAssistScreen";
import DriveTimeTrackerScreen from "./screens/DriveTimeTrackerScreen";

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
  // ── Always visible ───────────────────────────────────────────
  SplashScreen:  undefined;

  // ── Jonathan — App screens ───────────────────────────────────
  Home:          undefined;
  Blank:         undefined;
  // ── Charlie — App screens ───────────────────────────────────
  Contacts:      undefined;
  Chat:          { name: string };
  Tickets:       undefined;
  TicketDetail:  { taskId: number };

  // ── Jonathan — Work Orders (placeholder until real screen built) ──
  JobDetail:     { jobId: string; workOrderId: string };
  // ── Charlie — Work Orders (placeholder until real screen built) ──
  WorkOrders:    undefined;

  // ── Troy — Auth screens ──────────────────────────────────────
  Login:           undefined;
  OfflineLogin:    undefined;
  BiometricCheck:  undefined;
  PasswordReset:   undefined;
  OfflinePinReset: undefined;

  // ── Troy — Profile screens ───────────────────────────────────
  Profile:         undefined;
  LicenseDetails:  undefined;

  // ── Aldo — Inspection screen + AI assist + Drive Time ────────
  Inspection:        { bypassGate?: boolean } | undefined;
  InspectionAssist:  undefined;
  DriveTimeTracker:  undefined;

  // ── Charlie — Dashboard (placeholder until real screen is built) ──
  Dashboard:       undefined;
};

const StackNavigator = createNativeStackNavigator();

// ── Auth-aware navigator ───────────────────────────────────────────────────
// Renders the Auth stack (Login flow) when there is no valid token.
// Renders the App stack (Inspection gate → Dashboard) when authenticated.
// React Navigation automatically transitions between stacks when isAuthenticated changes.
function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  // Still reading token from SecureStore — show a branded loading screen
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <StackNavigator.Navigator screenOptions={screenConfig.window}>
      {isAuthenticated ? (
        // ── Protected App screens ─────────────────────────────────────────
        <>
          <StackNavigator.Screen name="Inspection"       component={InspectionScreen}       />
          <StackNavigator.Screen name="Dashboard"        component={HomeScreen}              />
          <StackNavigator.Screen name="Home"             component={HomeScreen}              />
          <StackNavigator.Screen name="Blank"            component={Blank}                  />
          <StackNavigator.Screen name="Contacts"         component={Contacts}               />
          <StackNavigator.Screen name="Chat"             component={Chat}                   />
          <StackNavigator.Screen name="Tickets"          component={TicketsScreen}          />
          <StackNavigator.Screen name="TicketDetail"     component={TicketDetailScreen}     />
          <StackNavigator.Screen name="Profile"          component={ProfileScreen}          />
          <StackNavigator.Screen name="LicenseDetails"   component={LicenseScreen}          />
          <StackNavigator.Screen name="InspectionAssist" component={InspectionAssistScreen} />
          <StackNavigator.Screen name="DriveTimeTracker" component={DriveTimeTrackerScreen} />
          {/* SplashScreen kept for Jonathan's direct nav references */}
          <StackNavigator.Screen name="SplashScreen"     component={SplashScreen}           />
        </>
      ) : (
        // ── Public Auth screens ───────────────────────────────────────────
        <>
          <StackNavigator.Screen name="Login"           component={LoginScreen}           />
          <StackNavigator.Screen name="OfflineLogin"    component={OfflineLoginScreen}    />
          <StackNavigator.Screen name="BiometricCheck"  component={BiometricScreen}       />
          <StackNavigator.Screen name="PasswordReset"   component={PasswordResetScreen}   />
          <StackNavigator.Screen name="OfflinePinReset" component={OfflinePinResetScreen} />
        </>
      )}
    </StackNavigator.Navigator>
  );
}

// ── App root ───────────────────────────────────────────────────────────────
export default function App() {
  const [externalFontsLoaded, setExternalFontsLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      const isLoaded = await LoadFonts();
      setExternalFontsLoaded(isLoaded);
    };
    load();
  }, []);

  if (!externalFontsLoaded) return null;

  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
