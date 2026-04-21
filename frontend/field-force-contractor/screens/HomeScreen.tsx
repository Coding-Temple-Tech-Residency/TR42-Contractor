import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { MainFrame } from '../components/MainFrame';
import { useAuth } from '../contexts/AuthContext';

// ─── DEV MODE — set to false before shipping ──────────────────────────────────
const DEV_MODE = true;

type Nav = NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;
type Status = 'driving' | 'work' | 'offline';

const statusOptions: { value: Status; label: string; color: string; bg: string; border: string }[] = [
    { value: 'driving', label: 'Driving', color: '#60a5fa', bg: 'rgba(59,130,246,0.2)',  border: '#60a5fa' },
    { value: 'work',    label: 'Work',    color: '#4ade80', bg: 'rgba(34,197,94,0.2)',   border: '#4ade80' },
    { value: 'offline', label: 'Offline', color: '#9ca3af', bg: 'rgba(107,114,128,0.2)', border: '#9ca3af' },
];

const stats = [
    { icon: 'checkmark-circle' as const, label: 'Completed', value: '24', color: '#60a5fa' },
    { icon: 'time'             as const, label: 'Pending',   value: '8',  color: '#f59e0b' },
    { icon: 'trending-up'      as const, label: 'Progress',  value: '75%', color: '#a78bfa' },
];

const recentActivities = [
    { task: 'Update project documentation',   time: '2 hours ago', status: 'completed' },
    { task: 'Review team feedback',           time: '4 hours ago', status: 'completed' },
    { task: 'Schedule meeting with clients',  time: '1 day ago',   status: 'pending'   },
];

export default function HomeScreen() {
    const [currentStatus, setCurrentStatus] = useState<Status>('work');
    const [isStatusOpen, setIsStatusOpen] = useState(false);
    const nav = useNavigation<Nav>();
    const { logout } = useAuth();
    const route = useRoute();

    // If we land on the legacy "Home" route (e.g. SplashScreen timer),
    // silently redirect to "Dashboard" so the back stack stays clean.
    useEffect(() => {
        if (route.name === 'Home') {
            nav.replace('Dashboard');
        }
    }, []);

    const currentStatusData = statusOptions.find(s => s.value === currentStatus)!;

    const handleStatusSelect = (status: Status) => {
        setCurrentStatus(status);
        setIsStatusOpen(false);
    };

    return (
        <MainFrame header='home' headerMenu={["none", []]}>

            {/* ── Title bar ──────────────────────────────────────────
                Styled to match the Menu2 navy bar visually but with no
                back arrow — Dashboard is the root of the authenticated
                stack, so there's nothing meaningful to go back to. */}
            <View style={styles.titleBar}>
                <Text style={styles.titleBarText}>Dashboard</Text>
            </View>

            {/* ── Header ── */}
            <View style={styles.header}>
                {/* [Component12 / Logo goes here] */}
                <Text style={styles.welcome}>Welcome back!</Text>
            </View>

            {/* ── Status Selector ── */}
            <View style={styles.section}>
                <TouchableOpacity
                    style={styles.statusButton}
                    onPress={() => setIsStatusOpen(!isStatusOpen)}
                >
                    <View style={styles.statusLeft}>
                        <View style={[styles.statusDot, { backgroundColor: currentStatusData.bg, borderColor: currentStatusData.border }]} />
                        <Text style={styles.statusLabel}>Status: {currentStatusData.label}</Text>
                    </View>
                    <Ionicons
                        name="chevron-down"
                        size={20}
                        color="#9ca3af"
                        style={{ transform: [{ rotate: isStatusOpen ? '180deg' : '0deg' }] }}
                    />
                </TouchableOpacity>

                {isStatusOpen && (
                    <View style={styles.statusDropdown}>
                        {statusOptions.map(option => (
                            <TouchableOpacity
                                key={option.value}
                                style={[
                                    styles.statusOption,
                                    currentStatus === option.value && {
                                        backgroundColor: option.bg,
                                        borderWidth: 1,
                                        borderColor: option.border,
                                    },
                                ]}
                                onPress={() => handleStatusSelect(option.value)}
                            >
                                <View style={[styles.statusDot, { backgroundColor: option.bg, borderColor: option.border }]} />
                                <Text style={[styles.statusOptionText, { color: option.color }]}>{option.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>

            {/* ── Stats Grid ── */}
            <View style={styles.statsRow}>
                {stats.map(stat => (
                    <View key={stat.label} style={styles.statCard}>
                        <Ionicons name={stat.icon} size={24} color={stat.color} />
                        <Text style={styles.statValue}>{stat.value}</Text>
                        <Text style={styles.statLabel}>{stat.label}</Text>
                    </View>
                ))}
            </View>

            {/* ── Recent Activity ── */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Recent Activity</Text>
                {recentActivities.map((activity, index) => (
                    <View
                        key={index}
                        style={[
                            styles.activityRow,
                            index < recentActivities.length - 1 && styles.activityBorder,
                        ]}
                    >
                        <View style={[
                            styles.activityDot,
                            { backgroundColor: activity.status === 'completed' ? '#16a34a' : '#ea580c' }
                        ]} />
                        <View style={styles.activityText}>
                            <Text style={styles.activityTask}>{activity.task}</Text>
                            <Text style={styles.activityTime}>{activity.time}</Text>
                        </View>
                    </View>
                ))}
            </View>

            {/* ── Drive Time Warning ── */}
            <View style={styles.warning}>
                <Text style={styles.warningText}>Over 11 hours drive time, time for a break</Text>
            </View>

            {/* ── DEV: Quick navigation ── */}
            {DEV_MODE && (
                <View style={styles.devPanel}>
                    <Text style={styles.devLabel}>⚙ DEV TOOLS</Text>
                    <View style={styles.devGrid}>
                        <TouchableOpacity style={styles.devButton} onPress={() => logout()}>
                            <Ionicons name="log-in-outline" size={18} color="#f59e0b" />
                            <Text style={styles.devButtonText}>Login</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.devButton} onPress={() => nav.navigate('Inspection', { bypassGate: true })}>
                            <Ionicons name="construct-outline" size={18} color="#f59e0b" />
                            <Text style={styles.devButtonText}>Inspection</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.devButton} onPress={() => nav.navigate('DriveTimeTracker')}>
                            <Ionicons name="speedometer-outline" size={18} color="#f59e0b" />
                            <Text style={styles.devButtonText}>Drive Time</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.devButton} onPress={() => nav.navigate('InspectionAssist')}>
                            <Ionicons name="sparkles-outline" size={18} color="#f59e0b" />
                            <Text style={styles.devButtonText}>AI Assist</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.devButton} onPress={() => nav.navigate('SavedReports')}>
                            <Ionicons name="document-text-outline" size={18} color="#f59e0b" />
                            <Text style={styles.devButtonText}>Saved Reports</Text>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={styles.devLogoutButton} onPress={logout}>
                        <Ionicons name="log-out-outline" size={16} color="#ef4444" />
                        <Text style={styles.devLogoutText}>Logout</Text>
                    </TouchableOpacity>
                </View>
            )}

        </MainFrame>
    );
}

const CARD_BG = 'rgba(255,255,255,0.1)';
const BORDER  = 'rgba(255,255,255,0.15)';

const styles = StyleSheet.create({

    // ── Title bar (no back arrow) ─────────────────────────────
    // Matches the Menu2 SubHeader bar visually (navy background,
    // centered bold title) so Dashboard still has a clear section
    // header without a misleading "back" affordance.
    titleBar: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#142040',
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 12,
    },
    titleBarText: {
        fontSize: 18,
        fontFamily: 'poppins-bold',
        color: 'white',
        letterSpacing: 0.3,
    },

    header: {
        width: '90%',
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 8,
    },
    welcome: {
        fontSize: 13,
        color: '#9ca3af',
        marginTop: 4,
    },

    section: {
        width: '90%',
        marginBottom: 16,
    },

    // Status selector
    statusButton: {
        backgroundColor: CARD_BG,
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 12,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    statusLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    statusDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 2,
    },
    statusLabel: {
        color: 'white',
        fontSize: 13,
        fontFamily: 'poppins-bold',
    },
    statusDropdown: {
        backgroundColor: 'rgba(30,30,30,0.95)',
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 12,
        padding: 6,
        marginTop: 6,
    },
    statusOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 8,
    },
    statusOptionText: {
        fontSize: 13,
        fontFamily: 'poppins-bold',
    },

    // Stats
    statsRow: {
        flexDirection: 'row',
        width: '90%',
        gap: 10,
        marginBottom: 16,
    },
    statCard: {
        flex: 1,
        backgroundColor: CARD_BG,
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 12,
        padding: 14,
        alignItems: 'center',
        gap: 6,
    },
    statValue: {
        fontSize: 20,
        fontFamily: 'poppins-bold',
        color: 'white',
    },
    statLabel: {
        fontSize: 11,
        color: '#9ca3af',
        textAlign: 'center',
    },

    // Recent Activity
    card: {
        width: '90%',
        backgroundColor: CARD_BG,
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 15,
        fontFamily: 'poppins-bold',
        color: 'white',
        marginBottom: 12,
    },
    activityRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingBottom: 12,
        gap: 10,
    },
    activityBorder: {
        borderBottomWidth: 1,
        borderBottomColor: BORDER,
        marginBottom: 12,
    },
    activityDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginTop: 5,
    },
    activityText: {
        flex: 1,
    },
    activityTask: {
        fontSize: 13,
        color: 'white',
        fontFamily: 'poppins-bold',
    },
    activityTime: {
        fontSize: 11,
        color: '#9ca3af',
        marginTop: 2,
    },

    // Warning
    warning: {
        width: '90%',
        backgroundColor: '#dc2626',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginBottom: 24,
    },
    warningText: {
        color: 'white',
        fontSize: 13,
        fontFamily: 'poppins-bold',
        textAlign: 'center',
    },

    // Dev panel
    devPanel: {
        width: '90%',
        backgroundColor: 'rgba(245,158,11,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(245,158,11,0.4)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        gap: 12,
    },
    devLabel: {
        fontSize: 11,
        fontFamily: 'poppins-bold',
        color: '#f59e0b',
        letterSpacing: 2,
        textAlign: 'center',
    },
    devGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    devButton: {
        flex: 1,
        minWidth: '45%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(245,158,11,0.15)',
        borderWidth: 1,
        borderColor: 'rgba(245,158,11,0.3)',
        borderRadius: 8,
        paddingVertical: 6,
        gap: 6,
    },
    devButtonText: {
        color: '#f59e0b',
        fontSize: 12,
        fontFamily: 'poppins-bold',
    },
    devLogoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(239,68,68,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(239,68,68,0.3)',
        borderRadius: 8,
        paddingVertical: 6,
        gap: 6,
    },
    devLogoutText: {
        color: '#ef4444',
        fontSize: 12,
        fontFamily: 'poppins-bold',
    },
});
