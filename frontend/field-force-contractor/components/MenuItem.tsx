import {Text,View,Pressable,Image} from "react-native"
import {FC,useState} from "react"
import {Styles} from "../constants/Styles"
import { MenuItems } from "./Menu"
import {Assets} from "../constants/Assets"

type Props = {
menuItem:MenuItems
}
export const MenuItem:FC<Props> = (props) =>{
return(<>
<Pressable>
{
    ({pressed}) =>{
    
        return(<>
            {
                <View style={Styles.Menu.menuItem}>
                    
                  {(props.menuItem.icon) ? <Image source={props.menuItem.icon || Assets.icons.HomeIcon} style={Styles.Menu.menuIcon}/> : null}
                    <Text style={
                        [
                            Styles.Menu.itemText,
                            {
                                color: (pressed) ? Styles.Menu.itemTextPressed.color : Styles.Menu.itemText.color
                            }
                        ]

                    }>{props.menuItem.label}</Text>
                
                
                </View>
            }
       </> )
    }
}
</Pressable>

</>)


}