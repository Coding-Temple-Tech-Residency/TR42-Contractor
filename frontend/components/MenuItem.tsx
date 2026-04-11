import {Text,View,Pressable} from "react-native"
import {FC} from "react"
import { Image } from "expo-image"
import {Styles} from "../constants/Styles"
import { MenuItems } from "./Menu"
import {Assets} from "../constants/Assets"
import { useNavigation } from "@react-navigation/native"
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import{RootStackParamList} from "../App"
type Props = {
menuItem:MenuItems
}
export const MenuItem:FC<Props> = (props) =>{
const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
return(<>
<Pressable onPress={() => {nav.navigate(props.menuItem.component as any)}}>
{
    ({pressed}) =>{
    
        return(<>
            {
                <View style={Styles.Menu.menuItem}>
                    
                  {(props.menuItem.icon) ? <Image source={props.menuItem.icon || Assets.icons.HomeIcon} style={Styles.Menu.menuIcon} contentFit="contain" transition={120} cachePolicy="memory-disk" /> : null}
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
