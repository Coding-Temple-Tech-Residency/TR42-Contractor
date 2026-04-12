import{Assets} from "@/constants/Assets"
import{Styles} from "@/constants/Styles"
import{FC} from "react"
import { Timespan } from "react-native/Libraries/Utilities/IPerformanceLogger"
import {Text,View} from "react-native"


type MessageType = "sent" | "recived"
type Props = {
    message?:string
    messageId?:number
    profileIcon?:string
    contactId?:string
    timeStamp?:Timespan
    messageType?:MessageType
}
export const Message:FC<Props> =(props) =>{

    return(<>
    <View style={Styles.Chat.messageBoxRecived}>
        <View style={Styles.Chat.MessageRecieved}>
            <Text style={Styles.Chat.MessageText}>{props.message}</Text>
        </View>
    </View>
    
    
    </>)

}