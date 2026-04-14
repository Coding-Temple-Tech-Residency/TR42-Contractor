import {Styles} from "@/constants/Styles"
import {Assets} from "@/constants/Assets"
import {FC,ReactNode,useEffect,useState} from "react"
import {View,ImageBackground,Text,ScrollView,Image,} from "react-native"
import {Header,HeaderVariant} from "@/components/Header"
import { Menu,MenuOptions}  from "@/components/Menu"
import {Menus} from "@/constants/Menus"

type Props = {
children?:ReactNode
header?: HeaderVariant
headerMenu?: MenuOptions
footerMenu?: MenuOptions
strip?: "menus" | "all" | "header"
}

export const MainFrame:FC<Props> = (props) =>{

 const renderHeaderMenu: MenuOptions =
  props.strip === "menus" || props.strip === "all"
    ? ["none",[]]
    : props.headerMenu ?? ["Menu2", ["Home"]];

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
        </View>

        <ScrollView contentContainerStyle={Styles.MainFrame.Body}>
          {
          props.children
          }
        </ScrollView>

        <View style={Styles.MainFrame.Footer}>
          <Menu menuOptions={renderFooterMenu}/>
          <View style={Styles.MainFrame.SpaceHeader}/>
        </View>

      </View>
    </ImageBackground>
 </>)
}
