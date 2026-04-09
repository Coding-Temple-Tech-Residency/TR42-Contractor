
import { Assets } from "../constants/Assets"
export const Menus = {

 Main:[

    {label:"Home", component: "Blank"},
    {label:"Assigned", component: "Blank"},
    {label:"Completed", component: "Blank"},
    {label:"In Progress", component: "Blank"},

 ],
 Footer:[

    {label:"Home",icon:Assets.icons.HomeIcon,component:"Home"},
    {label:"Task",icon:Assets.icons.TaskIcon,component:"Task-PlaceHolder"},
    {label:"Contacts",icon:Assets.icons.ContactIcon,component:"Contact-PlaceHolder"}
 ]


}