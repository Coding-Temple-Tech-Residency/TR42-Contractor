import {View,TextInput,Pressable,Text} from 'react-native';
import { Image } from 'expo-image';
import {Styles} from '../constants/Styles';
import {FC} from "react";
import { Assets } from "../constants/Assets";
type Props = {

    placeHolder?:string,
    buttonText?: string
}
export const SearchBar:FC<Props> = (props) => {
 const searchPlaceHolder = props.placeHolder || "Search...";
 const buttonText = props.buttonText || "Submit";
    return(<>
    <View style={Styles.SearchBar.Bar}>
        <TextInput style={Styles.SearchBar.SearchInput} placeholder={searchPlaceHolder}/>
        <Pressable style={({pressed}) => 
            [Styles.SearchBar.SearchButton,
              {backgroundColor: (pressed) ? Styles.SearchBar.SearchButtonPressed.backgroundColor : Styles.SearchBar.SearchButton.backgroundColor}
            ]}>
              {({pressed}) => 
                  {
                    return(<Text style={
                      [Styles.SearchBar.SearchButtonText,
                        {
                          color: (pressed) ? Styles.SearchBar.SearchButtonPressed.color : Styles.SearchBar.SearchButtonText.color
                        }
                      ]
                    }>{buttonText}</Text>)                      
                  }
              }
         </Pressable>
          <Pressable style={({pressed}) =>[

            Styles.SearchBar.TextToSpeechButton,
            {
              backgroundColor: (pressed) ? Styles.SearchBar.TextToSpeechButtonPressed.backgroundColor : Styles.SearchBar.TextToSpeechButton.backgroundColor
            }]}>

            <View style={Styles.SearchBar.TextToSpeechInset}>
              <Image source={Assets.icons.TextToSpeech} style={Styles.SearchBar.TextToSpeechIcon} contentFit="contain" transition={120} cachePolicy="memory-disk" />
            </View>
            
          </Pressable>
    </View>
    
    </>

    )
}
