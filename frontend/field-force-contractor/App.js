import { Text, View } from "react-native";
import  {MainFrame} from "./components/MainFrame";
import {useEffect, useState} from "react";
import LoadFonts from "./utils/LoadFonts";
import {Styles} from "./constants/Styles";
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Blank from "./screens/Blank";
import {screenConfig} from "./constants/ScreenConfig";

const StackNavigator = createNativeStackNavigator();

export default function App() {
  const [externalFontsLoaded,setExternalFontsLoaded] = useState(false);

  useEffect(()=>{
   
      const load = async()=>{

        let isLoaded = await LoadFonts();
        setExternalFontsLoaded(isLoaded);
        
      }
      load();
  },[])

  return (
 
  <NavigationContainer>

    <StackNavigator.Navigator screenOptions={screenConfig.window} initialRouteName="Home">

      <StackNavigator.Screen name="Home" component={Blank}/>

    </StackNavigator.Navigator>

  </NavigationContainer>


   

  );
}
