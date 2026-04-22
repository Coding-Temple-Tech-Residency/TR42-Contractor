import { Ionicons } from "@expo/vector-icons";
import * as LocalAuthentication from "expo-local-authentication";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { MainFrame } from "../components/MainFrame";
import { colors, fontSize, fonts, radius, spacing } from "../constants/theme";

interface SessionLockScreenProps {
  onUnlock: () => void;
}

export default function SessionLockScreen({
  onUnlock,
}: SessionLockScreenProps) {
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [errorText, setErrorText] = useState("");

  const handleUnlock = async () => {
    if (isUnlocking) return;

    setIsUnlocking(true);
    setErrorText("");

    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !enrolled) {
        setErrorText(
          "Biometric or device passcode is not configured on this device.",
        );
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate to continue",
        cancelLabel: "Cancel",
      });

      if (result.success) {
        onUnlock();
      } else if (
        result.error !== "user_cancel" &&
        result.error !== "system_cancel"
      ) {
        setErrorText("Authentication failed. Please try again.");
      }
    } catch {
      setErrorText(
        "Authentication is currently unavailable. Please try again.",
      );
    } finally {
      setIsUnlocking(false);
    }
  };

  useEffect(() => {
    handleUnlock();
  }, []);

  return (
    <MainFrame
      header="default"
      headerMenu={["Menu2", ["Session Locked"]]}
      footerMenu={["none", []]}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      <View style={styles.container}>
        <View style={styles.iconWrap}>
          <Ionicons name="lock-closed" size={64} color={colors.primary} />
        </View>

        <Text style={styles.title}>Session Locked</Text>
        <Text style={styles.subtitle}>
          Please authenticate to continue your active session.
        </Text>

        {errorText !== "" && (
          <View style={styles.errorBanner}>
            <Ionicons
              name="alert-circle-outline"
              size={16}
              color={colors.error}
            />
            <Text style={styles.errorText}>{errorText}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.unlockBtn, isUnlocking && styles.unlockBtnDisabled]}
          onPress={handleUnlock}
          activeOpacity={0.85}
          disabled={isUnlocking}
        >
          {isUnlocking ? (
            <ActivityIndicator color={colors.textWhite} />
          ) : (
            <>
              <Ionicons
                name="finger-print"
                size={18}
                color={colors.textWhite}
              />
              <Text style={styles.unlockText}>Unlock</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </MainFrame>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },

  iconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryFaint,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },

  title: {
    fontFamily: fonts.bold,
    fontSize: fontSize.xl,
    color: colors.textWhite,
    letterSpacing: 1,
  },

  subtitle: {
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.textLight,
    textAlign: "center",
    maxWidth: 320,
  },

  errorBanner: {
    marginTop: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.errorBorder,
    backgroundColor: colors.errorBg,
  },

  errorText: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.errorTitle,
  },

  unlockBtn: {
    marginTop: spacing.md,
    minWidth: 180,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },

  unlockBtnDisabled: {
    opacity: 0.7,
  },

  unlockText: {
    fontFamily: fonts.bold,
    fontSize: fontSize.base,
    color: colors.textWhite,
  },
});
