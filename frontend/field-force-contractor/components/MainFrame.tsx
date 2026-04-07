<<<<<<< Updated upstream
import {Styles} from "../constants/Styles"
import {Assets} from "../constants/Assets"
import {FC,ReactNode} from "react"
import {View,ImageBackground,Text,ScrollView,Image,} from "react-native"
import {Header, HeaderVariant} from "../components/Header"


type Props ={
  children: ReactNode,
  header?: HeaderVariant,
}

export const MainFrame:FC<Props> = (props) =>{

  return(<>
    <ImageBackground source={Assets.backgrounds.MainFrame.MainbackgroundImage} style={Styles.MainFrame.BackgroundImageSize}>

      <View style={Styles.MainFrame.Window}>
        <View style={Styles.MainFrame.Header}>
          <View style={Styles.MainFrame.SpaceHeader}/>
          <Header header={props.header}/> 
          <Text style={Styles.MainFrame.DefaultText}> Top menu goes here</Text> 
        </View>

        <ScrollView contentContainerStyle={Styles.MainFrame.Body}>
          {
          props.children
          }
        </ScrollView>

        <View style={Styles.MainFrame.Footer}>
          <Text style={Styles.MainFrame.DefaultText}> Bottom Navigation Here</Text> 
          <View style={Styles.MainFrame.SpaceHeader}/>
        </View>

      </View>
    </ImageBackground>
 </>)
}
=======
// components/MainFrame.tsx
// The main shell wrapper for every screen in the app.
// It handles the background image, header, optional tab bar, scrollable body, and footer.
//
// Props:
//   header?     — which header style to use ('default' or 'home'). Defaults to 'default'.
//   showTabs?   — pass true to show the secondary tab bar (Home | Assigned | Completed | In Progress)
//   activeTab?  — which tab is currently highlighted. One of the TAB_LABELS values.
//   onTabPress? — callback fired when a tab is tapped, receives the tab label as a string.
//
// Usage examples:
//   <MainFrame>
//     Plain screen with centred logo, no tabs.
//
//   <MainFrame header="home">
//     Main app screen with logo + profile icon, no tabs.
//
//   <MainFrame header="home" showTabs activeTab="Assigned" onTabPress={(tab) => setActiveTab(tab)}>
//     Main app screen with the full tab bar — CHARLIE / JONATHAN use this for work order screens.

import { FC, ReactNode } from "react";
import { View, ImageBackground, Text, ScrollView, Image, TouchableOpacity } from "react-native";
import { Styles } from "../constants/Styles";
import { Assets } from "../constants/Assets";

// ── Header variant ────────────────────────────────────────────
// 'default' → centred logo only        (auth screens: Login, Biometric, Reset)
// 'home'    → logo left + profile right (main app screens: Dashboard, Work Orders, etc.)
type HeaderVariant = 'default' | 'home';

// ── Tab bar ───────────────────────────────────────────────────
// These are the four tabs shown in the approved design.
// They live here so they're easy to find and update in one place.
const TAB_LABELS = ['Home', 'Assigned', 'Completed', 'In Progress'] as const;
type TabLabel = typeof TAB_LABELS[number];

// ── MainFrame props ───────────────────────────────────────────
type MainFrameProps = {
  children:    ReactNode;
  header?:     HeaderVariant;
  showTabs?:   boolean;
  activeTab?:  TabLabel;
  onTabPress?: (tab: TabLabel) => void;
};

// ── Header sub-components ─────────────────────────────────────

// Default header — centred logo, no profile icon (used on auth screens)
const HeaderDefault: FC = () => (
  <View style={Styles.HeaderVariants.container}>
    <View style={Styles.MainFrame.SpaceHeader} />
    <View style={Styles.HeaderVariants.centered}>
      <Image
        source={Assets.logos.ffLogoName}
        style={Styles.HeaderVariants.logo}
        resizeMode="contain"
      />
    </View>
  </View>
);

// Home header — logo on the left, profile icon on the right
const HeaderHome: FC = () => (
  <View style={Styles.HeaderVariants.container}>
    <View style={Styles.MainFrame.SpaceHeader} />
    <View style={Styles.HeaderVariants.row}>
      <Image
        source={Assets.logos.ffLogoName}
        style={Styles.HeaderVariants.logo}
        resizeMode="contain"
      />
      <Image
        source={Assets.icons.profileIcon}
        style={Styles.HeaderVariants.profileIcon}
        resizeMode="contain"
      />
    </View>
  </View>
);

const headers: Record<HeaderVariant, FC> = {
  default: HeaderDefault,
  home:    HeaderHome,
};

// ── Tab bar sub-component ─────────────────────────────────────
// Only rendered when showTabs={true} is passed to MainFrame.
// Highlights the active tab with an orange underline and text colour.
//
// CHARLIE / JONATHAN:
//   Pass activeTab and onTabPress from your screen to control
//   which tab is selected and what happens when one is tapped.
//   Example in your screen:
//     const [tab, setTab] = useState('Home');
//     <MainFrame header="home" showTabs activeTab={tab} onTabPress={setTab}>

type TabBarProps = {
  activeTab?:  TabLabel;
  onTabPress?: (tab: TabLabel) => void;
};

const TabBar: FC<TabBarProps> = ({ activeTab, onTabPress }) => (
  <View style={Styles.TabBar.container}>
    {TAB_LABELS.map((tab) => {
      const isActive = tab === activeTab;
      return (
        <TouchableOpacity
          key={tab}
          style={[Styles.TabBar.tab, isActive && Styles.TabBar.tabActive]}
          onPress={() => onTabPress && onTabPress(tab)}
          activeOpacity={0.7}
        >
          <Text style={[Styles.TabBar.tabText, isActive && Styles.TabBar.tabTextActive]}>
            {tab}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

// ── MainFrame ─────────────────────────────────────────────────

export const MainFrame: FC<MainFrameProps> = (props) => {
  const Header = headers[props.header ?? 'default'];

  return (
    <>
      <ImageBackground
        source={Assets.backgrounds.MainFrame.MainbackgroundImage}
        style={Styles.MainFrame.BackgroundImageSize}
      >
        <View style={Styles.MainFrame.Window}>

          {/* Main brand header — swaps between default and home variants */}
          <View style={Styles.MainFrame.Header}>
            <Header />
          </View>

          {/* Secondary tab bar — only rendered when showTabs={true} */}
          {props.showTabs === true && (
            <TabBar
              activeTab={props.activeTab}
              onTabPress={props.onTabPress}
            />
          )}

          {/* Scrollable content area — all child screen content goes here */}
          <ScrollView contentContainerStyle={Styles.MainFrame.Body}>
            {props.children}
          </ScrollView>

          {/* Footer — bottom navigation slot */}
          <View style={Styles.MainFrame.Footer}>
            {/*
             * CHARLIE / JONATHAN:
             * Replace the placeholder text below with:
             *   import { BottomNavigation } from './BottomNavigation';
             *   <BottomNavigation />
             */}
            <Text style={Styles.MainFrame.DefaultText}>Bottom Navigation Here</Text>
            <View style={Styles.MainFrame.SpaceHeader} />
          </View>

        </View>
      </ImageBackground>
    </>
  );
};
>>>>>>> Stashed changes
