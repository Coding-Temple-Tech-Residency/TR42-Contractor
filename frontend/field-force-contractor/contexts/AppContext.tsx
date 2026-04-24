import { createContext,useState,ReactNode } from "react"



export const  AppContext = createContext<any>(null)


export const AppProvider = ({children} : {children:ReactNode}) =>{
   const [mount,setMounted] = useState(false);
   const [reverseStack,setReverseStack] = useState(false);
    return(

        <AppContext.Provider value={{mount,setMounted,reverseStack,setReverseStack}}>
        {children}
        </AppContext.Provider>
    )

}