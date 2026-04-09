import {FC,ReactNode} from "react"
import { MainFrame } from "@/components/MainFrame"
import { SearchBar } from "../components/SearchBar"

export const Contacts:FC = (props) => {

    return(<>
    <MainFrame header="home" headerMenu={["Menu2",["Contacts"]]}>
     <SearchBar placeHolder="Search..." buttonText="Search"/>

    </MainFrame>
    
    
    </>)
}