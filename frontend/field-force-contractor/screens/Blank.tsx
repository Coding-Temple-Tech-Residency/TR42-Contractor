import {MainFrame} from "../components/MainFrame";
import {Text,View} from "react-native";
import { Styles } from "../constants/Styles";
import {SearchBar} from "../components/SearchBar";
import {Menus} from "../constants/Menus"
import {FC,useEffect} from "react";
export const Blank:FC = () =>{


    useEffect(() =>{
     

        
     
       
    },[])

    return(<>
    
       <MainFrame  header="home" headerMenu={["Menu2",["Test Page"]]} >
        <SearchBar buttonText="Search"/>
           <View style={Styles.TestStyles.Style1}>
                
                <Text style={Styles.TestStyles.Style2}>children in styled container here</Text>
           </View>
       </MainFrame>
    
    
    </>)
}