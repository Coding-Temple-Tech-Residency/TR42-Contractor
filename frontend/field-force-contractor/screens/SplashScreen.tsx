import {FC,useEffect} from "react"
import { useNavigation } from "@react-navigation/native"
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from "@/App"
import { MainFrame } from "@/components/MainFrame";
import {View,Image} from "react-native"
import { Styles } from "@/constants/Styles";
import { Assets } from "@/constants/Assets";

export const SplashScreen:FC = () =>{
const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
const SplashTime = 2500
 useEffect(() =>{

  const timer = setTimeout(() =>{

   nav.navigate("Home")

  },SplashTime)

 },[])

 return(<>
 
  <MainFrame strip="all">

    <View style={Styles.SplashScreen.Block}>

        <Image source={Assets.logos.FieldForceLogo} style={Styles.SplashScreen.LogoImage}/>
        <Image source={Assets.logos.FieldForceLogoText} style={Styles.SplashScreen.LogoText}/>
          
    </View>

  </MainFrame>
 
 </>)

}