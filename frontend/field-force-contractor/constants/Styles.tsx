const DefaultFont = "poppins-bold";
const DefaultColor = "white";
import { StyleSheet } from "react-native";
export const Styles = {

   MainFrame: StyleSheet.create({
    
            Window:{
                display: "flex",
                width: "100%",
                height: "100%"
            
        },
        Body:{

             alignItems:"center",
             width: "100%",
             height: "100%",
             overflow: "hidden",
            
             
        },
        Header:{
            
             width: "100%",
             alignItems:"center",
          

        },
        Footer:{
            
            
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
            color:DefaultColor

        },
        SpaceHeader:{

            backgroundColor : "black",
            width: "100%",
            height: 45
        }
        
    }),
    TestStyles : StyleSheet.create({

        Style1:{
            width: "80%",
            height: "80%",
            marginTop:20,
            backgroundColor: "red",
            justifyContent:"center",
        },
        Style2:{
            fontFamily: DefaultFont,
            fontSize: 30,
            color:DefaultColor, 
            textAlign: "center",
        }
    }),

    HeaderVariants: StyleSheet.create({

        container: {
            width: '100%',
        },
        row: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingVertical: 10,
        },
        logo: {
            height: 48,
            aspectRatio: 4,
        },
        profileIcon: {
            height: 48,
            width: 48,
        },
        centered: {
            alignItems: 'center',
            paddingVertical: 10,
        },
    }),
    
}