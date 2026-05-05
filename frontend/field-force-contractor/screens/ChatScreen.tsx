import {Styles} from "@/constants/Styles"
import React, {FC, ReactNode,useContext,useEffect,useRef,useState} from "react"
import {Keyboard,Platform,ScrollView,useWindowDimensions,View,Text, Image} from "react-native"
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
import { canUseBiometricAuthentication } from "expo-secure-store"
import { Assets } from "@/constants/Assets"
import { createIconSetFromFontello } from "@expo/vector-icons"

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
type ScrollMetrics = {
    scrollY: number
    layoutHeight: number
    contentHeight: number
}

const FOOTER_MENU_HEIGHT = 110;
const KEYBOARD_GAP = 8;
const LOAD_PREVIOUS_DRAG_DISTANCE = 20;
const LOAD_PREVIOUS_HOLD_TIME = 2000;
   const MAXPERLOAD = 2;
    const INTIALLOAD = 10;
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
const messageSlice = (messages:TypeMessage[],load:number) =>{
   
   return(messages.slice((messages.length >= load) ? messages.length - load : 0,messages.length))

}
export const Chat:FC = (props) =>{

    const route = useRoute<any>()
 
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
     
    //Demo Messages database 
     const previousDemoMessages =  useRef<TypeMessage[]> ([

        {sessionId:sessionId, id:InitID.getId(),message:"Hello",senderId:userInfo.userid, utcTimeStamp:"2026-03-23T23:28:27.788Z"}, 
        {sessionId:sessionId,id:InitID.getId(),message:"Hello",senderId:contactId, utcTimeStamp:"2026-03-23T23:28:27.788Z"}, 
        {sessionId:sessionId, id:InitID.getId(),message:"Hello",senderId:userInfo.userid, utcTimeStamp:"2026-03-24T23:28:27.788Z"}, 

        {sessionId:sessionId, id:InitID.getId(),message:"Hey, are you free later?",senderId:userInfo.userid, utcTimeStamp:"2025-01-10T08:15:12.000Z"},
        {sessionId:sessionId,id:InitID.getId(),message:"Yeah, what’s up?",senderId:contactId, utcTimeStamp:"2025-01-10T08:16:45.000Z"},
        {sessionId:sessionId, id:InitID.getId(),message:"Wanted to go over that project",senderId:userInfo.userid, utcTimeStamp:"2025-01-11T09:05:30.000Z"},
        {sessionId:sessionId,id:InitID.getId(),message:"Sure, give me a bit",senderId:contactId, utcTimeStamp:"2025-01-11T09:06:10.000Z"},
        {sessionId:sessionId,id:InitID.getId(),message:"No rush 👍",senderId:userInfo.userid, utcTimeStamp:"2025-01-12T10:20:00.000Z"},

        {sessionId:sessionId, id:InitID.getId(),message:"Did you check the email?",senderId:userInfo.userid, utcTimeStamp:"2025-01-13T11:00:00.000Z"},
        {sessionId:sessionId,id:InitID.getId(),message:"Not yet, I will now",senderId:contactId, utcTimeStamp:"2025-01-13T11:02:15.000Z"},
        {sessionId:sessionId, id:InitID.getId(),message:"Cool, let me know what you think",senderId:userInfo.userid, utcTimeStamp:"2025-01-14T12:30:45.000Z"},
        {sessionId:sessionId,id:InitID.getId(),message:"Looks good to me",senderId:contactId, utcTimeStamp:"2025-01-14T12:31:20.000Z"},
        {sessionId:sessionId,id:InitID.getId(),message:"Awesome, I’ll move forward then",senderId:userInfo.userid, utcTimeStamp:"2025-01-15T13:10:05.000Z"},

        {sessionId:sessionId, id:InitID.getId(),message:"You heading to the meeting?",senderId:userInfo.userid, utcTimeStamp:"2025-01-16T14:22:00.000Z"},
        {sessionId:sessionId,id:InitID.getId(),message:"Yeah, almost there",senderId:contactId, utcTimeStamp:"2025-01-16T14:23:40.000Z"},
        {sessionId:sessionId, id:InitID.getId(),message:"Save me a seat lol",senderId:userInfo.userid, utcTimeStamp:"2025-01-17T15:45:55.000Z"},
        {sessionId:sessionId,id:InitID.getId(),message:"Got you 😂",senderId:contactId, utcTimeStamp:"2025-01-17T15:47:10.000Z"},
        {sessionId:sessionId,id:InitID.getId(),message:"Appreciate it",senderId:userInfo.userid, utcTimeStamp:"2025-01-18T16:05:25.000Z"},

        {sessionId:sessionId, id:InitID.getId(),message:"Did the build pass?",senderId:userInfo.userid, utcTimeStamp:"2025-01-19T17:30:00.000Z"},
        {sessionId:sessionId,id:InitID.getId(),message:"Yeah just finished",senderId:contactId, utcTimeStamp:"2025-01-19T17:32:12.000Z"},
        {sessionId:sessionId, id:InitID.getId(),message:"Nice, pushing to prod?",senderId:userInfo.userid, utcTimeStamp:"2025-01-20T18:40:33.000Z"},
        {sessionId:sessionId,id:InitID.getId(),message:"In a few mins",senderId:contactId, utcTimeStamp:"2025-01-20T18:41:50.000Z"},
        {sessionId:sessionId,id:InitID.getId(),message:"Cool, I’ll keep an eye on it",senderId:userInfo.userid, utcTimeStamp:"2025-01-21T19:55:10.000Z"},

    ])
   
    const {reverseStack} = useContext(AppContext);
    const [messages,setMessage] = useState(messageSlice(previousDemoMessages.current,INTIALLOAD));
    const scrollRef = useRef<ScrollView>(null);
    const [searchBarBottom,setSearchBarBottom] = useState(FOOTER_MENU_HEIGHT);
    const lastSync = useRef(TimeFormater.getTimeStamp("UTC-DATE"));
    const messageIds = useRef(new Set(messageSlice(previousDemoMessages.current,INTIALLOAD).map(item => item.id)));
    const fromSet = useRef((previousDemoMessages.current.length >= INTIALLOAD) ? previousDemoMessages.current.length - INTIALLOAD - MAXPERLOAD : 0);
    const toSet = useRef(previousDemoMessages.current.length);
    const [loading,setLoading] = useState(false);
    const loadingPreviousMessages = useRef(false);
    const lastScrollY = useRef(0);
    const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isAtBottomRef = useRef(false);
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
           const syncMessages = (messages:TypeMessage[]) =>{
            
            const tm = setInterval(() =>{   
                 
                  const newMessages = messages.filter(t => t.utcTimeStamp >= lastSync.current).filter(p => {
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
                                              
                    },5000)
                    return(tm)
                }
               const tm = syncMessages(previousDemoMessages.current);
        return () => {
            showSubscription.remove();
            hideSubscription.remove();
            clearInterval(tm);
            clearHoldTimer();
        };
    }, [windowHeight]);
   
   const StartTest = () =>{

     if(Test === false){

              const tm = setInterval(() =>{
                     if(MaxMessage > MessageSent.current){
                            console.log("Testing" + MessageSent.current);
                            previousDemoMessages.current.push( {sessionId:sessionId, id:InitID.getId(),message:"Test Message " + MessageSent.current,senderId:contactId, utcTimeStamp:TimeFormater.getTimeStamp("UTC-DATE")})
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
                 resolve();
              },wait)
              

             ));
            
         }
    const nextSlice = (load:number) =>{

    
        if(fromSet.current > load){             
              toSet.current = fromSet.current;
              fromSet.current -= load;
            }
            else{
                toSet.current = fromSet.current;
                fromSet.current = 0;
            }    
    }
    const previousMessages = async (messages:TypeMessage[], wait:number) => {
                
            const data = messages.slice(fromSet.current,toSet.current).sort(
                (a,b) => new Date(a.utcTimeStamp).getTime() - new Date(b.utcTimeStamp).getTime()
            ).filter(p => {
                        if(!messageIds.current.has(p.id)){
                            messageIds.current.add(p.id)
                            return(true)
                        }    
                        return(false)          
                    });
                    
                setMessage(prev => [...prev,...data]);

              nextSlice(MAXPERLOAD)

             await awaitUpdate(wait);
                         
    }
    const clearHoldTimer = () =>{
        if(holdTimer.current){
            clearTimeout(holdTimer.current);
            holdTimer.current = null;
        }
        if(!loadingPreviousMessages.current){
            setLoading(false);
        }
    }
    const loadPreviousAfterHold = () =>{
        if(holdTimer.current || loadingPreviousMessages.current){
            return;
        }

        setLoading(true);
        holdTimer.current = setTimeout(async () =>{
            holdTimer.current = null;
            if(loadingPreviousMessages.current || fromSet.current >= toSet.current){
                setLoading(false);
                return;
            }

            loadingPreviousMessages.current = true;
            setLoading(true);
            try{
                await previousMessages(previousDemoMessages.current,2000);
            }
            finally{
                setLoading(false);
                loadingPreviousMessages.current = false;
            }
        }, LOAD_PREVIOUS_HOLD_TIME);
    }
    const hasPreviousMessages = () =>{
        return(fromSet.current < toSet.current);
    }
    const updateBottomState = (metrics?:ScrollMetrics) =>{
        if(metrics){
            isAtBottomRef.current = metrics.layoutHeight + metrics.scrollY >= metrics.contentHeight - 10;
        }
        return(isAtBottomRef.current);
    }
    const startPreviousMessagesHold = (metrics?:ScrollMetrics) =>{
        if(updateBottomState(metrics) && hasPreviousMessages() && !loadingPreviousMessages.current){
            loadPreviousAfterHold();
        }
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
    const scroll = async (event:any,touch?:number,movement = 0,metrics?:ScrollMetrics) =>{
         const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent
         const scrollY = contentOffset.y;
         const scrollDelta = scrollY - lastScrollY.current;
         lastScrollY.current = scrollY;
         updateBottomState(metrics ?? {
            scrollY,
            layoutHeight: layoutMeasurement.height,
            contentHeight: contentSize.height,
         });
         const isDraggingUp = movement > LOAD_PREVIOUS_DRAG_DISTANCE || scrollDelta > 0;
         if(isAtBottomRef.current && isDraggingUp){
          startPreviousMessagesHold(metrics);
         }
         else if(!isAtBottomRef.current || !hasPreviousMessages()){
          clearHoldTimer();
         }
    }
    const movement = (movement = 0,metrics?:ScrollMetrics) =>{
        if(movement > LOAD_PREVIOUS_DRAG_DISTANCE){
            startPreviousMessagesHold(metrics);
        }
        else{
            clearHoldTimer();
        }
    }
    return(<>
  
    <MainFrame headerMenu={["Menu2",[name]]} injectFooter={
        <>
        {loading && <View style={Styles.Chat.loadingContainer}>
                <Image source={Assets.logos.loading} style={Styles.Chat.loading}/>
            </View>}
        <SearchBar placeHolder="Message..." buttonText="Send" multiline onClick={(msg:string)=>{(msg) && SendMessage(msg)}} resetOnSubmit={true}/>
        </>
        } onRefresh={() => {previousMessages(previousDemoMessages.current,2000)}} onScroll={(event:any,touch?:number,movement?:number,metrics?:ScrollMetrics) => {scroll(event,touch,movement,metrics)}} onMovement={(move:number,metrics?:ScrollMetrics) => {movement(move,metrics)}} onTouchEnd={() => {clearHoldTimer()}}>
        
            <View style={Styles.Chat.container}>
              
                    {
                    returnMessages(reverseStack)
                    }
                
            </View>
    </MainFrame>
  
        
  
   

    </>)

}
