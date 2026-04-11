import { FC, useState } from "react"
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { RootStackParamList } from "../App"
import { MainFrame } from "@/components/MainFrame"
import { useSetNavigationUI, UI } from '../contexts/NavigationUIContext';
import { colors, spacing, radius, fontSize, fonts } from '../constants/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const mockContacts = [
  { id: '1', name: 'Contractor: John Doe',  phone: '555-555-5555', type: 'contractor' },
  { id: '2', name: 'Vendor: Ex-Way',        phone: '555-555-5555', type: 'vendor'     },
];

export const Contacts: FC = () => {
    useSetNavigationUI(UI.back('Contacts'));
    const navigation = useNavigation<Nav>();
    const [search, setSearch] = useState('');

    const filtered = mockContacts.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <MainFrame>
            <View style={styles.container}>

                {/* Search bar */}
                <View style={styles.searchRow}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search"
                        placeholderTextColor={colors.textMuted}
                        value={search}
                        onChangeText={setSearch}
                    />
                    <TouchableOpacity style={styles.searchBtn} activeOpacity={0.85}>
                        <Text style={styles.searchBtnText}>Search</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.voiceBtn} activeOpacity={0.85}>
                        <Ionicons name="mic" size={20} color={colors.textWhite} />
                    </TouchableOpacity>
                </View>

                {/* Contact list */}
                {filtered.map((contact) => (
                    <TouchableOpacity key={contact.id} style={styles.card} activeOpacity={0.8} onPress={() => navigation.navigate('ContactDetail', { id: contact.id, name: contact.name, phone: contact.phone, type: contact.type })}>
                        <View style={styles.avatar}>
                            <Ionicons name="person" size={26} color={colors.textWhite} />
                        </View>
                        <View style={styles.info}>
                            <Text style={styles.name}>{contact.name}</Text>
                            <View style={styles.phoneRow}>
                                <Ionicons name="call-outline" size={13} color={colors.textMuted} />
                                <Text style={styles.phone}>{contact.phone}</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                    </TouchableOpacity>
                ))}

            </View>
        </MainFrame>
    );
}

const styles = StyleSheet.create({
    container:    { width: '90%', gap: spacing.sm, paddingVertical: spacing.md },
    searchRow:    { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
    searchInput:  { flex: 1, backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: 10, fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.textWhite },
    searchBtn:    { backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 10 },
    searchBtnText:{ fontFamily: fonts.bold, fontSize: fontSize.sm, color: colors.textWhite },
    voiceBtn:     { backgroundColor: '#22c55e', borderRadius: radius.md, padding: 10 },
    card:         { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3b82f620', borderRadius: radius.md, borderWidth: 1, borderColor: '#3b82f6', padding: spacing.md, gap: spacing.md },
    avatar:       { width: 44, height: 44, borderRadius: 22, backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center' },
    info:         { flex: 1, gap: 2 },
    name:         { fontFamily: fonts.bold, fontSize: fontSize.sm, color: colors.textWhite },
    phoneRow:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
    phone:        { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.textMuted },
});
