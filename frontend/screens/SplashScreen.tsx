import { FC, useEffect } from "react"
import { useNavigation } from "@react-navigation/native"
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from "@/App"
import { MainFrame } from "@/components/MainFrame";
import { View } from "react-native"
import { Image } from "expo-image"
import { Styles } from "@/constants/Styles";
import { Assets } from "@/constants/Assets";
import { useAuth } from "@/contexts/AuthContext";

export const SplashScreen: FC = () => {
  const nav            = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    const frame = requestAnimationFrame(() => {
      nav.replace(isAuthenticated ? 'Home' : 'Login');
    });

    return () => cancelAnimationFrame(frame);
  }, [isAuthenticated, isLoading, nav]);

  return (
    <MainFrame header="none" headerMenu={["none"]} footerMenu={["none"]}>
      <View style={Styles.SplashScreen.Block}>
        <Image source={Assets.logos.FieldForceLogo} style={Styles.SplashScreen.LogoImage} contentFit="contain" transition={120} />
        <Image source={Assets.logos.FieldForceLogoText} style={Styles.SplashScreen.LogoText} contentFit="contain" transition={120} />
      </View>
    </MainFrame>
  );
}
