import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ScrollView,
} from 'react-native';
import { useAuthStore } from '../../store/auth.store';
import { apiClient } from '../../api/client';

export default function LoginScreen() {
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Login State
  const [email, setEmail] = useState('driver@example.com');
  const [password, setPassword] = useState('Driver@123456');
  const [loading, setLoading] = useState(false);

  // Register Driver State
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [driverEmail, setDriverEmail] = useState('');
  const [driverCity, setDriverCity] = useState('Coimbatore');
  const [vehicleType, setVehicleType] = useState('Motorcycle / Scooter');
  const [driverPassword, setDriverPassword] = useState('');

  // OTP State
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [debugOtpHint, setDebugOtpHint] = useState<string | null>(null);

  const login = useAuthStore((state) => state.login);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in both email and password.');
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Login failed';
      Alert.alert('Authentication Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSendDriverOtp = async () => {
    if (!driverName.trim() || !driverPhone.trim() || !driverEmail.trim() || !driverPassword.trim()) {
      Alert.alert('Missing Fields', 'Please fill in Name, Phone, Gmail, and Password.');
      return;
    }

    if (!driverEmail.includes('@')) {
      Alert.alert('Invalid Gmail', 'Please enter a valid Gmail address.');
      return;
    }

    try {
      setSendingOtp(true);
      const res = await apiClient.post('/auth/send-otp', {
        email: driverEmail.trim(),
        name: driverName.trim(),
        phone: driverPhone.trim(),
      });
      const data = res.data.data;
      setDebugOtpHint(data.otpDebug || '123456');
      setIsOtpModalOpen(true);
      Alert.alert('Gmail OTP Sent ✉️', `Verification code sent to ${driverEmail}.`);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error?.message || 'Failed to send OTP.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyDriverOtp = async () => {
    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      Alert.alert('Error', 'Please enter the full 6-digit OTP code sent to your Gmail.');
      return;
    }

    try {
      setVerifyingOtp(true);
      const res = await apiClient.post('/auth/verify-otp-and-register', {
        name: driverName.trim(),
        phone: driverPhone.trim(),
        email: driverEmail.trim(),
        password: driverPassword,
        otp: otpCode.trim(),
        role: 'DELIVERY_PARTNER',
        addressLine1: driverCity.trim(),
      });

      const data = res.data.data;
      Alert.alert('Driver Account Verified 🎉', 'Welcome! Your driver profile has been created.');
      setIsOtpModalOpen(false);

      // Auto login
      await login(driverEmail.trim(), driverPassword);
    } catch (err: any) {
      Alert.alert('Verification Error', err.response?.data?.error?.message || 'OTP verification failed.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
          {/* Logo & Header */}
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoEmoji}>🛵</Text>
            </View>
            <Text style={styles.title}>PQM Delivery Partner</Text>
            <Text style={styles.subtitle}>Driver Dispatch & Order Fulfillment Portal</Text>

            {/* Mode Switcher Tabs */}
            <View style={{ flexDirection: 'row', backgroundColor: '#1E293B', borderRadius: 12, padding: 4, marginTop: 16, borderWidth: 1, borderColor: '#334155', width: '100%' }}>
              <TouchableOpacity
                onPress={() => setAuthMode('LOGIN')}
                style={{ flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: authMode === 'LOGIN' ? '#F59E0B' : 'transparent', alignItems: 'center' }}
              >
                <Text style={{ fontWeight: '800', color: authMode === 'LOGIN' ? '#0F172A' : '#94A3B8', fontSize: 13 }}>Driver Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setAuthMode('REGISTER')}
                style={{ flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: authMode === 'REGISTER' ? '#F59E0B' : 'transparent', alignItems: 'center' }}
              >
                <Text style={{ fontWeight: '800', color: authMode === 'REGISTER' ? '#0F172A' : '#94A3B8', fontSize: 13 }}>New Driver Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* LOGIN FORM */}
          {authMode === 'LOGIN' ? (
            <View style={styles.form}>
              <Text style={styles.label}>Driver Email</Text>
              <TextInput
                style={styles.input}
                placeholder="driver@example.com"
                placeholderTextColor="#64748B"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#64748B"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <TouchableOpacity
                style={styles.button}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#0F172A" />
                ) : (
                  <Text style={styles.buttonText}>Log In to Driver Portal ➔</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            /* REGISTER NEW DRIVER FORM */
            <View style={styles.form}>
              <Text style={styles.label}>Full Driver Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Ramesh Kumar"
                placeholderTextColor="#64748B"
                value={driverName}
                onChangeText={setDriverName}
              />

              <Text style={styles.label}>Phone Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="+91 9876543210"
                placeholderTextColor="#64748B"
                value={driverPhone}
                onChangeText={setDriverPhone}
                keyboardType="phone-pad"
              />

              <Text style={styles.label}>Gmail Address *</Text>
              <TextInput
                style={styles.input}
                placeholder="driver@gmail.com"
                placeholderTextColor="#64748B"
                value={driverEmail}
                onChangeText={setDriverEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.label}>Base Operating City</Text>
              <TextInput
                style={styles.input}
                placeholder="Coimbatore"
                placeholderTextColor="#64748B"
                value={driverCity}
                onChangeText={setDriverCity}
              />

              <Text style={styles.label}>Password *</Text>
              <TextInput
                style={styles.input}
                placeholder="Minimum 6 characters"
                placeholderTextColor="#64748B"
                value={driverPassword}
                onChangeText={setDriverPassword}
                secureTextEntry
              />

              <TouchableOpacity
                style={styles.button}
                onPress={handleSendDriverOtp}
                disabled={sendingOtp}
                activeOpacity={0.8}
              >
                {sendingOtp ? (
                  <ActivityIndicator color="#0F172A" />
                ) : (
                  <Text style={styles.buttonText}>Send Gmail Verification OTP ✉️ ➔</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>Authorized Restaurant Delivery Partners Portal</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Gmail OTP Verification Modal */}
      {isOtpModalOpen && (
        <Modal visible transparent animationType="slide">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <View style={{ backgroundColor: '#1E293B', borderRadius: 20, padding: 24, width: '100%', maxWidth: 400, borderWidth: 1, borderColor: '#334155' }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#FFFFFF', textAlign: 'center' }}>
                ✉️ Verify Driver Gmail Address
              </Text>
              <Text style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center', marginTop: 4, marginBottom: 20 }}>
                We sent a 6-digit verification code to {'\n'}
                <Text style={{ fontWeight: '800', color: '#F59E0B' }}>{driverEmail}</Text>
              </Text>

              <TextInput
                style={{
                  backgroundColor: '#0F172A',
                  borderWidth: 2,
                  borderColor: '#F59E0B',
                  borderRadius: 12,
                  fontSize: 24,
                  fontWeight: '900',
                  letterSpacing: 6,
                  textAlign: 'center',
                  paddingVertical: 12,
                  color: '#F59E0B',
                  marginBottom: 20,
                }}
                placeholder="e.g. 589412"
                placeholderTextColor="#64748B"
                value={otpCode}
                onChangeText={setOtpCode}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  onPress={() => setIsOtpModalOpen(false)}
                  style={{ flex: 1, backgroundColor: '#334155', paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
                >
                  <Text style={{ color: '#94A3B8', fontWeight: '700' }}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleVerifyDriverOtp}
                  disabled={verifyingOtp}
                  style={{ flex: 1.5, backgroundColor: '#F59E0B', paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
                >
                  {verifyingOtp ? (
                    <ActivityIndicator color="#0F172A" />
                  ) : (
                    <Text style={{ color: '#0F172A', fontWeight: '900' }}>Verify & Complete 🎉</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  keyboardView: {
    flex: 1,
  },
  inner: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoEmoji: {
    fontSize: 36,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
  },
  form: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#F59E0B',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#0F172A',
    fontWeight: '800',
    fontSize: 15,
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#64748B',
  },
});
