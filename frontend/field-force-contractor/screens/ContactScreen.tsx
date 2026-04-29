import {FC,use,useContext,useState} from "react"
import { MainFrame } from "@/components/MainFrame"
import { SearchBar } from "@/components/SearchBar"
import { ContactCard } from "@/components/ContactCard"
import { useNavigation,useRoute,RouteProp } from "@react-navigation/native"
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from "@/App"
import { AppContext, demoUsers } from "@/contexts/AppContext"


export const Contacts:FC = (props) => {
    
 
    const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
    const {client} = useContext(AppContext)
    const contacts = (client) ?  [...demoUsers,client] : demoUsers
    const  [nameSearch,setNameSearch] = useState("");
    const  route = useRoute();
    const sort = route.params
  
    const Search:FC = () =>{
       return(
           <SearchBar onClick={(msg:string)=>{setNameSearch(msg)}}/>
       )
    }
    return(<>
    <MainFrame header="home" headerMenu={["Menu2",["Contacts"]]} injectHeader={<Search/>}>
    
      {
        contacts.filter(ct => (`${ct.firstName.toUpperCase()} ${ct.lastName.toUpperCase()}`).includes((sort) ? `${client.firstName} ${client.lastName}`.toUpperCase() : nameSearch.toUpperCase())).map((item,index) =>{
          return( <ContactCard key={index} contactId={item.userid} phoneNumber={item.phone} name={`${item.firstName} ${ item.lastName}`}/>)
        })
      }
    
     
    </MainFrame>
    
    
    </>)
}