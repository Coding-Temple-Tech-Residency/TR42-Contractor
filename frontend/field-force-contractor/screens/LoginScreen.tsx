// LoginScreen.tsx  —  Troy
// This is the first screen the user sees when they open the app.
// It handles login and validates the inputs before moving on.
//
// Wrapped in MainFrame (Jonathan's) so this screen automatically gets:
//   • SplashScreenBackGround.png background
//   • ff-logo-name.png centered header bar (status-bar spacing handled by MainFrame)
//   • No header/footer menus — user isn't authenticated yet
//
// ── AUTH FLOW FIX ──────────────────────────────────────────────────────────────
// login() is NOT called here. Token + user are passed as nav params to
// BiometricCheck, which calls login() only after a successful scan.
// ──────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { MainFrame }          from '../components/MainFrame';
import { RootStackParamList } from '@/App';
import { colors, spacing, radius, fontSize, fonts } from '../constants/theme';
import { api, LoginResponse, ApiError } from '../utils/api';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Login'>;

// ─────────────────────────────────────────────────────────────────────────────
// ⚙️  STAKEHOLDER CONFIG
//   'email'    = contractor logs in with their email address
//   'username' = contractor logs in with a username / email (accepted by backend)
// ─────────────────────────────────────────────────────────────────────────────
const LOGIN_FIELD: 'email' | 'username' = 'username';

const FIELD_CONFIG = {
  email: {
    label:          'Email Address',
    placeholder:    'name@example.com',
    keyboardType:   'email-address' as const,
    autoCapitalize: 'none' as const,
  },
  username: {
    label:          'Username or Email',
    placeholder:    'Enter your username or email',
    keyboardType:   'default' as const,
    autoCapitalize: 'none' as const,
  },
};

const fieldConfig = FIELD_CONFIG[LOGIN_FIELD];

// ─────────────────────────────────────────────────────────────────────────────
// ⚙️  DEV MODE
//  true  = any non-empty username + password (6+ chars) succeeds immediately.
//  Set to false when the backend is ready.
// ─────────────────────────────────────────────────────────────────────────────
const DEV_MODE = true;

const isValidEmail = (value: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value.trim());
};

const AMBER = '#f59e0b';

// ─────────────────────────────────────────────────────────────────────────────
export default function LoginScreen() {
  const navigation = useNavigation<Nav>();

  const [identifier,   setIdentifier]   = useState('');
  const [password,     setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOffline,    setIsOffline]    = useState(false);

  const [identifierError, setIdentifierError] = useState('');
  const [passwordError,   setPasswordError]   = useState('');
  const [loginError,      setLoginError]      = useState('');

  // ── Validation ─────────────────────────────────────────────────────────────

  const validateIdentifier = () => {
    if (identifier.trim() === '') {
      setIdentifierError(`Please enter your ${fieldConfig.label.toLowerCase()}.`);
    } else if (LOGIN_FIELD === 'email' && !isValidEmail(identifier)) {
      setIdentifierError('Please enter a valid email address (e.g. name@example.com).');
    } else {
      setIdentifierError('');
    }
  };

  const validatePassword = () => {
    if (password === '') {
      setPasswordError('Please enter your password.');
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
    } else {
      setPasswordError('');
    }
  };

  const handleIdentifierChange = (newValue: string) => {
    setIdentifier(newValue);
    setIdentifierError('');
    setLoginError('');
  };

  const handlePasswordChange = (newValue: string) => {
    setPassword(newValue);
    setPasswordError('');
    setLoginError('');
  };

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleLogin = async () => {
    let everythingIsValid = true;

    if (identifier.trim() === '') {
      setIdentifierError(`Please enter your ${fieldConfig.label.toLowerCase()}.`);
      everythingIsValid = false;
    } else if (LOGIN_FIELD === 'email' && !isValidEmail(identifier)) {
      setIdentifierError('Please enter a valid email address (e.g. name@example.com).');
      everythingIsValid = false;
    } else {
      setIdentifierError('');
    }

    if (password === '') {
      setPasswordError('Please enter your password.');
      everythingIsValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      everythingIsValid = false;
    } else {
      setPasswordError('');
    }

    if (!everythingIsValid) return;

    setIsSubmitting(true);
    setLoginError('');

    try {
      if (DEV_MODE) {
        await new Promise(resolve => setTimeout(resolve, 800));
        navigation.navigate('BiometricCheck', {
          pendingToken: 'dev-token',
          pendingUser:  { id: 0, username: identifier.trim(), role: 'contractor' },
          onSuccess:{screen:"Home"}
        });
        return;
      }

      const res = await api.post<LoginResponse>('/auth/login', {
        identifier: identifier.trim(),
        password,
      });

      // Do NOT call login() here — BiometricCheck calls it after scan succeeds
      navigation.navigate('BiometricCheck', {
        pendingToken: res.token,
        pendingUser:  res.user,
        onSuccess:{screen:"Home"}
      });

    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.status === 401) {
        setLoginError('The credentials you entered are incorrect. Please try again.');
      } else if (apiErr.status === 0) {
        setLoginError('Unable to reach the server. Check your internet connection.');
      } else {
        setLoginError(apiErr.error || 'Something went wrong. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formLooksReady =
    identifier.trim().length > 0 &&
    (LOGIN_FIELD === 'email' ? isValidEmail(identifier) : true) &&
    password.length >= 6;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <MainFrame header="default" headerMenu={['none']} footerMenu={['none']}>

      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* Online/Offline status pill — visual toggle only for testing */}
          <TouchableOpacity
            style={styles.statusPill}
            onPress={() => setIsOffline(!isOffline)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isOffline ? 'wifi-outline' : 'wifi'}
              size={14}
              color={isOffline ? colors.warning : colors.success}
            />
            <Text style={[styles.statusText, { color: isOffline ? colors.warning : colors.success }]}>
              {isOffline ? 'Offline' : 'Online'}
            </Text>
          </TouchableOpacity>

          {/* Avatar */}
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={52} color="#8a9bb8" />
          </View>

          {/* Branding — "Field Force" title removed since the header already shows it.
              "Contractor Portal" is promoted to be the main headline so it is clear
              what this login page is for. "Restricted Access" stays in amber below. */}
          <View style={styles.brandBlock}>
            <Text style={styles.brandPortal}>Contractor Portal</Text>
            <Text style={styles.brandRestricted}>Restricted Access</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>

            {loginError !== '' && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
                <Text style={styles.errorBannerText}>{loginError}</Text>
              </View>
            )}

            {/* Username / Email input — orange placeholder, no label above */}
            <View style={styles.fieldGroup}>
              <TextInput
                style={[styles.input, identifierError !== '' ? styles.inputError : null]}
                value={identifier}
                onChangeText={handleIdentifierChange}
                onBlur={validateIdentifier}
                placeholder="Username"
                placeholderTextColor={AMBER}
                keyboardType={fieldConfig.keyboardType}
                autoCapitalize={fieldConfig.autoCapitalize}
                autoCorrect={false}
                accessibilityLabel="Username or email"
              />
              {identifierError !== '' && (
                <View style={styles.fieldErrorRow}>
                  <Ionicons name="alert-circle-outline" size={14} color={colors.error} />
                  <Text style={styles.fieldErrorText}>{identifierError}</Text>
                </View>
              )}
            </View>

            {/* Password input — orange placeholder, no label above */}
            <View style={styles.fieldGroup}>
              <View>
                <TextInput
                  style={[
                    styles.input,
                    styles.inputPadRight,
                    passwordError !== '' ? styles.inputError : null,
                  ]}
                  value={password}
                  onChangeText={handlePasswordChange}
                  onBlur={validatePassword}
                  placeholder="Password"
                  placeholderTextColor={AMBER}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  accessibilityLabel="Password"
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
              {passwordError !== '' && (
                <View style={styles.fieldErrorRow}>
                  <Ionicons name="alert-circle-outline" size={14} color={colors.error} />
                  <Text style={styles.fieldErrorText}>{passwordError}</Text>
                </View>
              )}
            </View>

            {/* Login button — amber when ready, gray when not */}
            <TouchableOpacity
              style={[
                styles.loginBtn,
                formLooksReady && !isSubmitting ? styles.loginBtnActive : styles.loginBtnDisabled,
              ]}
              onPress={handleLogin}
              activeOpacity={0.85}
              disabled={!formLooksReady || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.textWhite} />
              ) : (
                <Text style={styles.loginBtnText}>Login</Text>
              )}
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => navigation.navigate('PasswordReset')}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryBtnText}>Forgot Password</Text>
            </TouchableOpacity>

          </View>

        </ScrollView>
      </KeyboardAvoidingView>

    </MainFrame>
  );
}

const styles = StyleSheet.create({
  kav:   { flex: 1, width: '100%' },
  scroll: {
    flexGrow:          1,
    alignItems:        'center',
    paddingHorizontal: spacing.lg,
    paddingBottom:     spacing.xl,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
    marginTop:     spacing.lg,
    marginBottom:  spacing.md,
  },
  statusText:   { fontFamily: fonts.bold, fontSize: fontSize.sm },
  avatarCircle: {
    width:           100,
    height:          100,
    borderRadius:    50,
    backgroundColor: '#1e2d45',
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    spacing.md,
  },

  // Branding — "Contractor Portal" is now the headline
  brandBlock: { alignItems: 'center', marginBottom: spacing.lg },
  brandPortal: {
    fontFamily:    fonts.bold,
    fontSize:      26,              // larger than before
    color:         colors.textWhite,
    letterSpacing: 0.5,
    marginBottom:  spacing.xs,
  },
  brandRestricted: {
    fontFamily: fonts.bold,
    fontSize:   fontSize.sm,
    color:      '#f59e0b',
  },

  form:       { width: '100%', maxWidth: 380, gap: spacing.md },
  fieldGroup: { gap: 6 },

  // Darker input background, orange border and placeholder
  input: {
    width:             '100%',
    backgroundColor:   '#0d1520',
    borderRadius:      radius.md,
    borderWidth:       1,
    borderColor:       '#f59e0b',
    paddingHorizontal: spacing.md,
    paddingVertical:   14,
    fontFamily:        fonts.regular,
    color:             colors.textWhite,
    fontSize:          fontSize.base,
  },
  inputError:    { borderColor: colors.error },
  inputPadRight: { paddingRight: 48 },
  eyeBtn:        { position: 'absolute', right: 14, top: 14 },

  fieldErrorRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  fieldErrorText: {
    fontFamily: fonts.regular,
    fontSize:   fontSize.xs,
    color:      colors.error,
    flex:       1,
  },

  errorBanner: {
    flexDirection:   'row',
    alignItems:      'flex-start',
    gap:             spacing.sm,
    backgroundColor: colors.errorBg,
    borderWidth:     1,
    borderColor:     colors.errorBorder,
    borderRadius:    radius.md,
    padding:         spacing.md,
  },
  errorBannerText: {
    fontFamily: fonts.regular,
    fontSize:   fontSize.sm,
    color:      colors.error,
    flex:       1,
    lineHeight: 20,
  },

  loginBtn:         { borderRadius: radius.md, paddingVertical: 15, alignItems: 'center', marginTop: spacing.sm },
  loginBtnActive:   { backgroundColor: '#f59e0b' },
  loginBtnDisabled: { backgroundColor: colors.cardAlt },
  loginBtnText: {
    fontFamily:    fonts.bold,
    color:         colors.textWhite,
    fontSize:      fontSize.base,
    letterSpacing: 0.5,
  },

  dividerRow:  { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { fontFamily: fonts.regular, color: colors.textMuted, fontSize: fontSize.sm },

  secondaryBtn: {
    backgroundColor: colors.card,
    borderRadius:    radius.md,
    borderWidth:     1,
    borderColor:     colors.border,
    paddingVertical: 14,
    alignItems:      'center',
  },
  secondaryBtnText: {
    fontFamily: fonts.regular,
    color:      colors.textLight,
    fontSize:   fontSize.base,
  },
});