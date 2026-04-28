import {Styles} from "@/constants/Styles"
import React, {FC, ReactNode,useContext,useEffect,useRef,useState} from "react"
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
import { AppContext,getUser} from "@/contexts/AppContext"

type Props = {

    children:ReactNode
}
type TypeMessage = {
    sessionId:string
    id:string
    message:string
    senderId:string
    utcTimeStamp:string
    
  
   
}

const FOOTER_MENU_HEIGHT = 110;
const KEYBOARD_GAP = 8;


//Demo Chat sessions database
const demoSessions = [
   {sessionid:"123456",
    members: ["1","2"]
   },
   {sessionid:"1234567",
    members: ["1","3"]
   },
   {sessionid:"12345678",
    members: ["1","4"]
   }
]


const createSession = (userA:string,userB:string) => {
  //Checks the demo database to ensure that a message session does not already exist that contains the 2 contacts before creating a new one
  let session;
  if(demoSessions.some(p=> p.members.includes(userA) && p.members.includes(userB)) === false){
    session = InitID.getId();
    demoSessions.push({sessionid:session,members:[userA,userB]}) // create new session in demo database
  }
  else{
   // if a session already exist for the 2 provided contacts return that message session id
    session = demoSessions.find(p => p.members.includes(userA) && p.members.includes(userB))?.sessionid || ""
  }
 
 return(session);
}
 
export const Chat:FC = (props) =>{


    const route = useRoute<any>()
    const {name,contactId} = route.params

    const {userInfo} = useContext(AppContext)
    const sessionId = createSession(userInfo.userid || "",contactId)  
    const {height: windowHeight} = useWindowDimensions();
    const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
   
   
    let contactuser = getUser(contactId);
    let CONTACTNAME = `${contactuser?.firstName} ${contactuser?.lastName}`


      //Demo Messages database 
    const demoMessages:TypeMessage[] = [
    {sessionId:sessionId, id:InitID.getId(),message:"Hello",senderId:userInfo.userid, utcTimeStamp:"2026-03-23T23:28:27.788Z"}, 
    {sessionId:sessionId,id:InitID.getId(),message:"Hello",senderId:contactId, utcTimeStamp:"2026-03-23T23:28:27.788Z"}, 
    {sessionId:sessionId, id:InitID.getId(),message:"Hello",senderId:userInfo.userid, utcTimeStamp:"2026-03-24T23:28:27.788Z"}, 
    {sessionId:sessionId,id:InitID.getId(),message:"Hi",senderId:contactId,utcTimeStamp:TimeFormater.getTimeStamp("UTC-DATE")},
    {sessionId:sessionId,id:InitID.getId(),message:"How are you doing?",senderId:userInfo.userid, utcTimeStamp:TimeFormater.getTimeStamp("UTC-DATE")}, 
    ]
   
    const {reverseStack} = useContext(AppContext);
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
  
   
    const SendMessage = (mesg:string) =>{
        let sendersid;
        
        if(send === "sent"){ //Testing Data will be removed in production 

            setSend("received");
            sendersid = contactId
          
        }
        else{

            setSend("sent");
            sendersid = userInfo.userid
          
        }

        setMessage(prev => [...prev,{
            sessionId:sessionId,
            id:InitID.getId(),
            message:mesg,
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
                    
                <Message messageId={item.id} message={item.message} senderId={item.senderId} utcTimeStamp={item.utcTimeStamp} contactName={CONTACTNAME || ""}></Message>
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
               returnMessages(reverseStack)
            }
          </ScrollView>
    </MainFrame>
    <View style={[Styles.Chat.sendBar, {bottom: searchBarBottom}]}>
        <SearchBar placeHolder="Message..." buttonText="Send" multiline onClick={(msg:string)=>{(msg) && SendMessage(msg)}} resetOnSubmit={true}/>
    </View>
    </View>

    </>)

}
