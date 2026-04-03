import {Styles} from "../constants/Styles"
import {Assets} from "../constants/Assets"
import {useState} from "react"
import {View,ImageBackground,Text} from "react-native"

export function MainFrame(props){


return(<>

<ImageBackground source={Assets.backgrounds.MainFrame.MainbackgroundImage} style={Styles.MainFrame.BackgroundImageSize}>
   <View style={Styles.MainFrame.TopSpaceHeader}/>
    <View style={Styles.MainFrame.Window}>
       {
        props.children
       }  

    </View>
 </ImageBackground>



</>)
}