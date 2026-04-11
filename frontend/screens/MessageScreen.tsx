import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, FlatList, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { useSetNavigationUI, UI } from '../contexts/NavigationUIContext';
import { colors, spacing, radius, fontSize, fonts } from '../constants/theme';

type Message = {
  id:     string;
  text:   string;
  sender: 'me' | 'them';
  time:   string;
};

const getTime = () => {
  const d = new Date();
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')} ${d.getHours() >= 12 ? 'pm' : 'am'}`;
};

export default function MessageScreen() {
  const route = useRoute<any>();
  const { name } = route.params ?? { name: 'Contact' };

  useSetNavigationUI(UI.back(name));

  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: 'Hello!',                                                                                          sender: 'me',   time: '2:00 pm' },
    { id: '2', text: 'Hi, how can I help you?',                                                                         sender: 'them', time: '2:01 pm' },
    { id: '3', text: 'Im unable to login',                                                                              sender: 'me',   time: '2:02 pm' },
    { id: '4', text: 'Sorry to hear that your having trouble login I would be more than happen to guide you through the steps to reset your login.', sender: 'them', time: '2:03 pm' },
  ]);

  const [input, setInput] = useState('');
  const flatRef = useRef<FlatList>(null);

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages(prev => [
      ...prev,
      { id: Date.now().toString(), text: input.trim(), sender: 'me', time: getTime() },
    ]);
    setInput('');
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flex: 1 }}>
        {/* Date header */}
        <Text style={styles.dateHeader}>Today</Text>

        {/* Messages */}
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={(m) => m.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => (
            <View style={[styles.row, item.sender === 'me' ? styles.rowMe : styles.rowThem]}>
              {item.sender === 'them' && (
                <View style={styles.avatar}>
                  <Ionicons name="person" size={16} color={colors.textWhite} />
                </View>
              )}
              <View style={[styles.bubble, item.sender === 'me' ? styles.bubbleMe : styles.bubbleThem]}>
                <Text style={[styles.bubbleText, item.sender === 'me' ? styles.bubbleTextMe : styles.bubbleTextThem]}>
                  {item.text}
                </Text>
                <Text style={styles.timeText}>{item.time}</Text>
              </View>
            </View>
          )}
        />

        {/* Input bar */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Message"
            placeholderTextColor={colors.textMuted}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
          />
          <TouchableOpacity style={styles.sendBtn} onPress={sendMessage} activeOpacity={0.85}>
            <Text style={styles.sendBtnText}>Submit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.voiceBtn} activeOpacity={0.85}>
            <Ionicons name="mic" size={20} color={colors.textWhite} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  dateHeader:     { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm },
  list:           { width: '100%' },
  listContent:    { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm },
  row:            { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  rowMe:          { justifyContent: 'flex-end' },
  rowThem:        { justifyContent: 'flex-start' },
  avatar:         { width: 30, height: 30, borderRadius: 15, backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center' },
  bubble:         { maxWidth: '75%', borderRadius: radius.md, padding: spacing.sm, gap: 2 },
  bubbleMe:       { backgroundColor: '#3b82f6', borderBottomRightRadius: 4 },
  bubbleThem:     { backgroundColor: '#22c55e', borderBottomLeftRadius: 4 },
  bubbleText:     { fontFamily: fonts.regular, fontSize: fontSize.sm },
  bubbleTextMe:   { color: colors.textWhite },
  bubbleTextThem: { color: '#000000' },
  timeText:       { fontFamily: fonts.regular, fontSize: 10, color: 'rgba(255,255,255,0.6)', textAlign: 'right' },
  inputRow:       { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card, width: '100%' },
  input:          { flex: 1, backgroundColor: colors.cardAlt, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: 10, fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.textWhite },
  sendBtn:        { backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 10 },
  sendBtnText:    { fontFamily: fonts.bold, fontSize: fontSize.sm, color: colors.textWhite },
  voiceBtn:       { backgroundColor: '#22c55e', borderRadius: radius.md, padding: 10 },
});
