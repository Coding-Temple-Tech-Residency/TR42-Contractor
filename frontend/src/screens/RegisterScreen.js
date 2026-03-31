import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async () => {
    setError('');

    if (!email.trim() || !username.trim() || !password.trim()) {
      setError('All fields are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register(email.trim(), username.trim(), password);
      navigation.navigate('Login');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={DARK} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {/* ── Dark branded header ── */}
          <View style={styles.header}>
            <View style={styles.badge}>
              <Text style={styles.badgeLetter}>TR</Text>
              <View style={styles.badgeStripe} />
            </View>
            <Text style={styles.heading}>Create account</Text>
            <Text style={styles.tagline}>Join as a Field Contractor</Text>
          </View>

          {/* ── Form area ── */}
          <View style={styles.body}>
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorDot}>!</Text>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Text style={styles.label}>EMAIL</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                placeholder="you@company.com"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <Text style={styles.label}>USERNAME</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                placeholder="Choose a username"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                value={username}
                onChangeText={setUsername}
              />
            </View>

            <Text style={styles.label}>PASSWORD</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                placeholder="Create a password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleRegister}
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, isSubmitting && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkRow}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.linkText}>
                Already registered?{' '}
                <Text style={styles.linkBold}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ── Design tokens ───────────────────────────────────────────────────────────
const DARK = '#0A1628';
const BRAND = '#0066B2';
const SURFACE = '#FFFFFF';
const BG = '#F0F2F5';

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },
  flex: { flex: 1 },
  scroll: { flexGrow: 1 },

  header: {
    backgroundColor: DARK,
    paddingTop: Platform.OS === 'ios' ? 64 : 48,
    paddingBottom: 36,
    paddingHorizontal: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  badge: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: BRAND,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    overflow: 'hidden',
  },
  badgeLetter: {
    color: '#fff',
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: 1,
  },
  badgeStripe: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#F59E0B',
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  tagline: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
    letterSpacing: 0.3,
  },

  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 32,
  },

  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 1,
    marginBottom: 6,
    marginTop: 4,
  },
  inputWrap: {
    backgroundColor: SURFACE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1A1A2E',
  },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
  },
  errorDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#DC2626',
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 22,
    marginRight: 10,
    overflow: 'hidden',
  },
  errorText: {
    flex: 1,
    color: '#991B1B',
    fontSize: 13,
    lineHeight: 18,
  },

  button: {
    backgroundColor: BRAND,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 6,
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  linkRow: { marginTop: 24, alignItems: 'center' },
  linkText: { fontSize: 14, color: '#6B7280' },
  linkBold: { color: BRAND, fontWeight: '700' },
});
