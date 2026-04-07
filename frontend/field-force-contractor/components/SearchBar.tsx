import {View,TextInput,Pressable,Text,Image} from 'react-native';
import {Styles} from '../constants/Styles';
import {Children, FC, ReactNode} from "react";
import { Assets } from "../constants/Assets";
import {useState} from "react";
type props = {

    placeHolder:string,
    buttonText: string
}
export const SearchBar:FC<props> = (props) => {
 const [searchPlaceHolder, setSearchPlaceHolder] = useState(props.placeHolder);
 const [buttonText, setButtonText] = useState(props.buttonText);
    return(<>
    <View style={Styles.SearchBar.Bar}>
        <TextInput style={Styles.SearchBar.SearchInput} placeholder={searchPlaceHolder}/>
        <Pressable style={Styles.SearchBar.SearchButton}>
          <Text style={Styles.SearchBar.SearchButtonText}> {buttonText}</Text>
        </Pressable>
          <Pressable style={Styles.SearchBar.TextToSpeechButton}>
            <View style={Styles.SearchBar.TextToSpeechInset}>
              <Image source={Assets.icons.TextToSpeech} style={Styles.SearchBar.TextToSpeechIcon}/>
            </View>
            
          </Pressable>
    </View>
    
    </>

    )
}