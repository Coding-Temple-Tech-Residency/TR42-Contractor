import {Styles} from "@/constants/Styles"
import {View, Text,Pressable,Image} from "react-native"
import {FC} from "react"
import {useState,useEffect,useRef} from "react"
import { MenuItem } from "@/components/MenuItem"
import {Assets} from "@/constants/Assets"
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
    const [options,setIptions] = useState(props.menuOptions)
    const [viewItem, setView] = useState<any>()
    const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  
    useEffect(()=>{
     
        setIptions(props.menuOptions);
        switch (options?.[0]){
        case "Menu1":
            
            setView(v1)
            break;
        case "Menu2":
         
            setView(v2)
            break;
        case "Menu3":
            setView(v3)
             break;
        case "none":
      
          setView(null);
          break;

        default:
           setView(v1);
        
        }

    },[options])
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
          <Pressable onPress={()=>{nav.goBack()}}>
          <Image source={Assets.icons.BackArrow} style={Styles.Menu.headMenuStyle2Icon}></Image>
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
 
    return(
      viewItem 
    )

     
      
}
    
  

   

