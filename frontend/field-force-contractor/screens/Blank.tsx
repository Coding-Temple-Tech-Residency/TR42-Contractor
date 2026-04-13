import {MainFrame} from "@/components/MainFrame";
import {Text,View} from "react-native";
import { Styles } from "@/constants/Styles";
import {SearchBar} from "@/components/SearchBar";
import {Menus} from "@/constants/Menus"
import {FC,useEffect} from "react";
import LoginScreen from "@/screens/LoginScreen";
export const Blank:FC = () =>{


    useEffect(() =>{
     

       
    },[])

    return(<>
    
       <MainFrame >
        <LoginScreen/>
       </MainFrame>
    
    
    </>)
}