import {Styles} from "@/constants/Styles"
import {Assets} from "@/constants/Assets"
import {FC, useContext} from "react"
import {View,Image, Pressable} from "react-native"
import { useNavigation } from "@react-navigation/native"
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from "@/App"
import { ProfileIcon } from "./ProfileIcon"
export type HeaderVariant = 'default' | 'home' | "none"
import { AppContext } from "@/contexts/AppContext"

type Props ={
  
  header?: HeaderVariant
}
export const Header:FC<Props> = (props) =>{
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const {userInfo} = useContext(AppContext);

// Header with just the logo and "Field Force" text
const HeaderDefault: FC = () => (
  <View style={Styles.HeaderVariants.container}>
    
    <View style={Styles.HeaderVariants.centered}>
      <Image source={Assets.logos.ffLogoName} style={Styles.HeaderVariants.logo} resizeMode="contain" />
    </View>
  </View>
)
// Header with the logo, "Field Force" text and profile icon
const HeaderHome: FC = () => (
  <View style={Styles.HeaderVariants.container}>
    <View style={Styles.HeaderVariants.row}>
      <Image source={Assets.logos.ffLogoName} style={Styles.HeaderVariants.logo} resizeMode="contain" />
      <Pressable onPress={() => {nav.navigate("Profile")}}>
     
      <ProfileIcon width={Styles.Menu.headMenuStyle2Icon.width} height={Styles.Menu.headMenuStyle2Icon.height} name={`${userInfo.firstName} ${userInfo.lastName}`}/>
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

