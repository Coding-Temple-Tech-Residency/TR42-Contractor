import {Styles} from "@/constants/Styles"
import React, {FC, ReactNode,useContext,useEffect,useRef,useState} from "react"
import {Keyboard,Platform,ScrollView,useWindowDimensions,View,Text, RefreshControl} from "react-native"
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
    user_one_id:"1",
    user_two_id:"2"
    
   },
   {sessionid:"1234567",
    user_one_id:"1",
    user_two_id:"3"
   },
   {sessionid:"12345678",
    user_one_id:"1",
    user_two_id:"4"
   }
]

const createSession = (userA:string,userB:string) => {
  //Checks the demo database to ensure that a message session does not already exist that contains the 2 contacts before creating a new one
  let session;
  if(demoSessions.some(p => [p.user_one_id,p.user_two_id].includes(userA) && [p.user_one_id,p.user_two_id].includes(userB)) === false){
    session = InitID.getId();
    demoSessions.push({sessionid:session,user_one_id:userA,user_two_id:userB}) // create new session in demo database
  }
  else{
   // if a session already exist for the 2 provided contacts return that message session id
    session = demoSessions.find(p => [p.user_one_id,p.user_two_id].includes(userA) && [p.user_one_id,p.user_two_id].includes(userB))?.sessionid || ""
  }
 
 return(session);
}

export const Chat:FC = (props) =>{

    const route = useRoute<any>()
    const maxPerLoad = 2;
    const initalLoad = 50;
    const {name,contactId} = route.params
    const [Test,setTest] = useState(false);
    const {userInfo} = useContext(AppContext)
    const sessionId = createSession(userInfo.userid || "",contactId)  
    const {height: windowHeight} = useWindowDimensions();
    const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
    
    const MaxMessage = 10;
    let MessageSent = useRef(0);
    let contactuser = getUser(contactId);
    let CONTACTNAME = `${contactuser?.firstName} ${contactuser?.lastName}`
     

    const previousDemoMessages =  useRef<TypeMessage[]> ([

      {sessionId:sessionId, id:InitID.getId(),message:"Hello",senderId:userInfo.userid, utcTimeStamp:"2026-03-23T23:28:27.788Z"}, 
    {sessionId:sessionId,id:InitID.getId(),message:"Hello",senderId:contactId, utcTimeStamp:"2026-03-23T23:28:27.788Z"}, 
    {sessionId:sessionId, id:InitID.getId(),message:"Hello",senderId:userInfo.userid, utcTimeStamp:"2026-03-24T23:28:27.788Z"}, 
    {sessionId:sessionId,id:InitID.getId(),message:"Hi",senderId:contactId,utcTimeStamp:TimeFormater.getTimeStamp("UTC-DATE")},
    {sessionId:sessionId,id:InitID.getId(),message:"How are you doing?",senderId:userInfo.userid, utcTimeStamp:TimeFormater.getTimeStamp("UTC-DATE")}, 
     {sessionId:sessionId, id:InitID.getId(),message:"Hello",senderId:userInfo.userid, utcTimeStamp:"2026-03-23T23:28:27.788Z"}, 
    {sessionId:sessionId,id:InitID.getId(),message:"Hello",senderId:contactId, utcTimeStamp:"2026-03-23T23:28:27.788Z"}, 
    {sessionId:sessionId, id:InitID.getId(),message:"Hello",senderId:userInfo.userid, utcTimeStamp:"2026-03-24T23:28:27.788Z"}, 
    {sessionId:sessionId,id:InitID.getId(),message:"Hi",senderId:contactId,utcTimeStamp:TimeFormater.getTimeStamp("UTC-DATE")},
    {sessionId:sessionId,id:InitID.getId(),message:"How are you doing?",senderId:userInfo.userid, utcTimeStamp:TimeFormater.getTimeStamp("UTC-DATE")}, 



    ])
      //Demo Messages database 
    const demoMessages = useRef<TypeMessage[]> ([
    {sessionId:sessionId, id:InitID.getId(),message:"Hello",senderId:userInfo.userid, utcTimeStamp:"2026-03-23T23:28:27.788Z"}, 
    {sessionId:sessionId,id:InitID.getId(),message:"Hello",senderId:contactId, utcTimeStamp:"2026-03-23T23:28:27.788Z"}, 
    {sessionId:sessionId, id:InitID.getId(),message:"Hello",senderId:userInfo.userid, utcTimeStamp:"2026-03-24T23:28:27.788Z"}, 
   
    
    ])
   
    const {reverseStack} = useContext(AppContext);
    const [messages,setMessage] = useState(demoMessages.current.splice((demoMessages.current.length >= initalLoad) ? demoMessages.current.length - initalLoad : 0, demoMessages.current.length));
    const scrollRef = useRef<ScrollView>(null);
    const [searchBarBottom,setSearchBarBottom] = useState(FOOTER_MENU_HEIGHT);
    const lastSync = useRef("");
    const messageIds = useRef(new Set(demoMessages.current.map(item => item.id)));
    const fromSet = useRef((previousDemoMessages.current.length > maxPerLoad) ? previousDemoMessages.current.length - maxPerLoad : 0);
    const toSet = useRef(previousDemoMessages.current.length);
    const [refresh,setRefresh] = useState(false);
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
           const syncMessages = setInterval(() =>{   
                 
                  const newMessages = demoMessages.current.filter(t => t.utcTimeStamp >= lastSync.current).filter(p => {
                    if(!messageIds.current.has(p.id)){
                        messageIds.current.add(p.id)
                        return(true)
                    }    
                    return(false)          
                })
                  lastSync.current = TimeFormater.getTimeStamp("UTC-DATE")
                  if(newMessages.length > 0){
                    setMessage(prev => [...prev,...newMessages])  
                    console.log("Found " + newMessages.length + " New Messages")
                  
                  }       
                    console.log("Checking Messages")    
                            
                    },5000)

        return () => {
            showSubscription.remove();
            hideSubscription.remove();
            clearInterval(syncMessages);
        };
    }, [windowHeight]);
    useEffect(() => {
     
        console.log(refresh)

    },[refresh])
   
   const StartTest = () =>{

     if(Test === false){

              const tm = setInterval(() =>{
                     if(MaxMessage > MessageSent.current){
                            console.log("Testing" + MessageSent.current);
                            demoMessages.current.push( {sessionId:sessionId, id:InitID.getId(),message:"Test Message " + MessageSent.current,senderId:contactId, utcTimeStamp:TimeFormater.getTimeStamp("UTC-DATE")})
                            MessageSent.current++
                     }
                     else{
                        clearInterval(tm);
                        return;
                     }
 
                    },5000)
                    setTest(true);
        }

   }
  
    const SendMessage = (mesg:string) =>{ 
        StartTest();
        setMessage(prev => [...prev,{
            sessionId:sessionId,
            id:InitID.getId(),
            message:mesg,
            senderId: userInfo.userid,
            utcTimeStamp:TimeFormater.getTimeStamp("UTC-DATE")
        }]);
        Keyboard.dismiss()
    }
    const Trim = (txt:string) => {
       let str:string = txt.replace(/\s+/g,'')
        return(str)
    }
      const awaitUpdate = async (wait:number) => {
            
          return(new Promise<void>(resolve => 
              setTimeout(() => {
               
                console.log("Done scanning");
                 resolve();
              },wait)
              

             ));
            
         }
     const loadPrevious = async (wait:number) => {
             
         setRefresh(true);
          
            console.log(fromSet.current)
            console.log(toSet.current)
            if(fromSet.current >= maxPerLoad && fromSet.current !== 0){             
              toSet.current = fromSet.current;
              fromSet.current -= maxPerLoad;
            }
            else{
                toSet.current = fromSet.current;
                fromSet.current = 0;
            }
                      
            const data = previousDemoMessages.current.slice(fromSet.current,toSet.current).filter(p => {
                        if(!messageIds.current.has(p.id)){
                            messageIds.current.add(p.id)
                            return(true)
                        }    
                        return(false)          
                    });
                    console.log(data)
                setMessage(prev => [...prev,...data]);
                         
             await awaitUpdate(wait);
                setRefresh(false);
                
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
  
    <MainFrame headerMenu={["Menu2",[name]]} injectFooter={
        <SearchBar placeHolder="Message..." buttonText="Send" multiline onClick={(msg:string)=>{(msg) && SendMessage(msg)}} resetOnSubmit={true}/>
        }>
        
            <ScrollView
                ref={scrollRef}
                onContentSizeChange={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
                refreshControl={<RefreshControl onRefresh={() => {loadPrevious(2000)}} refreshing={refresh}/>}
            >
                <View style={Styles.Chat.container}>
                    {
                    returnMessages(reverseStack)
                    }
                </View>
            </ScrollView>
          
    </MainFrame>
  
        
  
   

    </>)

}
