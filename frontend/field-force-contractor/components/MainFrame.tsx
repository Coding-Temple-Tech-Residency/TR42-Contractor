import {Styles} from "../constants/Styles"
import {Assets} from "../constants/Assets"
import {useState,FC,ReactNode} from "react"
import {View,ImageBackground,Text,ScrollView,Image,} from "react-native"

type HeaderVariant = 'default' | 'home'

type Props ={
  children: ReactNode
  header?: HeaderVariant
}

// Header with just the logo and "Field Force" text
const HeaderDefault: FC = () => (
  <View style={Styles.HeaderVariants.container}>
    <View style={Styles.MainFrame.SpaceHeader}/>
    <View style={Styles.HeaderVariants.centered}>
      <Image source={Assets.logos.ffLogoName} style={Styles.HeaderVariants.logo} resizeMode="contain" />
    </View>
  </View>
)
// Header with the logo, "Field Force" text and profile icon
const HeaderHome: FC = () => (
  <View style={Styles.HeaderVariants.container}>
    <View style={Styles.MainFrame.SpaceHeader}/>
    <View style={Styles.HeaderVariants.row}>
      <Image source={Assets.logos.ffLogoName} style={Styles.HeaderVariants.logo} resizeMode="contain" />
      <Image source={Assets.icons.profileIcon} style={Styles.HeaderVariants.profileIcon} resizeMode="contain" />
    </View>
  </View>
)

const headers: Record<HeaderVariant, FC> = {
  default: HeaderDefault,
  home:    HeaderHome,
}

export const MainFrame:FC<Props> = (props) =>{
  const Header = headers[props.header ?? 'default']
  return(<>
    <ImageBackground source={Assets.backgrounds.MainFrame.MainbackgroundImage} style={Styles.MainFrame.BackgroundImageSize}>
      <View style={Styles.MainFrame.Window}>

        <Header />

        <ScrollView contentContainerStyle={Styles.MainFrame.Body}>
          {
          props.children
          }
        </ScrollView>

        <View style={Styles.MainFrame.Footer}>
          <Text style={Styles.MainFrame.DefaultText}>Bottom Navigation Here</Text>
          <View style={Styles.MainFrame.SpaceHeader}/>
        </View>

      </View>
    </ImageBackground>
 </>)
}