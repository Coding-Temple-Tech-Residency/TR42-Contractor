
import { Assets } from "../constants/Assets"
export const Menus = {

 Main:[

    {label:"Login", component: "Login"},
    {label:"Profile", component: "Profile"},
    {label:"In Progress", component: "Blank"},

 ],
 Footer:[

    {label:"Home",       icon:Assets.icons.HomeIcon,    component:"Home"},
    {label:"WorkOrders", icon:Assets.icons.TaskIcon,    component:"WorkOrders"},
    {label:"Contacts",   icon:Assets.icons.ContactIcon, component:"Contacts"}
 ]


}