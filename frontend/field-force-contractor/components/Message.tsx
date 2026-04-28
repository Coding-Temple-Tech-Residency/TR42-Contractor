import{Assets} from "@/constants/Assets"
import{Styles} from "@/constants/Styles"
import{FC, useContext} from "react"
import {Text,View,Image} from "react-native"
import { ProfileIcon } from "./ProfileIcon"
import { TimeFormater } from "@/utils/timeFormater"
import { AppContext } from "@/contexts/AppContext"

export type MessageType = "sent" | "received"
type Props = {
    message?:string
    messageId?:string
    contactName?:string
    senderId?:string
    utcTimeStamp?:string
}
export const Message:FC<Props> =(props) =>{
  
    const {userInfo} = useContext(AppContext);
   

    const Sent:FC = () => {

        return(
        
            <View style={Styles.Chat.messageBoxSent}>
                    <Text style={Styles.Chat.timeText}>{TimeFormater.getTimeStamp("LOCAL",props.utcTimeStamp)}</Text>
                <View style={Styles.Chat.messageSent}>
                   
                    <Text style={Styles.Chat.messageText}>{props.message}</Text>
                </View>
            
                  <ProfileIcon width={Styles.Chat.chatIcon.width} height={Styles.Chat.chatIcon.height} name={`${userInfo.firstName} ${userInfo.lastName}`}/>
            </View>

        )
        
    }
    const Recieved:FC = () =>{
 
           return(
            <View style={Styles.Chat.messageBoxReceived}>   
                 <ProfileIcon width={Styles.Chat.chatIcon.width} height={Styles.Chat.chatIcon.height} name={props.contactName}/>

                <View style={Styles.Chat.messageReceived}>
                    
                    <Text style={Styles.Chat.messageText}>{props.message}</Text>
                </View>
                <Text style={Styles.Chat.timeText}>{TimeFormater.getTimeStamp("LOCAL",props.utcTimeStamp)}</Text>
            </View>
           )

    }
    return(<>
  
     {
        (userInfo.userid === props.senderId) ? <Sent/> : <Recieved/>
     }
    
    </>)

}