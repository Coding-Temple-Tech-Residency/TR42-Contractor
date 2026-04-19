// SavedReportsScreen.tsx
// Shows all AI-generated inspection reports saved by the contractor.
// Calls GET /api/ai/reports — endpoint is live on the backend.

import { FC, useCallback, useState } from 'react'
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import { MainFrame } from '@/components/MainFrame'
import { api } from '@/utils/api'

// ─── Types ────────────────────────────────────────────────────────────────────

type SavedReport = {
    id: number
    title: string
    priority: string
    category: string
    description: string
    recommended_actions: string[]
    raw_notes: string | null
    created_at: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function priorityBadge(priority: string) {
    if (priority === 'high')   return { label: '🔴 HIGH',   color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)' }
    if (priority === 'medium') return { label: '🟡 MEDIUM', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)' }
    return                            { label: '🟢 LOW',    color: '#34d399', bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.3)' }
}

function formatDate(iso: string) {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ─── Report card ──────────────────────────────────────────────────────────────

const ReportCard: FC<{ report: SavedReport }> = ({ report }) => {
    const [expanded, setExpanded] = useState(false)
    const badge = priorityBadge(report.priority)

    return (
        <TouchableOpacity
            style={s.card}
            onPress={() => setExpanded(e => !e)}
            activeOpacity={0.8}
        >
            {/* ── Header row ── */}
            <View style={s.cardHeader}>
                <View style={{ flex: 1, gap: 6 }}>
                    <Text style={s.cardTitle} numberOfLines={expanded ? undefined : 1}>
                        {report.title}
                    </Text>
                    <View style={s.cardMeta}>
                        <View style={[s.badge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                            <Text style={[s.badgeText, { color: badge.color }]}>{badge.label}</Text>
                        </View>
                        <View style={s.categoryPill}>
                            <Text style={s.categoryText}>{report.category}</Text>
                        </View>
                    </View>
                </View>
                <Ionicons
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color="rgba(255,255,255,0.3)"
                    style={{ marginLeft: 8, marginTop: 2 }}
                />
            </View>

            {/* ── Expanded content ── */}
            {expanded && (
                <View style={s.cardBody}>
                    <View style={s.divider} />

                    <Text style={s.sectionLabel}>Description</Text>
                    <Text style={s.bodyText}>{report.description}</Text>

                    <Text style={[s.sectionLabel, { marginTop: 12 }]}>Recommended Actions</Text>
                    {report.recommended_actions.map((action, i) => (
                        <View key={i} style={s.actionRow}>
                            <Text style={s.actionNum}>{i + 1}.</Text>
                            <Text style={s.actionText}>{action}</Text>
                        </View>
                    ))}

                    {report.raw_notes && (
                        <>
                            <Text style={[s.sectionLabel, { marginTop: 12 }]}>Original Notes</Text>
                            <Text style={s.notesText}>{report.raw_notes}</Text>
                        </>
                    )}
                </View>
            )}

            {/* ── Footer ── */}
            <Text style={s.dateText}>{formatDate(report.created_at)}</Text>
        </TouchableOpacity>
    )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

const EmptyState: FC = () => (
    <View style={s.empty}>
        <View style={s.emptyIcon}>
            <Ionicons name="document-text-outline" size={28} color="rgba(255,255,255,0.2)" />
        </View>
        <Text style={s.emptyTitle}>No saved reports yet</Text>
        <Text style={s.emptyBody}>
            Generate a report with Field Force AI and tap Save Report to see it here.
        </Text>
    </View>
)

// ─── Main screen ──────────────────────────────────────────────────────────────

export const SavedReportsScreen: FC = () => {
    const [reports, setReports]     = useState<SavedReport[]>([])
    const [loading, setLoading]     = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError]         = useState<string | null>(null)

    const fetchReports = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true)
        else setLoading(true)
        setError(null)

        try {
            const data = await api.authGet<SavedReport[]>('/api/ai/reports')
            setReports(data)
        } catch (e: any) {
            setError('Could not load reports. Pull down to retry.')
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    // Reload every time the screen comes into focus
    useFocusEffect(useCallback(() => { fetchReports() }, []))

    return (
        <MainFrame headerMenu={['Menu2', ['Saved Reports']]}>
            {loading ? (
                <View style={s.center}>
                    <ActivityIndicator size="large" color="#a78bfa" />
                </View>
            ) : error ? (
                <ScrollView
                    contentContainerStyle={s.center}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => fetchReports(true)} tintColor="#a78bfa" />
                    }
                >
                    <Ionicons name="cloud-offline-outline" size={36} color="rgba(255,255,255,0.2)" />
                    <Text style={s.errorText}>{error}</Text>
                </ScrollView>
            ) : (
                <FlatList
                    data={reports}
                    keyExtractor={item => String(item.id)}
                    renderItem={({ item }) => <ReportCard report={item} />}
                    contentContainerStyle={s.list}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={<EmptyState />}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => fetchReports(true)} tintColor="#a78bfa" />
                    }
                />
            )}
        </MainFrame>
    )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({

    list: { padding: 16, gap: 12, paddingBottom: 32 },

    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: 32,
    },

    // Report card
    card: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth:     1,
        borderColor:     'rgba(255,255,255,0.08)',
        borderRadius:    16,
        padding:         16,
        gap:             8,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems:    'flex-start',
    },
    cardTitle: {
        fontFamily: 'poppins-bold',
        fontSize:   14,
        color:      '#ffffff',
        lineHeight: 20,
    },
    cardMeta: {
        flexDirection: 'row',
        alignItems:    'center',
        gap:           8,
        flexWrap:      'wrap',
    },
    badge: {
        paddingVertical:   3,
        paddingHorizontal: 8,
        borderRadius:      8,
        borderWidth:       1,
    },
    badgeText: {
        fontFamily: 'poppins-bold',
        fontSize:   11,
    },
    categoryPill: {
        paddingVertical:   3,
        paddingHorizontal: 8,
        borderRadius:      8,
        backgroundColor:   'rgba(167,139,250,0.1)',
        borderWidth:       1,
        borderColor:       'rgba(167,139,250,0.25)',
    },
    categoryText: {
        fontFamily: 'poppins-regular',
        fontSize:   11,
        color:      '#a78bfa',
    },

    // Expanded body
    cardBody: { gap: 4 },
    divider: {
        height:          1,
        backgroundColor: 'rgba(255,255,255,0.06)',
        marginVertical:  8,
    },
    sectionLabel: {
        fontFamily: 'poppins-bold',
        fontSize:   11,
        color:      'rgba(255,255,255,0.4)',
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    bodyText: {
        fontFamily: 'poppins-regular',
        fontSize:   13,
        color:      'rgba(255,255,255,0.75)',
        lineHeight: 20,
    },
    actionRow: {
        flexDirection: 'row',
        gap:           6,
        marginBottom:  4,
    },
    actionNum: {
        fontFamily: 'poppins-bold',
        fontSize:   13,
        color:      '#a78bfa',
        width:      16,
    },
    actionText: {
        fontFamily: 'poppins-regular',
        fontSize:   13,
        color:      'rgba(255,255,255,0.75)',
        flex:       1,
        lineHeight: 20,
    },
    notesText: {
        fontFamily:      'poppins-regular',
        fontSize:        12,
        color:           'rgba(255,255,255,0.4)',
        fontStyle:       'italic',
        lineHeight:      18,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius:    8,
        padding:         10,
        borderWidth:     1,
        borderColor:     'rgba(255,255,255,0.06)',
    },

    // Date
    dateText: {
        fontFamily: 'poppins-regular',
        fontSize:   10,
        color:      'rgba(255,255,255,0.25)',
        marginTop:  4,
    },

    // Empty state
    empty: {
        flex:           1,
        alignItems:     'center',
        justifyContent: 'center',
        padding:        32,
        gap:            12,
        marginTop:      60,
    },
    emptyIcon: {
        width:           64,
        height:          64,
        borderRadius:    32,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth:     1,
        borderColor:     'rgba(255,255,255,0.08)',
        alignItems:      'center',
        justifyContent:  'center',
    },
    emptyTitle: {
        fontFamily: 'poppins-bold',
        fontSize:   15,
        color:      'rgba(255,255,255,0.4)',
    },
    emptyBody: {
        fontFamily: 'poppins-regular',
        fontSize:   13,
        color:      'rgba(255,255,255,0.25)',
        textAlign:  'center',
        lineHeight: 20,
    },

    // Error
    errorText: {
        fontFamily: 'poppins-regular',
        fontSize:   13,
        color:      'rgba(255,255,255,0.4)',
        textAlign:  'center',
    },
})
