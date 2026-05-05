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

import { FC, ReactNode,useEffect,useContext, useRef, useState}  from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ImageBackground,
  ScrollView,
  StyleSheet,
  RefreshControl,
  NativeScrollEvent,
  NativeSyntheticEvent,
  GestureResponderEvent,
  LayoutChangeEvent,
  PanResponder,
  PanResponderGestureState,
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
  onRefresh?:Function;
  onScroll?:(
    event: NativeSyntheticEvent<NativeScrollEvent>,
    touch?: number,
    movement?: number,
    metrics?: ScrollMetrics
  ) => void;
  onTouch?: (touch: number, metrics?: ScrollMetrics) => void;
  onMovement?: (movement: number, metrics?: ScrollMetrics) => void;
  onTouchEnd?: () => void;
};

type ScrollMetrics = {
  scrollY: number;
  layoutHeight: number;
  contentHeight: number;
};

export const MainFrame: FC<Props> = (props) => {
  const route    = useRoute();
  const pageName = route.name;
  const {mount,devMode} = useContext(AppContext);
  const {isAuthenticated,isLoading} = useAuth();
  const [refresh,setRefresh] = useState(false);
  const [touch,setTouch] = useState<number>();
  const [dragMove,setDragMove] = useState<number>();
  const touchStart = useRef<number | undefined>(undefined);
  const scrollMetrics = useRef<ScrollMetrics>({
    scrollY: 0,
    layoutHeight: 0,
    contentHeight: 0,
  });
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
      if(devMode === false){
        if(!isAuthenticated && notLogin){

          if( requireAuth === true || !noAuthRequired && requireAuth == undefined) {
            hasRedirected.current = true
            navigator.replace("Login")
          }

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

  const handleRefresh =  () =>{

    setRefresh(true);
    if(props.onRefresh){
       
        props.onRefresh()
       
    }
    setRefresh(false);
  }
  const handleScroll = (event:NativeSyntheticEvent<NativeScrollEvent>) =>{
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    scrollMetrics.current = {
      scrollY: contentOffset.y,
      layoutHeight: layoutMeasurement.height,
      contentHeight: contentSize.height,
    };

    if(props.onScroll){
     props.onScroll(event,touch,dragMove,scrollMetrics.current)
    }
  }
  const handleLayout = (event:LayoutChangeEvent) =>{
    scrollMetrics.current = {
      ...scrollMetrics.current,
      layoutHeight: event.nativeEvent.layout.height,
    };
  }
  const handleContentSizeChange = (_width:number,height:number) =>{
    scrollMetrics.current = {
      ...scrollMetrics.current,
      contentHeight: height,
    };
  }
  const handleTouchStart = (pageY:number) =>{
    touchStart.current = pageY;
    setTouch(pageY);
    setDragMove(0);
    props.onTouch?.(pageY,scrollMetrics.current);
    props.onMovement?.(0,scrollMetrics.current);
  }
  const handleTouchMove = (pageY:number) =>{
    const movement = (touchStart.current ?? pageY) - pageY;
    setTouch(pageY);
    setDragMove(movement);
    props.onTouch?.(pageY,scrollMetrics.current);
    props.onMovement?.(movement,scrollMetrics.current);
  }
  const handleTouchEnd = () =>{
    touchStart.current = undefined;
    setDragMove(0);
    props.onMovement?.(0,scrollMetrics.current);
    props.onTouchEnd?.();
  }
  const isAtBottom = () =>{
    const { scrollY, layoutHeight, contentHeight } = scrollMetrics.current;
    return(contentHeight <= layoutHeight || layoutHeight + scrollY >= contentHeight - 10);
  }
  const shouldCaptureBottomPull = (_event:GestureResponderEvent, gestureState:PanResponderGestureState) =>{
    return(
      isAtBottom() &&
      gestureState.dy < -5 &&
      Math.abs(gestureState.dy) > Math.abs(gestureState.dx)
    );
  }
  const handleBottomPullMove = (event:GestureResponderEvent, gestureState:PanResponderGestureState) =>{
    const movement = Math.max(0, -gestureState.dy);
    setTouch(event.nativeEvent.pageY);
    setDragMove(movement);
    props.onTouch?.(event.nativeEvent.pageY,scrollMetrics.current);
    props.onMovement?.(movement,scrollMetrics.current);
  }
  const bottomPullResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: shouldCaptureBottomPull,
      onMoveShouldSetPanResponderCapture: shouldCaptureBottomPull,
      onPanResponderGrant: (event) => {
        handleTouchStart(event.nativeEvent.pageY);
      },
      onPanResponderMove: handleBottomPullMove,
      onPanResponderRelease: handleTouchEnd,
      onPanResponderTerminate: handleTouchEnd,
      onShouldBlockNativeResponder: () => false,
    })
  ).current;

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

        <View style={{flex: 1}} {...bottomPullResponder.panHandlers}>
          <ScrollView
            style={{flex: 1}}
            contentContainerStyle={Styles.MainFrame.Body}
            onScroll={(event:NativeSyntheticEvent<NativeScrollEvent>) => {handleScroll(event)}}
            onLayout={(event:LayoutChangeEvent) => {handleLayout(event)}}
            onContentSizeChange={(width:number,height:number) => {handleContentSizeChange(width,height)}}
            onTouchStart={(event:GestureResponderEvent) => {handleTouchStart(event.nativeEvent.pageY)}}
            onTouchMove={(event:GestureResponderEvent) => {handleTouchMove(event.nativeEvent.pageY)}}
            onTouchEnd={() => {handleTouchEnd()}}
            onTouchCancel={() => {handleTouchEnd()}}
            scrollEventThrottle={16}
            refreshControl={<RefreshControl onRefresh={() => {handleRefresh()}} refreshing={refresh}/>}
          >
            {props.children}
          </ScrollView>
        </View>

        <View style={Styles.MainFrame.Footer}>
          {props.injectFooter}
          <Menu menuOptions={renderFooterMenu} />
          <View style={Styles.MainFrame.SpaceHeader} />
        </View>

      </View>
    </ImageBackground>
  );
};
