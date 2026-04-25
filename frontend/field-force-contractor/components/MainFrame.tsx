// MainFrame.tsx  —  Jonathan
//
// The single layout wrapper every screen in the app uses.
// Provides background image, status-bar spacer, logo header,
// optional header menu, scrollable body, and footer nav.
//
// Uses useRoute() to auto-detect the current page name and defaults
// to Menu2 which shows just the page title — no redundant nav links.
//
// ── SubHeader ─────────────────────────────────────────────────────────────────
// Also exports SubHeader — the navy back-arrow + centred title bar used on
// inner / detail screens. Previously lived in FieldForceHeader.tsx but is
// exported here so everything routes through a single component file and
// FieldForceHeader.tsx can be removed entirely.
//
// Usage:
//   import { MainFrame, SubHeader } from '../components/MainFrame';
//
//   <MainFrame header="home" ...>
//     <View style={{ alignSelf: 'stretch' }}>
//       <SubHeader title="Screen Title" />
//     </View>
//     ... page content ...
//   </MainFrame>
//
// The alignSelf:'stretch' wrapper is needed so SubHeader spans edge-to-edge
// inside MainFrame's centered ScrollView.
// ──────────────────────────────────────────────────────────────────────────────

import { FC, ReactNode,useEffect,useContext, useRef }  from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ImageBackground,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons }       from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList }     from "@/App"
import { Styles }              from '@/constants/Styles';
import { Assets }              from '@/constants/Assets';
import { colors, spacing, fontSize, fonts } from '@/constants/theme';
import { Header, HeaderVariant } from '@/components/Header';
import { Menu, MenuOptions }   from '@/components/Menu';
import { Menus }               from '@/constants/Menus';
import { AppContext } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';


// ── SubHeader ─────────────────────────────────────────────────────────────────

type SubHeaderProps = {
  title:   string;
  onBack?: () => void;
};

export function SubHeader({ title, onBack }: SubHeaderProps) {
  const navigation = useNavigation<any>();

  return (
    <View style={subStyles.subHeader}>
      <TouchableOpacity
        style={subStyles.backBtn}
        onPress={onBack ?? (() => navigation.goBack())}
        activeOpacity={0.7}
      >
        <Ionicons name="chevron-back" size={24} color={colors.textWhite} />
      </TouchableOpacity>

      <Text style={subStyles.subTitle}>{title}</Text>

      {/* Spacer keeps title centred */}
      <View style={subStyles.backBtn} />
    </View>
  );
}

const subStyles = StyleSheet.create({
  subHeader: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    backgroundColor:   '#142040',
    paddingHorizontal: spacing.md,
    paddingVertical:   12,
  },
  backBtn: {
    width:      36,
    alignItems: 'center',
  },
  subTitle: {
    flex:          1,
    fontFamily:    fonts.bold,
    color:         colors.textWhite,
    fontSize:      fontSize.lg,
    textAlign:     'center',
    letterSpacing: 0.3,
  },
});

// ── MainFrame ─────────────────────────────────────────────────────────────────

type Props = {
  children?:     ReactNode;
  header?:       HeaderVariant;
  headerMenu?:   MenuOptions;
  footerMenu?:   MenuOptions;
  strip?:        'menus' | 'all' | 'header';
  injectHeader?: ReactNode;
  injectFooter?: ReactNode;
  requireAuth?:boolean;
};

export const MainFrame: FC<Props> = (props) => {
  const route    = useRoute();
  const pageName = route.name;
  const [mount] = useContext(AppContext);
  const {isAuthenticated,isLoading} = useAuth();
 type Nav = NativeStackNavigationProp<RootStackParamList>;
 const publicPages = [

   {name:"Login"},
   {name:"OfflineLogin"},
   {name:"BiometricCheck"},
   {name:"OfflinePinReset"},
   {name:"SplashScreen"},
   {name:"PasswordReset"}
  
 ]
 const hasRedirected = useRef(false);
  const navigator = useNavigation<Nav>();
  const requireAuth = props.requireAuth;
  useEffect(() => {
    if(isLoading || hasRedirected.current) return
   
     
      const noAuthRequired =  publicPages.some(item => item.name === pageName)
      const notLogin = pageName !== "Login"
         
      if(!isAuthenticated && notLogin){

         if( requireAuth === true || !noAuthRequired && requireAuth == undefined) {
          hasRedirected.current = true
          navigator.replace("Login")
         }

        }
      
  


  },[isLoading,isAuthenticated,pageName,requireAuth])
 

  const renderHeaderMenu: MenuOptions =
    props.strip === 'menus' || props.strip === 'all'
      ? ['none', []]
      : props.headerMenu ?? ['Menu2', [pageName]];

  const renderFooterMenu: MenuOptions =
    props.strip === 'menus' || props.strip === 'all'
      ? ['none', []]
      : props.footerMenu ?? ['Menu3', Menus.Footer];

  const renderHeader = (props.strip !== 'all' && props.strip !== 'header')
    ? props.header
    : 'none';

  return (
    <ImageBackground
      source={Assets.backgrounds.MainFrame.MainbackgroundImage}
      style={Styles.MainFrame.BackgroundImageSize}
    >
      <View style={Styles.MainFrame.Window}>

        <View style={Styles.MainFrame.Header}>
          <View style={Styles.MainFrame.SpaceHeader} />
          <Header header={renderHeader} />
          <Menu menuOptions={renderHeaderMenu} />
          {props.injectHeader}
        </View>

        <ScrollView contentContainerStyle={Styles.MainFrame.Body}>
          {props.children}
        </ScrollView>

        <View style={Styles.MainFrame.Footer}>
          {props.injectFooter}
          <Menu menuOptions={renderFooterMenu} />
          <View style={Styles.MainFrame.SpaceHeader} />
        </View>

      </View>
    </ImageBackground>
  );
};