import{Assets} from "@/constants/Assets"
import{Styles} from "@/constants/Styles"
import{FC} from "react"
import {Text,View,Image} from "react-native"


export type MessageType = "sent" | "received"
type Props = {
    message?:string
    messageId?:number
    profileIcon?:string
    contactId?:string
    messageType?:string
    timeStamp?:string
}
export const Message:FC<Props> =(props) =>{
   
    const Sent:FC = () => {

        return(
        
            <View style={Styles.Chat.messageBoxSent}>
                    <Text style={Styles.Chat.timeText}>{props.timeStamp}</Text>
                <View style={Styles.Chat.messageSent}>
                    <Text style={Styles.Chat.messageText}>{props.message}</Text>
                </View>
                  <Image source={Assets.icons.ProfileIcon} style={Styles.Chat.chatIcon} />
            </View>

        )
        
    }
    const Recieved:FC = () =>{

           return(
            <View style={Styles.Chat.messageBoxReceived}>   
                <Image source={Assets.icons.ProfileIcon} style={Styles.Chat.chatIcon} />  
                <View style={Styles.Chat.messageReceived}>
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