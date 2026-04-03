import {Styles} from "../constants/Styles"
import {Assets} from "../constants/Assets"
import {useState} from "react"
import {View,ImageBackground,Text} from "react-native"

export function MainFrame(props){


return(<>

<ImageBackground source={Assets.backgrounds.MainFrame.MainbackgroundImage} style={Styles.MainFrame.BackgroundImageSize}>
  

    <View id="main-container" style={Styles.MainFrame.Window}>
      <View id="main-header" style={Styles.MainFrame.Header}>
        <View style={Styles.MainFrame.TopSpaceHeader}/>
        <Text style={Styles.MainFrame.DefaultText}>Header</Text>
      </View>

      <View id="main-body" style={Styles.MainFrame.Body}>
         {
         props.children
         }  
      </View>
      <View id="main-footer" style={Styles.MainFrame.Footer}>

      </View>

    </View>
 </ImageBackground>



</>)
}