import {FC, useEffect, useRef, useState} from "react"
import { useNavigation } from "@react-navigation/native"
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from "@/App"
import { MainFrame } from "@/components/MainFrame";
import {View,Image} from "react-native"
import { Styles } from "@/constants/Styles";
import { Assets } from "@/constants/Assets";
import { useAuth } from "@/contexts/AuthContext";

export const SplashScreen:FC = () =>{
const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
const { isAuthenticated, isLoading } = useAuth()
const [splashDone, setSplashDone] = useState(false)
const navigated = useRef(false)

 useEffect(() =>{
  const timer = setTimeout(() => setSplashDone(true), 2500)
  return () => clearTimeout(timer)
 },[])

 useEffect(() =>{
  if (splashDone && !isLoading && !navigated.current) {
   navigated.current = true
   nav.navigate(isAuthenticated ? "Dashboard" : "Login")
  }
 },[splashDone, isLoading, isAuthenticated])

 return(<>
 
  <MainFrame strip="all">

    <View style={Styles.SplashScreen.Block}>

        <Image source={Assets.logos.FieldForceLogo} style={Styles.SplashScreen.LogoImage}/>
        <Image source={Assets.logos.FieldForceLogoText} style={Styles.SplashScreen.LogoText}/>
          
    </View>

  </MainFrame>
 
 </>)

}