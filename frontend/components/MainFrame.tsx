import {Styles} from "../constants/Styles"
import {FC,ReactNode} from "react"
import {View,ScrollView} from "react-native"
import {Header,HeaderVariant} from "./Header"
import { Menu,MenuOptions}  from "./Menu"
import {Menus} from "../constants/Menus"

type Props = {
children?:ReactNode
header?: HeaderVariant
headerMenu?: MenuOptions
footerMenu?: MenuOptions
}

export const MainFrame:FC<Props> = (props) =>{
  return(
    <View style={Styles.MainFrame.Window}>
      <View style={Styles.MainFrame.Header}>
        <View style={Styles.MainFrame.SpaceHeader}/>
        <Header header={props.header}/>
        <Menu menuOptions={(props.headerMenu) ? props.headerMenu : ["Menu1",Menus.Main] } />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={Styles.MainFrame.Body}>
        {props.children}
      </ScrollView>

      <View style={Styles.MainFrame.Footer}>
        <Menu menuOptions={(props.footerMenu) ? props.footerMenu : ["Menu3",Menus.Footer] } />
        <View style={Styles.MainFrame.SpaceHeader}/>
      </View>
    </View>
  )
}
