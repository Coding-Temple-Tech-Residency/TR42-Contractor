import { Assets } from "../constants/Assets";

export const Menus = {
  // ── Main ──────────────────────────────────────────────────
  // Main is used in MainFrame and Blank.tsx as the item list for the header menu when Menu variant "Menu2" is rendered.
  // label is used in MenuItem as the visible text for each menu option.
  // component is used in MenuItem as the target screen name passed to navigation.navigate().
  
  Main: [
    { label: "Home", component: "Home" },
    { label: "Login", component: "Login" },
    { label: "Profile", component: "Profile" },
    { label: "In Progress", component: "Blank" },
    { label: "Field Force AI", component: "InspectionAssist" },
  ],

  // ── Footer ────────────────────────────────────────────────
  // Footer is used in MainFrame as the default footer menu when Menu variant "Menu3" is rendered.
  // label is used in MenuItem as the visible text for each footer navigation option.
  // icon is used in MenuItem as the image shown above each footer label.
  // component is used in MenuItem as the target screen name passed to navigation.navigate().

  Footer:[

    {label:"Home",icon:Assets.icons.HomeIcon,component:"Home"},
    {label:"Tickets",icon:Assets.icons.TaskIcon,component:"Tickets"},
    {label:"Contacts",icon:Assets.icons.ContactIcon,component:"Contacts"}
 ],
};
   
