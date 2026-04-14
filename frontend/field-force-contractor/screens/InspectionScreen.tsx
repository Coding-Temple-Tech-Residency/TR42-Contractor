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

  // Fetch the active checklist template on mount
  useEffect(() => {
    const fetchChecklist = async () => {
      try {
        const data = await api.authGet<ChecklistTemplate>('/inspections/checklist');
        setTemplate(data);
        // Auto-expand the first section
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
    fetchChecklist();
  }, []);

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
      <MainFrame>
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
      <MainFrame>
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

      {/* ── Truck image + title card ───────────────────────────────── */}
      <View style={styles.truckCard}>
        <View style={styles.truckImageWrap}>
          <Ionicons name="bus-outline" size={64} color="#8a9bb8" />
        </View>
        <Text style={styles.truckTitle}>{template.name}</Text>
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
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    alignItems: 'center',
    padding: 16,
    marginBottom: 16,
  },
  truckImageWrap: {
    width: '100%',
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    marginBottom: 10,
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
    backgroundColor: RED,
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
