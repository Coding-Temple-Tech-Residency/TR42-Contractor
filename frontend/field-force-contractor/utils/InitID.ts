import 'react-native-get-random-values'
import {v4 as uuid} from "uuid"
export class InitID{

    static getId(){
       
        return(uuid().toString())
    }
}