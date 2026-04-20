export const Assets = {
  backgrounds: {
    // ──Backgrounds─────────────────────────────────────────────────
    // Background image used in the MainFrame.
    MainFrame: {
     
      MainbackgroundImage: require("../assets/images/SplashScreenBackGround.png"),
    },
  },

  // ── Logos ─────────────────────────────────────────────────
  // ffLogoName is used in Header for the HeaderDefault and HeaderHome brand wordmark.
  // FieldForceLogo is used in SplashScreen for the standalone brand icon.
  // FieldForceLogoText is used in SplashScreen for the brand text shown beside/below the icon.

  logos: {
    ffLogoName: require("../assets/images/ff-logo-name.png"), 
    FieldForceLogo: require("../assets/images/ForceFiledicon.png"),
    FieldForceLogoText: require("../assets/images/FileForceText.png")
  },

  // ── Icons ─────────────────────────────────────────────────
  // TextToSpeech is used in SearchBar for the speech input / text-to-speech action button.
  // ProfileIcon is used in Header and ContactCard for the user/profile avatar image.
  // HomeIcon is used in Menus.jsx and rendered by MenuItem for the Home navigation entry.
  // TaskIcon is used in Menus.jsx and rendered by MenuItem for the Tickets/Jobs navigation entry.
  // ContactIcon is used in Menus.jsx and rendered by MenuItem for the Contacts navigation entry.
  // BackArrow is used in Menu and ContactCard for back/forward style navigation actions.
  // PhoneIcon is used in ContactCard next to the contact's phone information.

  icons: {
    TextToSpeech: require("../assets/images/SpeechToTextIconBlack.png"),
    ProfileIcon: require("../assets/images/profileicon.png"),
    HomeIcon: require("../assets/images/home.png"),
    TaskIcon: require("../assets/images/Jobs.png"),
    ContactIcon: require("../assets/images/contacts.png"),
    BackArrow: require("../assets/images/BackArrow.png"),
    PhoneIcon: require("../assets/images/phone.png")
  },
};
