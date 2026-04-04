import {Styles} from "../constants/Styles"
import {Assets} from "../constants/Assets"
import {useState,FC,ReactNode} from "react"
import {View,ImageBackground,Text} from "react-native"

type Props ={
  children: ReactNode
}
export const MainFrame:FC<Props> = (props) =>{


return(<>

<ImageBackground source={Assets.backgrounds.MainFrame.MainbackgroundImage} style={Styles.MainFrame.BackgroundImageSize}>
  

    <View style={Styles.MainFrame.Window}>
      <View  style={Styles.MainFrame.Header}>
        <View style={Styles.MainFrame.TopSpaceHeader}/>
        <Text style={Styles.MainFrame.DefaultText}>Header</Text>
      </View>

      <View style={Styles.MainFrame.Body}>
         {
         props.children
         }  
      </View>
      <View style={Styles.MainFrame.Footer}>

      </View>

    </View>
 </ImageBackground>



</>)
}