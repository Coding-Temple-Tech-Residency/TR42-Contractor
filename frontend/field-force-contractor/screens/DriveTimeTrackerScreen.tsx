// DriveTimeTrackerScreen.tsx
// FMCSA-style drive time tracker. Shows current duty status, live timers,
// progress bar, and a driving log table. Contractors can toggle between
// On Duty, Driving, Off Duty, and Sleeper Berth statuses.

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { MainFrame } from '../components/MainFrame';
import { api, ApiError } from '../utils/api';

type Nav = NativeStackNavigationProp<RootStackParamList, 'DriveTimeTracker'>;

// ── Types matching backend response ────────────────────────────────────────

type DutyLog = {
  id: number;
  status: string;
  start_time: string;
  end_time: string | null;
  duration_seconds: number | null;
};

type DutySession = {
  id: number;
  contractor_id: number;
  current_status: string;
  session_date: string;
  is_active: boolean;
  logs: DutyLog[];
};

type SessionResponse = {
  session: DutySession | null;
  driving_seconds: number;
  remaining_seconds: number;
  cycle_seconds: number;
};

type StatusResponse = {
  message: string;
  session: DutySession;
  driving_seconds: number;
  remaining_seconds: number;
};

// ── Constants ──────────────────────────────────────────────────────────────

const BLUE       = '#3b82f6';
const RED        = '#ef4444';
const GREEN      = '#22c55e';
const ORANGE     = '#ff8c00';
const DARK_BG    = 'rgba(255,255,255,0.08)';
const CARD_BG    = 'rgba(255,255,255,0.06)';
const BORDER     = 'rgba(255,255,255,0.12)';
const MAX_DRIVE  = 11 * 3600;   // 11-hour daily driving limit
const CYCLE_MAX  = 70 * 3600;   // 70-hour / 8-day cycle

type DutyStatus = 'on_duty' | 'driving' | 'off_duty' | 'sleeper_berth';

const STATUS_CONFIG: Record<DutyStatus, { label: string; color: string }> = {
  on_duty:       { label: 'On Duty',      color: BLUE },
  driving:       { label: 'Driving',      color: GREEN },
  off_duty:      { label: 'Off Duty',     color: ORANGE },
  sleeper_berth: { label: 'Sleep Berth',  color: '#8b5cf6' },
};

const STATUS_ORDER: DutyStatus[] = ['on_duty', 'driving', 'off_duty', 'sleeper_berth'];

// ── Helpers ────────────────────────────────────────────────────────────────

function formatHMS(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// Robust backend-date parser.
// Handles:
//   • Python/Marshmallow ISO with microseconds ("...45.123456") — Hermes
//     only accepts up to millisecond precision, so we trim extra digits.
//   • Strings missing a timezone (treat as UTC).
//   • Strings with an existing Z or ±HH:MM offset (leave untouched).
function parseBackendDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  // Trim microseconds (6 digits) → milliseconds (3 digits)
  const trimmed = iso.replace(/(\.\d{3})\d+/, '$1');
  const hasTz   = /(Z|[+-]\d{2}:?\d{2})$/.test(trimmed);
  const d       = new Date(hasTz ? trimmed : trimmed + 'Z');
  return isNaN(d.getTime()) ? null : d;
}

function formatTime12(iso: string): string {
  const d = parseBackendDate(iso);
  if (!d) return '--';
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function statusLabel(status: string): string {
  return STATUS_CONFIG[status as DutyStatus]?.label ?? status;
}

// ── Component ──────────────────────────────────────────────────────────────

export default function DriveTimeTrackerScreen() {
  const navigation = useNavigation<Nav>();

  const [session, setSession]           = useState<DutySession | null>(null);
  const [drivingSecs, setDrivingSecs]   = useState(0);
  const [remainingSecs, setRemainingSecs] = useState(MAX_DRIVE);
  const [cycleSecs, setCycleSecs]       = useState(0);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [changing, setChanging]         = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch current session on mount
  const fetchSession = useCallback(async () => {
    try {
      const data = await api.authGet<SessionResponse>('/drive-time/current');
      setSession(data.session);
      setDrivingSecs(data.driving_seconds);
      setRemainingSecs(data.remaining_seconds);
      setCycleSecs(data.cycle_seconds);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.error || 'Failed to load drive time data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Live ticker — increments driving seconds every second when status is driving
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (session?.current_status === 'driving' && session.is_active) {
      timerRef.current = setInterval(() => {
        setDrivingSecs(prev => prev + 1);
        setRemainingSecs(prev => Math.max(0, prev - 1));
        setCycleSecs(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [session?.current_status, session?.is_active]);

  // Change duty status — also creates a session if none exists for today
  const changeStatus = async (newStatus: DutyStatus) => {
    if (changing) return;
    if (session?.is_active && session?.current_status === newStatus) return;

    setChanging(true);
    setError('');

    try {
      const data = await api.authPost<StatusResponse>('/drive-time/status', {
        status: newStatus,
      });
      setSession(data.session);
      setDrivingSecs(data.driving_seconds);
      setRemainingSecs(data.remaining_seconds);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.error || 'Failed to change status.');
    } finally {
      setChanging(false);
    }
  };

  // Stop session
  const stopSession = async () => {
    if (changing) return;
    setChanging(true);
    setError('');

    try {
      await api.authPost('/drive-time/stop', {});
      // Refresh to get final state
      await fetchSession();
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.error || 'Failed to stop session.');
    } finally {
      setChanging(false);
    }
  };

  // Progress bar percentage (0–1) based on 11-hour driving limit
  const progressPct = Math.min(1, drivingSecs / MAX_DRIVE);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <MainFrame header="default" headerMenu={["none"]} footerMenu={["none"]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={BLUE} />
          <Text style={styles.loadingText}>Loading drive time...</Text>
        </View>
      </MainFrame>
    );
  }

  const currentStatus = (session?.current_status ?? 'off_duty') as DutyStatus;
  const isActive = session?.is_active ?? false;
  const logs = session?.logs ?? [];

  return (
    <MainFrame headerMenu={["Menu2", ["Drive Time Tracker"]]}>

      {/* Header is rendered by the Menu2 bar in MainFrame above
          (back arrow + "Drive Time Tracker" title). Removed the
          duplicate custom headerBlock that used to live here. */}

      {/* ── Status buttons ─────────────────────────────────────── */}
      <View style={styles.statusRow}>
        {STATUS_ORDER.map(status => {
          const cfg = STATUS_CONFIG[status];
          const isSelected = currentStatus === status;
          return (
            <TouchableOpacity
              key={status}
              style={[
                styles.statusBtn,
                { borderColor: cfg.color },
                isSelected && { backgroundColor: cfg.color },
              ]}
              onPress={() => changeStatus(status)}
              disabled={changing}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.statusBtnText,
                { color: isSelected ? 'white' : cfg.color },
              ]}>
                {cfg.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Time counters ──────────────────────────────────────── */}
      <View style={styles.timersRow}>
        <View style={styles.timerBlock}>
          <Text style={styles.timerLabel}>Current Drive Time</Text>
          <Text style={styles.timerValue}>{formatHMS(drivingSecs)}</Text>
        </View>
        <View style={styles.timerBlock}>
          <Text style={styles.timerLabel}>Time Remaining</Text>
          <Text style={styles.timerValue}>{formatHMS(remainingSecs)}</Text>
        </View>
        <View style={styles.timerBlock}>
          <Text style={styles.timerLabel}>70 Hour</Text>
          <Text style={styles.timerValue}>{formatHMS(cycleSecs)}</Text>
        </View>
      </View>

      {/* ── Progress bar ───────────────────────────────────────── */}
      <View style={styles.progressCard}>
        <Text style={styles.progressTitle}>Driving Time Progress</Text>

        {/* Hour markers */}
        <View style={styles.hourMarkersRow}>
          {[0, 4, 8, 12, 15].map(h => (
            <Text key={h} style={styles.hourMarker}>{h}h</Text>
          ))}
        </View>

        {/* Bar */}
        <View style={styles.progressBarBg}>
          <View style={[
            styles.progressBarFill,
            {
              width: `${progressPct * 100}%`,
              backgroundColor: progressPct > 0.9 ? RED : ORANGE,
            },
          ]} />
          {/* Truck icon at the progress tip */}
          <View style={[styles.progressIcon, { left: `${Math.min(progressPct * 100, 95)}%` }]}>
            <Ionicons name="bus" size={16} color="white" />
          </View>
        </View>

        <Text style={styles.progressSubtext}>
          {formatHMS(drivingSecs)} / {formatHMS(MAX_DRIVE)} max
        </Text>
      </View>

      {/* ── Driving Log table ──────────────────────────────────── */}
      <View style={styles.logCard}>
        <Text style={styles.logTitle}>Driving Log</Text>

        {/* Table header */}
        <View style={styles.logHeaderRow}>
          <Text style={[styles.logHeaderCell, { flex: 1.2 }]}>Start Time</Text>
          <Text style={[styles.logHeaderCell, { flex: 1.2 }]}>End Time</Text>
          <Text style={[styles.logHeaderCell, { flex: 1 }]}>Duration</Text>
          <Text style={[styles.logHeaderCell, { flex: 1 }]}>Status</Text>
        </View>

        {/* Log rows */}
        {logs.length === 0 ? (
          <View style={styles.emptyRow}>
            <Text style={styles.emptyText}>No logs yet. Change status to start tracking.</Text>
          </View>
        ) : (
          logs.map(log => {
            const startDate = parseBackendDate(log.start_time);
            const endDate   = parseBackendDate(log.end_time);
            const durSecs   = log.duration_seconds
              ?? (startDate
                ? Math.floor(((endDate ?? new Date()).getTime() - startDate.getTime()) / 1000)
                : 0);

            return (
              <View key={log.id} style={styles.logRow}>
                <Text style={[styles.logCell, { flex: 1.2 }]}>
                  {formatTime12(log.start_time)}
                </Text>
                <Text style={[styles.logCell, { flex: 1.2 }]}>
                  {log.end_time ? formatTime12(log.end_time) : '--'}
                </Text>
                <Text style={[styles.logCell, { flex: 1 }]}>
                  {formatDuration(durSecs)}
                </Text>
                <Text style={[styles.logCell, { flex: 1, color: STATUS_CONFIG[log.status as DutyStatus]?.color ?? 'white' }]}>
                  {statusLabel(log.status)}
                </Text>
              </View>
            );
          })
        )}
      </View>

      {/* ── Error ──────────────────────────────────────────────── */}
      {error !== '' && (
        <View style={styles.errorWrap}>
          <Ionicons name="alert-circle-outline" size={16} color={RED} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* ── Bottom CTA ────────────────────────────────────────── */}
      {!session ? (
        // No session yet — prompt to start by tapping a status button
        <TouchableOpacity
          style={[styles.stopBtn, { backgroundColor: GREEN }]}
          onPress={() => changeStatus('on_duty')}
          disabled={changing}
          activeOpacity={0.85}
        >
          {changing ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.stopBtnText}>Start Shift</Text>
          )}
        </TouchableOpacity>
      ) : !isActive ? (
        // Session ended — allow starting a new one
        <TouchableOpacity
          style={[styles.stopBtn, { backgroundColor: BLUE }]}
          onPress={() => changeStatus('on_duty')}
          disabled={changing}
          activeOpacity={0.85}
        >
          {changing ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.stopBtnText}>Start New Shift</Text>
          )}
        </TouchableOpacity>
      ) : (
        // Active session — stop it
        <TouchableOpacity
          style={styles.stopBtn}
          onPress={stopSession}
          disabled={changing}
          activeOpacity={0.85}
        >
          {changing ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.stopBtnText}>Stop Driving</Text>
          )}
        </TouchableOpacity>
      )}

    </MainFrame>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: { color: '#9ca3af', fontSize: 14, fontFamily: 'poppins-regular' },

  // ── Header ─────────────────────────────────────────────────────────────
  headerBlock: {
    width: '90%',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
    gap: 12,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'poppins-bold',
    color: 'white',
  },

  // ── Status buttons ─────────────────────────────────────────────────────
  statusRow: {
    width: '90%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 16,
  },
  statusBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
  },
  statusBtnText: {
    fontSize: 13,
    fontFamily: 'poppins-bold',
  },

  // ── Timers ─────────────────────────────────────────────────────────────
  timersRow: {
    width: '90%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  timerBlock: {
    alignItems: 'center',
    flex: 1,
  },
  timerLabel: {
    fontSize: 11,
    fontFamily: 'poppins-regular',
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 4,
  },
  timerValue: {
    fontSize: 18,
    fontFamily: 'poppins-bold',
    color: 'white',
  },

  // ── Progress ───────────────────────────────────────────────────────────
  progressCard: {
    width: '90%',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 14,
    fontFamily: 'poppins-bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  hourMarkersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  hourMarker: {
    fontSize: 10,
    fontFamily: 'poppins-regular',
    color: '#6b7280',
  },
  progressBarBg: {
    width: '100%',
    height: 12,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    overflow: 'visible',
    position: 'relative',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressIcon: {
    position: 'absolute',
    top: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressSubtext: {
    fontSize: 11,
    fontFamily: 'poppins-regular',
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },

  // ── Log table ──────────────────────────────────────────────────────────
  logCard: {
    width: '90%',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  logTitle: {
    fontSize: 14,
    fontFamily: 'poppins-bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  logHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 8,
    marginBottom: 4,
  },
  logHeaderCell: {
    fontSize: 11,
    fontFamily: 'poppins-bold',
    color: '#374151',
  },
  logRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  logCell: {
    fontSize: 12,
    fontFamily: 'poppins-regular',
    color: '#1f2937',
  },
  emptyRow: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    fontFamily: 'poppins-regular',
    color: '#9ca3af',
  },

  // ── Error ──────────────────────────────────────────────────────────────
  errorWrap: {
    width: '90%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  errorText: {
    color: RED,
    fontSize: 13,
    fontFamily: 'poppins-regular',
    flex: 1,
  },

  // ── Stop button ────────────────────────────────────────────────────────
  stopBtn: {
    width: '90%',
    backgroundColor: RED,
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  stopBtnDisabled: {
    backgroundColor: '#6b7280',
  },
  stopBtnText: {
    fontSize: 16,
    fontFamily: 'poppins-bold',
    color: 'white',
  },
});
