import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useAuthStore } from '../../store/auth.store';
import { AuthService } from '../../services/auth.service';

export default function LoginScreen({ navigation }: any) {
  const [loginMode, setLoginMode] = useState<'PASSWORD' | 'OTP'>('PASSWORD');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // OTP Login state
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpHint, setOtpHint] = useState<string | null>(null);

  const { login, loginWithOtp, isLoading, error, clearError } = useAuthStore();

  const handlePasswordLogin = async () => {
    if (!email.trim() || !password.trim()) {
      return;
    }
    clearError();
    try {
      await login({ email: email.trim(), password: password.trim() });
    } catch {
      // Handled in store
    }
  };

  const handleSendLoginOtp = async () => {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Validation Error', 'Please enter a valid email address to receive OTP.');
      return;
    }

    clearError();
    try {
      setSendingOtp(true);
      const res = await AuthService.sendOtp(email.trim());
      setOtpHint(res.otpDebug || '123456');
      setIsOtpSent(true);
      Alert.alert(
        'Gmail OTP Sent ✉️',
        `A 6-digit verification code was sent to ${email.trim()}. Check your inbox or use dev code (${res.otpDebug || '123456'}).`
      );
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error?.message || err.message || 'Failed to send OTP.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleOtpLogin = async () => {
    if (!email.trim() || !otpCode.trim()) {
      Alert.alert('Validation Error', 'Please enter your email and the 6-digit OTP code.');
      return;
    }

    clearError();
    try {
      await loginWithOtp(email.trim(), otpCode.trim());
    } catch {
      // Handled in store
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.headerContainer}>
            <Text style={styles.logo}>🍽️</Text>
            <Text style={styles.title}>Welcome to PQM Kitchen</Text>
            <Text style={styles.subtitle}>Sign in to your customer account</Text>

            {/* Login Mode Toggle Tabs */}
            <View style={styles.modeTabRow}>
              <TouchableOpacity
                style={[styles.modeTab, loginMode === 'PASSWORD' && styles.modeTabActive]}
                onPress={() => {
                  setLoginMode('PASSWORD');
                  clearError();
                }}
              >
                <Text style={[styles.modeTabText, loginMode === 'PASSWORD' && styles.modeTabTextActive]}>
                  Password Sign In
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeTab, loginMode === 'OTP' && styles.modeTabActive]}
                onPress={() => {
                  setLoginMode('OTP');
                  clearError();
                }}
              >
                <Text style={[styles.modeTabText, loginMode === 'OTP' && styles.modeTabTextActive]}>
                  Gmail OTP Sign In ✉️
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="name@example.com"
                placeholderTextColor="#999"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (error) clearError();
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
            </View>

            {loginMode === 'PASSWORD' ? (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="#999"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (error) clearError();
                    }}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                </View>

                <TouchableOpacity
                  style={[styles.primaryButton, (!email.trim() || !password.trim() || isLoading) && styles.buttonDisabled]}
                  onPress={handlePasswordLogin}
                  disabled={isLoading || !email.trim() || !password.trim()}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.buttonText}>Sign In with Password</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                {!isOtpSent ? (
                  <TouchableOpacity
                    style={[styles.primaryButton, (!email.trim() || sendingOtp) && styles.buttonDisabled, { backgroundColor: '#F59E0B' }]}
                    onPress={handleSendLoginOtp}
                    disabled={sendingOtp || !email.trim()}
                    activeOpacity={0.8}
                  >
                    {sendingOtp ? (
                      <ActivityIndicator color="#0F172A" />
                    ) : (
                      <Text style={[styles.buttonText, { color: '#0F172A', fontWeight: '900' }]}>
                        Send 6-Digit Gmail OTP ✉️
                      </Text>
                    )}
                  </TouchableOpacity>
                ) : (
                  <>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Enter 6-Digit OTP Code</Text>
                      <TextInput
                        style={[styles.input, { letterSpacing: 4, textAlign: 'center', fontSize: 20, fontWeight: '800' }]}
                        placeholder="e.g. 123456"
                        placeholderTextColor="#999"
                        value={otpCode}
                        onChangeText={(text) => {
                          setOtpCode(text);
                          if (error) clearError();
                        }}
                        keyboardType="number-pad"
                        maxLength={6}
                        autoFocus
                      />
                      <Text style={{ fontSize: 11, color: '#10B981', marginTop: 4, fontWeight: '700', textAlign: 'center' }}>
                        OTP Sent to {email}! Dev bypass code: {otpHint || '123456'}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={[styles.primaryButton, (!otpCode.trim() || isLoading) && styles.buttonDisabled]}
                      onPress={handleOtpLogin}
                      disabled={isLoading || !otpCode.trim()}
                      activeOpacity={0.8}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text style={styles.buttonText}>Verify OTP & Sign In 🎉</Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={{ marginTop: 12, alignItems: 'center' }}
                      onPress={handleSendLoginOtp}
                      disabled={sendingOtp}
                    >
                      <Text style={{ color: '#F59E0B', fontWeight: '700', fontSize: 13 }}>
                        Didn't receive email? Tap to Resend OTP 🔄
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </>
            )}

            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.linkText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 56,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A2E',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#666666',
    textAlign: 'center',
  },
  errorBox: {
    backgroundColor: '#FDE8E8',
    borderColor: '#F8B4B4',
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: '#9B1C1C',
    fontSize: 14,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F7F7F8',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1A1A2E',
  },
  primaryButton: {
    backgroundColor: '#FF5722',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#FF5722',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#666666',
    fontSize: 14,
  },
  linkText: {
    color: '#FF5722',
    fontSize: 14,
    fontWeight: '700',
  },
  modeTabRow: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    padding: 4,
    borderRadius: 12,
    marginTop: 16,
    width: '100%',
    gap: 4,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  modeTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  modeTabTextActive: {
    color: '#FF5722',
    fontWeight: '800',
  },
});

