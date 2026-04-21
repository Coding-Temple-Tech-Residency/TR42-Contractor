import { Styles } from "@/constants/Styles";
import { Assets } from "@/constants/Assets";
import {View,Text,Image,Pressable,Linking} from "react-native"
import { useNavigation } from "@react-navigation/native"
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import{RootStackParamList} from "@/App"
import { ProfileIcon } from "./ProfileIcon";

import {FC} from "react"

type Props = {

    profileIcon?: string
    name?:string
    phoneNumber?: string
    contactId?: string
}
export const ContactCard:FC<Props> = (props) =>{
const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
 const Call = (phone:string) =>{

    Linking.openURL(`tel:${phone}`)
 }
  return(<>
  
  <View style={Styles.Contacts.container}>
    
    <View style={Styles.Contacts.IconContainer}>
        
        <ProfileIcon width={Styles.Contacts.ProfileIcon.width} height={Styles.Contacts.ProfileIcon.height} name={props.name}/> 
    </View>
    <View style={Styles.Contacts.InfoContainer}>
       <Text style={Styles.Contacts.contactText}>{props.name}</Text>
       <View style={Styles.Contacts.phoneIconText}>
         <Image style={Styles.Contacts.phoneIcon} source={Assets.icons.PhoneIcon}/>
         <Pressable onPress={()=>{Call(props.phoneNumber || "")}}>
         {
            ({pressed}) => {

            return(<>
            <Text style={(pressed) ? Styles.Contacts.contactText : Styles.Contacts.contactTextPressed}> {props.phoneNumber}</Text>
            
            </>)
            }
        }
         </Pressable>
        </View>
        
    </View>
    <View style={Styles.Contacts.buttonContainer}>
         <Pressable onPress={() =>{nav.navigate("Chat" as any,{name:props.name || "",contactId:props.contactId})}}>
            {
                ({pressed}) => {
                return(<>
                    <Image source={Assets.icons.BackArrow} style={(pressed)?Styles.Contacts.forwardArrowPressed : Styles.Contacts.forwardArrow}/>
               </>)
                }
            }           
         </Pressable>
    </View>

  </View>
  
  </>)

}