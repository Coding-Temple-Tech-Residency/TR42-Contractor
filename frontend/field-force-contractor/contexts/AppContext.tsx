import { createContext,useState,ReactNode } from "react"



export const  AppContext = createContext<any>(null)

export type userTable = {

    userid:string,
    firstName:string,
    lastName:string,
    phone:string,
    role:string,
    vendorid:string
}
//Demo User Data
export const demoUsers:userTable[] = [
 {
    userid:"0",
    firstName:"John",
    lastName:"Doe",
    phone:"555-555-5555",
    role:"contractor",
    vendorid:"1"
 },
 {
    userid:"1",
    firstName:"Jane",
    lastName:"Doe",
    phone:"666-555-5555",
    role:"client",
    vendorid:""
 },
 {
    userid:"2",
    firstName:"Taylor",
    lastName:"Swith",
    phone:"777-555-5555",
    role:"vendor",
    vendorid:""
 },
 {
    userid:"3",
    firstName:"Ben",
    lastName:"Joe",
    phone:"888-555-5555",
    role:"contractor",
    vendorid:"1"
 }

]
export const getUser = (userid:string) =>{

    let user = demoUsers.find(p => p.userid === userid) || null
  
    return(user);
}
export const AppProvider = ({children} : {children:ReactNode}) =>{
   const [mount,setMounted] = useState(false);
   const [reverseStack,setReverseStack] = useState(false);
   const [devMode,setDevMode] = useState(false);
   const [userInfo,setUserInfo] = useState(getUser("1"));
   
    return(

        <AppContext.Provider value={{mount,setMounted,reverseStack,setReverseStack,devMode,setDevMode,setUserInfo,userInfo}}>
        {children}
        </AppContext.Provider>
    )

}