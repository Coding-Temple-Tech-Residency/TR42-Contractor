import {Styles} from "../constants/Styles"
import {Assets} from "../constants/Assets"
import {FC,ReactNode} from "react"
import {View,ImageBackground,Text,ScrollView,Image,} from "react-native"
import {Header, HeaderVariant} from "../components/Header"


type Props ={
  children: ReactNode,
  header?: HeaderVariant,
}

export const MainFrame:FC<Props> = (props) =>{

  return(<>
    <ImageBackground source={Assets.backgrounds.MainFrame.MainbackgroundImage} style={Styles.MainFrame.BackgroundImageSize}>
      <View style={Styles.MainFrame.Window}>
        <View style={Styles.MainFrame.Header}>
          <Header header={props.header ?? "default"}/> 
          <Text style={Styles.MainFrame.DefaultText}> Top menu goes here</Text> 
        </View>

        <ScrollView contentContainerStyle={Styles.MainFrame.Body}>
          {
          props.children
          }
        </ScrollView>

        <View style={Styles.MainFrame.Footer}>
          <Text style={Styles.MainFrame.DefaultText}> Bottom Navigation Here</Text> 
          <View style={Styles.MainFrame.SpaceHeader}/>
        </View>

      </View>
    </ImageBackground>
 </>)
}