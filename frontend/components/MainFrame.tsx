import { FC, ReactNode } from 'react';
import { ScrollView } from 'react-native';
import { Styles } from '../constants/Styles';

type Props = {
  children?: ReactNode;
  // header/headerMenu/footerMenu kept for backwards compat but ignored —
  // use useSetNavigationUI() in the screen instead
  header?:     any;
  headerMenu?: any;
  footerMenu?: any;
};

export const MainFrame: FC<Props> = ({ children }) => (
  <ScrollView style={{ flex: 1 }} contentContainerStyle={Styles.MainFrame.Body}>
    {children}
  </ScrollView>
);
