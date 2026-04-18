import { useEffect, useState } from "react";
import { TextInput } from "react-native";
import { LoadFonts } from "./utils/LoadFonts";

// Dark translucent keyboard on iOS for every TextInput in the app
(TextInput as any).defaultProps = {
  ...((TextInput as any).defaultProps ?? {}),
  keyboardAppearance: 'dark',
};
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider } from './contexts/AuthContext';


// ── Jonathan ──────────────────────────────────────
import {Blank} from "./screens/Blank"; //Test playground page will be removed for development purpose only!
import HomeScreen from "./screens/HomeScreen"
import {screenConfig} from "./constants/ScreenConfig";
import { Contacts } from "./screens/ContactScreen";
import { SplashScreen } from "./screens/SplashScreen";
import {Chat} from "./screens/ChatScreen";
import TicketsScreen from "./screens/TicketsScreen";
import TicketDetailScreen from "./screens/TicketDetailScreen";
import InspectionScreen from "./screens/InspectionScreen"
import { InspectionAssistScreen } from "./screens/InspectionAssistScreen";
 
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
  // ── Charlie — App screens ───────────────────────────────────
  Contacts:      undefined;
  Chat:          undefined;
  Tickets:       undefined;
  TicketDetail: { taskId: number };

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

  // ── Aldo — Inspection screen + AI assist ─────────────────────
  Inspection:       undefined;
  InspectionAssist: undefined;

  // ── Charlie — Dashboard (placeholder until real screen is built) ──
  Dashboard:       undefined;
};

const StackNavigator = createNativeStackNavigator();
        
export default function App() {
  // ── Jonathan — Import External Fonts ───────────────────────────────────
  // Loads custom fonts when the app starts, then updates state so the app only renders after the fonts are ready.
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
      {/* Jonathan */}
      <StackNavigator.Screen name="SplashScreen"  component={SplashScreen}/>
      <StackNavigator.Screen name="Blank" component={Blank}/>
      <StackNavigator.Screen name="Contacts" component={Contacts}/>
      <StackNavigator.Screen name="Chat" component={Chat} />
      

      {/* Charlie */}
      <StackNavigator.Screen name="Home" component={HomeScreen}/>
      <StackNavigator.Screen name="Dashboard" component={HomeScreen}/>

      {/* Troy */}
      <StackNavigator.Screen name="Login"           component={LoginScreen}           />
      <StackNavigator.Screen name="OfflineLogin"    component={OfflineLoginScreen}    />
      <StackNavigator.Screen name="BiometricCheck"  component={BiometricScreen}       />
      <StackNavigator.Screen name="PasswordReset"   component={PasswordResetScreen}   />
      <StackNavigator.Screen name="OfflinePinReset" component={OfflinePinResetScreen} />
      <StackNavigator.Screen name="Profile"        component={ProfileScreen} />
      <StackNavigator.Screen name="LicenseDetails" component={LicenseScreen} />
      <StackNavigator.Screen name="Tickets"        component={TicketsScreen} />
      <StackNavigator.Screen name="TicketDetail"   component={TicketDetailScreen} />
      <StackNavigator.Screen name="Inspection"      component={InspectionScreen} />
      <StackNavigator.Screen name="InspectionAssist" component={InspectionAssistScreen} />


    </StackNavigator.Navigator>

  </NavigationContainer>
  </AuthProvider>
  );
}
