
import { Assets } from "../constants/Assets"
export const Menus = {

 Main:[

    {label:"Home", component: "Home"},
    {label:"Login", component: "Login"},
    {label:"Profile", component: "Profile"},
    {label:"In Progress", component: "Blank"},

 ],
 Footer:[

    {label:"Home",      icon:Assets.icons.HomeIcon,    component:"Home"},
    {label:"Dashboard", icon:Assets.icons.TaskIcon,    component:"Dashboard"},
    {label:"WorkOrders",icon:Assets.icons.TaskIcon,    component:"WorkOrders"},
    {label:"Contacts",  icon:Assets.icons.ContactIcon, component:"Contacts"}
 ]


}