// LoginScreen.tsx
// This is the first screen the user sees when they open the app.
// It handles email + password login and validates the inputs before moving on.

import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { FieldForceHeader } from '../components/FieldForceHeader';
import { colors, spacing, radius, fontSize, fonts } from '../constants/theme';

// This tells TypeScript what screen we're on so navigation.navigate()
// knows which screens are valid to go to from here
type Nav = NativeStackNavigationProp<RootStackParamList, 'Login'>;

// ---------------------------------------------------------------
// DEV ONLY — these are test credentials so we can log in quickly
// during development. Delete these before going to production!
// ---------------------------------------------------------------
const DEV_EMAIL    = 'test@test.com';
const DEV_PASSWORD = '123456';

// A simple function to check if an email looks valid.
// It uses a "regex" (regular expression) to check the format.
// The email needs to have something before @, something after @, and a dot somewhere after that.
const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

export default function LoginScreen() {
  const navigation = useNavigation<Nav>();

  // useState stores values that can change. When they change, the screen re-renders.
  // We pre-fill with dev credentials so testers don't have to type every time.
  const [email,        setEmail]        = useState(DEV_EMAIL);
  const [password,     setPassword]     = useState(DEV_PASSWORD);
  const [showPassword, setShowPassword] = useState(false); // toggles the eye icon

  // These hold error messages. Empty string '' means no error to show.
  const [emailError,    setEmailError]    = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loginError,    setLoginError]    = useState(''); // shown when credentials are wrong

  // This runs when the user taps away from the email field (on blur)
  const validateEmail = () => {
    if (email.trim() === '') {
      setEmailError('Please enter an email address.');
    } else if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address (e.g. name@example.com).');
    } else {
      setEmailError(''); // clear any previous error if it's valid now
    }
  }

  // This runs when the user taps away from the password field
  const validatePassword = () => {
    if (password === '') {
      setPasswordError('Please enter your password.');
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
    } else {
      setPasswordError(''); // clear error
    }
  }

  // When the user changes the email field, clear any errors so they
  // don't see stale error messages while they're still typing
  const handleEmailChange = (newValue: string) => {
    setEmail(newValue);
    setEmailError('');
    setLoginError('');
  }

  const handlePasswordChange = (newValue: string) => {
    setPassword(newValue);
    setPasswordError('');
    setLoginError('');
  }

  // This runs when the user taps the Login button
  const handleLogin = () => {
    // First check if both fields are valid before doing anything
    let everythingIsValid = true;

    if (email.trim() === '') {
      setEmailError('Please enter an email address.');
      everythingIsValid = false;
    } else if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address (e.g. name@example.com).');
      everythingIsValid = false;
    } else {
      setEmailError('');
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
    if (!everythingIsValid) {
      return;
    }

    // ---------------------------------------------------------------
    // DEV credential check — replace this with a real API call later.
    // In production, you'd send the email and password to your backend
    // and it would tell you if they're correct.
    // ---------------------------------------------------------------
    const emailMatches    = email.trim().toLowerCase() === DEV_EMAIL;
    const passwordMatches = password === DEV_PASSWORD;

    if (!emailMatches || !passwordMatches) {
      setLoginError('The email or password you entered is incorrect. Please try again.');
      return;
    }

    // If we get here, credentials are correct — go to biometric check
    setLoginError('');
    navigation.navigate('BiometricCheck');
  }

  // The Login button should look "active" only when both fields look valid
  const formLooksReady = isValidEmail(email) && password.length >= 6;

  return (
    <SafeAreaView style={styles.container}>
      {/* Makes the status bar text white so it's visible on our dark background */}
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* The Field Force logo bar at the top — showAvatar=false hides the profile icon
          because the user isn't logged in yet */}
      <FieldForceHeader showAvatar={false} />

      {/* KeyboardAvoidingView pushes the form up when the keyboard opens
          so the inputs don't get hidden behind it */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled" // lets buttons work even if keyboard is open
          showsVerticalScrollIndicator={false}
        >

          {/* Online/Offline status pill — tapping it switches to the offline login screen */}
          <TouchableOpacity
            style={styles.statusPill}
            onPress={() => navigation.replace('OfflineLogin')}
            activeOpacity={0.8}
          >
            <Ionicons name="wifi" size={14} color={colors.success} />
            <Text style={[styles.statusText, { color: colors.success }]}>Online</Text>
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

            {/* Email input */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={[
                  styles.input,
                  emailError !== '' ? styles.inputError : null, // red border if error
                ]}
                value={email}
                onChangeText={handleEmailChange}
                onBlur={validateEmail} // validate when they leave the field
                placeholder="name@example.com"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"   // don't auto-capitalize emails
                keyboardType="email-address"
                autoCorrect={false}
              />
              {/* Only shows the error text if there is one */}
              {emailError !== '' && (
                <View style={styles.fieldErrorRow}>
                  <Ionicons name="alert-circle-outline" size={14} color={colors.error} />
                  <Text style={styles.fieldErrorText}>{emailError}</Text>
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

            {/* Login button — appears grayed out when the form isn't ready */}
            <TouchableOpacity
              style={[styles.loginBtn, !formLooksReady && styles.btnDisabled]}
              onPress={handleLogin}
              activeOpacity={0.85}
            >
              <Text style={styles.loginBtnText}>Login</Text>
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
    </SafeAreaView>
  );
}

// All the styles for this screen live here.
// We keep styles at the bottom so the component logic above is easier to read.
const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: colors.background },
  flex:       { flex: 1 },
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
  statusText:   { fontFamily: fonts.bold, fontSize: fontSize.sm },
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
    color:      colors.primary, // orange — draws attention to "Restricted Access"
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
    backgroundColor: colors.primary,
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