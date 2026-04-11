import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { MainFrame } from '../components/MainFrame';
import { api, type LoginResponse, type ApiError } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const auth       = useAuth();

  const [username,     setUsername]     = useState('');
  const [password,     setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading,    setIsLoading]    = useState(false);

  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loginError,    setLoginError]    = useState('');

  const handleUsernameChange = (v: string) => { setUsername(v); setUsernameError(''); setLoginError(''); };
  const handlePasswordChange = (v: string) => { setPassword(v); setPasswordError(''); setLoginError(''); };

  const handleLogin = async () => {
    let valid = true;

    if (username.trim() === '') {
      setUsernameError('Please enter your username.');
      valid = false;
    }
    if (password === '') {
      setPasswordError('Please enter your password.');
      valid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      valid = false;
    }
    if (!valid) return;

    setIsLoading(true);
    setLoginError('');

    try {
      const result = await api.post<LoginResponse>('/auth/login', {
        username: username.trim(),
        password,
      });

      await auth.login(result.token, result.user);
      navigation.navigate('BiometricCheck');

    } catch (err: unknown) {
      const apiErr = err as ApiError;
      if (apiErr.status === 0) {
        setLoginError('Unable to connect. Check your internet connection.');
      } else if (apiErr.status === 401) {
        setLoginError('Incorrect username or password.');
      } else if (apiErr.status === 423) {
        setLoginError('Account locked. Contact your administrator.');
      } else if (apiErr.status >= 500) {
        setLoginError('Server error. Please try again.');
      } else {
        setLoginError(apiErr.error ?? String((err as Error).message ?? 'Login failed.'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formReady = username.trim().length > 0 && password.length >= 6;

  return (
    <MainFrame header="default" headerMenu={['none']} footerMenu={['none']}>

      {/* Online indicator */}
      <TouchableOpacity
        style={styles.statusPill}
        onPress={() => navigation.replace('OfflineLogin')}
        activeOpacity={0.8}
      >
        <Ionicons name="wifi" size={14} color="#22c55e" />
        <Text style={styles.statusText}>Online</Text>
      </TouchableOpacity>

      {/* Avatar */}
      <View style={styles.avatarCircle}>
        <Ionicons name="person" size={52} color="#8a9bb8" />
      </View>

      {/* Branding */}
      <View style={styles.brandBlock}>
        <Text style={styles.brandTitle}>Field Force</Text>
        <View style={styles.brandLine} />
        <Text style={styles.brandSub}>Contractor Portal</Text>
        <Text style={styles.brandRestricted}>Restricted Access</Text>
      </View>

      {/* Form */}
      <View style={styles.form}>

        {loginError !== '' && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={18} color="#f87171" />
            <Text style={styles.errorBannerText}>{loginError}</Text>
          </View>
        )}

        {/* Username */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={[styles.input, usernameError !== '' && styles.inputError]}
            value={username}
            onChangeText={handleUsernameChange}
            placeholder="Username"
            placeholderTextColor="#9ca3af"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
          />
          {usernameError !== '' && (
            <Text style={styles.fieldError}>{usernameError}</Text>
          )}
        </View>

        {/* Password */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Password</Text>
          <View>
            <TextInput
              style={[styles.input, styles.inputPadRight, passwordError !== '' && styles.inputError]}
              value={password}
              onChangeText={handlePasswordChange}
              placeholder="Password"
              placeholderTextColor="#9ca3af"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#9ca3af"
              />
            </TouchableOpacity>
          </View>
          {passwordError !== '' && (
            <Text style={styles.fieldError}>{passwordError}</Text>
          )}
        </View>

        {/* Login button */}
        <TouchableOpacity
          style={[styles.loginBtn, (!formReady || isLoading) && styles.btnDisabled]}
          onPress={handleLogin}
          activeOpacity={0.85}
          disabled={isLoading}
        >
          {isLoading
            ? <ActivityIndicator color="#000" />
            : <Text style={styles.loginBtnText}>Login</Text>
          }
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Forgot password */}
        <TouchableOpacity
          style={styles.forgotBtn}
          onPress={() => navigation.navigate('PasswordReset')}
          activeOpacity={0.8}
          disabled={isLoading}
        >
          <Text style={styles.forgotBtnText}>Forgot Password</Text>
        </TouchableOpacity>

      </View>
    </MainFrame>
  );
}

const styles = StyleSheet.create({
  statusPill: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
    marginTop:     16,
    marginBottom:  12,
  },
  statusText: {
    fontFamily: 'poppins-bold',
    fontSize:   13,
    color:      '#22c55e',
  },
  avatarCircle: {
    width:           100,
    height:          100,
    borderRadius:    50,
    backgroundColor: '#1e2d45',
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    12,
  },
  brandBlock: {
    alignItems:   'center',
    marginBottom: 20,
  },
  brandTitle: {
    fontFamily:    'poppins-bolditalic',
    fontSize:      28,
    color:         '#ffffff',
    letterSpacing: 1,
  },
  brandLine: {
    width:           '70%',
    height:          2,
    backgroundColor: '#ffffff',
    marginVertical:  6,
  },
  brandSub: {
    fontFamily:   'poppins-regular',
    fontSize:     14,
    color:        '#cbd5e1',
    marginBottom: 4,
  },
  brandRestricted: {
    fontFamily: 'poppins-bold',
    fontSize:   12,
    color:      '#f59e0b',
  },
  form: {
    width:    '100%',
    maxWidth: 380,
    gap:      12,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  fieldGroup: { gap: 4 },
  label: {
    fontFamily: 'poppins-regular',
    fontSize:   13,
    color:      '#ffffff',
  },
  input: {
    width:             '100%',
    backgroundColor:   '#c8d0dc',
    borderRadius:      8,
    paddingHorizontal: 14,
    paddingVertical:   12,
    fontFamily:        'poppins-regular',
    color:             '#0a0e1a',
    fontSize:          14,
  },
  inputError:    { borderWidth: 1, borderColor: '#f87171' },
  inputPadRight: { paddingRight: 46 },
  eyeBtn:        { position: 'absolute', right: 12, top: 12 },
  fieldError: {
    fontFamily: 'poppins-regular',
    fontSize:   11,
    color:      '#f87171',
  },
  errorBanner: {
    flexDirection:   'row',
    alignItems:      'flex-start',
    gap:             8,
    backgroundColor: 'rgba(248,113,113,0.15)',
    borderWidth:     1,
    borderColor:     '#f87171',
    borderRadius:    8,
    padding:         12,
  },
  errorBannerText: {
    fontFamily: 'poppins-regular',
    fontSize:   13,
    color:      '#f87171',
    flex:       1,
    lineHeight: 20,
  },
  loginBtn: {
    backgroundColor: '#f59e0b',
    borderRadius:    8,
    paddingVertical: 14,
    alignItems:      'center',
    marginTop:       4,
  },
  btnDisabled:   { backgroundColor: '#78716c' },
  loginBtnText: {
    fontFamily:    'poppins-bold',
    color:         '#000000',
    fontSize:      15,
    letterSpacing: 0.5,
  },
  dividerRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#374151' },
  dividerText: {
    fontFamily: 'poppins-regular',
    color:      '#9ca3af',
    fontSize:   12,
  },
  forgotBtn: {
    backgroundColor: '#1e2d45',
    borderRadius:    8,
    borderWidth:     1,
    borderColor:     '#374151',
    paddingVertical: 13,
    alignItems:      'center',
  },
  forgotBtnText: {
    fontFamily: 'poppins-regular',
    color:      '#cbd5e1',
    fontSize:   14,
  },
});
