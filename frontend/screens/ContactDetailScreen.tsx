import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { MainFrame } from '../components/MainFrame';
import { useSetNavigationUI, UI } from '../contexts/NavigationUIContext';
import { colors, spacing, radius, fontSize, fonts } from '../constants/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ContactDetailScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation<Nav>();
    const { name, phone, type } = route.params ?? {};

    useSetNavigationUI(UI.back(name ?? 'Contact'));

    const handleCall = () => {
        Linking.openURL(`tel:${phone}`);
    };

    const handleMessage = () => {
        navigation.navigate('Message', { name, phone });
    };

    return (
        <MainFrame>
            <View style={styles.container}>

                {/* Avatar */}
                <View style={styles.avatarCircle}>
                    <Ionicons name="person" size={52} color="#8a9bb8" />
                </View>

                <Text style={styles.name}>{name}</Text>
                <Text style={styles.type}>{type?.toUpperCase()}</Text>

                {/* Info rows */}
                <View style={styles.section}>
                    <View style={styles.infoRow}>
                        <View style={styles.iconWrap}>
                            <Ionicons name="call-outline" size={18} color={colors.primary} />
                        </View>
                        <View style={styles.textWrap}>
                            <Text style={styles.infoLabel}>Phone</Text>
                            <Text style={styles.infoValue}>{phone}</Text>
                        </View>
                    </View>
                </View>

                {/* Action buttons */}
                <View style={styles.btnRow}>
                    <TouchableOpacity style={styles.actionBtn} onPress={handleCall} activeOpacity={0.85}>
                        <Ionicons name="call" size={20} color={colors.textWhite} />
                        <Text style={styles.actionBtnText}>Call</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, styles.actionBtnSecondary]} onPress={handleMessage} activeOpacity={0.85}>
                        <Ionicons name="chatbubble-outline" size={20} color={colors.primary} />
                        <Text style={[styles.actionBtnText, { color: colors.primary }]}>Message</Text>
                    </TouchableOpacity>
                </View>

            </View>
        </MainFrame>
    );
}

const styles = StyleSheet.create({
    container:          { width: '90%', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl },
    avatarCircle:       { width: 100, height: 100, borderRadius: 50, backgroundColor: '#1e2d45', borderWidth: 2, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
    name:               { fontFamily: fonts.bold, fontSize: fontSize.xl, color: colors.textWhite },
    type:               { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.textMuted, marginBottom: spacing.sm },
    section:            { width: '100%', gap: spacing.sm },
    infoRow:            { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingVertical: 14, paddingHorizontal: spacing.md, gap: spacing.md },
    iconWrap:           { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(245,158,11,0.1)', alignItems: 'center', justifyContent: 'center' },
    textWrap:           { flex: 1 },
    infoLabel:          { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.textMuted, marginBottom: 2 },
    infoValue:          { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.textWhite },
    btnRow:             { flexDirection: 'row', gap: spacing.sm, width: '100%', marginTop: spacing.sm },
    actionBtn:          { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 14 },
    actionBtnSecondary: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.primary },
    actionBtnText:      { fontFamily: fonts.bold, fontSize: fontSize.base, color: colors.textWhite },
});
