import {Styles} from "../constants/Styles"
import {Assets} from "../constants/Assets"
import {FC} from "react"
import {View, Pressable} from "react-native"
import { Image } from "expo-image"
import { useNavigation } from "@react-navigation/native"
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from "@/App"
export type HeaderVariant = 'default' | 'home' | "none"

type Props ={
  
  header?: HeaderVariant
}
export const Header:FC<Props> = (props) =>{
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>()


// Header with just the logo and "Field Force" text
const HeaderDefault: FC = () => (
  <View style={Styles.HeaderVariants.container}>
    
    <View style={Styles.HeaderVariants.centered}>
      <Image source={Assets.logos.ffLogoName} style={Styles.HeaderVariants.logo} contentFit="contain" transition={120} />
    </View>
  </View>
)
// Header with the logo, "Field Force" text and profile icon
const HeaderHome: FC = () => (
  <View style={Styles.HeaderVariants.container}>
    <View style={Styles.HeaderVariants.row}>
      <Image source={Assets.logos.ffLogoName} style={Styles.HeaderVariants.logo} contentFit="contain" transition={120} />
      <Pressable onPress={() => {nav.navigate("Profile")}}>
      <Image source={Assets.icons.ProfileIcon} style={Styles.Menu.headMenuStyle2Icon} contentFit="contain" transition={120} cachePolicy="memory-disk" />
      </Pressable>
      
    </View>
  </View>
)

const headers: Record<Exclude<HeaderVariant,"none">, FC> = {
  default: HeaderDefault,
  home:    HeaderHome,
   

}
const headerType = props.header ?? "default"
if(headerType === "none"){
return(null);

}

const Head =  headers[headerType]

return(<>
{Head && <Head/>}
</>)
 
}

