import { Assets } from "@/constants/Assets"
import {Styles} from "@/constants/Styles"
import {FC, ReactNode,useEffect,useState} from "react"
import {View,Text,Pressable,Image,FlatList} from "react-native"
import { MainFrame } from "@/components/MainFrame"
import { useRoute } from '@react-navigation/native'
import { SearchBar } from "@/components/SearchBar"
import { Message,MessageType } from "@/components/Message"
import {InitMessage} from "@/utils/InitMessage"


type Props = {

    children:ReactNode
}
type TypeMessage = {

    message:string
    contact?:string
    messageType:MessageType //Indicates if the mssage was sent or recieved so the app knows how to show it
   
}
export const Chat:FC = (props) =>{

    const route = useRoute<any>()
    const deviceDate = new Date()
    const {name} = route.params

    const demoMessages = [ // Demo data real data will be replaced by backend
    {message:"Hello",contact:"John Doe",messageType:"sent"}, 
    {message:"Hi",contact:"Jane Doe",messageType:"received"},
    {message:"How are you doing?",contact:"John Doe",messageType:"sent"}, 
    ]
    const [messages,setMessage] = useState(demoMessages);
    
    const [send,setSend] = useState<MessageType>("received");

   
    const SendMessage = (mesg:string,contact:string) =>{
        if(send === "sent"){

            setSend("received");
        }
        else{

            setSend("sent");
        }
    
        setMessage(prev => [...prev,{message:mesg,contact:contact,messageType:send}]);

    }
    return(<>
    <MainFrame headerMenu={["Menu2",[name]]}>
        
          {
            messages.map((item) => {
            const id = InitMessage.getMessageId();
            return(<Message key={id} messageId={id} message={item.message} contactId={item.contact} messageType={item.messageType}></Message>)
            })
          }
      
        <View style={Styles.Chat.sendBar}>
            <SearchBar placeHolder="Message..." buttonText="Send" onClick={(msg:string)=>{(msg) && SendMessage(msg,"01")}}/>
        </View>
    </MainFrame>

    </>)

}