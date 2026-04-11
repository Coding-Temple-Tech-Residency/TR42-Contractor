import {FC,ReactNode} from "react"
import { MainFrame } from "@/components/MainFrame"
import { SearchBar } from "../components/SearchBar"
import { ContactCard } from "@/components/ContactCard"

export const Contacts:FC = (props) => {
    
    return(<>
    <MainFrame header="home" headerMenu={["Menu2",["Contacts"]]}>
     <SearchBar onClick={()=>{console.log("Search Contacts Clicked")}}/>
     <ContactCard phoneNumber="555-555-5555" name="John Doe"/>
     <ContactCard phoneNumber="444-444-4444" name="Jane Doe"/>
    </MainFrame>
    
    
    </>)
}