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
import { ThemeProvider } from './contexts/ThemeContext';

// ── Jonathan ──────────────────────────────────────────────────────────────────
import {Blank} from "./screens/Blank"; //Test playground page will be removed for development purpose only!
import HomeScreen from "./screens/HomeScreen"
import {screenConfig} from "./constants/ScreenConfig";
import { Contacts } from "./screens/ContactScreen";
import { SplashScreen } from "./screens/SplashScreen";
import {Chat} from "./screens/ChatScreen";
import TicketsScreen from "./screens/TicketsScreen";
import TicketDetailScreen from "./screens/TicketDetailScreen";
import InspectionScreen from "./screens/InspectionScreen";

// ── Aldo — AI / Drive Time / Saved Reports ────────────────────────────────────
import { InspectionAssistScreen } from "./screens/InspectionAssistScreen";
import DriveTimeTrackerScreen    from "./screens/DriveTimeTrackerScreen";
import { SavedReportsScreen }    from "./screens/SavedReportsScreen";

// ── Troy — Auth screens ───────────────────────────────────────────────────────
import LoginScreen           from "./screens/LoginScreen";
import OfflineLoginScreen    from "./screens/OfflineLoginScreen";
import BiometricScreen       from "./screens/BiometricScreen";
import PasswordResetScreen   from "./screens/PasswordResetScreen";
import OfflinePinResetScreen from "./screens/OfflinePinResetScreen";

// ── Troy — Profile screens ────────────────────────────────────────────────────
import ProfileScreen     from "./screens/ProfileScreen";
import LicenseScreen     from "./screens/LicenseScreen";
import TaskHistoryScreen from "./screens/TaskHistoryScreen";

export type RootStackParamList = {
  // ── Always visible ────────────────────────────────────────────────────────
  SplashScreen:  undefined;

  // ── Jonathan — App screens ────────────────────────────────────────────────
  Home:          undefined;
  Blank:         undefined;

  // ── Charlie — App screens ─────────────────────────────────────────────────
  Contacts:      undefined;
  Chat:          { name: string };
  Tickets:       undefined;
  TicketDetail:  { taskId: number };

  // ── Jonathan — Work Orders (placeholder until real screen built) ──────────
  JobDetail:     { jobId: string; workOrderId: string };
  // ── Charlie — Work Orders (placeholder until real screen built) ───────────
  WorkOrders:    undefined;

  // ── Troy — Auth screens ───────────────────────────────────────────────────
  Login:           undefined;
  OfflineLogin:    undefined;

  // BiometricCheck receives the pending token and user from LoginScreen.
  // login() is NOT called until the biometric scan succeeds here, ensuring
  // isAuthenticated never becomes true before identity is verified.
  BiometricCheck: {
    pendingToken: string;
    pendingUser:  { id: number; username: string; role: string };
  };

  PasswordReset:   undefined;
  OfflinePinReset: undefined;

  // ── Troy — Profile screens ────────────────────────────────────────────────
  Profile:         undefined;
  LicenseDetails:  undefined;
  TaskHistory:     undefined;

  // ── Aldo — Inspection screen + AI assist + Drive Time ────────────────────
  Inspection:       { bypassGate?: boolean } | undefined;
  InspectionAssist: undefined;
  DriveTimeTracker: undefined;

  // ── Aldo — Saved Reports ──────────────────────────────────────────────────
  SavedReports: undefined;

  // ── Charlie — Dashboard (placeholder until real screen is built) ──────────
  Dashboard:       undefined;
};

const StackNavigator = createNativeStackNavigator();

// ── Auth-aware navigator ──────────────────────────────────────────────────────
// Renders the Auth stack (Login flow) when there is no valid token.
// Renders the App stack (Inspection gate → Dashboard) when authenticated.
// React Navigation automatically transitions between stacks when isAuthenticated changes.
//
// IMPORTANT: BiometricCheck is in the PUBLIC stack because it runs BEFORE
// login() is called. LoginScreen passes pendingToken + pendingUser as nav params
// and BiometricScreen calls login() only after a successful scan. If BiometricCheck
// were in the protected stack it would be unmounted the moment isAuthenticated
// flips to true, bypassing biometrics entirely.
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
        // ── Protected App screens ─────────────────────────────────────────────
        // First screen is Inspection — the daily gate. After passing (or skipping)
        // it navigates to Dashboard. All other app screens follow.
        <>
          <StackNavigator.Screen name="Inspection"       component={InspectionScreen}       />
          <StackNavigator.Screen name="Dashboard"        component={HomeScreen}             />
          <StackNavigator.Screen name="Home"             component={HomeScreen}             />
          <StackNavigator.Screen name="Blank"            component={Blank}                 />
          <StackNavigator.Screen name="Contacts"         component={Contacts}              />
          <StackNavigator.Screen name="Chat"             component={Chat}                  />
          <StackNavigator.Screen name="Tickets"          component={TicketsScreen}         />
          <StackNavigator.Screen name="TicketDetail"     component={TicketDetailScreen}    />
          <StackNavigator.Screen name="Profile"          component={ProfileScreen}         />
          <StackNavigator.Screen name="LicenseDetails"   component={LicenseScreen}         />
          <StackNavigator.Screen name="TaskHistory"      component={TaskHistoryScreen}     />
          <StackNavigator.Screen name="InspectionAssist" component={InspectionAssistScreen}/>
          <StackNavigator.Screen name="DriveTimeTracker" component={DriveTimeTrackerScreen}/>
          <StackNavigator.Screen name="SavedReports"     component={SavedReportsScreen}    />
          {/* SplashScreen kept for Jonathan's direct nav references */}
          <StackNavigator.Screen name="SplashScreen"     component={SplashScreen}          />
        </>
      ) : (
        // ── Public Auth screens ───────────────────────────────────────────────
        // SplashScreen checks the token on mount and navigates accordingly.
        // BiometricCheck lives here so it is available before login() fires.
        <>
          <StackNavigator.Screen name="SplashScreen"    component={SplashScreen}          />
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

// ── App root ──────────────────────────────────────────────────────────────────
export default function App() {
  // ── Jonathan — Import External Fonts ─────────────────────────────────────
  // Loads custom fonts when the app starts, then updates state so
  // the app only renders after the fonts are ready.
  const [externalFontsLoaded, setExternalFontsLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      let isLoaded = await LoadFonts();
      setExternalFontsLoaded(isLoaded);
    };
    load();
  }, []);

  if (!externalFontsLoaded) return null;

  return (
    <ThemeProvider>
      <AuthProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </ThemeProvider>
  );
}