import { FC } from "react"
import { MainFrame } from "@/components/MainFrame"
import { SearchBar } from "../components/SearchBar"
import { useSetNavigationUI, UI } from '../contexts/NavigationUIContext';

export const Contacts: FC = () => {
    useSetNavigationUI(UI.back('Contacts'));
    return (
        <MainFrame>
            <SearchBar placeHolder="Search..." buttonText="Search"/>
        </MainFrame>
    );
}