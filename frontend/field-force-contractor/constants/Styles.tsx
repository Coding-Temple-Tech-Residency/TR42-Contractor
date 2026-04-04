const DefaultFont = "poppins-bold";
import { StyleSheet } from "react-native";
export const Styles = {

   MainFrame: StyleSheet.create({
    
            Window:{
                display: "flex",
                width: "100%",
                height: "100%"
            
        },
        Body:{

           
             flexDirection: "row",
             justifyContent : "center",
             alignItems:"center",
             width: "100%",
             height: 500,
             
        },
        Header:{
            
             width: "100%",
             backgroundColor:"yellow",
             alignItems:"center",
          

        },
        Footer:{
            
             flexDirection: "row",
             justifyContent : "center",
             alignItems:"center",
             width: "100%",

        },
            BackgroundImageSize:{

                width:"100%",
                height:"100%",
                
        },
          DefaultText:{

            fontFamily: DefaultFont,
            fontSize: 20,
            color:"white"

        },
        TopSpaceHeader:{

            backgroundColor : "black",
            width: "100%",
            height: 45
        }
        
    })
    
}