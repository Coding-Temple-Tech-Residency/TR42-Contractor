import {FC,useState} from "react"
import { MainFrame } from "@/components/MainFrame"
import { SearchBar } from "@/components/SearchBar"
import { ContactCard } from "@/components/ContactCard"
import { useNavigation } from "@react-navigation/native"
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from "@/App"
import { InitID } from "@/utils/InitID"


export const Contacts:FC = (props) => {
    
    const contactData = [ //PlaceHolder Contact Data  will be provided by backend
        {id:InitID.getId(),name:"John Doe",phone:"555-555-5555"}, // ids need to be replaced with data from database 
        {id:InitID.getId(),name:"Jane Doe", phone:"444-444-4444"},
        {id:InitID.getId(),name:"Taylor Swift",phone:"555-555-5555"}

    ]
    const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
    const [contacts] = useState(contactData)
    const  [nameSearch,setNameSearch] = useState("");
    const Search:FC = () =>{
       return(
           <SearchBar onClick={(msg:string)=>{setNameSearch(msg)}}/>
       )
    }
    return(<>
    <MainFrame header="home" headerMenu={["Menu2",["Contacts"]]} injectHeader={<Search/>}>
    
      {
        contacts.filter(ct => ct.name.toUpperCase().includes(nameSearch.toUpperCase())).map((item) =>{
          return( <ContactCard key={item.id} contactId={item.id} phoneNumber={item.phone} name={item.name}/>)
        })
      }
    
     
    </MainFrame>
    
    
    </>)
}