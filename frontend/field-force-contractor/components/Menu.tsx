import {Styles} from "../constants/Styles"
import {View, Text,Pressable,Image} from "react-native"
import {FC} from "react"
import {useState,useEffect,useRef} from "react"
import { MenuItem } from "./MenuItem"
import {Menus} from "../constants/Menus"
import {Assets} from "../constants/Assets"

type MenuVariant = "Menu1" | "Menu2" | "none"
export type MenuItems = {label:string,icon?:string,component:string}
export type MenuOptions = [MenuVariant,items?:MenuItems[]]
type Props = {
menuOptions?:MenuOptions
}
export const Menu:FC<Props> = (props) => {
    const [options,setIptions] = useState(props.menuOptions)
    const [menuStyle,setMenuStyle] = useState<any>(null);
    const [viewItem, setView] = useState<any>();
  
    useEffect(()=>{
     
        setIptions(props.menuOptions);
        switch (options?.[0]){
        case "Menu1":
            setMenuStyle(Styles.Menu.container)
            setView(v1)
            break;
        case "Menu2":
            setMenuStyle(Styles.Menu.container)
            setView(v2)
            break;
        case "none":
          setMenuStyle(Styles.Menu.container)
          setView(null);

        default:
            setMenuStyle(Styles.Menu.container)
        
        }


    },[options])
    const v1 = () => {
      return(
     <View  style={Styles.Menu.container}>
       {
       (options?.[1] || []).map((items,index) =>{
          return(<MenuItem key={index} menuItem={items}/>)

       })}
      </View>)

    }

    const v2 = () =>{
      return(
        <View style={Styles.Menu.container}>
          <Image source={Assets.icons.profileIcon} style={Styles.Menu.headMenuIcon}></Image>
        </View>
      )
    }
 
    return(
      viewItem 
    )

     
      
}
    
  

   

