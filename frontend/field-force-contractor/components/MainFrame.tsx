import {Styles} from "@/constants/Styles"
import {Assets} from "@/constants/Assets"
import {FC,ReactNode} from "react"
import {View,ImageBackground,ScrollView} from "react-native"
import {Header,HeaderVariant} from "@/components/Header"
import { Menu,MenuOptions}  from "@/components/Menu"
import {Menus} from "@/constants/Menus"
import { useRoute } from "@react-navigation/native"

type Props = {
children?:ReactNode
header?: HeaderVariant
headerMenu?: MenuOptions
footerMenu?: MenuOptions
strip?: "menus" | "all" | "header"
injectHeader?:ReactNode
injectFooter?:ReactNode
}

export const MainFrame:FC<Props> = (props) =>{
 const route = useRoute();
 const pageName = route.name;
 const renderHeaderMenu: MenuOptions =
  props.strip === "menus" || props.strip === "all"
    ? ["none",[]]
    : props.headerMenu ?? ["Menu2", [pageName]];

 const renderFooterMenu: MenuOptions =
  props.strip === "menus" || props.strip === "all"
    ? ["none",[]]
    : props.footerMenu ?? ["Menu3", Menus.Footer];

  const renderHeader = (props.strip != "all" && props.strip != "header") ? props.header : "none"

  return(<>
    <ImageBackground source={Assets.backgrounds.MainFrame.MainbackgroundImage} style={Styles.MainFrame.BackgroundImageSize}>
      <View style={Styles.MainFrame.Window}>
       <View style={Styles.MainFrame.Header}>
        <View style={Styles.MainFrame.SpaceHeader}/>
        <Header  header={renderHeader}/>
        <Menu menuOptions={renderHeaderMenu} />
        {
          props.injectHeader
        }
        </View>

        <ScrollView contentContainerStyle={Styles.MainFrame.Body}>
          {
          props.children
          }
        </ScrollView>

        <View style={Styles.MainFrame.Footer}>
           {
            props.injectFooter
           }
          <Menu menuOptions={renderFooterMenu}/>
          <View style={Styles.MainFrame.SpaceHeader}/>
        </View>

      </View>
    </ImageBackground>
 </>)
}
