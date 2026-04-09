import {Styles} from "../constants/Styles"
import {Assets} from "../constants/Assets"
import {FC,ReactNode,useEffect} from "react"
import {View,ImageBackground,Text,ScrollView,Image,} from "react-native"
import {Header,HeaderVariant} from "../components/Header"
import { Menu,MenuOptions}  from "./Menu"
import {Menus} from "../constants/Menus"

type Props = {
children?:ReactNode
header?: HeaderVariant
headerMenu?: MenuOptions
footerMenu?: MenuOptions


}

export const MainFrame:FC<Props> = (props) =>{



  return(<>
    <ImageBackground source={Assets.backgrounds.MainFrame.MainbackgroundImage} style={Styles.MainFrame.BackgroundImageSize}>
      <View style={Styles.MainFrame.Window}>
       <View style={Styles.MainFrame.Header}>
        <View style={Styles.MainFrame.SpaceHeader}/>
        <Header  header={props.header}/>
        <Menu menuOptions={(props.headerMenu) ? props.headerMenu : ["Menu1",Menus.Main]} />
        </View>

        <ScrollView contentContainerStyle={Styles.MainFrame.Body}>
          {
          props.children
          }
        </ScrollView>

        <View style={Styles.MainFrame.Footer}>
          <Menu menuOptions={(props.footerMenu) ? props.footerMenu : ["Menu3",Menus.Footer]}/>
          <View style={Styles.MainFrame.SpaceHeader}/>
        </View>

      </View>
    </ImageBackground>
 </>)
}
