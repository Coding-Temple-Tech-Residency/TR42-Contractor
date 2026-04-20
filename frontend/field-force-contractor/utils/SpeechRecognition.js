import * as SpeechRecognition from 'expo-speech-recognition';

export class TextToSpeech {
 
  static listener;
  static RemoveListener = () =>{

    if(TextToSpeech.listener){

        TextToSpeech.listener.remove();
        TextToSpeech.listener = null;
    }
     return(true);
   }
   static Start (textResult) {
    
    if(TextToSpeech.RemoveListener())
     {
        SpeechRecognition.start({
            lang: "en-US",
            interimResults: true
        });
        TextToSpeech.listener = SpeechRecognition.addListener("result",(event) =>{
            const text = event.results?.[0]?.transcript;
            if(text){
            textResult(text)
            }

        })
     }
   
}
static Stop(){

    SpeechRecognition.stop();
    TextToSpeech.RemoveListener();
    
}

   

}