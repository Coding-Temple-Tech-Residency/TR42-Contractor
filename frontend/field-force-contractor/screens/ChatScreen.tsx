import {Styles} from "@/constants/Styles"
import React, {FC, ReactNode,useEffect,useRef,useState} from "react"
import {Keyboard,Platform,ScrollView,useWindowDimensions,View,Text} from "react-native"
import { MainFrame } from "@/components/MainFrame"
import { useRoute } from '@react-navigation/native'
import { SearchBar } from "@/components/SearchBar"
import { Message,MessageType } from "@/components/Message"
import {InitID} from "@/utils/InitID"
import { TimeFormater } from "@/utils/timeFormater"
import { useNavigation } from "@react-navigation/native"
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from "@/App"
import { useAuth } from "@/contexts/AuthContext"

type Props = {

    children:ReactNode
}
type TypeMessage = {

    id:string
    message:string
    contactId?:string
    messageType:MessageType //Indicates if the mssage was sent or recieved so the app knows how to show it
    timeStamp:string
    contactName:string
    senderId:string
    utcTimeStamp:string
    
  
   
}

const FOOTER_MENU_HEIGHT = 110;
const KEYBOARD_GAP = 8;


export const Chat:FC = (props) =>{

    const route = useRoute<any>()
    const {name,contactId} = route.params
    const {height: windowHeight} = useWindowDimensions();
    const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
    const {user} = useAuth();
    const CONTACTID = contactId;
    const USERID = (user?.id || "").toString();
    let USERSNAME = "John Doe" //Name should be replaced with users first + last name from the sql database
    let CONTACTNAME = USERSNAME

    const demoMessages:TypeMessage[] = [ // Demo data real data will be replaced by backend
    {id:InitID.getId(),message:"Hello",contactName:USERSNAME,contactId:CONTACTID,messageType:"sent",timeStamp:TimeFormater.getTimeStamp("LOCAL"),senderId:USERID?.toString(), utcTimeStamp:"2026-03-23T23:28:27.788Z"}, 
    {id:InitID.getId(),message:"Hello",contactName:USERSNAME,contactId:CONTACTID,messageType:"sent",timeStamp:TimeFormater.getTimeStamp("LOCAL"),senderId:USERID?.toString(), utcTimeStamp:"2026-03-23T23:28:27.788Z"}, 
    {id:InitID.getId(),message:"Hello",contactName:USERSNAME,contactId:CONTACTID,messageType:"sent",timeStamp:TimeFormater.getTimeStamp("LOCAL"),senderId:USERID?.toString(), utcTimeStamp:"2026-03-24T23:28:27.788Z"}, 
    {id:InitID.getId(),message:"Hi",contactName:name, contactId:USERID?.toString(),messageType:"received",timeStamp:TimeFormater.getTimeStamp("LOCAL"),senderId:CONTACTID,utcTimeStamp:TimeFormater.getTimeStamp("UTC-DATE")},
    {id:InitID.getId(),message:"How are you doing?",contactName:USERSNAME, contactId:CONTACTID,messageType:"sent",timeStamp:TimeFormater.getTimeStamp("LOCAL"),senderId:USERID?.toString(), utcTimeStamp:TimeFormater.getTimeStamp("UTC-DATE")}, 
    ]
   
    const [messages,setMessage] = useState(demoMessages);
    const scrollRef = useRef<ScrollView>(null);

    const [send,setSend] = useState<MessageType>("received");
    const [searchBarBottom,setSearchBarBottom] = useState(FOOTER_MENU_HEIGHT);
    
    useEffect(() => {
        const showSubscription = Keyboard.addListener(
            Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
            (event) => {
                const keyboardOverlap = Math.max(0, windowHeight - event.endCoordinates.screenY);
                setSearchBarBottom(Math.max(FOOTER_MENU_HEIGHT, keyboardOverlap + KEYBOARD_GAP));
            }
        );
        const hideSubscription = Keyboard.addListener(
            Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
            () => {
                setSearchBarBottom(FOOTER_MENU_HEIGHT);
            }
        );

        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, [windowHeight]);
  
   
    const SendMessage = (mesg:string,contact:string,contactId:string) =>{
        let sendersid;
        let contactsid;
        if(send === "sent"){ //Testing Data will be removed in production 

            setSend("received");
            sendersid = CONTACTID
            contactsid = USERID
            CONTACTNAME = USERSNAME
        }
        else{

            setSend("sent");
            sendersid = USERID
            contactsid = CONTACTID
            CONTACTNAME = name
        }

        setMessage(prev => [...prev,{
            id:InitID.getId(),
            message:mesg,
            contactid:contactsid, //This should be replaced with the contactId paramater provided in SendMessage()
            contactName:CONTACTNAME,
            messageType:send,
            timeStamp: TimeFormater.getTimeStamp("LOCAL"),
            senderId: sendersid,
            utcTimeStamp:TimeFormater.getTimeStamp("UTC-DATE")
        }]);
        Keyboard.dismiss()
    }
    const Trim = (txt:string) => {
       let str:string = txt.replace(/\s+/g,'')
        return(str)
    }
    const returnMessages = (reverseOrder?:boolean) =>{
        const currentDate = Trim(TimeFormater.getTimeStamp("LOCAL-DATE",TimeFormater.getTimeStamp("UTC-DATE")))
        const dateLabels = new Set<string>()
        let setLabel = "";
      const orderedMessages = [...messages].sort(
        (a, b) => new Date(b.utcTimeStamp).getTime() - new Date(a.utcTimeStamp).getTime()
      );
      const msgs =  ((reverseOrder) ? orderedMessages: messages).map((item) => {
               
                const messageDate:string = Trim(TimeFormater.getTimeStamp("LOCAL-DATE",item.utcTimeStamp))
                
                if(!dateLabels.has(messageDate)){

                    dateLabels.add(messageDate);
                   setLabel = (messageDate === currentDate) ? "Today" : messageDate
                }
                else{
                    setLabel = "";
                }
                    
                return(
                <React.Fragment key={item.id}>
                    
                { (setLabel !== "" && <Text style={Styles.Chat.dateMarker}>{setLabel}</Text>)}
                    
                <Message messageId={item.id} message={item.message} contactName={item.contactName} contactId={item.contactId} senderId={item.senderId} messageType={item.messageType} timeStamp={item.timeStamp} utcTimeStamp={item.utcTimeStamp}></Message>
                </React.Fragment>
      )})

                return(msgs);

    }
    return(<>
    <View style={Styles.Chat.screen}>
    <MainFrame headerMenu={["Menu2",[name]]}>
          <ScrollView
            ref={scrollRef}
            style={Styles.Chat.container}
            onContentSizeChange={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
          >
            {
               returnMessages(false)
            }
          </ScrollView>
    </MainFrame>
    <View style={[Styles.Chat.sendBar, {bottom: searchBarBottom}]}>
        <SearchBar placeHolder="Message..." buttonText="Send" multiline onClick={(msg:string)=>{(msg) && SendMessage(msg,CONTACTNAME,CONTACTID)}} resetOnSubmit={true}/>
    </View>
    </View>

    </>)

}
