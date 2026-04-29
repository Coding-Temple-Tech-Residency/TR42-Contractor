import {MainFrame} from "@/components/MainFrame";
import {Text,View} from "react-native";
import { Styles } from "@/constants/Styles";
import {SearchBar} from "@/components/SearchBar";
import {Menus} from "@/constants/Menus"
import {FC,useEffect} from "react";
import { ProfileIcon } from "@/components/ProfileIcon";
import { useNavigation,useRoute } from "@react-navigation/native"
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from "@/App"
export const Blank:FC = () =>{

 const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
    useEffect(() =>{
     
     nav.navigate("Contacts",{sort:true})
       
    },[])

    return(<>
    
       <MainFrame requireAuth={true}>
       
            <ProfileIcon width={100} height={100} name="Jonathan Hubbbard"/>
    
       </MainFrame>
    
    
    </>)
}