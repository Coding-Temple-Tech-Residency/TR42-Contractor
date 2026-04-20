import {FC,useState} from "react"
import { MainFrame } from "@/components/MainFrame"
import { SearchBar } from "@/components/SearchBar"
import { ContactCard } from "@/components/ContactCard"

export const Contacts:FC = (props) => {
    
    const contactData = [ //PlaceHolder Contact Data  will be provided by backend
        {id:1,name:"John Doe",phone:"555-555-5555"},
        {id:2,name:"Jane Doe", phone:"444-444-4444"}

    ]
    const [contacts,setContacts] = useState(contactData)
    const Search:FC = () =>{
       return(
           <SearchBar onClick={()=>{console.log("Search Contacts Clicked")}}/>
       )
    }
    return(<>
    <MainFrame header="home" headerMenu={["Menu2",["Contacts"]]} injectHeader={<Search/>}>
    
      {
        contactData.map((item) =>{
          return( <ContactCard key={item.id} phoneNumber={item.phone} name={item.name}/>)
        })
      }
    
     
    </MainFrame>
    
    
    </>)
}