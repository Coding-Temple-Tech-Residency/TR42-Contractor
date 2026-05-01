import { useEffect, useState,useContext} from "react";
import { TextInput, View, ActivityIndicator } from "react-native";
import { LoadFonts } from "./utils/LoadFonts";

// Dark translucent keyboard on iOS for every TextInput in the app
(TextInput as any).defaultProps = {
  ...((TextInput as any).defaultProps ?? {}),
  keyboardAppearance: "dark",
};

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";

// ── Jonathan ──────────────────────────────────────
import { screenConfig } from "./constants/ScreenConfig";
import { Chat } from "./screens/ChatScreen";
import { Contacts } from "./screens/ContactScreen";
import { SplashScreen} from "./screens/SplashScreen";
import { AppContext, AppProvider} from "./contexts/AppContext";
import DriveTimeTrackerScreen from "./screens/DriveTimeTrackerScreen";
import HomeScreen from "./screens/HomeScreen";
import { InspectionAssistScreen } from "./screens/InspectionAssistScreen";
import InspectionScreen from "./screens/InspectionScreen";
import { SavedReportsScreen } from "./screens/SavedReportsScreen";
import SessionLockScreen from "./screens/SessionLockScreen";
import TicketDetailScreen from "./screens/TicketDetailScreen";
import TicketsScreen from "./screens/TicketsScreen";
import { Blank } from "./screens/Blank";

// ── TROY — Auth screens ──────────────────────────────────────
import BiometricScreen from "./screens/BiometricScreen";
import LoginScreen from "./screens/LoginScreen";
import OfflineLoginScreen from "./screens/OfflineLoginScreen";
import OfflinePinResetScreen from "./screens/OfflinePinResetScreen";
import PasswordResetScreen from "./screens/PasswordResetScreen";

// ── TROY — Profile screens ───────────────────────────────────
import LicenseScreen from "./screens/LicenseScreen";
import ProfileScreen from "./screens/ProfileScreen";
import TaskHistoryScreen from "./screens/TaskHistoryScreen";
export type OnSuccessRoute = {
  [K in keyof RootStackParamList]:
    undefined extends RootStackParamList[K]
      ? { screen: K; params?: RootStackParamList[K] }
      : { screen: K; params: RootStackParamList[K] }
}[keyof RootStackParamList];
export type RootStackParamList = {
  // ── Always visible ───────────────────────────────────────────
  SplashScreen: undefined;

  // ── Jonathan — App screens ───────────────────────────────────
  Home: undefined;
  Blank: undefined;
  // ── Charlie — App screens ───────────────────────────────────
  Contacts: undefined;
  Chat: { name: string; contactId?: string };
  Tickets: undefined;
  TicketDetail: { taskId: number };

  // ── Jonathan — Work Orders (placeholder until real screen built) ──
  JobDetail: { jobId: string; workOrderId: string };
  // ── Charlie — Work Orders (placeholder until real screen built) ──
  WorkOrders: undefined;

  // ── Troy — Auth screens ──────────────────────────────────────
  Login: undefined;
  OfflineLogin: {
    pendingToken: string;
    pendingUser: { id: number; username: string; role: string };
  };

  // BiometricCheck receives the pending token and user from LoginScreen.
  // login() is NOT called until the biometric scan succeeds here, ensuring
  // isAuthenticated never becomes true before identity is verified.
  BiometricCheck: {
    pendingToken: string;
    pendingUser: { id: number; username: string; role: string };
    onSuccess?: OnSuccessRoute
  };

  PasswordReset: undefined;
  OfflinePinReset: undefined;

  // ── Troy — Profile screens ───────────────────────────────────
  Profile: undefined;
  LicenseDetails: undefined;
  TaskHistory: undefined;

  // ── Aldo — Inspection screen + AI assist + Drive Time ────────
  Inspection: { bypassGate?: boolean } | undefined;
  InspectionAssist: undefined;
  DriveTimeTracker: undefined;

  // ── Aldo — Saved Reports ─────────────────────────────────────
  SavedReports: undefined;

  // ── Session lock ─────────────────────────────────────────────
  SessionLock: undefined;

  // ── Charlie — Dashboard (placeholder until real screen is built) ──
  Dashboard: undefined;
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
      <View
        style={{
          flex: 1,
          backgroundColor: "#0a0a0a",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <StackNavigator.Navigator
      screenOptions={screenConfig.window} initialRouteName="SplashScreen"
      
    >
          <StackNavigator.Screen name="SplashScreen"    component={SplashScreen}          />
           <StackNavigator.Screen name="Blank"          component={Blank}          />
   
          <StackNavigator.Screen name="Inspection"       component={InspectionScreen}       />
          <StackNavigator.Screen name="Dashboard"        component={HomeScreen}              />
          <StackNavigator.Screen name="Home"             component={HomeScreen}              />
          <StackNavigator.Screen name="Contacts"         component={Contacts}                />
          <StackNavigator.Screen name="Chat"             component={Chat}                    />
          <StackNavigator.Screen name="Tickets"          component={TicketsScreen}           />
          <StackNavigator.Screen name="TicketDetail"     component={TicketDetailScreen}      />
          <StackNavigator.Screen name="Profile"          component={ProfileScreen}           />
          <StackNavigator.Screen name="LicenseDetails"   component={LicenseScreen}           />
          <StackNavigator.Screen name="TaskHistory"      component={TaskHistoryScreen}       />
          <StackNavigator.Screen name="InspectionAssist" component={InspectionAssistScreen}  />
          <StackNavigator.Screen name="DriveTimeTracker" component={DriveTimeTrackerScreen}  />
          <StackNavigator.Screen name="SavedReports"     component={SavedReportsScreen}      />
       
         <StackNavigator.Screen name="Login"           component={LoginScreen}           />
          <StackNavigator.Screen name="OfflineLogin"    component={OfflineLoginScreen}    />
          <StackNavigator.Screen name="BiometricCheck"  component={BiometricScreen}       />
          <StackNavigator.Screen name="PasswordReset"   component={PasswordResetScreen}   />
          <StackNavigator.Screen name="OfflinePinReset" component={OfflinePinResetScreen} />
        
     

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
    <AppProvider>
      <ThemeProvider>
        <AuthProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </AuthProvider>
      </ThemeProvider>
    </AppProvider>
  );
}