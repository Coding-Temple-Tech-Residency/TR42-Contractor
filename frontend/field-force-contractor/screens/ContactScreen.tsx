import {FC,useState} from "react"
import { MainFrame } from "@/components/MainFrame"
import { SearchBar } from "@/components/SearchBar"
import { ContactCard } from "@/components/ContactCard"
import { useNavigation } from "@react-navigation/native"
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from "@/App"
import { demoUsers } from "@/contexts/AppContext"


export const Contacts:FC = (props) => {
    
 
    const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
    const [contacts] = useState(demoUsers)
    const  [nameSearch,setNameSearch] = useState("");
    const Search:FC = () =>{
       return(
           <SearchBar onClick={(msg:string)=>{setNameSearch(msg)}}/>
       )
    }
    return(<>
    <MainFrame header="home" headerMenu={["Menu2",["Contacts"]]} injectHeader={<Search/>}>
    
      {
        contacts.filter(ct => (`${ct.firstName.toUpperCase()} ${ct.lastName.toUpperCase()}`).includes(nameSearch.toUpperCase())).map((item) =>{
          return( <ContactCard key={item.userid} contactId={item.userid} phoneNumber={item.phone} name={`${item.firstName} ${ item.lastName}`}/>)
        })
      }
    
     
    </MainFrame>
    
    
    </>)
}