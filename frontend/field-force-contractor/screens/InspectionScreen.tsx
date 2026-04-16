// InspectionScreen.tsx
// Full-screen truck inspection checklist. Appears before a shift starts
// if the contractor hasn't inspected their equipment yet.
//
// Checklist sections and items are fetched dynamically from the backend.
// "No Issues Found" marks everything passed and submits immediately.
// Otherwise the contractor checks items individually and taps "Submit Inspection".

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { MainFrame } from '../components/MainFrame';
import { api, ApiError } from '../utils/api';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Inspection'>;

// ── Types matching the backend response ─────────────────────────────────────

type ChecklistItem = {
  id: number;
  label: string;
  display_order: number;
  section_id: number;
};

type ChecklistSection = {
  id: number;
  name: string;
  display_order: number;
  items: ChecklistItem[];
};

type ChecklistTemplate = {
  id: number;
  name: string;
  description: string;
  sections: ChecklistSection[];
};

// ── Constants ───────────────────────────────────────────────────────────────

const CARD_BG = 'rgba(255,255,255,0.1)';
const BORDER  = 'rgba(255,255,255,0.15)';
const BLUE    = '#3b82f6';
const RED     = '#ef4444';
const GREEN   = '#22c55e';

export default function InspectionScreen() {
  const navigation = useNavigation<Nav>();

  const [template,      setTemplate]      = useState<ChecklistTemplate | null>(null);
  const [loading,       setLoading]        = useState(true);
  const [error,         setError]          = useState('');
  const [expandedId,    setExpandedId]     = useState<number | null>(null);
  const [checkedItems,  setCheckedItems]   = useState<Set<number>>(new Set());
  const [isSubmitting,  setIsSubmitting]   = useState(false);
  const [submitError,   setSubmitError]    = useState('');

  // On mount:
  //   1. Check if today's inspection is already done (submitted, no-issues,
  //      or skipped). If so → forward straight to Home. This is what makes
  //      the screen a "gate" — it only blocks the first login of the day.
  //   2. Otherwise load the checklist template for display.
  useEffect(() => {
    const run = async () => {
      // Step 1 — inspection gate
      try {
        const latest = await api.authGet<{ submitted_at?: string; created_at?: string }>(
          '/inspections/latest',
        );
        const when = latest.submitted_at ?? latest.created_at;
        if (when) {
          const sameDay =
            new Date(when).toLocaleDateString() === new Date().toLocaleDateString();
          if (sameDay) {
            navigation.replace('Dashboard');
            return;
          }
        }
      } catch (err) {
        // 404 = no inspections yet. Any other failure: let the user try the
        // checklist flow — the submit call will surface any real API issue.
      }

      // Step 2 — load the checklist template
      try {
        const data = await api.authGet<ChecklistTemplate>('/inspections/checklist');
        setTemplate(data);
        if (data.sections.length > 0) {
          setExpandedId(data.sections[0].id);
        }
      } catch (err) {
        const apiErr = err as ApiError;
        setError(apiErr.error || 'Failed to load inspection checklist.');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [navigation]);

  // Toggle a checkbox on/off
  const toggleItem = (itemId: number) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  // Toggle which section is expanded (accordion style)
  const toggleSection = (sectionId: number) => {
    setExpandedId(prev => (prev === sectionId ? null : sectionId));
  };

  // User tapped the X — record the skip server-side (flag only, no results)
  // then continue into the app. Per Jonathan: leadership still needs to see
  // who bypassed inspection, so we log it instead of dropping the call.
  const handleSkip = async () => {
    if (!template) return;
    setIsSubmitting(true);
    setSubmitError('');

    try {
      await api.authPost('/inspections/submit', {
        template_id: template.id,
        skipped: true,
      });
      navigation.replace('Dashboard');
    } catch (err) {
      const apiErr = err as ApiError;
      setSubmitError(apiErr.error || 'Failed to skip inspection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit with "No Issues Found" — auto-pass everything
  const handleNoIssues = async () => {
    if (!template) return;
    setIsSubmitting(true);
    setSubmitError('');

    try {
      await api.authPost('/inspections/submit', {
        template_id: template.id,
        no_issues_found: true,
      });
      navigation.replace('Dashboard');
    } catch (err) {
      const apiErr = err as ApiError;
      setSubmitError(apiErr.error || 'Failed to submit inspection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit with individual item results
  const handleSubmit = async () => {
    if (!template) return;
    setIsSubmitting(true);
    setSubmitError('');

    // Build results array — checked = passed, unchecked = failed
    const allItems = template.sections.flatMap(s => s.items);
    const results = allItems.map(item => ({
      item_id: item.id,
      passed: checkedItems.has(item.id),
    }));

    try {
      await api.authPost('/inspections/submit', {
        template_id: template.id,
        no_issues_found: false,
        results,
      });
      navigation.replace('Dashboard');
    } catch (err) {
      const apiErr = err as ApiError;
      setSubmitError(apiErr.error || 'Failed to submit inspection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <MainFrame header="default" headerMenu={["none"]} footerMenu={["none"]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={BLUE} />
          <Text style={styles.loadingText}>Loading checklist...</Text>
        </View>
      </MainFrame>
    );
  }


  // ── Error state ───────────────────────────────────────────────────────────
  if (error || !template) {
    return (
      <MainFrame header="default" headerMenu={["none"]} footerMenu={["none"]}>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={RED} />
          <Text style={styles.errorText}>{error || 'No inspection template found.'}</Text>
        </View>
      </MainFrame>
    );
  }

  // ── Main content ──────────────────────────────────────────────────────────
  return (
    <MainFrame>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <View style={styles.headerBlock}>
        <Text style={styles.headerTitle}>Inspection Required</Text>
      </View>

      {/* ── Truck image + title card + skip (X) button ──────────────
          Asset: TankerTruckBackgroundbanner.png — provided by Jonathan
          (stored locally as assets/images/truck.png). Stakeholders haven't
          asked for per-vehicle photos yet, so it stays static for now.
          The X button flags the inspection as skipped server-side and
          routes the user into the app.                                 */}
      <View style={styles.truckCard}>
        <View style={styles.truckImageWrap}>
          <Image
            source={require('../assets/images/truck.png')}
            style={styles.truckImage}
            resizeMode="cover"
          />
          <TouchableOpacity
            style={styles.skipBtn}
            onPress={handleSkip}
            disabled={isSubmitting}
            activeOpacity={0.7}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          >
            <Ionicons name="close" size={20} color="white" />
          </TouchableOpacity>
        </View>
        <View style={styles.truckTitleStrip}>
          <Text style={styles.truckTitle}>{template.name}</Text>
        </View>
      </View>

      {/* ── Checklist sections (accordion) ─────────────────────────── */}
      {template.sections.map(section => {
        const isExpanded = expandedId === section.id;
        const sectionItemIds = section.items.map(i => i.id);
        const checkedCount = sectionItemIds.filter(id => checkedItems.has(id)).length;

        return (
          <View key={section.id} style={styles.sectionWrap}>

            {/* Section header — tappable to expand/collapse */}
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleSection(section.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.sectionTitle}>{section.name}</Text>
              <View style={styles.sectionRight}>
                <Text style={styles.sectionCount}>
                  {checkedCount}/{section.items.length}
                </Text>
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color="white"
                />
              </View>
            </TouchableOpacity>

            {/* Expanded items */}
            {isExpanded && (
              <View style={styles.itemsList}>
                {section.items.map(item => {
                  const isChecked = checkedItems.has(item.id);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.itemRow}
                      onPress={() => toggleItem(item.id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={isChecked ? 'checkbox' : 'square-outline'}
                        size={22}
                        color={isChecked ? GREEN : '#9ca3af'}
                      />
                      <Text style={[styles.itemLabel, isChecked && styles.itemLabelChecked]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        );
      })}

      {/* ── Submit error ──────────────────────────────────────────── */}
      {submitError !== '' && (
        <View style={styles.submitErrorWrap}>
          <Ionicons name="alert-circle-outline" size={16} color={RED} />
          <Text style={styles.submitErrorText}>{submitError}</Text>
        </View>
      )}

      {/* ── Action buttons ────────────────────────────────────────── */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.btn, styles.noIssuesBtn]}
          onPress={handleNoIssues}
          disabled={isSubmitting}
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.btnText}>No Issues Found</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.submitBtn]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.btnText}>Submit Inspection</Text>
          )}
        </TouchableOpacity>
      </View>

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
    paddingHorizontal: 24,
  },
  loadingText: { color: '#9ca3af', fontSize: 14, fontFamily: 'poppins-regular' },
  errorText:   { color: RED, fontSize: 14, fontFamily: 'poppins-regular', textAlign: 'center' },

  // ── Header ──────────────────────────────────────────────────────────────
  headerBlock: {
    width: '90%',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'poppins-bold',
    color: 'white',
  },

  // ── Truck card ──────────────────────────────────────────────────────────
  truckCard: {
    width: '90%',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 12,
  },
  truckImageWrap: {
    width: '100%',
    height: 110,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  truckImage: {
    width: '100%',
    height: '100%',
  },
  // X button — top-right corner of the truck banner. Skips the inspection.
  skipBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  truckTitleStrip: {
    width: '100%',
    backgroundColor: BLUE,
    paddingVertical: 10,
    alignItems: 'center',
  },
  truckTitle: {
    fontSize: 16,
    fontFamily: 'poppins-bold',
    color: 'white',
  },

  // ── Sections ────────────────────────────────────────────────────────────
  sectionWrap: {
    width: '90%',
    marginBottom: 4,
  },
  sectionHeader: {
    backgroundColor: BLUE,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'poppins-bold',
    color: 'white',
    flex: 1,
  },
  sectionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionCount: {
    fontSize: 12,
    fontFamily: 'poppins-regular',
    color: 'rgba(255,255,255,0.7)',
  },

  // ── Items list ──────────────────────────────────────────────────────────
  itemsList: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  itemLabel: {
    fontSize: 14,
    fontFamily: 'poppins-regular',
    color: '#1f2937',
    flex: 1,
  },
  itemLabelChecked: {
    color: '#6b7280',
  },

  // ── Submit error ────────────────────────────────────────────────────────
  submitErrorWrap: {
    width: '90%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  submitErrorText: {
    color: RED,
    fontSize: 13,
    fontFamily: 'poppins-regular',
    flex: 1,
  },

  // ── Buttons ─────────────────────────────────────────────────────────────
  buttonRow: {
    width: '90%',
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    marginBottom: 24,
  },
  btn: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: 'center',
  },
  noIssuesBtn: {
    backgroundColor: GREEN,
  },
  submitBtn: {
    backgroundColor: BLUE,
  },
  btnText: {
    fontSize: 14,
    fontFamily: 'poppins-bold',
    color: 'white',
  },
});
