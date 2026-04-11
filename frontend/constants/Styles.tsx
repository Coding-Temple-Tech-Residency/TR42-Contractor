import { StyleSheet } from "react-native";

const DefaultFont  = "poppins-bold";
const DefaultColor = "white";
const DefaultPressedColor = "#FAEECE";

export const Styles = {

  MainFrame: StyleSheet.create({
    Window:              { flex: 1, width: "100%" },
    Body:                { alignItems: "center", width: "100%", overflow: "hidden", flexDirection: "column" },
    Header:              { width: "100%" },
    Footer:              { justifyContent: "center", alignItems: "center", width: "100%" },
    BackgroundImageSize: { width: "100%", height: "100%" },
    DefaultText:         { fontFamily: DefaultFont, fontSize: 20, color: DefaultColor },
    SpaceHeader:         { backgroundColor: "transparent", width: "100%", height: 45 },
  }),

  HeaderVariants: StyleSheet.create({
    container:   { width: "100%", backgroundColor: "#0a0e1a" },
    centered:    { width: "100%", alignItems: "center", justifyContent: "center", paddingVertical: 10 },
    row:         { width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10 },
    logo:        { width: 160, height: 40 },
    profileIcon: { width: 36, height: 36 },
  }),

  TabBar: StyleSheet.create({ container: { flexDirection: "row", width: "100%", backgroundColor: "#0d1b2e", borderBottomWidth: 1, borderBottomColor: "#1e2d45", paddingHorizontal: 4, }, tab: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 10, borderBottomWidth: 3, borderBottomColor: "transparent", }, tabActive: { borderBottomColor: "#ff8c00" }, tabText: { fontFamily: DefaultFont, fontSize: 12, color: "#6b7280", letterSpacing: 0.3, }, tabTextActive: { color: "#ff8c00" }, }), SearchBar: StyleSheet.create({ Bar: { flexDirection: "row", backgroundColor: "#007CFF", width: "100%", height: 54, justifyContent: "flex-start", alignItems:"center", }, SearchInput: { flex: 1, height: 37, backgroundColor:"white", marginLeft: 15, paddingLeft: 15, borderRadius: 5, }, SearchButton: { width: 81, height: 37, backgroundColor: "black", justifyContent: "center", alignItems: "center", marginLeft: 10, borderRadius: 8, },
    SearchButtonPressed: { backgroundColor: DefaultPressedColor, color: "black", }, SearchButtonText: { fontFamily: DefaultFont, fontSize: 15, color: "white", },
    TextToSpeechButton: { width: 40, height: 37, borderRadius: 8, backgroundColor: "#17FE81", marginLeft: 10, justifyContent: "center", alignItems: "center", marginRight: 10, },
    TextToSpeechButtonPressed: { backgroundColor: DefaultPressedColor},
    TextToSpeechInset: { width: 35,height: 32,borderRadius: 8, borderColor: "white",borderWidth: 2,
    },
    TextToSpeechIcon: { width: "100%", height: "100%" },
  }),

  Menu: StyleSheet.create({
    MenuStyle1: { width:"100%", minHeight:54, padding:10, backgroundColor:"#00254D", flexDirection:"row", justifyContent:"center", alignItems:"center", overflow:"hidden" },
    MenuStyle2: { width:"100%", minHeight:54, padding:5, backgroundColor:"#00254D", flexDirection:"row", justifyContent:"flex-start", alignItems:"center", overflow:"hidden" },
    MenuStyle3: { width:"100%", minHeight:54, padding:5, backgroundColor:"#00254D", flexDirection:"row", justifyContent:"space-between", alignItems:"center", overflow:"hidden" },
    itemText: { fontFamily: DefaultFont, color: DefaultColor, fontSize:14 },
    itemTextPressed: { color:DefaultPressedColor },
    menuItem: { justifyContent:"space-between", alignItems:"center",marginRight:10,marginLeft:10},
    menuIcon: { width:25, height:25,marginTop:5 },
    headMenuStyle2Icon:{width:45,height:45},
    headerMenuStyle2Text:{fontFamily:DefaultFont, fontSize:21, color:DefaultColor, flex:1, textAlign:"center", paddingRight:"8%"},
  
  }),
  SplashScreen: StyleSheet.create({
   Block: {width:"100%", flex:1, alignItems:"center", justifyContent:"center", marginTop:"25%"},
   LogoImage:{width:350,height:250, resizeMode:"contain"},
   LogoText:{width:250,height:150,resizeMode:"contain", marginTop:-45}



  }),
  Contacts: StyleSheet.create({
   container:{width:"100%", height:84,backgroundColor:"#80AEEA", borderRadius:11, flexDirection:"row", marginTop:5, justifyContent:"space-between", alignItems:"center"},
   InfoContainer:{height:"100%", flex:1,justifyContent:"center", alignItems:"center",flexDirection:"column"},
   IconContainer:{height:"100%",width:75,justifyContent:"center", alignItems:"center"},
   buttonContainer:{height:"100%",width:75,justifyContent:"center", alignItems:"center"},
   contactText: {fontFamily:DefaultFont, color:DefaultColor, fontSize:16,alignItems:"center"},
   phoneIcon: {width:20,height:20, marginRight:5,marginBottom:3},
   phoneIconText:{flexDirection:"row",justifyContent:"center", alignItems:"center"},
   contactTextPressed: {color:DefaultPressedColor},
   ProfileIcon:{width:50,height:50},
   forwardArrow:{width:35,height:35, transform:[{scaleX: -1}]},
   forwardArrowPressed:{width:65,height:65, transform:[{scaleX: - 1}]}


  }),
  TestStyles: StyleSheet.create({
    Style1: { width: "80%", flex:1, marginTop:20, backgroundColor: "red", justifyContent:"center" },
    Style2: { fontFamily: DefaultFont, fontSize: 30, color: DefaultColor, textAlign: "center" },
    
  }),
};
