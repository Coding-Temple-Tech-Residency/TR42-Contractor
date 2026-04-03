const DefaultFont = "poppins-bold";

export const Styles = {

   MainFrame:{
    
            Window:{
                display: "flex",
                width: "100%",
                height: "100%"
            
        },
        Body:{

             display: "flex",
             flexDirection: "row",
             justifyContent : "center",
             alignItems:"center",
             width: "100%",
             height: 150,
             
        },
        Header:{
             display: "flex",
             width: "100%",
             backgroundColor:"yellow",
             alignItems:"center",
          

        },
        Footer:{
             display: "flex",
             flexDirection: "row",
              justifyContent : "center",
             alignItems:"center",
             width: "100%",

        },
            BackgroundImageSize:{

                width:"100%",
                height:"100%",
                resizeMode: "stretch"
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
        
    }
    
}