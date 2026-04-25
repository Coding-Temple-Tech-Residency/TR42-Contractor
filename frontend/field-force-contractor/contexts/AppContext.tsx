import { createContext,useState,ReactNode } from "react"



export const  AppContext = createContext<any>(null)


export const AppProvider = ({children} : {children:ReactNode}) =>{
   const [mount,setMounted] = useState(false);
   const [reverseStack,setReverseStack] = useState(false);
   const [devMode,setDevMode] = useState(false);
    return(

        <AppContext.Provider value={{mount,setMounted,reverseStack,setReverseStack,devMode,setDevMode}}>
        {children}
        </AppContext.Provider>
    )

}