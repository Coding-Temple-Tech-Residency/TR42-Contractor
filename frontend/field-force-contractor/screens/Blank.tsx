import {MainFrame} from "../components/MainFrame";
import {Text,View} from "react-native";
import { Styles } from "../constants/Styles";
export default function Blank(){

    return(<>
    
       <MainFrame header="default">
           <View style={Styles.TestStyles.Style1}>
                <Text style={Styles.TestStyles.Style2}>children in styled container here</Text>
           </View>
       </MainFrame>
    
    
    </>)
}