import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../../theme';
import { useLoginMutation } from '../../services/api';
import { setCredentials } from '../../store/authSlice';
import { setTier } from '../../store/subscriptionSlice';
import { useAppDispatch } from '../../hooks/redux';
import type { AuthStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    try {
      const result = await login({ email: email.trim().toLowerCase(), password }).unwrap();
      const tier = (result.user.subscriptionTier as 'free' | 'pro') ?? 'free';
      dispatch(setCredentials({ user: { ...result.user, subscriptionTier: tier }, token: result.token }));
      dispatch(setTier(tier));
    } catch (err: any) {
      Alert.alert('Login Failed', err?.data?.message || 'Something went wrong');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="flash" size={40} color={colors.primary} />
          </View>
          <Text style={styles.title}>StuhDee</Text>
          <Text style={styles.subtitle}>Master anything, one card at a time</Text>
        </View>

        <View style={styles.whyAccount}>
          <View style={styles.whyRow}>
            <Ionicons name="cloud-outline" size={16} color={colors.primary} />
            <Text style={styles.whyText}>Cards sync across all your devices</Text>
          </View>
          <View style={styles.whyRow}>
            <Ionicons name="repeat-outline" size={16} color={colors.primary} />
            <Text style={styles.whyText}>Spaced repetition progress saved to your account</Text>
          </View>
          <View style={styles.whyRow}>
            <Ionicons name="bar-chart-outline" size={16} color={colors.primary} />
            <Text style={styles.whyText}>Study analytics and streaks tracked per user</Text>
          </View>
        </View>

        <View style={styles.form}>
          <Text style={styles.formTitle}>Welcome back</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>EMAIL</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="your@email.com"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>PASSWORD</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="••••••••"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPw}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPw(!showPw)} style={styles.eyeBtn}>
                <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.primaryBtnText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('Register')}>
            <Text style={styles.secondaryBtnText}>Create an account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  inner: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingTop: 60, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: spacing.lg },
  logoContainer: {
    width: 80, height: 80, borderRadius: radius.xl,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 1, borderColor: colors.primary + '40',
  },
  title: { ...typography.h1, marginBottom: spacing.xs },
  subtitle: { ...typography.bodyMuted, textAlign: 'center' },
  whyAccount: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  whyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  whyText: { ...typography.small, color: colors.textSecondary, flex: 1 },
  form: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.lg, borderWidth: 1, borderColor: colors.border,
  },
  formTitle: { ...typography.h3, marginBottom: spacing.lg },
  inputGroup: { marginBottom: spacing.md },
  label: { ...typography.label, marginBottom: spacing.xs },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.background, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md,
  },
  inputIcon: { marginRight: spacing.sm },
  input: { flex: 1, ...typography.body, paddingVertical: spacing.md, color: colors.textPrimary },
  eyeBtn: { padding: spacing.xs },
  primaryBtn: {
    backgroundColor: colors.primary, borderRadius: radius.full,
    paddingVertical: spacing.md + 2, alignItems: 'center', marginTop: spacing.md,
  },
  primaryBtnText: { ...typography.h4, color: colors.white },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.md },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { ...typography.small, marginHorizontal: spacing.sm },
  secondaryBtn: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.full,
    paddingVertical: spacing.md, alignItems: 'center',
  },
  secondaryBtnText: { ...typography.body, color: colors.textSecondary },
});
