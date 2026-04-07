export const Assets: any = {

  backgrounds: {
    MainFrame: {
      MainbackgroundImage: require("../assets/images/SplashScreenBackGround.png"),
    },
  },

  // ── Logos ─────────────────────────────────────────────────
  // ffLogoName is used by both HeaderDefault and HeaderHome in MainFrame.
  // TODO: replace the placeholder path once the final logo asset is added
  //       to assets/images/.  e.g. require("../assets/images/ff-logo-name.png")
  logos: {
    ffLogoName: require("../assets/images/icon.png"),  // swap for real logo asset
  },

  // ── Icons ─────────────────────────────────────────────────
  // profileIcon is used by HeaderHome (the main-app header variant).
  // TODO: replace with the real profile icon asset when available.
  icons: {
    profileIcon: require("../assets/images/icon.png"), // swap for real profile icon asset
  },

};