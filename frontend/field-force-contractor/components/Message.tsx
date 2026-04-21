import{Assets} from "@/constants/Assets"
import{Styles} from "@/constants/Styles"
import{FC} from "react"
import {Text,View,Image} from "react-native"
import { ProfileIcon } from "./ProfileIcon"
import { TimeFormater } from "@/utils/timeFormater"

export type MessageType = "sent" | "received"
type Props = {
    message?:string
    messageId?:string
    profileIcon?:string
    contactId?:string
    contactName?:string
    senderId?:string
    messageType?:string
    timeStamp?:string
    utcTimeStamp?:string
}
export const Message:FC<Props> =(props) =>{
   
    const Sent:FC = () => {

        return(
        
            <View style={Styles.Chat.messageBoxSent}>
                    <Text style={Styles.Chat.timeText}>{props.timeStamp}</Text>
                <View style={Styles.Chat.messageSent}>
                    <Text style={Styles.Chat.dateText}>{TimeFormater.getTimeStamp("LOCAL-DATE",props.utcTimeStamp)}</Text>
                    <Text style={Styles.Chat.messageText}>{props.message}</Text>
                </View>
            
                  <ProfileIcon width={Styles.Chat.chatIcon.width} height={Styles.Chat.chatIcon.height} name={props.contactName}/>
            </View>

        )
        
    }
    const Recieved:FC = () =>{

           return(
            <View style={Styles.Chat.messageBoxReceived}>   
                 <ProfileIcon width={Styles.Chat.chatIcon.width} height={Styles.Chat.chatIcon.height} name={props.contactName}/>

                <View style={Styles.Chat.messageReceived}>
                     <Text style={Styles.Chat.dateText}>{TimeFormater.getTimeStamp("LOCAL-DATE",props.utcTimeStamp)}</Text>
                    <Text style={Styles.Chat.messageText}>{props.message}</Text>
                </View>
                <Text style={Styles.Chat.timeText}>{props.timeStamp}</Text>
            </View>
           )

    }
    return(<>
  
     {
        (props.messageType === "sent") ? <Sent/> : <Recieved/>
     }
    
    </>)

}