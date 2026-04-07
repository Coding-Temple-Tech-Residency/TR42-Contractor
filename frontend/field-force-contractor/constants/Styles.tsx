const DefaultFont = "poppins-bold";
const DefaultColor = "white";
import { StyleSheet } from "react-native";
export const Styles = {

   MainFrame: StyleSheet.create({
    
            Window:{
                display: "flex",
                flex:1
            
        },
        Body:{

             alignItems:"center",
             flex: 1,
             overflow: "hidden",
            
             
        },
        Header:{
            
             width: "100%",
             minHeight:27,
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
    SearchBar: StyleSheet.create({
        Bar:{
              flexDirection: "row",
              backgroundColor: "#007CFF",
              width: "100%",
              height: 54,
              justifyContent: "flex-start",
              alignItems:"center"
        },
        SearchInput:{

          flex:1,
          height: 37,
          backgroundColor:"white",
          marginLeft:15,
          paddingLeft:15,
          borderRadius:5
      
        
          
        },
        SearchButton:{

            width:81,
            height:37,
            backgroundColor:"black",
            justifyContent:"center",
            alignItems:"center",
            marginLeft:10,
            borderRadius:8,


        },
        SearchButtonPressed:{

            backgroundColor: "#FAEECE",
            color: "black",

        },
        SearchButtonText:{

            fontFamily:DefaultFont,
            fontSize: 15,
            color:"white"

        },
        TextToSpeechButton:{
             
            width:40,
            height:37,
            borderRadius:8,
            backgroundColor:"#17FE81",
            marginLeft:10,
            justifyContent:"center",
            alignItems:"center",
            marginRight:10

        },
        TextToSpeechButtonPressed:{

            backgroundColor:"#FFE9AE",

        },
        TextToSpeechInset:{
            
            width:35,
            height:32,
            borderRadius:8,
            borderColor:"white",
            borderWidth:2,
            

        },
        TextToSpeechIcon:{

            width:"100%",
            height:"100%"
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
