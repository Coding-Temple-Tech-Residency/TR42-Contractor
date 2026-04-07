import {Styles} from "../constants/Styles"
import {Assets} from "../constants/Assets"
import {useState,FC,ReactNode} from "react"
import {View,ImageBackground,Text,ScrollView} from "react-native"
import { SearchBar } from "../components/SearchBar"
type Props ={
  children: ReactNode
}
export const MainFrame:FC<Props> = (props) =>{


return(<>

<ImageBackground source={Assets.backgrounds.MainFrame.MainbackgroundImage} style={Styles.MainFrame.BackgroundImageSize}>
  

    <View style={Styles.MainFrame.Window}>
      <View  style={Styles.MainFrame.Header}>
        <View style={Styles.MainFrame.SpaceHeader}/>
        <SearchBar buttonText="Search" placeHolder="Search..."/>
        <Text style={Styles.MainFrame.DefaultText}>Header Here</Text>
        <Text style={Styles.MainFrame.DefaultText}>Menu Here</Text>
      </View>

      <ScrollView contentContainerStyle={Styles.MainFrame.Body}>
         {
         props.children
         }  
      </ScrollView>
      <View style={Styles.MainFrame.Footer}>
           <Text style={Styles.MainFrame.DefaultText}>Bottom Navigation Here </Text>
           <View style={Styles.MainFrame.SpaceHeader}/>
      </View>

    </View>
 </ImageBackground>



</>)
}