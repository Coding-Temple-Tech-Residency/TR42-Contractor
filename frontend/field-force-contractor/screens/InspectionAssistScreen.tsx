// InspectionAssistScreen.tsx
// Field Force AI — inspection assistant powered by Claude.
// Styled independently from the shared Chat/Message components
// so Jonathan's chat screen is never affected.

import { FC, useEffect, useRef, useState } from 'react'
import {
    Animated,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { MainFrame } from '@/components/MainFrame'
import { SearchBar } from '@/components/SearchBar'
import { InitMessage } from '@/utils/InitMessage'
import { TimeFormater } from '@/utils/timeFormater'
import { api } from '@/utils/api'

// ─── Types ────────────────────────────────────────────────────────────────────

type MessageType = 'sent' | 'received'

type ChatMessage = {
    id: number
    message: string
    messageType: MessageType
    timeStamp: string
    reportData?: InspectionReport   // only on AI-received messages
    saved?: boolean                 // true once the user saves the report
}

type InspectionReport = {
    title: string
    priority: string
    category: string
    description: string
    recommended_actions: string[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SUGGESTIONS = [
    { label: 'Report an electrical issue', icon: 'flash-outline' },
    { label: 'Log a safety hazard',        icon: 'warning-outline' },
    { label: 'Document an HVAC problem',   icon: 'thermometer-outline' },
]

const WELCOME_TEXT =
    "Hi! I'm Field Force AI.\n\nI can help you generate structured inspection reports from your field notes. Tap a suggestion below or describe what you observed."

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatReport(report: InspectionReport): string {
    const badge =
        report.priority === 'high'   ? '🔴 HIGH'   :
        report.priority === 'medium' ? '🟡 MEDIUM' : '🟢 LOW'

    const actions = report.recommended_actions
        .map((a, i) => `${i + 1}. ${a}`)
        .join('\n')

    return [
        report.title,
        '',
        `Priority: ${badge}   Category: ${report.category}`,
        '',
        report.description,
        '',
        'Recommended Actions:',
        actions,
    ].join('\n')
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

const TypingIndicator: FC = () => {
    const dots = [
        useRef(new Animated.Value(0.3)).current,
        useRef(new Animated.Value(0.3)).current,
        useRef(new Animated.Value(0.3)).current,
    ]

    useEffect(() => {
        const animate = (dot: Animated.Value, delay: number) =>
            Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(dot, { toValue: 1,   duration: 300, useNativeDriver: true }),
                    Animated.timing(dot, { toValue: 0.3, duration: 300, useNativeDriver: true }),
                    Animated.delay(600),
                ])
            ).start()

        dots.forEach((d, i) => animate(d, i * 150))
        return () => dots.forEach(d => d.stopAnimation())
    }, [])

    return (
        <View style={s.rowReceived}>
            <View style={s.aiAvatar}>
                <Ionicons name="sparkles" size={14} color="#a78bfa" />
            </View>
            <View style={s.typingBubble}>
                {dots.map((d, i) => (
                    <Animated.View key={i} style={[s.typingDot, { opacity: d }]} />
                ))}
            </View>
        </View>
    )
}

// ─── AI message bubble ────────────────────────────────────────────────────────

type AIBubbleProps = {
    text: string
    time: string
    reportData?: InspectionReport
    saved?: boolean
    onSave?: () => void
}

const AIBubble: FC<AIBubbleProps> = ({ text, time, reportData, saved, onSave }) => (
    <View style={s.rowReceived}>
        <View style={s.aiAvatar}>
            <Ionicons name="sparkles" size={14} color="#a78bfa" />
        </View>
        <View style={{ flex: 1 }}>
            <View style={s.aiBubble}>
                <Text style={s.aiText}>{text}</Text>
            </View>
            {/* Save button — only shown on actual report responses */}
            {reportData && (
                <TouchableOpacity
                    style={[s.saveBtn, saved && s.saveBtnDone]}
                    onPress={onSave}
                    disabled={saved}
                    activeOpacity={0.7}
                >
                    <Ionicons
                        name={saved ? 'checkmark-circle' : 'save-outline'}
                        size={13}
                        color={saved ? '#34d399' : '#a78bfa'}
                    />
                    <Text style={[s.saveBtnText, saved && s.saveBtnTextDone]}>
                        {saved ? 'Saved' : 'Save Report'}
                    </Text>
                </TouchableOpacity>
            )}
            <Text style={s.timeLabel}>{time}</Text>
        </View>
    </View>
)

// ─── User message bubble ──────────────────────────────────────────────────────

const UserBubble: FC<{ text: string; time: string }> = ({ text, time }) => (
    <View style={s.rowSent}>
        <View style={{ alignItems: 'flex-end' }}>
            <View style={s.userBubble}>
                <Text style={s.userText}>{text}</Text>
            </View>
            <Text style={s.timeLabel}>{time}</Text>
        </View>
    </View>
)

// ─── Main screen ──────────────────────────────────────────────────────────────

export const InspectionAssistScreen: FC = () => {
    const [messages, setMessages]              = useState<ChatMessage[]>([])
    const [loading, setLoading]                = useState(false)
    const [suggestionsVisible, setSuggestions] = useState(true)
    const scrollRef                            = useRef<ScrollView>(null)

    const scroll = () => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80)

    const addMessage = (text: string, type: MessageType, reportData?: InspectionReport) => {
        setMessages(prev => [...prev, {
            id:          InitMessage.getMessageId(),
            message:     text,
            messageType: type,
            timeStamp:   TimeFormater.getTimeStamp(),
            reportData,
        }])
    }

    const handleSend = async (notes: string) => {
        if (!notes.trim() || loading) return
        setSuggestions(false)
        addMessage(notes, 'sent')
        setLoading(true)
        scroll()

        try {
            const report = await api.authPost<InspectionReport>(
                '/api/ai/inspection-assist',
                { notes },
            )
            addMessage(formatReport(report), 'received', report)
        } catch (e: any) {
            addMessage(
                `Sorry, I couldn't generate a report. ${e.error ?? 'Please try again.'}`,
                'received',
            )
        } finally {
            setLoading(false)
            scroll()
        }
    }

    const handleSaveReport = async (msgId: number, report: InspectionReport, rawNotes: string) => {
        try {
            await api.authPost('/api/ai/save-report', {
                title:               report.title,
                priority:            report.priority,
                category:            report.category,
                description:         report.description,
                recommended_actions: report.recommended_actions,
                raw_notes:           rawNotes,
            })
            setMessages(prev =>
                prev.map(m => m.id === msgId ? { ...m, saved: true } : m)
            )
        } catch (e: any) {
            console.warn('Save report failed:', e)
        }
    }

    const Footer: FC = () => (
        <SearchBar
            placeHolder="Describe what you observed..."
            buttonText="Send"
            onClick={(msg: string) => { if (msg) handleSend(msg) }}
        />
    )

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <MainFrame headerMenu={['Menu2', ['Field Force AI']]} injectFooter={<Footer />}>
                <ScrollView
                    ref={scrollRef}
                    style={s.scroll}
                    contentContainerStyle={s.scrollContent}
                    onContentSizeChange={scroll}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >

                    {/* ── Welcome card ── */}
                    <View style={s.welcomeCard}>
                        <View style={s.welcomeIconWrap}>
                            <Ionicons name="sparkles" size={22} color="#a78bfa" />
                        </View>
                        <Text style={s.welcomeTitle}>Field Force AI</Text>
                        <Text style={s.welcomeBody}>{WELCOME_TEXT}</Text>
                    </View>

                    {/* ── Suggestion chips ── */}
                    {suggestionsVisible && (
                        <View style={s.chips}>
                            {SUGGESTIONS.map(({ label, icon }) => (
                                <TouchableOpacity
                                    key={label}
                                    style={s.chip}
                                    onPress={() => handleSend(label)}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name={icon as any} size={14} color="#a78bfa" />
                                    <Text style={s.chipText}>{label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {/* ── Divider once conversation starts ── */}
                    {messages.length > 0 && <View style={s.divider} />}

                    {/* ── Message thread ── */}
                    {messages.map((item, idx) => {
                        if (item.messageType === 'received') {
                            const prevSent = messages.slice(0, idx).reverse().find(m => m.messageType === 'sent')
                            return (
                                <AIBubble
                                    key={item.id}
                                    text={item.message}
                                    time={item.timeStamp}
                                    reportData={item.reportData}
                                    saved={item.saved}
                                    onSave={() => item.reportData && handleSaveReport(
                                        item.id,
                                        item.reportData,
                                        prevSent?.message ?? '',
                                    )}
                                />
                            )
                        }
                        return <UserBubble key={item.id} text={item.message} time={item.timeStamp} />
                    })}

                    {/* ── Typing indicator ── */}
                    {loading && <TypingIndicator />}

                </ScrollView>
            </MainFrame>
        </KeyboardAvoidingView>
    )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({

    scroll:        { flex: 1, width: '100%' },
    scrollContent: { padding: 16, paddingBottom: 24, gap: 12 },

    // Welcome card
    welcomeCard: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth:     1,
        borderColor:     'rgba(255,255,255,0.08)',
        borderRadius:    16,
        padding:         20,
        alignItems:      'center',
        gap:             10,
        marginBottom:    4,
    },
    welcomeIconWrap: {
        width:           44,
        height:          44,
        borderRadius:    22,
        backgroundColor: 'rgba(167,139,250,0.12)',
        borderWidth:     1,
        borderColor:     'rgba(167,139,250,0.25)',
        alignItems:      'center',
        justifyContent:  'center',
    },
    welcomeTitle: {
        fontFamily:    'poppins-bold',
        fontSize:      16,
        color:         '#ffffff',
        letterSpacing: 0.3,
    },
    welcomeBody: {
        fontFamily: 'poppins-regular',
        fontSize:   13,
        color:      'rgba(255,255,255,0.55)',
        textAlign:  'center',
        lineHeight: 20,
    },

    // Suggestion chips
    chips: { gap: 8 },
    chip: {
        flexDirection:     'row',
        alignItems:        'center',
        gap:               8,
        alignSelf:         'flex-start',
        backgroundColor:   'rgba(167,139,250,0.08)',
        borderWidth:       1,
        borderColor:       'rgba(167,139,250,0.2)',
        borderRadius:      20,
        paddingVertical:   9,
        paddingHorizontal: 14,
    },
    chipText: {
        fontFamily: 'poppins-regular',
        fontSize:   13,
        color:      '#a78bfa',
    },

    // Divider
    divider: {
        height:          1,
        backgroundColor: 'rgba(255,255,255,0.06)',
        marginVertical:  4,
    },

    // AI message row
    rowReceived: {
        flexDirection:  'row',
        alignItems:     'flex-start',
        gap:            10,
        marginVertical: 4,
    },
    aiAvatar: {
        width:           28,
        height:          28,
        borderRadius:    14,
        backgroundColor: 'rgba(167,139,250,0.12)',
        borderWidth:     1,
        borderColor:     'rgba(167,139,250,0.25)',
        alignItems:      'center',
        justifyContent:  'center',
        marginTop:       2,
    },
    aiBubble: {
        backgroundColor:     'rgba(255,255,255,0.05)',
        borderWidth:         1,
        borderColor:         'rgba(255,255,255,0.09)',
        borderRadius:        16,
        borderTopLeftRadius: 4,
        paddingVertical:     12,
        paddingHorizontal:   14,
    },
    aiText: {
        fontFamily: 'poppins-regular',
        fontSize:   14,
        color:      'rgba(255,255,255,0.88)',
        lineHeight: 22,
    },

    // User message row
    rowSent: {
        flexDirection:  'row',
        justifyContent: 'flex-end',
        marginVertical: 4,
    },
    userBubble: {
        backgroundColor:         '#ffffff',
        borderRadius:            16,
        borderBottomRightRadius: 4,
        paddingVertical:         12,
        paddingHorizontal:       14,
        maxWidth:                '80%',
    },
    userText: {
        fontFamily: 'poppins-regular',
        fontSize:   14,
        color:      '#0a0a0a',
        lineHeight: 22,
    },

    // Timestamp
    timeLabel: {
        fontFamily: 'poppins-regular',
        fontSize:   10,
        color:      'rgba(255,255,255,0.25)',
        marginTop:  4,
        marginLeft: 2,
    },

    // Save report button
    saveBtn: {
        flexDirection:     'row',
        alignItems:        'center',
        alignSelf:         'flex-start',
        gap:               5,
        marginTop:         8,
        paddingVertical:   6,
        paddingHorizontal: 12,
        borderRadius:      12,
        borderWidth:       1,
        borderColor:       'rgba(167,139,250,0.35)',
        backgroundColor:   'rgba(167,139,250,0.08)',
    },
    saveBtnDone: {
        borderColor:     'rgba(52,211,153,0.35)',
        backgroundColor: 'rgba(52,211,153,0.08)',
    },
    saveBtnText: {
        fontFamily: 'poppins-regular',
        fontSize:   12,
        color:      '#a78bfa',
    },
    saveBtnTextDone: {
        color: '#34d399',
    },

    // Typing indicator
    typingBubble: {
        flexDirection:       'row',
        alignItems:          'center',
        gap:                 5,
        backgroundColor:     'rgba(255,255,255,0.05)',
        borderWidth:         1,
        borderColor:         'rgba(255,255,255,0.09)',
        borderRadius:        16,
        borderTopLeftRadius: 4,
        paddingVertical:     14,
        paddingHorizontal:   18,
    },
    typingDot: {
        width:           6,
        height:          6,
        borderRadius:    3,
        backgroundColor: 'rgba(255,255,255,0.7)',
    },
})
