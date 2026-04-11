import { useEffect, useState } from "react";
import { LoadFonts } from "./utils/LoadFonts";
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ImageBackground, StyleSheet } from 'react-native';
import { screenConfig } from "./constants/ScreenConfig";
import { AuthProvider } from "./contexts/AuthContext";
import { Assets } from "./constants/Assets";

// ── Utility screens ──────────────────────────────────────────
import { Blank }    from "./screens/Blank";
import { Contacts } from "./screens/Contacts";
import { SplashScreen } from "./screens/SplashScreen";

// ── Auth screens (Troy) ──────────────────────────────────────
import LoginScreen           from "./screens/LoginScreen";
import OfflineLoginScreen    from "./screens/OfflineLoginScreen";
import BiometricScreen       from "./screens/BiometricScreen";
import PasswordResetScreen   from "./screens/PasswordResetScreen";
import OfflinePinResetScreen from "./screens/OfflinePinResetScreen";

// ── Profile screens (Troy) ───────────────────────────────────
import ProfileScreen from "./screens/ProfileScreen";
import LicenseScreen from "./screens/LicenseScreen";

// ── App screens ──────────────────────────────────────────────
import HomeScreen            from "./screens/HomeScreen";
import DashboardPlaceholder  from "./screens/placeholders/DashboardPlaceholder";
import WorkOrdersPlaceholder from "./screens/placeholders/WorkOrdersPlaceholder";
import JobDetailPlaceholder  from "./screens/placeholders/JobDetailPlaceholder";

export type RootStackParamList = {
  // Auth flow
  SplashScreen:    undefined;
  Login:           undefined;
  OfflineLogin:    undefined;
  BiometricCheck:  undefined;
  PasswordReset:   undefined;
  OfflinePinReset: undefined;

  // Main app (post-login)
  Dashboard:   undefined;
  Home:        undefined;
  WorkOrders:  undefined;
  JobDetail:   { jobId: string; workOrderId: string };
  Contacts:    undefined;

  // Profile
  Profile:        undefined;
  LicenseDetails: undefined;

  // Misc
  Blank: undefined;
};

const StackNavigator = createNativeStackNavigator();
const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: 'transparent',
    card:       'transparent',
    border:     '#10233d',
  },
};

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
    <SafeAreaProvider>
      <AuthProvider>
        <ImageBackground
          source={Assets.backgrounds.MainFrame.MainbackgroundImage}
          style={appStyles.bg}
          resizeMode="cover"
        >
          <NavigationContainer theme={navigationTheme}>
            <StackNavigator.Navigator
              screenOptions={screenConfig.window}
              initialRouteName="SplashScreen"
            >
              {/* ── Entry ── */}
              <StackNavigator.Screen name="SplashScreen" component={SplashScreen}        options={screenConfig.fade} />

              {/* ── Auth flow ── */}
              <StackNavigator.Screen name="Login"           component={LoginScreen}           options={screenConfig.fade} />
              <StackNavigator.Screen name="OfflineLogin"    component={OfflineLoginScreen}    options={screenConfig.fade} />
              <StackNavigator.Screen name="BiometricCheck"  component={BiometricScreen}       options={screenConfig.fade} />
              <StackNavigator.Screen name="PasswordReset"   component={PasswordResetScreen}   />
              <StackNavigator.Screen name="OfflinePinReset" component={OfflinePinResetScreen} />

              {/* ── Main app (accessible after login) ── */}
              <StackNavigator.Screen name="Dashboard"  component={DashboardPlaceholder}  />
              <StackNavigator.Screen name="Home"       component={HomeScreen}            />
              <StackNavigator.Screen name="WorkOrders" component={WorkOrdersPlaceholder} />
              <StackNavigator.Screen name="JobDetail"  component={JobDetailPlaceholder}  />
              <StackNavigator.Screen name="Contacts"   component={Contacts}              />

              {/* ── Profile ── */}
              <StackNavigator.Screen name="Profile"        component={ProfileScreen} options={screenConfig.slideUp} />
              <StackNavigator.Screen name="LicenseDetails" component={LicenseScreen} options={screenConfig.slideUp} />

              {/* ── Misc ── */}
              <StackNavigator.Screen name="Blank" component={Blank} />

            </StackNavigator.Navigator>
          </NavigationContainer>
        </ImageBackground>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const appStyles = StyleSheet.create({
  bg: { flex: 1, width: '100%', height: '100%' },
});
