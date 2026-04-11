import { Styles } from "@/constants/Styles";
import { Assets } from "@/constants/Assets";
import {View,Text,Image,Pressable} from "react-native"
import {FC} from "react"

type Props = {

    profileIcon?: string
    name?:string
    phoneNumber?: number
    contactId?: number
}
export const ContactCard:FC<Props> = (props) =>{

  return(<>
  
  <View style={Styles.Contacts.container}>
    
    <View style={Styles.Contacts.IconContainer}>
        <Image source={Assets.icons.ProfileIcon} style={Styles.Contacts.ProfileIcon}/>
    </View>
    <View style={Styles.Contacts.InfoContainer}>
       <Text style={Styles.Contacts.contactText}>John Doe</Text>
       <View style={Styles.Contacts.phoneIconText}>
         <Image style={Styles.Contacts.phoneIcon} source={Assets.icons.PhoneIcon}/>
         <Pressable>
         {
            ({pressed}) => {

            return(<>
            <Text style={(pressed) ? Styles.Contacts.contactText : Styles.Contacts.contactTextPressed}> 555-555-5555 </Text>
            
            </>)
            }
        }
         </Pressable>
        </View>
        

    </View>
    <View style={Styles.Contacts.buttonContainer}>
         <Pressable>
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