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
import { MainFrame } from '@/components/MainFrame'
import { Message, MessageType } from '@/components/Message'
import { SearchBar } from '@/components/SearchBar'
import { Styles } from '@/constants/Styles'
import { InitMessage } from '@/utils/InitMessage'
import { TimeFormater } from '@/utils/timeFormater'
import { api } from '@/utils/api'

type ChatMessage = {
    id: number
    message: string
    messageType: MessageType
    timeStamp: string
}

type InspectionReport = {
    title: string
    priority: string
    category: string
    description: string
    recommended_actions: string[]
}

const SUGGESTIONS = [
    'Report an electrical issue',
    'Log a safety hazard',
    'Document an HVAC problem',
]

const WELCOME: ChatMessage = {
    id: InitMessage.getMessageId(),
    message: "Hi! I'm Field Force AI.\n\nI can help you generate structured inspection reports from your field notes. Tap a suggestion below or describe what you observed.",
    messageType: 'received',
    timeStamp: TimeFormater.getTimeStamp(),
}

function formatReport(report: InspectionReport): string {
    const priority = report.priority.toUpperCase()
    const actions = report.recommended_actions
        .map((a, i) => `${i + 1}. ${a}`)
        .join('\n')
    return `${report.title}\n\nPriority: ${priority}\nCategory: ${report.category}\n\n${report.description}\n\nRecommended Actions:\n${actions}`
}

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
                    Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
                    Animated.timing(dot, { toValue: 0.3, duration: 300, useNativeDriver: true }),
                    Animated.delay(600),
                ])
            ).start()

        dots.forEach((d, i) => animate(d, i * 150))
        return () => dots.forEach(d => d.stopAnimation())
    }, [])

    return (
        <View style={Styles.Chat.messageBoxReceived}>
            <View style={typingStyles.bubble}>
                {dots.map((d, i) => (
                    <Animated.View key={i} style={[typingStyles.dot, { opacity: d }]} />
                ))}
            </View>
        </View>
    )
}

const typingStyles = StyleSheet.create({
    bubble: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#2C2C2E',
        borderRadius: 20,
        borderBottomLeftRadius: 5,
        paddingVertical: 14,
        paddingHorizontal: 18,
        marginLeft: 8,
        marginTop: 4,
    },
    dot: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
        backgroundColor: 'rgba(255,255,255,0.8)',
    },
})

export const InspectionAssistScreen: FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([WELCOME])
    const [loading, setLoading] = useState(false)
    const [suggestionsVisible, setSuggestionsVisible] = useState(true)
    const scrollRef = useRef<ScrollView>(null)

    const addMessage = (text: string, type: MessageType) => {
        setMessages(prev => [...prev, {
            id: InitMessage.getMessageId(),
            message: text,
            messageType: type,
            timeStamp: TimeFormater.getTimeStamp(),
        }])
    }

    const handleSend = async (notes: string) => {
        if (!notes.trim() || loading) return
        setSuggestionsVisible(false)
        addMessage(notes, 'sent')
        setLoading(true)
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80)

        try {
            const report = await api.authPost<InspectionReport>(
                '/api/ai/inspection-assist',
                { notes },
            )
            addMessage(formatReport(report), 'received')
        } catch (e: any) {
            addMessage(
                `Sorry, I couldn't generate a report. ${e.error ?? 'Please try again.'}`,
                'received',
            )
        } finally {
            setLoading(false)
            setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80)
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
                    style={Styles.Chat.container}
                    contentContainerStyle={{ paddingBottom: 12 }}
                    onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {messages.map(item => (
                        <Message
                            key={item.id}
                            messageId={item.id}
                            message={item.message}
                            messageType={item.messageType}
                            timeStamp={item.timeStamp}
                        />
                    ))}

                    {suggestionsVisible && (
                        <View style={suggestionStyles.row}>
                            {SUGGESTIONS.map(s => (
                                <TouchableOpacity
                                    key={s}
                                    style={suggestionStyles.chip}
                                    onPress={() => handleSend(s)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={suggestionStyles.chipText}>{s}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {loading && <TypingIndicator />}
                </ScrollView>
            </MainFrame>
        </KeyboardAvoidingView>
    )
}

const suggestionStyles = StyleSheet.create({
    row: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 8,
        marginTop: 10,
        marginLeft: 8,
    },
    chip: {
        backgroundColor: 'rgba(10, 132, 255, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(10, 132, 255, 0.4)',
        borderRadius: 16,
        paddingVertical: 8,
        paddingHorizontal: 14,
    },
    chipText: {
        color: '#0A84FF',
        fontFamily: 'poppins-regular',
        fontSize: 13,
    },
})
