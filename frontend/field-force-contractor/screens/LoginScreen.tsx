// LoginScreen.tsx  —  Troy
// This is the first screen the user sees when they open the app.
// It handles login and validates the inputs before moving on.
//
// Wrapped in MainFrame (Jonathan's) so this screen automatically gets:
//   • SplashScreenBackGround.png background
//   • ff-logo-name.png centered header bar (status-bar spacing handled by MainFrame)
//   • No header/footer menus — user isn't authenticated yet

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
import { useAuth }            from '../contexts/AuthContext';

// This tells TypeScript what screen we're on so navigation.navigate()
// knows which screens are valid to go to from here
type Nav = NativeStackNavigationProp<RootStackParamList, 'Login'>;

// ─────────────────────────────────────────────────────────────────────────────
// ⚙️  STAKEHOLDER CONFIG — change this one line after Tuesday's meeting
//
//   'email'    = contractor logs in with their email address
//   'username' = contractor logs in with a username
// ─────────────────────────────────────────────────────────────────────────────
const LOGIN_FIELD: 'email' | 'username' = 'username';

// Labels, placeholder text, and keyboard type are all derived from the flag above
// so only the one line above ever needs to change — nothing else in this file
const FIELD_CONFIG = {
  email: {
    label:          'Email Address',
    placeholder:    'name@example.com',
    keyboardType:   'email-address' as const,
    autoCapitalize: 'none' as const,
  },
  username: {
    label:          'Username',
    placeholder:    'Enter your username',
    keyboardType:   'default' as const,
    autoCapitalize: 'none' as const,
  },
};

const fieldConfig = FIELD_CONFIG[LOGIN_FIELD];

// ─────────────────────────────────────────────────────────────────────────────
// ⚙️  DEV MODE — set this to true to bypass the real API call while testing.
//
//  When DEV_MODE is true:
//    • Any non-empty username + password (6+ chars) will succeed immediately
//    • No network request is made — the connection timeout error disappears
//    • The app routes correctly based on the Online/Offline pill state
//
//  Set to false when the backend is ready and you want real API calls.
// ─────────────────────────────────────────────────────────────────────────────
const DEV_MODE = false;

// A simple function to check if an email looks valid.
// It uses a "regex" (regular expression) to check the format.
// Only used when LOGIN_FIELD === 'email'.
const isValidEmail = (value: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value.trim());
};

// ─────────────────────────────────────────────────────────────────────────────
export default function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const { login }  = useAuth();

  // useState stores values that can change. When they change, the screen re-renders.
  const [identifier,   setIdentifier]   = useState(''); // holds email OR username depending on LOGIN_FIELD
  const [password,     setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false); // toggles the eye icon
  const [isSubmitting, setIsSubmitting] = useState(false); // shows spinner on button

  // Online/Offline toggle — this is a UI state indicator used for testing.
  // Tapping the pill just flips this value. It does NOT navigate by itself.
  // The Login button uses this to decide where to route after a successful login:
  //   Online  → BiometricCheck (normal flow)
  //   Offline → OfflineLogin   (PIN-based flow)
  const [isOffline, setIsOffline] = useState(false);

  // These hold error messages. Empty string '' means no error to show.
  const [identifierError, setIdentifierError] = useState('');
  const [passwordError,   setPasswordError]   = useState('');
  const [loginError,      setLoginError]      = useState(''); // shown when credentials are wrong

  // ── Validation ───────────────────────────────────────────────────────────

  // This runs when the user taps away from the identifier field (on blur)
  const validateIdentifier = () => {
    if (identifier.trim() === '') {
      setIdentifierError(`Please enter your ${fieldConfig.label.toLowerCase()}.`);
    } else if (LOGIN_FIELD === 'email' && !isValidEmail(identifier)) {
      setIdentifierError('Please enter a valid email address (e.g. name@example.com).');
    } else {
      setIdentifierError(''); // clear any previous error if it's valid now
    }
  };

  // This runs when the user taps away from the password field
  const validatePassword = () => {
    if (password === '') {
      setPasswordError('Please enter your password.');
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
    } else {
      setPasswordError(''); // clear error
    }
  };

  // When the user changes the identifier field, clear any errors so they
  // don't see stale error messages while they're still typing
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

  // ── Submit ───────────────────────────────────────────────────────────────

  // This runs when the user taps the Login button.
  // After a successful login it routes based on the Online/Offline pill:
  //   Online  → BiometricCheck
  //   Offline → OfflineLogin
  const handleLogin = async () => {
    // First check if both fields are valid before doing anything
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

    // If either field has an error, stop here and don't try to log in
    if (!everythingIsValid) return;

    setIsSubmitting(true);
    setLoginError('');

    try {
      if (DEV_MODE) {
        // ── DEV MODE: skip the real API call ──────────────────────────────
        // Simulate a short network delay so the spinner is visible
        await new Promise(resolve => setTimeout(resolve, 800));

        // Both online and offline go to biometrics first.
        // If biometrics fail, BiometricScreen routes to the PIN screen.
        navigation.navigate('BiometricCheck');
        return;
      }

      // ── PRODUCTION: call the real backend /auth/login endpoint ────────
      const res = await api.post<LoginResponse>('/auth/login', {
        [LOGIN_FIELD]: identifier.trim(),
        password,
      });

      // Store JWT + user info in AuthContext (persists to SecureStore)
      await login(res.token, res.user);

      // Both online and offline go to biometrics first.
      navigation.navigate('BiometricCheck');

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

  // The Login button should look "active" only when both fields look valid
  const formLooksReady =
    identifier.trim().length > 0 &&
    (LOGIN_FIELD === 'email' ? isValidEmail(identifier) : true) &&
    password.length >= 6;

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <MainFrame header="default" headerMenu={['none']} footerMenu={['none']}>

      {/* Makes the status bar text white so it's visible on our dark background */}
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* KeyboardAvoidingView pushes the form up when the keyboard opens
          so the inputs don't get hidden behind it */}
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled" // lets buttons work even if keyboard is open
          showsVerticalScrollIndicator={false}
        >

          {/* Online/Offline status pill ─────────────────────────────────────
              This is a VISUAL TOGGLE ONLY — tapping it flips the pill between
              Online (green) and Offline (amber) so you can test both flows.
              It does NOT navigate anywhere by itself.
              The Login button reads this state and routes accordingly:
                Online  → BiometricCheck
                Offline → OfflineLogin                                       */}
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

          {/* Generic person icon — in production this could show the user's photo */}
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={52} color="#8a9bb8" />
          </View>

          {/* App branding */}
          <View style={styles.brandBlock}>
            <Text style={styles.brandTitle}>Field Force</Text>
            <View style={styles.brandLine} />
            <Text style={styles.brandSub}>Contractor Portal</Text>
            {/* Amber color draws attention to "Restricted Access" — matches Troy's mockup */}
            <Text style={styles.brandRestricted}>Restricted Access</Text>
          </View>

          {/* The login form */}
          <View style={styles.form}>

            {/* This red banner only shows up when the wrong credentials are entered.
                It stays hidden (renders nothing) when loginError is an empty string. */}
            {loginError !== '' && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
                <Text style={styles.errorBannerText}>{loginError}</Text>
              </View>
            )}

            {/* Email / Username input — label and behavior controlled by LOGIN_FIELD at the top */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{fieldConfig.label}</Text>
              <TextInput
                style={[
                  styles.input,
                  identifierError !== '' ? styles.inputError : null, // red border if error
                ]}
                value={identifier}
                onChangeText={handleIdentifierChange}
                onBlur={validateIdentifier} // validate when they leave the field
                placeholder={fieldConfig.placeholder}
                placeholderTextColor={colors.textMuted}
                keyboardType={fieldConfig.keyboardType}
                autoCapitalize={fieldConfig.autoCapitalize}
                autoCorrect={false}
              />
              {/* Only shows the error text if there is one */}
              {identifierError !== '' && (
                <View style={styles.fieldErrorRow}>
                  <Ionicons name="alert-circle-outline" size={14} color={colors.error} />
                  <Text style={styles.fieldErrorText}>{identifierError}</Text>
                </View>
              )}
            </View>

            {/* Password input */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Password</Text>
              {/* We wrap the input in a View so we can position the eye icon on top of it */}
              <View>
                <TextInput
                  style={[
                    styles.input,
                    styles.inputPadRight, // extra right padding so text doesn't overlap the eye icon
                    passwordError !== '' ? styles.inputError : null,
                  ]}
                  value={password}
                  onChangeText={handlePasswordChange}
                  onBlur={validatePassword}
                  placeholder="Min. 6 characters"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showPassword} // hides/shows the password text
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {/* Eye icon button — toggles between showing and hiding the password */}
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

            {/* Login button — appears grayed out when the form isn't ready or submitting */}
            <TouchableOpacity
              style={[styles.loginBtn, (!formLooksReady || isSubmitting) && styles.btnDisabled]}
              onPress={handleLogin}
              activeOpacity={0.85}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.textWhite} />
              ) : (
                <Text style={styles.loginBtnText}>Login</Text>
              )}
            </TouchableOpacity>

            {/* Visual separator between Login and Forgot Password */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Takes user to the password reset screen */}
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

// All the styles for this screen live here.
// We keep styles at the bottom so the component logic above is easier to read.
const AMBER = '#f59e0b'; // Login button + "Restricted Access" — matches Troy's approved mockup

const styles = StyleSheet.create({
  kav:   { flex: 1, width: '100%' },
  scroll: {
    flexGrow:          1,       // lets the ScrollView expand to fill available space
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
  statusText: { fontFamily: fonts.bold, fontSize: fontSize.sm },
  avatarCircle: {
    width:           100,
    height:          100,
    borderRadius:    50,        // makes the square a circle
    backgroundColor: '#1e2d45',
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    spacing.md,
  },
  brandBlock:  { alignItems: 'center', marginBottom: spacing.lg },
  brandTitle: {
    fontFamily:    fonts.boldItalic,
    fontSize:      28,
    color:         colors.textWhite,
    letterSpacing: 1,
  },
  brandLine: {
    width:           '70%',
    height:          2,
    backgroundColor: colors.textWhite,
    marginVertical:  6,
  },
  brandSub: {
    fontFamily:   fonts.regular,
    fontSize:     fontSize.base,
    color:        colors.textLight,
    marginBottom: 4,
  },
  brandRestricted: {
    fontFamily: fonts.bold,
    fontSize:   fontSize.sm,
    color:      AMBER,           // amber — draws attention to "Restricted Access"
  },
  form:       { width: '100%', maxWidth: 380, gap: spacing.md },
  fieldGroup: { gap: 6 },
  label:      { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.textLight },
  input: {
    width:             '100%',
    backgroundColor:   colors.card,
    borderRadius:      radius.md,
    borderWidth:       1,
    borderColor:       colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical:   14,
    fontFamily:        fonts.regular,
    color:             colors.textWhite,
    fontSize:          fontSize.base,
  },
  inputError:    { borderColor: colors.error }, // overrides the default border with red
  inputPadRight: { paddingRight: 48 },           // keeps text from going under the eye button
  eyeBtn:        { position: 'absolute', right: 14, top: 14 },
  fieldErrorRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           5,
    marginTop:     2,
  },
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
  loginBtn: {
    backgroundColor: AMBER,     // amber fill — matches Troy's approved mockup
    borderRadius:    radius.md,
    paddingVertical: 15,
    alignItems:      'center',
    marginTop:       spacing.sm,
  },
  btnDisabled:  { backgroundColor: colors.cardAlt }, // grayed out state
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