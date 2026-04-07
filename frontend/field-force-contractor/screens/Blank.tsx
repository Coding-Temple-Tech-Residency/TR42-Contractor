import {MainFrame} from "../components/MainFrame";
import {Text,View} from "react-native";
import { Styles } from "../constants/Styles";
import {SearchBar} from "../components/SearchBar";
import {FC} from "react";
export const Blank:FC = () =>{

    return(<>
    
       <MainFrame>
           <View style={Styles.TestStyles.Style1}>
                
                <Text style={Styles.TestStyles.Style2}>children in styled container here</Text>
           </View>
       </MainFrame>
    
    
    </>)
}