import { useEffect, useState } from "react";
import { LoadFonts } from "./utils/LoadFonts";
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';



// ── Jonathan ──────────────────────────────────────
import {Blank} from "./screens/Blank"; //Test playground page will be removed for development purpose only!
import HomeScreen from "./screens/HomeScreen"
import {screenConfig} from "./constants/ScreenConfig";
import { Contacts } from "./screens/Contacts";
import { SplashScreen } from "./screens/SplashScreen";
import {Chat} from "./screens/Chat";
 
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
  // Troy
  Login:           undefined;
  OfflineLogin:    undefined;
  BiometricCheck:  undefined;
  PasswordReset:   undefined;
  OfflinePinReset: undefined;
  Profile:         undefined;
  LicenseDetails:  undefined;

  //Jonathan
  Contacts:        undefined;
  SplashScreen:    undefined;
  Chat:         undefined;
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
  <NavigationContainer>

    <StackNavigator.Navigator screenOptions={screenConfig.window} initialRouteName="SplashScreen">
      {/* Jonathan */}
      <StackNavigator.Screen name="SplashScreen"  component={SplashScreen}/>
      <StackNavigator.Screen name="Blank" component={Blank}/>
      <StackNavigator.Screen name="Contacts" component={Contacts}/>
      <StackNavigator.Screen name="Chat" component={Chat} />
      

      {/* Charlie */}
      <StackNavigator.Screen name="Home" component={HomeScreen}/>

      {/* Troy */}
      <StackNavigator.Screen name="Login"           component={LoginScreen}           />
      <StackNavigator.Screen name="OfflineLogin"    component={OfflineLoginScreen}    />
      <StackNavigator.Screen name="BiometricCheck"  component={BiometricScreen}       />
      <StackNavigator.Screen name="PasswordReset"   component={PasswordResetScreen}   />
      <StackNavigator.Screen name="OfflinePinReset" component={OfflinePinResetScreen} />
      <StackNavigator.Screen name="Profile"        component={ProfileScreen} />
      <StackNavigator.Screen name="LicenseDetails" component={LicenseScreen} />
   

    </StackNavigator.Navigator>

  </NavigationContainer>
  );
}
