import {MainFrame} from "@/components/MainFrame";
import {Text,View} from "react-native";
import { Styles } from "@/constants/Styles";
import {SearchBar} from "@/components/SearchBar";
import {Menus} from "@/constants/Menus"
import {FC,useEffect} from "react";
import { ProfileIcon } from "@/components/ProfileIcon";
export const Blank:FC = () =>{


    useEffect(() =>{
     

       
    },[])

    return(<>
    
       <MainFrame>
       
            <ProfileIcon width={100} height={100} name="Jonathan Hubbbard"/>
    
       </MainFrame>
    
    
    </>)
}