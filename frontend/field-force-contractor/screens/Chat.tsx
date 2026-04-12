import { Assets } from "../constants/Assets"
import {Styles} from "../constants/Styles"
import {FC, ReactNode,useState} from "react"
import {View,Text,Pressable,Image} from "react-native"
import { MainFrame } from "@/components/MainFrame"
import { useRoute } from '@react-navigation/native'
import { SearchBar } from "@/components/SearchBar"
import { Message } from "@/components/Message"
import {InitMessage} from "@/utils/InitMessage"

type Props = {

    children:ReactNode
}
type MessageType = {

    messageId?:number
    message:string
    contactId?:string
}
export const Chat:FC = (props) =>{

    const route = useRoute<any>()
    const {name} = route.params
    const [messages,setMessage] = useState<MessageType[]>([]);
    const SendMessage = (mesg:string,contact:string) =>{
     
        setMessage(prev => [...prev,{message:mesg,messageId:InitMessage.getMessageId(),contact:contact}]);

    }
    return(<>
    <MainFrame headerMenu={["Menu2",[name]]}>
    <View style={Styles.Chat.sendBar}>
        <SearchBar placeHolder="Message..." buttonText="Send" onClick={(msg:string)=>{(msg) && SendMessage(msg,"01")}}/>
    </View>
    {
       messages.map(item =>{

         return(
            <Message key={item.messageId} messageId={item.messageId} message={item.message} contactId={item.contactId}></Message>
         )
       })
    }
    </MainFrame>

    </>)

}