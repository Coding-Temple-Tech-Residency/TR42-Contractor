import {Styles} from "@/constants/Styles"
import {FC, ReactNode,useState} from "react"
import {View} from "react-native"
import { MainFrame } from "@/components/MainFrame"
import { useRoute } from '@react-navigation/native'
import { SearchBar } from "@/components/SearchBar"
import { Message,MessageType } from "@/components/Message"
import {InitMessage} from "@/utils/InitMessage"
import { TimeFormater } from "@/utils/timeFormater"
type Props = {

    children:ReactNode
}
type TypeMessage = {

    id:number
    message:string
    contact?:string
    messageType:MessageType //Indicates if the mssage was sent or recieved so the app knows how to show it
    timeStamp:string
  
   
}

export const Chat:FC = (props) =>{

    const route = useRoute<any>()
    const {name} = route.params
   
   
    const demoMessages:TypeMessage[] = [ // Demo data real data will be replaced by backend
    {id:InitMessage.getMessageId(),message:"Hello",contact:"John Doe",messageType:"sent",timeStamp:TimeFormater.getTimeStamp()}, 
    {id:InitMessage.getMessageId(),message:"Hi",contact:"Jane Doe",messageType:"received",timeStamp:TimeFormater.getTimeStamp()},
    {id:InitMessage.getMessageId(),message:"How are you doing?",contact:"John Doe",messageType:"sent",timeStamp:TimeFormater.getTimeStamp()}, 
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
    
        setMessage(prev => [...prev,{
            id:InitMessage.getMessageId(),
            message:mesg,
            contact:contact,
            messageType:send,
            timeStamp: TimeFormater.getTimeStamp()
        }]);

    }
    const Search:FC =() => {
        return(
         <SearchBar placeHolder="Message..." buttonText="Send" onClick={(msg:string)=>{(msg) && SendMessage(msg,"01")}}/>
        )
    }
    return(<>
    <MainFrame headerMenu={["Menu2",[name]]} injectFooter={<Search/>} >
          <View style={Styles.Chat.container}>
            {
                messages.map((item) => {
                return(<Message key={item.id} messageId={item.id} message={item.message} contactId={item.contact} messageType={item.messageType} timeStamp={item.timeStamp}></Message>)
                })
            }
          </View>
      
        
    </MainFrame>

    </>)

}
