import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MainFrame } from '../components/MainFrame';

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

    const currentStatusData = statusOptions.find(s => s.value === currentStatus)!;

    const handleStatusSelect = (status: Status) => {
        setCurrentStatus(status);
        setIsStatusOpen(false);
    };

    return (
        <MainFrame header='home'>

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

        </MainFrame>
    );
}

const CARD_BG = 'rgba(255,255,255,0.1)';
const BORDER  = 'rgba(255,255,255,0.15)';

const styles = StyleSheet.create({

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

<<<<<<< HEAD
});
=======
});
>>>>>>> becb9b8b116401500b04e827827b0635410e7d32
