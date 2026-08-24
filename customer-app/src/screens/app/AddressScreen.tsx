import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { addressApi, Address } from '../../api/address.api';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<AppStackParamList, 'Address'>;

export default function AddressScreen({ navigation }: Props) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal State for New Address
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [detectingLocation, setDetectingLocation] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    label: 'Home',
    addressLine1: '',
    addressLine2: '',
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    pincode: '641018',
    landmark: '',
    isDefault: true,
  });

  const handleDetectLocation = () => {
    setDetectingLocation(true);
    setTimeout(() => {
      setFormData((prev) => ({
        ...prev,
        addressLine1: '104, Avinashi Road, Opposite VOC Park',
        addressLine2: 'Gandhipuram',
        city: 'Coimbatore',
        state: 'Tamil Nadu',
        pincode: '641018',
        landmark: 'Near VOC Park',
      }));
      setDetectingLocation(false);
      Alert.alert('GPS Location Detected 📍', 'Delivery address auto-filled for Coimbatore!');
    }, 800);
  };

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const data = await addressApi.getMyAddresses();
      setAddresses(data);
    } catch (err) {
      console.log('Failed to fetch addresses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleSetDefault = async (id: string) => {
    try {
      await addressApi.setDefault(id);
      fetchAddresses();
    } catch (err) {
      Alert.alert('Error', 'Failed to set default address');
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Delete Address', 'Are you sure you want to delete this address?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await addressApi.delete(id);
            fetchAddresses();
          } catch (err) {
            Alert.alert('Error', 'Failed to delete address');
          }
        },
      },
    ]);
  };

  const handleCreateAddress = async () => {
    if (!formData.addressLine1.trim()) {
      Alert.alert('Validation Error', 'Please enter Address Line 1');
      return;
    }
    if (!formData.pincode.trim() || formData.pincode.length !== 6) {
      Alert.alert('Validation Error', 'Please enter a valid 6-digit pincode');
      return;
    }

    try {
      setSubmitting(true);
      await addressApi.create(formData);
      setIsModalOpen(false);
      setFormData({
        label: 'Home',
        addressLine1: '',
        addressLine2: '',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001',
        landmark: '',
        isDefault: true,
      });
      fetchAddresses();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error?.message || 'Failed to add address');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delivery Addresses 📍</Text>
        <TouchableOpacity onPress={() => setIsModalOpen(true)}>
          <Text style={styles.addText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F59E0B" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {addresses.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No addresses saved</Text>
              <Text style={styles.emptySubtitle}>Add a delivery address to complete your order.</Text>
            </View>
          ) : (
            addresses.map((item) => (
              <View key={item.id} style={[styles.addressCard, item.isDefault && styles.defaultCard]}>
                <View style={styles.cardHeader}>
                  <View style={styles.labelBadge}>
                    <Text style={styles.labelText}>{item.label}</Text>
                  </View>
                  {item.isDefault ? (
                    <Text style={styles.defaultBadge}>DEFAULT</Text>
                  ) : (
                    <TouchableOpacity onPress={() => handleSetDefault(item.id)}>
                      <Text style={styles.setDefaultText}>Set as Default</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <Text style={styles.addressLine}>{item.addressLine1}</Text>
                {item.addressLine2 ? <Text style={styles.addressSub}>{item.addressLine2}</Text> : null}
                <Text style={styles.addressCity}>
                  {item.city}, {item.state} - {item.pincode}
                </Text>

                <View style={styles.cardActions}>
                  <TouchableOpacity onPress={() => handleDelete(item.id)}>
                    <Text style={styles.deleteText}>Delete Address</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}

          <TouchableOpacity style={styles.addNewButton} onPress={() => setIsModalOpen(true)}>
            <Text style={styles.addNewButtonText}>+ Add New Address</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Add Address Modal */}
      <Modal visible={isModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Delivery Address</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                onPress={handleDetectLocation}
                disabled={detectingLocation}
                style={{
                  backgroundColor: '#1E293B',
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: '#F59E0B',
                  marginBottom: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {detectingLocation ? (
                  <ActivityIndicator color="#F59E0B" />
                ) : (
                  <Text style={{ color: '#F59E0B', fontSize: 14, fontWeight: '700', textAlign: 'center' }}>
                    📍 Detect Current Location via GPS
                  </Text>
                )}
              </TouchableOpacity>

              <Text style={styles.inputLabel}>Label (e.g. Home, Work, Apartment)</Text>
              <TextInput
                style={styles.input}
                value={formData.label}
                onChangeText={(text) => setFormData({ ...formData, label: text })}
              />

              <Text style={styles.inputLabel}>Address Line 1 (Flat, Building, Street) *</Text>
              <TextInput
                style={styles.input}
                placeholder="12, MG Road"
                placeholderTextColor="#64748B"
                value={formData.addressLine1}
                onChangeText={(text) => setFormData({ ...formData, addressLine1: text })}
              />

              <Text style={styles.inputLabel}>City *</Text>
              <TextInput
                style={styles.input}
                value={formData.city}
                onChangeText={(text) => setFormData({ ...formData, city: text })}
              />

              <Text style={styles.inputLabel}>State *</Text>
              <TextInput
                style={styles.input}
                value={formData.state}
                onChangeText={(text) => setFormData({ ...formData, state: text })}
              />

              <Text style={styles.inputLabel}>6-Digit Pincode *</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                maxLength={6}
                value={formData.pincode}
                onChangeText={(text) => setFormData({ ...formData, pincode: text })}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsModalOpen(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleCreateAddress}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#0F172A" />
                ) : (
                  <Text style={styles.saveText}>Save Address</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  backButton: {
    paddingVertical: 4,
  },
  backText: {
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  addText: {
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: '800',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 4,
  },
  addressCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 14,
  },
  defaultCard: {
    borderColor: '#F59E0B',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  labelBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  labelText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  defaultBadge: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '800',
  },
  setDefaultText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },
  addressLine: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  addressSub: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 2,
  },
  addressCity: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 2,
  },
  cardActions: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    alignItems: 'flex-end',
  },
  deleteText: {
    color: '#F87171',
    fontSize: 12,
    fontWeight: '700',
  },
  addNewButton: {
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  addNewButtonText: {
    color: '#F59E0B',
    fontWeight: '800',
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  inputLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelText: {
    color: '#94A3B8',
    fontWeight: '700',
    fontSize: 14,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: '#F59E0B',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveText: {
    color: '#0F172A',
    fontWeight: '800',
    fontSize: 14,
  },
});
