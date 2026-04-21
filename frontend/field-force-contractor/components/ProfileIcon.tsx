import { Styles } from "@/constants/Styles";
import { Assets} from "@/constants/Assets";
import {FC,useEffect, useState} from "react"
import { View,Text,Image } from "react-native";


type Props = {
    width?:number
    height?:number
    name?:string
}
export const ProfileIcon:FC<Props> = (props) =>{
const [initName, setInitName] = useState<string>(props.name || "")
const formatName = (nameText:string) => {
  let inital =  (nameText && nameText.includes(" ")) ? nameText.split(" ")[0][0].toUpperCase() + nameText.split(" ")[1][0].toUpperCase() : ""
    return(inital)
}
useEffect(() => {
 if(props.name){

  setInitName(formatName(props.name))
  
 }

},[props.name])
return(
    <View style={{width:props.width || 55, height:props.height || 55}}>
        {
       (initName === "") ? <Image source={Assets.icons.ProfileIcon} style={Styles.ProfileIcon.Default}/> :  
       <View style={Styles.ProfileIcon.icon}>
        {
        
            <Text style={
            [ 
                Styles.ProfileIcon.iconText,
                {
                    fontSize: (props.width) ? props.width * 0.4 : Styles.ProfileIcon.iconText.fontSize
                }
            ]
            }>{initName}</Text>
        }

        </View>
        }
    </View>
)

}