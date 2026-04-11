import * as Font from "expo-font";
 
export const FontList = {
  "poppins-regular":    require("../assets/fonts/Poppins-Regular.ttf"),
  "poppins-bold":       require("../assets/fonts/Poppins-Bold.ttf"),
  "poppins-italic":     require("../assets/fonts/Poppins-Italic.ttf"),
  "poppins-bolditalic": require("../assets/fonts/Poppins-BoldItalic.ttf"),
};
 
export async function LoadFonts() {
  try {
    await Font.loadAsync(FontList);
    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
}

