import {Styles} from "../constants/Styles"
import {View, Text,Pressable} from "react-native"
import {FC} from "react"
import { MenuItem } from "./MenuItem"
import {Assets} from "../constants/Assets"
import { Image } from "expo-image"
import { useNavigation } from "@react-navigation/native"
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from "@/App"
type MenuVariant = "Menu1" | "Menu2" |"Menu3" | "none"
export type MenuItems = {label:string,icon?:string,component:string}
export type MenuOptions = [MenuVariant,items?:any[]] 

type Props = {
menuOptions?:MenuOptions 

}
export const Menu:FC<Props> = (props) => {
    const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
    const options = props.menuOptions

    const v1 = () => {
      return(
     <View  style={Styles.Menu.MenuStyle1}>
       {
       (options?.[1] || []).map((items,index) =>{
          return(<MenuItem key={index} menuItem={items}/>)

       })}
      </View>)

    }

    const v2 = () =>{
      return(
        <View style={Styles.Menu.MenuStyle2}>
          <Pressable onPress={() => { if (nav.canGoBack()) { nav.goBack(); } else { nav.navigate("Home"); } }} hitSlop={8}>
          <Image source={Assets.icons.BackArrow} style={Styles.Menu.headMenuStyle2Icon} contentFit="contain" transition={120} />
          </Pressable>
          <Text style={Styles.Menu.headerMenuStyle2Text}>{(props.menuOptions?.[1]?.[0].label === undefined)? props.menuOptions?.[1]?.[0]: "Object Not Supported"}</Text>
        </View>
      )
    }
     const v3 = () =>{
      return(
        <View  style={Styles.Menu.MenuStyle3}>
       {
       (options?.[1] || []).map((items,index) =>{
          return(<MenuItem key={index} menuItem={items}/>)

       })}
      </View>)
      
    }

    switch (options?.[0]){
      case "Menu1":
        return v1()
      case "Menu2":
        return v2()
      case "Menu3":
        return v3()
      case "none":
        return null
      default:
        return v1()
    }

     
      
}
    
  

   

