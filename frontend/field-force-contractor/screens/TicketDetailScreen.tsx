import { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Modal, Alert, ActivityIndicator, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MainFrame } from '../components/MainFrame';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SETTINGS_BIOMETRIC_KEY } from './ProfileScreen';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';


export default function TicketDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { taskId, assigned } = route.params;

  const [taskStatus, setTaskStatus] = useState<'to_do' | 'in_progress' | 'completed'>('to_do');
  const [notes, setNotes] = useState('');
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationStep, setVerificationStep] = useState<'initial' | 'biometric' | 'pin' | 'location' | 'success' | 'error'>('initial');
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [selectedMethod, setSelectedMethod] = useState<'face' | 'fingerprint'>('fingerprint');
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'failed'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [startLocation, setStartLocation] = useState<Location.LocationObject | null>(null);
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [listening, setListening] = useState(false);

  const pinRefs = useRef<(TextInput | null)[]>([null, null, null, null, null, null]);

  // ── Load saved biometric preference ────────────────────────────────────────
  // Reads the preference the user set in ProfileScreen → Settings so the
  // correct method is pre-selected when the verification modal opens.
  useEffect(() => {
    const loadPreference = async () => {
      try {
        const saved = await AsyncStorage.getItem(SETTINGS_BIOMETRIC_KEY);
        if (saved === 'face' || saved === 'fingerprint') {
          setSelectedMethod(saved);
        }
      } catch {
        // Fall back to fingerprint default if read fails
      }
    };
    loadPreference();
  }, []);

  // Capture GPS when verification reaches location step
  useEffect(() => {
    if (verificationStep !== 'location') return;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMessage('Location permission is required to start a task.');
        setVerificationStep('error');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setStartLocation(loc);
      setVerificationStep('success');
    })();
  }, [verificationStep]);

  // Auto-close modal after success
  useEffect(() => {
    if (verificationStep !== 'success') return;
    const t = setTimeout(() => {
      setShowVerificationModal(false);
      setTaskStatus('in_progress');
      setScanState('idle');
      setPin(['', '', '', '', '', '']);
    }, 2000);
    return () => clearTimeout(t);
  }, [verificationStep]);

  useSpeechRecognitionEvent('start', () => setListening(true));
  useSpeechRecognitionEvent('end', () => setListening(false));
  useSpeechRecognitionEvent('result', (event) => {
    if (event.results[0]?.transcript) {
      setNotes(prev => (prev ? prev + ' ' : '') + event.results[0].transcript);
    }
  });
  useSpeechRecognitionEvent('error', (event) => {
    console.warn('Speech error:', event.error, event.message);
    setListening(false);
  });

  const task = {
    id: taskId,
    title: 'Install Gas Pump at Station #42',
    deadline: 'March 21, 2026 at 5:00 PM',
    location: '1234 Main Street, San Francisco, CA 94102',
    description: 'Install new gas pump model XR-500 at station #42. Ensure proper connection to underground tank and test all safety mechanisms before completion.',
    pointOfContact: { name: 'John Martinez', phone: '+1 (555) 012-3456' },
    photosRequired: 1,
    photosMax: 5,
    photosSubmitted: photoUris.length,
  };

  // ── TODO: Real data integration ─────────────────────────────────────────────
  //  delete placeholder above and use this:
  //
  // 1. Add near other useState declarations:
  //   const [taskData, setTaskData] = useState<any | null>(null);
  //
  // 2. Add after existing useEffects:
  //   useEffect(() => {
  //     api.get(`/tickets/${taskId}`).then(data => {
  //       setTaskData(data);
  //       setTaskStatus(data.status);   // backend values: 'to_do' | 'in_progress' | 'completed'
  //       setNotes(data.notes ?? '');
  //     });
  //   }, [taskId]);
  //
  // 3. Replace placeholder task object with:
  //   const task = {
  //     id:            taskData.id,
  //     title:         taskData.service_type ?? taskData.description.slice(0, 60),
  //     deadline:      taskData.due_date,
  //     location:      taskData.route,
  //     description:   taskData.description,
  //     pointOfContact: { name: taskData.poc_name, phone: taskData.poc_phone },  // confirm field names with backend team — no poc field exists yet
  //     photosRequired: 1,             // frontend-only — no backend field
  //     photosMax:      5,             // frontend-only — no backend field
  //     photosSubmitted: photoUris.length,
  //   };
  // ─────────────────────────────────────────────────────────────────────────────

  const toggleListening = async () => {
    if (listening) {
      ExpoSpeechRecognitionModule.stop();
      return;
    }
    const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!granted) {
      Alert.alert('Permission Required', 'Microphone and speech recognition access is needed.');
      return;
    }
    ExpoSpeechRecognitionModule.start({ lang: 'en-US', continuous: false });
  };

  const handleOpenMaps = () => {
    const encoded = encodeURIComponent(task.location);
    const url = `https://maps.google.com/?q=${encoded}`;
    Linking.openURL(url);
  };

  const handlePinInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);
    if (value && index < 5) {
      pinRefs.current[index + 1]?.focus();
    }
  };

  const handlePinKeyDown = (index: number, key: string) => {
    if (key === 'Backspace' && !pin[index] && index > 0) {
      pinRefs.current[index - 1]?.focus();
    }
  };

  const handleStartTask = () => {
    setShowVerificationModal(true);
    setVerificationStep('initial');
  };

  const handleTakePhoto = async () => {
    if (photoUris.length >= task.photosMax) return;
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      const uri = result.assets[0].uri;
      setPhotoUris(prev => [...prev, uri]);
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const geoTag = { lat: loc.coords.latitude, lng: loc.coords.longitude, timestamp: loc.timestamp, uri };
        const existing = await AsyncStorage.getItem(`photo_log_${task.id}`) ?? '[]';
        const log = JSON.parse(existing);
        log.push(geoTag);
        await AsyncStorage.setItem(`photo_log_${task.id}`, JSON.stringify(log));
      } catch {
        // Non-blocking — don't prevent photo if GPS fails
      }
    }
  };

  const handleUploadPhoto = async () => {
    if (photoUris.length >= task.photosMax) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      const uri = result.assets[0].uri;
      setPhotoUris(prev => [...prev, uri]);
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const geoTag = { lat: loc.coords.latitude, lng: loc.coords.longitude, timestamp: loc.timestamp, uri };
        const existing = await AsyncStorage.getItem(`photo_log_${task.id}`) ?? '[]';
        const log = JSON.parse(existing);
        log.push(geoTag);
        await AsyncStorage.setItem(`photo_log_${task.id}`, JSON.stringify(log));
      } catch {
        // Non-blocking — don't prevent photo if GPS fails
      }
    }
  };

  const handleCompleteTask = async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      await AsyncStorage.setItem(
        `location_log_${task.id}`,
        JSON.stringify({
          taskId: task.id,
          startLocation: startLocation?.coords ?? null,
          endLocation: loc.coords,
          startedAt: startLocation?.timestamp ?? null,
          completedAt: loc.timestamp,
        })
      );
    } catch {
      // Non-blocking — don't prevent completion if GPS fails
    }
    navigation.navigate('TaskConfirmation' as never, { taskId } as never);
  };

  const closeModal = () => {
    setShowVerificationModal(false);
    setVerificationStep('initial');
    setPin(['', '', '', '', '', '']);
    setErrorMessage('');
    setScanState('idle');
  };

  const handleBiometricAuth = () => {
    if (scanState === 'scanning') return;
    setScanState('scanning');
    setErrorMessage('');

    setTimeout(() => {
      setVerificationStep('location');
    }, 1500);
  };

  const handlePinAuth = () => {
    const pinString = pin.join('');
    if (pinString.length !== 6) {
      setErrorMessage('Please enter a complete 6-digit PIN');
      return;
    }
    if (pinString !== '123456') {
      setVerificationStep('error');
      setErrorMessage('Invalid PIN. Please try again.');
      setPin(['', '', '', '', '', '']);
      return;
    }
    setErrorMessage('');
    setVerificationStep('location');
  };

  const handleAcceptTask = () => {
    // TODO: API call to accept task
    navigation.goBack();
  };

  const handleDeclineTask = () => {
    // TODO: API call to decline task
    navigation.goBack();
  };

  return (
    <MainFrame header='home'>

      {/* ── Task Title + Status ── */}
      <View style={styles.section}>
        <Text style={styles.taskTitle}>{task.title}</Text>
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, {
            backgroundColor:
              taskStatus === 'to_do' ? '#6b7280' :
              taskStatus === 'in_progress' ? '#f97316' : '#22c55e'
          }]} />
          <Text style={styles.statusText}>
            {taskStatus === 'to_do' ? 'Not Started' :
             taskStatus === 'in_progress' ? 'In Progress' : 'Ready to Submit'}
          </Text>
        </View>
      </View>

      {/* ── Accept and Decline Buttons ── */}
      {!assigned && (
        <View style={styles.assignRow}>
          <TouchableOpacity style={styles.acceptBtn} onPress={handleAcceptTask}>
            <Ionicons name="checkmark" size={12} color="white" />
            <Text style={styles.btnText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.declineBtn} onPress={handleDeclineTask}>
            <Ionicons name="close" size={12} color="white" />
            <Text style={styles.btnText}>Decline</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Location ── */}
      <TouchableOpacity style={styles.infoCard} onPress={handleOpenMaps}>
        <View style={styles.infoIcon}>
          <Ionicons name="location" size={18} color="#ff8c00" />
        </View>
        <View style={styles.infoText}>
          <Text style={styles.infoLabel}>Location</Text>
          <Text style={styles.infoValue}>{task.location}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
      </TouchableOpacity>

      {/* ── Deadline ── */}
      <View style={styles.infoCard}>
        <View style={styles.infoIconAlt}>
          <Ionicons name="time" size={18} color="#f59e0b" />
        </View>
        <View style={styles.infoText}>
          <Text style={styles.infoLabel}>Deadline</Text>
          <Text style={styles.infoValue}>{task.deadline}</Text>
        </View>
      </View>

      {/* ── Point of Contact ── */}
      <View style={styles.infoCard}>
        <View style={styles.infoIcon}>
          <Ionicons name="person" size={18} color="#ff8c00" />
        </View>
        <View style={styles.infoText}>
          <Text style={styles.infoLabel}>Point of Contact</Text>
          <Text style={styles.infoValue}>{task.pointOfContact.name}</Text>
          <Text style={styles.taskDetail}>{task.pointOfContact.phone}</Text>
        </View>
      </View>

      {/* ── Description ── */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Description</Text>
        <Text style={styles.cardBody}>{task.description}</Text>
      </View>

      {/* ── Notes — only when in progress ── */}
      {taskStatus !== 'to_do' && (
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.cardTitle}>Notes & Issues</Text>
            <TouchableOpacity
              style={[styles.micBtn, listening && { backgroundColor: '#ff8c00', borderRadius: 8, padding: 8 }]}
              onPress={toggleListening}
            >
              <Ionicons name={listening ? 'stop-circle' : 'mic'} size={18} color={listening ? '#fff' : '#ff8c00'} />
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add notes, observations, or issues..."
            placeholderTextColor="#6b7280"
            multiline
            numberOfLines={4}
          />
          <Text style={styles.notesHint}>These notes will be submitted with your task completion</Text>
        </View>
      )}

      {/* ── Photos ── */}
      {taskStatus !== 'to_do' && (
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.cardTitle}>Photos</Text>
            <Text style={styles.photoCount}>{photoUris.length}/{task.photosRequired}</Text>
          </View>
          <View style={styles.photoRow}>
            {[...Array(task.photosRequired)].map((_, i) => (
              <View
                key={i}
                style={[styles.photoSlot, i < photoUris.length && styles.photoSlotDone]}
              >
                <Ionicons
                  name={i < photoUris.length ? 'checkmark-circle' : 'camera'}
                  size={24}
                  color={i < photoUris.length ? '#22c55e' : '#6b7280'}
                />
              </View>
            ))}
          </View>
            {photoUris.length < task.photosMax && (
              <View style={styles.photoActions}>
                <TouchableOpacity style={styles.photoBtn} onPress={handleTakePhoto}>
                  <Ionicons name="camera" size={16} color="#ff8c00" />
                  <Text style={styles.photoBtnText}>Take Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoBtn} onPress={handleUploadPhoto}>
                  <Ionicons name="images" size={16} color="#ff8c00" />
                  <Text style={styles.photoBtnText}>Upload Photo</Text>
                </TouchableOpacity>
              </View>
            )}
            </View>
          )}

      {/* ── Actions ── */}
      <View style={styles.actions}>
        {taskStatus === 'to_do' && assigned && (
          <TouchableOpacity style={styles.btnPrimary} onPress={handleStartTask}>
            <Ionicons name="play-circle" size={20} color="white" />
            <Text style={styles.btnText}>Start Task</Text>
          </TouchableOpacity>
        )}
        {taskStatus === 'in_progress' && (
            <TouchableOpacity
              style={task.photosSubmitted >= task.photosRequired ? styles.btnSuccess : styles.btnOutline}
              onPress={handleCompleteTask}
              disabled={task.photosSubmitted < task.photosRequired}
            >
              <Ionicons name="checkmark-circle" size={20} color={task.photosSubmitted >= task.photosRequired ? 'white' : '#ff8c00'} />
              <Text style={task.photosSubmitted >= task.photosRequired ? styles.btnText : styles.btnOutlineText}>
                {task.photosSubmitted >= task.photosRequired ? 'Complete Task' : `Need ${task.photosRequired - task.photosSubmitted} more photo(s)`}
              </Text>
            </TouchableOpacity>
        )}
      </View>

      {/* ── Verification Modal ── */}
      <Modal
        visible={showVerificationModal}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Identity Verification</Text>

            {(verificationStep === 'initial' || verificationStep === 'biometric') && (
              <View style={styles.modalBody}>
                <Text style={styles.modalText}>Verify your identity to start this task.</Text>

                {/* Face ID / Fingerprint toggle */}
                <View style={styles.methodRow}>
                  <TouchableOpacity
                    style={[styles.methodBtn, selectedMethod === 'face' && styles.methodBtnActive]}
                    onPress={() => { setSelectedMethod('face'); setScanState('idle'); }}
                  >
                    <Ionicons name="scan-outline" size={20} color={selectedMethod === 'face' ? '#ff8c00' : '#9ca3af'} />
                    <Text style={[styles.methodLabel, selectedMethod === 'face' && styles.methodLabelActive]}>Face ID</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.methodBtn, selectedMethod === 'fingerprint' && styles.methodBtnActive]}
                    onPress={() => { setSelectedMethod('fingerprint'); setScanState('idle'); }}
                  >
                    <Ionicons name="finger-print" size={20} color={selectedMethod === 'fingerprint' ? '#ff8c00' : '#9ca3af'} />
                    <Text style={[styles.methodLabel, selectedMethod === 'fingerprint' && styles.methodLabelActive]}>Fingerprint</Text>
                  </TouchableOpacity>
                </View>

                {/* Scan button */}
                <TouchableOpacity
                  style={[
                    styles.scanButton,
                    scanState === 'scanning' && styles.scanButtonScanning,
                    scanState === 'failed'   && styles.scanButtonFailed,
                  ]}
                  onPress={handleBiometricAuth}
                  disabled={scanState === 'scanning'}
                >
                  {scanState === 'scanning' ? (
                    <ActivityIndicator size={64} color="white" />
                  ) : (
                    <Ionicons
                      name={selectedMethod === 'face' ? 'scan' : 'finger-print'}
                      size={80}
                      color={scanState === 'failed' ? '#ef4444' : '#ff8c00'}
                    />
                  )}
                </TouchableOpacity>

                {scanState === 'idle'     && <Text style={styles.hintText}>{selectedMethod === 'face' ? 'Tap to scan your face' : 'Tap to scan fingerprint'}</Text>}
                {scanState === 'scanning' && <Text style={styles.hintText}>Scanning…</Text>}

                {/* ── Failed state: retry + PIN fallback ──────────────────────
                    "Use PIN instead" only appears after a scan fails — it is a
                    fallback, not a first option. This matches the login biometric
                    screen behaviour and prevents contractors bypassing biometrics. */}
                {scanState === 'failed' && (
                  <>
                    <Text style={styles.errorText}>Scan failed — please try again.</Text>
                    <TouchableOpacity style={styles.btnPrimary} onPress={() => setScanState('idle')}>
                      <Text style={styles.btnText}>Retry</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.pinLink} onPress={() => setVerificationStep('pin')}>
                      <Ionicons name="keypad-outline" size={16} color="#ff8c00" />
                      <Text style={styles.pinLinkText}>Use PIN instead</Text>
                    </TouchableOpacity>
                  </>
                )}

              </View>
            )}

            {verificationStep === 'pin' && (
              <View style={styles.modalBody}>
                <Text style={styles.modalText}>Please enter your 6-digit PIN.</Text>
                <View style={styles.pinRow}>
                  {[...Array(6)].map((_, index) => (
                    <TextInput
                      key={index}
                      ref={el => { pinRefs.current[index] = el; }}
                      style={styles.pinInput}
                      value={pin[index]}
                      onChangeText={value => handlePinInput(index, value)}
                      onKeyPress={({ nativeEvent }) => handlePinKeyDown(index, nativeEvent.key)}
                      keyboardType="numeric"
                      maxLength={1}
                      secureTextEntry
                    />
                  ))}
                </View>
                {errorMessage !== '' && (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle" size={16} color="#ef4444" />
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  </View>
                )}
                <TouchableOpacity style={styles.btnPrimary} onPress={handlePinAuth}>
                  <Text style={styles.btnText}>Verify PIN</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setVerificationStep('initial')}>
                  <Text style={styles.backLink}>Back</Text>
                </TouchableOpacity>
              </View>
            )}

            {verificationStep === 'location' && (
              <View style={styles.modalBody}>
                <Text style={styles.modalText}>Checking your location...</Text>
                <Ionicons name="location" size={48} color="#ff8c00" style={styles.modalIcon} />
              </View>
            )}

            {verificationStep === 'success' && (
              <View style={styles.modalBody}>
                <Text style={styles.modalText}>Verification successful. Starting task...</Text>
                <Ionicons name="checkmark-circle" size={48} color="#22c55e" style={styles.modalIcon} />
              </View>
            )}

            {verificationStep === 'error' && (
              <View style={styles.modalBody}>
                <Text style={styles.modalText}>Verification failed.</Text>
                <Ionicons name="alert-circle" size={48} color="#ef4444" style={styles.modalIcon} />
                {errorMessage !== '' && <Text style={styles.errorText}>{errorMessage}</Text>}
                <TouchableOpacity style={styles.btnPrimary} onPress={closeModal}>
                  <Ionicons name="close" size={20} color="white" />
                  <Text style={styles.btnText}>Close</Text>
                </TouchableOpacity>
              </View>
            )}

          </View>
        </View>
      </Modal>

    </MainFrame>
  );
}

const CARD_BG = 'rgba(255,255,255,0.1)';
const BORDER  = 'rgba(255,255,255,0.15)';

const styles = StyleSheet.create({
  section: { width: '90%', marginBottom: 12, marginTop: 16 },
  taskTitle: { fontSize: 20, fontFamily: 'poppins-bold', color: 'white', marginBottom: 8 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,140,0,0.1)',
    borderWidth: 1, borderColor: 'rgba(255,140,0,0.3)',
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 11, fontFamily: 'poppins-bold', color: 'white' },

  infoCard: {
    width: '90%',
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    padding: 12,
    backgroundColor: CARD_BG,
    borderWidth: 1, borderColor: BORDER,
    borderRadius: 12,
    marginBottom: 8,
  },
  infoIcon: {
    width: 40, height: 40, borderRadius: 8,
    backgroundColor: 'rgba(255,140,0,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  infoIconAlt: {
    width: 40, height: 40, borderRadius: 8,
    backgroundColor: 'rgba(245,158,11,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  infoText: { flex: 1 },
  infoLabel: { fontSize: 11, color: '#9ca3af', marginBottom: 2 },
  infoValue: { fontSize: 13, fontFamily: 'poppins-bold', color: 'white' },

  card: {
    width: '90%',
    backgroundColor: CARD_BG,
    borderWidth: 1, borderColor: BORDER,
    borderRadius: 12, padding: 16,
    marginBottom: 12,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  cardTitle: { fontSize: 13, fontFamily: 'poppins-bold', color: 'white' },
  cardBody: { fontSize: 13, color: '#d1d5db', lineHeight: 20 },

  micBtn: {
    padding: 8, borderRadius: 8,
    backgroundColor: 'rgba(255,140,0,0.1)',
  },
  notesInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: BORDER,
    borderRadius: 8, padding: 10,
    color: 'white', fontSize: 13,
    minHeight: 100, textAlignVertical: 'top',
  },
  notesHint: { fontSize: 11, color: '#6b7280', marginTop: 6 },

  photoCount: { fontSize: 13, fontFamily: 'poppins-bold', color: '#ff8c00' },
  photoRow: { flexDirection: 'row', gap: 8 },
  photoSlot: {
    flex: 1, aspectRatio: 1,
    borderRadius: 8, borderWidth: 2,
    borderStyle: 'dashed', borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
  },
  photoSlotDone: { borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.1)' },

  actions: { width: '90%', gap: 10, marginBottom: 32 },
  btnPrimary: {
    backgroundColor: '#ff8c00',
    borderRadius: 12, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
  },
  btnOutline: {
    backgroundColor: CARD_BG,
    borderWidth: 2, borderColor: '#ff8c00',
    borderRadius: 12, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
  },
  btnSuccess: {
    backgroundColor: '#16a34a',
    borderRadius: 12, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
  },
  btnText: { fontSize: 14, fontFamily: 'poppins-bold', color: 'white' },
  btnOutlineText: { fontSize: 14, fontFamily: 'poppins-bold', color: '#ff8c00' },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#1c2330',
    borderWidth: 1, borderColor: BORDER,
    borderRadius: 16, padding: 20,
  },
  modalTitle: { fontSize: 17, fontFamily: 'poppins-bold', color: 'white' },
  modalBody: { gap: 16, marginTop: 12 },
  modalText: { fontSize: 13, color: '#d1d5db' },
  modalIcon: { alignSelf: 'center' },

  pinRow: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  pinInput: {
    width: 44, height: 44,
    textAlign: 'center', fontSize: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: BORDER,
    borderRadius: 8, color: 'white',
  },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 10, borderRadius: 8,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
  },
  errorText: { fontSize: 11, color: '#f87171', flex: 1 },
  backLink: { textAlign: 'center', color: '#9ca3af', fontSize: 13, paddingVertical: 8 },

  methodRow:       { flexDirection: 'row', gap: 8 },
  methodBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 10, paddingHorizontal: 12,
    borderRadius: 10, borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: 'rgba(26,43,66,0.85)',
  },
  methodBtnActive:   { borderColor: '#ff8c00', backgroundColor: 'rgba(255,140,0,0.15)' },
  methodLabel:       { fontSize: 12, color: '#9ca3af' },
  methodLabelActive: { fontFamily: 'poppins-bold', color: '#ff8c00' },
  scanButton: {
    width: 140, height: 140, borderRadius: 20, borderWidth: 3,
    borderColor: '#ff8c00', alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', backgroundColor: 'rgba(255,140,0,0.08)',
  },
  scanButtonScanning: { borderColor: '#9ca3af', backgroundColor: 'rgba(255,255,255,0.03)' },
  scanButtonFailed:   { borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.05)' },
  hintText:    { fontSize: 12, color: '#9ca3af', textAlign: 'center' },
  pinLink:     { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center' },
  pinLinkText: { fontSize: 13, fontFamily: 'poppins-bold', color: '#ff8c00', textDecorationLine: 'underline' },
  photoActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  photoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,140,0,0.4)',
    backgroundColor: 'rgba(255,140,0,0.08)',
  },
  photoBtnText: { fontSize: 12, fontFamily: 'poppins-bold', color: '#ff8c00' },

  taskDetail: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  assignRow: {
    width: '90%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginBottom: 8,
  },
  acceptBtn: {
    backgroundColor: '#ff8c00',
    borderRadius: 8, paddingVertical: 8,
    paddingHorizontal: 14,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6,
  },
  declineBtn: {
    backgroundColor: '#dc2626',
    borderRadius: 8, paddingVertical: 8,
    paddingHorizontal: 14,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6,
  },
});