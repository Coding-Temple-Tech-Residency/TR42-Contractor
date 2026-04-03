import {MainFrame} from "../components/MainFrame";
import {Text} from "react-native";
import { Styles } from "../constants/Styles";
export default function Blank(){

    return(<>
    
       <MainFrame>
            <Text style={Styles.MainFrame.DefaultText}>The main page using main frame</Text>
       </MainFrame>
    
    
    </>)
}