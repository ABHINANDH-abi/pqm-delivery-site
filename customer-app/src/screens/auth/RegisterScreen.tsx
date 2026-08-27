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
  Modal,
  Alert,
} from 'react-native';
import { useAuthStore } from '../../store/auth.store';
import { AuthService } from '../../services/auth.service';

export default function RegisterScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('Coimbatore');
  const [pincode, setPincode] = useState('641018');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // OTP State
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [debugOtpHint, setDebugOtpHint] = useState<string | null>(null);

  const { verifyOtpAndRegister, isLoading, error, clearError } = useAuthStore();

  const handleSendOtp = async () => {
    if (!name.trim() || !email.trim() || !phone.trim() || !addressLine1.trim() || !password.trim()) {
      setValidationError('Please fill in Name, Phone, Gmail, Address, and Password.');
      return;
    }

    if (!email.includes('@')) {
      setValidationError('Please enter a valid Gmail / Email address.');
      return;
    }

    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match.');
      return;
    }

    setValidationError(null);
    clearError();

    try {
      setSendingOtp(true);
      const res = await AuthService.sendOtp(email.trim(), name.trim(), phone.trim());
      setDebugOtpHint(res.otpDebug || '123456');
      setIsOtpModalOpen(true);
      Alert.alert(
        'Gmail OTP Sent ✉️',
        `A 6-digit verification code has been sent to your Gmail (${email}). Check your inbox or use dev code (${res.otpDebug || '123456'}).`
      );
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to send OTP to Gmail.';
      setValidationError(msg);
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyAndSubmit = async () => {
    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      Alert.alert('Validation Error', 'Please enter the full 6-digit OTP code sent to your Gmail.');
      return;
    }

    try {
      await (useAuthStore.getState() as any).verifyOtpAndRegister({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        otp: otpCode.trim(),
        addressLine1: addressLine1.trim(),
        city: city.trim(),
        pincode: pincode.trim(),
        role: 'CUSTOMER',
      });
      setIsOtpModalOpen(false);
    } catch (err: any) {
      // Error handled in store
    }
  };

  const displayError = validationError || error;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.headerContainer}>
            <Text style={styles.logo}>✨</Text>
            <Text style={styles.title}>Create Customer Account</Text>
            <Text style={styles.subtitle}>Enter your details and verify your Gmail via OTP</Text>
          </View>

          {displayError && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{displayError}</Text>
            </View>
          )}

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Abhinandh"
                placeholderTextColor="#999"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  setValidationError(null);
                  clearError();
                }}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="+91 9876543210"
                placeholderTextColor="#999"
                value={phone}
                onChangeText={(text) => {
                  setPhone(text);
                  setValidationError(null);
                  clearError();
                }}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Gmail / Email Address *</Text>
              <TextInput
                style={styles.input}
                placeholder="user@gmail.com"
                placeholderTextColor="#999"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setValidationError(null);
                  clearError();
                }}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Delivery Address / Location *</Text>
              <TextInput
                style={styles.input}
                placeholder="Door No, Street Name, Landmark"
                placeholderTextColor="#999"
                value={addressLine1}
                onChangeText={setAddressLine1}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={[styles.inputGroup, { flex: 1.5 }]}>
                <Text style={styles.label}>City</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Coimbatore"
                  placeholderTextColor="#999"
                  value={city}
                  onChangeText={setCity}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Pincode</Text>
                <TextInput
                  style={styles.input}
                  placeholder="641018"
                  placeholderTextColor="#999"
                  value={pincode}
                  onChangeText={setPincode}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Setup Password *</Text>
              <TextInput
                style={styles.input}
                placeholder="Minimum 6 characters"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password *</Text>
              <TextInput
                style={styles.input}
                placeholder="Re-enter password"
                placeholderTextColor="#999"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                (sendingOtp || !name.trim() || !email.trim() || !phone.trim() || !addressLine1.trim() || !password.trim()) && styles.buttonDisabled,
              ]}
              onPress={handleSendOtp}
              disabled={sendingOtp || !name.trim() || !email.trim() || !phone.trim() || !addressLine1.trim() || !password.trim()}
              activeOpacity={0.8}
            >
              {sendingOtp ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Send Gmail Verification OTP ✉️ →</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.linkText}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Gmail 6-Digit OTP Verification Modal */}
      {isOtpModalOpen && (
        <Modal visible transparent animationType="slide">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, width: '100%', maxWidth: 400 }}>
              <Text style={{ fontSize: 28, textAlign: 'center', marginBottom: 8 }}>✉️</Text>
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#1A1A2E', textAlign: 'center' }}>
                Verify Gmail Address
              </Text>
              <Text style={{ fontSize: 13, color: '#666666', textAlign: 'center', marginTop: 4, marginBottom: 16 }}>
                Enter the 6-digit OTP code sent to {'\n'}
                <Text style={{ fontWeight: '800', color: '#FF5722' }}>{email}</Text>
              </Text>

              {debugOtpHint ? (
                <View style={{ backgroundColor: '#FFF3E0', padding: 10, borderRadius: 8, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: '#FF5722' }}>
                  <Text style={{ fontSize: 12, color: '#E65100', fontWeight: '700', textAlign: 'center' }}>
                    DEV OTP CODE: {debugOtpHint}
                  </Text>
                </View>
              ) : null}

              <Text style={{ fontSize: 12, fontWeight: '700', color: '#333333', marginBottom: 6 }}>
                Enter 6-Digit OTP Code:
              </Text>
              <TextInput
                style={{
                  backgroundColor: '#F7F7F8',
                  borderWidth: 2,
                  borderColor: '#FF5722',
                  borderRadius: 12,
                  fontSize: 24,
                  fontWeight: '900',
                  letterSpacing: 6,
                  textAlign: 'center',
                  paddingVertical: 12,
                  color: '#FF5722',
                  marginBottom: 20,
                }}
                placeholder="e.g. 589412"
                placeholderTextColor="#CCCCCC"
                value={otpCode}
                onChangeText={setOtpCode}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  onPress={() => setIsOtpModalOpen(false)}
                  style={{ flex: 1, backgroundColor: '#EEEEEE', paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
                >
                  <Text style={{ color: '#666666', fontWeight: '700' }}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleVerifyAndSubmit}
                  disabled={isLoading}
                  style={{ flex: 1.5, backgroundColor: '#FF5722', paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={{ color: '#FFFFFF', fontWeight: '900' }}>Verify & Register 🎉</Text>
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
    marginBottom: 24,
  },
  logo: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A2E',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  errorBox: {
    backgroundColor: '#FDE8E8',
    borderColor: '#F8B4B4',
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
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
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F7F7F8',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
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
    marginTop: 20,
    marginBottom: 20,
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
});
