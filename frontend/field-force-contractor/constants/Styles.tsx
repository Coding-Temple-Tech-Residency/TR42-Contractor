const DefaultFont  = "poppins-bold";
const DefaultColor = "white";
import { StyleSheet } from "react-native";

export const Styles = {

  MainFrame: StyleSheet.create({
    Window:              { width: "100%", height: "100%" },
    Body:                { alignItems: "center", width: "100%", overflow: "hidden" },
    Header:              { width: "100%" },
    Footer:              { justifyContent: "center", alignItems: "center", width: "100%" },
    BackgroundImageSize: { width: "100%", height: "100%" },
    DefaultText:         { fontFamily: DefaultFont, fontSize: 20, color: DefaultColor },
    SpaceHeader:         { backgroundColor: "black", width: "100%", height: 45 },
  }),

  HeaderVariants: StyleSheet.create({
    container:   { width: "100%", backgroundColor: "#0a0e1a" },
    centered:    { width: "100%", alignItems: "center", justifyContent: "center", paddingVertical: 10 },
    row:         { width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10 },
    logo:        { width: 160, height: 40 },
    profileIcon: { width: 36, height: 36 },
  }),

  // ── Secondary tab bar (Home | Assigned | Completed | In Progress) ────────
  // Sits between the main header and the screen content.
  // Only shown when the MainFrame receives showTabs={true}.
  //
  // CHARLIE / JONATHAN:
  //   activeTab and onTabPress are passed in from your screen so you
  //   control which tab is highlighted and what happens when one is tapped.
  //   Example:
  //     <MainFrame header="home" showTabs activeTab="Assigned" onTabPress={setTab}>
  TabBar: StyleSheet.create({
    container: {
      flexDirection:     "row",
      width:             "100%",
      backgroundColor:   "#0d1b2e",          // slightly lighter than the main bg
      borderBottomWidth: 1,
      borderBottomColor: "#1e2d45",
      paddingHorizontal: 4,
    },
    tab: {
      flex:            1,
      alignItems:      "center",
      justifyContent:  "center",
      paddingVertical: 10,
      borderBottomWidth: 3,
      borderBottomColor: "transparent",      // invisible underline when inactive
    },
    tabActive: {
      borderBottomColor: "#ff8c00",          // orange underline on active tab
    },
    tabText: {
      fontFamily: DefaultFont,
      fontSize:   12,
      color:      "#6b7280",                 // muted gray when inactive
      letterSpacing: 0.3,
    },
    tabTextActive: {
      color: "#ff8c00",                      // orange text when active
    },
  }),

  TestStyles: StyleSheet.create({
    Style1: { width: "80%", height: "80%", marginTop: 20, backgroundColor: "red", justifyContent: "center" },
    Style2: { fontFamily: DefaultFont, fontSize: 30, color: DefaultColor, textAlign: "center" },
  }),

<<<<<<< HEAD
};
=======
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
>>>>>>> becb9b8b116401500b04e827827b0635410e7d32
