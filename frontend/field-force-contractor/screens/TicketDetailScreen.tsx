import { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Modal, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MainFrame } from '../components/MainFrame';

const DEV_MODE = true;

export default function TicketDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { taskId } = route.params;

  const [taskStatus, setTaskStatus] = useState<'not_started' | 'in_progress' | 'ready_to_submit'>('not_started');
  const [notes, setNotes] = useState('');
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationStep, setVerificationStep] = useState<'initial' | 'biometric' | 'pin' | 'location' | 'success' | 'error'>('initial');
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [selectedMethod, setSelectedMethod] = useState<'face' | 'fingerprint'>('fingerprint');
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'failed'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const pinRefs = useRef<(TextInput | null)[]>([null, null, null, null, null, null]);

  const task = {
    id: taskId,
    title: 'Install Gas Pump at Station #42',
    status: taskStatus,
    deadline: 'March 21, 2026 at 5:00 PM',
    location: '1234 Main Street, San Francisco, CA 94102',
    description: 'Install new gas pump model XR-500 at station #42. Ensure proper connection to underground tank and test all safety mechanisms before completion.',
    photosRequired: 3,
    photosSubmitted: taskStatus === 'ready_to_submit' ? 3 : 0,
  };

  const toggleListening = () => {
    Alert.alert('Coming Soon', 'Voice input will be available in a future update.');
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

  const handleTakePhoto = () => {
    navigation.navigate('TakePhoto' as never, { taskId } as never);
  };

  const handleCompleteTask = () => {
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
      if (DEV_MODE) {
        setVerificationStep('location');
        setTimeout(() => {
          setVerificationStep('success');
          setTimeout(() => {
            setShowVerificationModal(false);
            setTaskStatus('in_progress');
            setScanState('idle');
          }, 2000);
        }, 1500);
        return;
      }
      // PRODUCTION: real LocalAuthentication
    }, 1500);
  };

  const handlePinAuth = () => {
    const pinString = pin.join('');
    if (pinString.length !== 6) {
      setErrorMessage('Please enter a complete 6-digit PIN');
      return;
    }
    setVerificationStep('location');
    setErrorMessage('');
    setTimeout(() => {
      const pinValid = pinString === '123456';
      if (pinValid) {
        setVerificationStep('success');
        setTimeout(() => {
          setShowVerificationModal(false);
          setTaskStatus('in_progress');
          setPin(['', '', '', '', '', '']);
        }, 2000);
      } else {
        setVerificationStep('error');
        setErrorMessage('Invalid PIN. Please try again.');
        setPin(['', '', '', '', '', '']);
      }
    }, 1500);
  };

  return (
    <MainFrame header='home'>

      {/* ── Back Header ── */}
      <View style={styles.backHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="white" />
        </TouchableOpacity>
        <View style={styles.backHeaderText}>
          <Text style={styles.backTitle}>Task Details</Text>
          <Text style={styles.backSubtitle}>ID: #{task.id}</Text>
        </View>
      </View>

      {/* ── Task Title + Status ── */}
      <View style={styles.section}>
        <Text style={styles.taskTitle}>{task.title}</Text>
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, {
            backgroundColor:
              taskStatus === 'not_started' ? '#6b7280' :
              taskStatus === 'in_progress' ? '#f97316' : '#22c55e'
          }]} />
          <Text style={styles.statusText}>
            {taskStatus === 'not_started' ? 'Not Started' :
             taskStatus === 'in_progress' ? 'In Progress' : 'Ready to Submit'}
          </Text>
        </View>
      </View>

      {/* ── Location ── */}
      <View style={styles.infoCard}>
        <View style={styles.infoIcon}>
          <Ionicons name="location" size={18} color="#ff8c00" />
        </View>
        <View style={styles.infoText}>
          <Text style={styles.infoLabel}>Location</Text>
          <Text style={styles.infoValue}>{task.location}</Text>
        </View>
      </View>

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

      {/* ── Description ── */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Description</Text>
        <Text style={styles.cardBody}>{task.description}</Text>
      </View>

      {/* ── Notes — only when in progress ── */}
      {taskStatus !== 'not_started' && (
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.cardTitle}>Notes & Issues</Text>
            <TouchableOpacity style={styles.micBtn} onPress={toggleListening}>
              <Ionicons name="mic" size={18} color="#ff8c00" />
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

      {/* ── Photos — only when in progress ── */}
      {taskStatus !== 'not_started' && (
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.cardTitle}>Photo Submissions</Text>
            <Text style={styles.photoCount}>{task.photosSubmitted}/{task.photosRequired}</Text>
          </View>
          <View style={styles.photoRow}>
            {[...Array(task.photosRequired)].map((_, index) => (
              <View key={index} style={[
                styles.photoSlot,
                index < task.photosSubmitted && styles.photoSlotDone
              ]}>
                <Ionicons
                  name={index < task.photosSubmitted ? 'checkmark-circle' : 'camera'}
                  size={24}
                  color={index < task.photosSubmitted ? '#22c55e' : '#6b7280'}
                />
              </View>
            ))}
          </View>
        </View>
      )}

      {/* ── Action Buttons ── */}
      <View style={styles.actions}>
        {taskStatus === 'not_started' && (
          <TouchableOpacity style={styles.btnPrimary} onPress={handleStartTask}>
            <Ionicons name="play" size={20} color="white" />
            <Text style={styles.btnText}>Start Task</Text>
          </TouchableOpacity>
        )}

        {taskStatus === 'in_progress' && (
          <>
            <TouchableOpacity style={styles.btnPrimary} onPress={handleTakePhoto}>
              <Ionicons name="camera" size={20} color="white" />
              <Text style={styles.btnText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnOutline} onPress={() => navigation.navigate('UploadPhoto' as never, { taskId } as never)}>
              <Ionicons name="cloud-upload-outline" size={20} color="#ff8c00" />
              <Text style={styles.btnOutlineText}>Upload Photo</Text>
            </TouchableOpacity>
          </>
        )}

        {taskStatus === 'ready_to_submit' && (
          <TouchableOpacity style={styles.btnSuccess} onPress={handleCompleteTask}>
            <Ionicons name="checkmark-circle" size={20} color="white" />
            <Text style={styles.btnText}>Complete Task</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Verification Modal ── */}
      <Modal visible={showVerificationModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>

            <View style={styles.cardRow}>
              <Text style={styles.modalTitle}>Task Verification</Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={20} color="white" />
              </TouchableOpacity>
            </View>

            {(verificationStep === 'initial' || verificationStep === 'biometric') && (
              <View style={styles.modalBody}>
                <Text style={styles.modalText}>Verify your identity to start this task.</Text>

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

                {scanState === 'failed' && (
                  <>
                    <Text style={styles.errorText}>Scan failed — please try again.</Text>
                    <TouchableOpacity style={styles.btnPrimary} onPress={() => setScanState('idle')}>
                      <Text style={styles.btnText}>Retry</Text>
                    </TouchableOpacity>
                  </>
                )}

                <TouchableOpacity style={styles.pinLink} onPress={() => setVerificationStep('pin')}>
                  <Ionicons name="keypad-outline" size={16} color="#ff8c00" />
                  <Text style={styles.pinLinkText}>Use PIN instead</Text>
                </TouchableOpacity>
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
  backHeader: {
    width: '90%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    marginBottom: 16,
  },
  backBtn: {
    width: 40, height: 40,
    borderRadius: 8,
    backgroundColor: CARD_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backHeaderText: { flex: 1 },
  backTitle: { fontSize: 17, fontFamily: 'poppins-bold', color: 'white' },
  backSubtitle: { fontSize: 11, color: '#9ca3af' },

  section: { width: '90%', marginBottom: 12 },
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
});
