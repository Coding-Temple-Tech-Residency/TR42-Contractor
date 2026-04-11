export const Assets = {
  backgrounds: {
    MainFrame: {
      MainbackgroundImage: require("../assets/images/SplashScreenBackGround-optimized.jpg"),
    },
  },

  // ── Logos ─────────────────────────────────────────────────
  // ffLogoName is used by both HeaderDefault and HeaderHome in MainFrame.
  logos: {
    ffLogoName: require("../assets/images/ff-logo-name.png"), // placeholder, swap for real logo asset
    FieldForceLogo: require("../assets/images/ForceFiledicon.png"),
    FieldForceLogoText: require("../assets/images/FileForceText.png")
  },

  // ── Icons ─────────────────────────────────────────────────
  // profileIcon is used by HeaderHome (main-app header variant).
  icons: {
    TextToSpeech: require("../assets/images/SpeechToTextIconBlack.png"),
    ProfileIcon: require("../assets/images/profileicon.png"),
    HomeIcon:       require("../assets/images/home.png"),
    TaskIcon:       require("../assets/images/Jobs.png"),
    DashboardIcon:  require("../assets/images/ForceFiledicon.png"),
    ContactIcon:    require("../assets/images/contacts.png"),
    BackArrow:require("../assets/images/BackArrow.png"),
  
  },
};
