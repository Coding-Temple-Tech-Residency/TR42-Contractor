import{Assets} from "@/constants/Assets"
import{Styles} from "@/constants/Styles"
import{FC} from "react"
import {Text,View} from "react-native"


export type MessageType = "sent" | "received"
type Props = {
    message?:string
    messageId?:number
    profileIcon?:string
    contactId?:string
    timeStamp?:string
    messageType?:MessageType
}
export const Message:FC<Props> =(props) =>{

    const Sent:FC = () => {

        return(
        
            <View style={Styles.Chat.messageBoxSent}>
                <View style={Styles.Chat.messageSent}>
                    <Text style={Styles.Chat.messageText}>{props.message}</Text>
                </View>
            </View>

        )
        
    }
    const Recieved:FC = () =>{

           return(
            <View style={Styles.Chat.messageBoxReceived}>
                <View style={Styles.Chat.messageReceived}>
                    <Text style={Styles.Chat.messageText}>{props.message}</Text>
                </View>
            </View>
           )

    }
    return(<>
  
     {
        (props.messageType === "sent") ? <Sent/> : <Recieved/>
     }
    
    </>)

}