import { StyleSheet } from "react-native";

const DefaultFont = "poppins-bold";
const DefaultColor = "white";
const DefaultPressedColor = "#FAEECE";

export const Styles = {
  // ──────Jonathan───────MainFrame ─────────────────────────────────────────────
  // Window is used in MainFrame as the outer wrapper for the full screen layout.
  // Body is used in MainFrame as the ScrollView content container for the page body.
  // Header is used in MainFrame as the wrapper around whichever header component is rendered.
  // Footer is used in MainFrame as the wrapper around whichever footer/menu component is rendered.
  // BackgroundImageSize is used in MainFrame for the full-screen ImageBackground.
  // DefaultText is a shared fallback text style inside MainFrame-related layouts and is not directly referenced in the current files.
  // SpaceHeader is used in MainFrame as the black spacer bar above and below the main content.
  MainFrame: StyleSheet.create({
    Window: { width: "100%", flex: 1 },
    Body: { alignItems:"center", width: "100%", overflow: "hidden", justifyContent:"flex-start", flexDirection: "column" },
    Header: { width: "100%" },
    Footer: { justifyContent: "center", alignItems: "center", width: "100%" },
    BackgroundImageSize: { width: "100%", flex: 1 },
    DefaultText: { fontFamily: DefaultFont, fontSize: 20, color: DefaultColor },
    SpaceHeader: { backgroundColor: "black", width: "100%", height: 45 },
  }),

  // ──────Charlie─────── HeaderVariants ────────────────────────────────────────
  // container is used in Header as the outer wrapper for both header variants.
  // centered is used in Header for the centered logo-only header layout.
  // row is used in Header for the logo + profile icon header layout.
  // logo is used in Header for the ffLogoName image sizing.
  // profileIcon is intended for the profile image in HeaderVariants, but Header currently uses Styles.Menu.headMenuStyle2Icon instead.
  HeaderVariants: StyleSheet.create({
    container: { width: "100%", backgroundColor: "#0a0e1a" },
    centered: { width: "100%", alignItems: "center", justifyContent: "center", paddingVertical: 10 },
    row: { width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10, },
    logo: { width: 160, height: 40 },
    profileIcon: { width: 36, height: 36 },
  }),

  // ──────Troy─────── TabBar ────────────────────────────────────────────────
  // container, tab, tabActive, tabText, and tabTextActive are intended for a shared tab bar component.
  // This style group is not directly referenced through Styles.TabBar in the current files.
  TabBar: StyleSheet.create({
    container: { flexDirection: "row", width: "100%", backgroundColor: "#0d1b2e", borderBottomWidth: 1, borderBottomColor: "#1e2d45", paddingHorizontal: 4, },
    tab: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 10, borderBottomWidth: 3, borderBottomColor: "transparent", },
    tabActive: { borderBottomColor: "#ff8c00" },
    tabText: { fontFamily: DefaultFont, fontSize: 12, color: "#6b7280", letterSpacing: 0.3 },
    tabTextActive: { color: "#ff8c00" },
  }),

  // ──────Jonathan─────── SearchBar ─────────────────────────────────────────────
  // Bar is used in SearchBar as the outer row container.
  // SearchInput is used in SearchBar for the text input field.
  // SearchButton is used in SearchBar for the search action button.
  // SearchButtonPressed is used in SearchBar for the pressed-state background and text color.
  // SearchButtonText is used in SearchBar for the search button label text.
  // TextToSpeechButton is used in SearchBar for the speech action button container.
  // TextToSpeechButtonPressed is used in SearchBar for the pressed-state speech button background.
  // TextToSpeechInset is used in SearchBar as the inner bordered wrapper around the speech icon.
  // TextToSpeechIcon is used in SearchBar for the speech icon image sizing.
  SearchBar: StyleSheet.create({
    Bar: { flexDirection: "row", backgroundColor: "#007CFF", width: "100%", minHeight: 54, justifyContent: "flex-start", alignItems: "flex-end", paddingVertical: 8, },
    SearchInput: { flex: 1, height: 37, backgroundColor: "white", marginLeft: 15, paddingLeft: 15, borderRadius: 5, },
    MessageInput: { minHeight: 37, maxHeight: 110, paddingTop: 8, paddingBottom: 8, paddingRight: 10 },
    SearchButton: { width: 81, height: 37, backgroundColor: "black", justifyContent: "center", alignItems: "center", marginLeft: 10, marginRight:10, borderRadius: 8, },
    SearchButtonPressed: { backgroundColor: DefaultPressedColor, color: "black" },
    SearchButtonText: { fontFamily: DefaultFont, fontSize: 15, color: "white" },
    TextToSpeechButton: { width: 40, height: 37, borderRadius: 8, backgroundColor: "#17FE81", marginLeft: 10, justifyContent: "center", alignItems: "center", marginRight: 10, },
    TextToSpeechButtonPressed: { backgroundColor: DefaultPressedColor },
    TextToSpeechInset: { width: 35, height: 32, borderRadius: 8, borderColor: "white", borderWidth: 2, },
    TextToSpeechIcon: { width: "100%", height: "100%" },
  }),

  // ──────Jonathan───────Menu ──────────────────────────────────────────────────
  // MenuStyle1, MenuStyle2, and MenuStyle3 are used in Menu for the three menu/header layout variants.
  // itemText and itemTextPressed are used in MenuItem for the default and pressed text color states.
  // menuItem is used in MenuItem as the wrapper around each individual menu option.
  // menuIcon is used in MenuItem for the menu icon image sizing.
  // headMenuStyle2Icon is used in Menu and Header for the large icon shown in the style 2 header row.
  // headerMenuStyle2Text is used in Menu for the centered title text in the style 2 header row.
  Menu: StyleSheet.create({
    MenuStyle1: { width: "100%", minHeight: 54, padding: 10, backgroundColor: "#00254D", flexDirection: "row", justifyContent: "center", alignItems: "center", overflow: "hidden", }, MenuStyle2: { width: "100%", minHeight: 54, padding: 5, backgroundColor: "#00254D", flexDirection: "row", justifyContent: "flex-start", alignItems: "center", overflow: "hidden", }, MenuStyle3: { width: "100%", minHeight: 54, padding: 5, backgroundColor: "#00254D", flexDirection: "row", justifyContent: "space-between", alignItems: "center", overflow: "hidden", },
    itemText: { fontFamily: DefaultFont, color: DefaultColor, fontSize: 14 },
    itemTextPressed: { color: DefaultPressedColor },
    menuItem: { justifyContent: "space-between", alignItems: "center", marginRight: 10, marginLeft: 10 },
    menuIcon: { width: 25, height: 25, marginTop: 5 },
    headMenuStyle2Icon: { width: 45, height: 45 },
    headerMenuStyle2Text: { fontFamily: DefaultFont, fontSize: 21, color: DefaultColor, flex: 1, textAlign: "center", paddingRight: "8%", },
  }),

  // ──────Jonathan───────SplashScreen ──────────────────────────────────────────
  // Block is used in SplashScreen as the centered wrapper for the logo stack.
  // LogoImage is used in SplashScreen for the standalone logo mark image.
  // LogoText is used in SplashScreen for the brand text image.
  SplashScreen: StyleSheet.create({
    Block: { width: "100%", flex: 1, alignItems: "center", justifyContent: "center", marginTop: "25%" },
    LogoImage: { width: 350, height: 250, resizeMode: "contain" },
    LogoText: { width: 250, height: 150, resizeMode: "contain", marginTop: -45 },
  }),

  // ──────Jonathan─────── Contacts ──────────────────────────────────────────────
  // container is used in ContactCard as the outer card wrapper.
  // InfoContainer is used in ContactCard as the centered text column for the contact details.
  // IconContainer is used in ContactCard as the left-side wrapper for the profile icon.
  // buttonContainer is used in ContactCard as the right-side wrapper for the arrow button.
  // contactText is used in ContactCard for the contact name text.
  // phoneIcon is used in ContactCard for the phone icon image.
  // phoneIconText is used in ContactCard as the row wrapper around the phone icon and phone number.
  // contactTextPressed is used in ContactCard for the pressed-state phone number color.
  // ProfileIcon is used in ContactCard for the profile/avatar image sizing.
  // forwardArrow and forwardArrowPressed are used in ContactCard for the default and pressed arrow image states.
  Contacts: StyleSheet.create({
    container: { width: "100%", height: 84, backgroundColor: "#80aeea50", borderRadius: 11, flexDirection: "row", marginTop: 5, justifyContent: "space-between", alignItems: "center", }, InfoContainer: { height: "100%", flex: 1, justifyContent: "center", alignItems: "center", flexDirection: "column", },
    IconContainer: { height: "100%", width: 75, justifyContent: "center", alignItems: "center" },
    buttonContainer: { height: "100%", width: 75, justifyContent: "center", alignItems: "center" },
    contactText: { fontFamily: DefaultFont, color: DefaultColor, fontSize: 16, alignItems: "center" },
    phoneIcon: { width: 20, height: 20, marginRight: 5, marginBottom: 3 },
    phoneIconText: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
    contactTextPressed: { color: DefaultPressedColor },
    ProfileIcon: { width: 50, height: 50 },
    forwardArrow: { width: 35, height: 35, transform: [{ scaleX: -1 }] },
    forwardArrowPressed: { width: 65, height: 65, transform: [{ scaleX: -1 }] },
  }),

  // ──────Jonathan───────TestStyles ────────────────────────────────────────────
  // Style1 is used in Blank as the demo container wrapper.
  // Style2 is used in Blank as the demo text style.
  TestStyles: StyleSheet.create({
    Style1: { width: "80%", flex: 1, marginTop: 20, backgroundColor: "red", justifyContent: "center" },
    Style2: { fontFamily: DefaultFont, fontSize: 30, color: DefaultColor, textAlign: "center" },
  }),

 //──────Jonathan───────Chat ────────────────────────────────────────────
  Chat: StyleSheet.create({

   screen:{flex:1},
   container:{width:"100%",height:"100%", padding:15,paddingBottom:100},
   sendBar:{position:"absolute",left:0,right:0,width:"100%",zIndex:10,elevation:10},
   messageBoxReceived:{flexDirection:"row", justifyContent:"flex-start",width:"100%", alignItems:"center"},
   messageBoxSent:{flexDirection:"row", justifyContent:"flex-end",width:"100%",alignItems:"center"},
   messageSent:{justifyContent:"center", minHeight:65,maxWidth:"65%",borderRadius:11,backgroundColor:"#007CFF",marginTop:5,marginRight:10,marginLeft:10},
   messageReceived:{justifyContent:"center",minHeight:65,maxWidth:"65%",borderRadius:11, backgroundColor:"#30E852",marginTop:5,marginRight:10,marginLeft:10},
   messageText:{fontFamily:DefaultFont,color:DefaultColor,fontSize:16,marginLeft:15,marginRight:15, justifyContent:"center",textAlign:"center"},
   timeText:{fontFamily:DefaultFont,color:DefaultColor,fontSize:12},
   dateText:{fontFamily:DefaultFont,color:DefaultColor,fontSize:12, marginLeft:15, marginRight:15,textAlign:"center"},
   chatIcon:{width:35,height:35,marginRight:5,marginLeft:5},
   dateMarker:{fontFamily:DefaultFont,color:DefaultColor,fontSize:15, marginLeft:15, marginRight:15,textAlign:"center"},

  }),
  ProfileIcon: StyleSheet.create({
  icon:{width:"100%", height:"100%", backgroundColor:"#007bff49", borderRadius:100, borderColor:"#828282",borderStyle:"solid", borderWidth:1, justifyContent:"center", alignItems:"center"},
  iconText:{color:DefaultColor, fontFamily:DefaultFont, fontSize:16, fontWeight:"bold"},
  Default:{width:"100%",height:"100%"}

  })
};
