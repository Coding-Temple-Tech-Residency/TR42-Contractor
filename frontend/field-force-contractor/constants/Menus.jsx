
import { Assets } from "../constants/Assets"
export const Menus = {

 Main:[

    {label:"Home", component: "Home"},
    {label:"Login", component: "Login"},
    {label:"Profile", component: "Profile"},
    {label:"In Progress", component: "Blank"},

 ],
 Footer:[

    {label:"Home",icon:Assets.icons.HomeIcon,component:"Home"},
    {label:"Tickets",icon:Assets.icons.TaskIcon,component:"Tickets"},
    {label:"Contacts",icon:Assets.icons.ContactIcon,component:"Contacts"}
 ]


}