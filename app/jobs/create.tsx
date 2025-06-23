import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Id } from '@/convex/_generated/dataModel';
import Header from '@/components/Header';
import { Picker } from '@react-native-picker/picker';

interface User {
  userId: string;
  role: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function CreateJobScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    department: '',
    experienceRequired: '',
    salaryMin: '',
    salaryMax: '',
    location: '',
    requiredSkills: '',
    deadline: '',
    currency: 'INR',
  });

  const createJob = useMutation(api.jobs.createJob);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        if (parsedUser.role !== 'admin' && parsedUser.role !== 'hr') {
          Alert.alert('Access Denied', 'You do not have permission to create jobs');
          router.back();
          return;
        }
        setUser(parsedUser);
      } else {
        router.replace('/auth/login');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      router.replace('/auth/login');
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatSalaryDisplay = (value: string) => {
    if (!value) return '';
    const symbol = formData.currency === 'INR' ? '₹' : '$';
    const numValue = parseInt(value);
    if (formData.currency === 'INR') {
      if (numValue >= 100000) {
        return `${symbol}${(numValue / 100000).toFixed(1)} LPA`;
      }
      return `${symbol}${numValue.toLocaleString('en-IN')}`;
    }
    return `${symbol}${numValue.toLocaleString()}`;
  };

  const handleCreateJob = async () => {
    const {
      title,
      description,
      department,
      experienceRequired,
      salaryMin,
      salaryMax,
      location,
      requiredSkills,
      currency,
    } = formData;

    if (!title || !description || !department || !experienceRequired || !salaryMin || !salaryMax || !location) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (parseInt(salaryMin) >= parseInt(salaryMax)) {
      Alert.alert('Error', 'Maximum salary must be greater than minimum salary');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'User not found');
      return;
    }

    setLoading(true);
    try {
      const skillsArray = requiredSkills
        .split(',')
        .map(skill => skill.trim())
        .filter(skill => skill.length > 0);

      await createJob({
        title,
        description,
        department,
        experienceRequired: parseInt(experienceRequired),
        salaryMin: parseInt(salaryMin),
        salaryMax: parseInt(salaryMax),
        location,
        requiredSkills: skillsArray,
        postedBy: user.userId as Id<"users">,
        currency,
      });

      Alert.alert('Success', 'Job posted successfully! All candidates will be notified.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create job');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'android' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <Header title="Create Job" showBack={true} />

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Job Title *</Text>
              <TextInput
                style={styles.input}
                value={formData.title}
                onChangeText={(value) => updateFormData('title', value)}
                placeholder="e.g. Senior Software Engineer"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Department *</Text>
              <TextInput
                style={styles.input}
                value={formData.department}
                onChangeText={(value) => updateFormData('department', value)}
                placeholder="e.g. Engineering"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Location *</Text>
              <TextInput
                style={styles.input}
                value={formData.location}
                onChangeText={(value) => updateFormData('location', value)}
                placeholder="Bhopal, India"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Currency *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.currency}
                  onValueChange={(value) => updateFormData('currency', value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Indian Rupee (₹)" value="INR" />
                </Picker>
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.label}>Min Salary *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.salaryMin}
                  onChangeText={(value) => updateFormData('salaryMin', value)}
                  placeholder={formData.currency === 'INR' ? '600000' : '80000'}
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
                {formData.salaryMin && (
                  <Text style={styles.salaryPreview}>
                    {formatSalaryDisplay(formData.salaryMin)}
                  </Text>
                )}
              </View>
              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.label}>Max Salary *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.salaryMax}
                  onChangeText={(value) => updateFormData('salaryMax', value)}
                  placeholder={formData.currency === 'INR' ? '1200000' : '120000'}
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
                {formData.salaryMax && (
                  <Text style={styles.salaryPreview}>
                    {formatSalaryDisplay(formData.salaryMax)}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Experience Required (years) *</Text>
              <TextInput
                style={styles.input}
                value={formData.experienceRequired}
                onChangeText={(value) => updateFormData('experienceRequired', value)}
                placeholder="0 (for fresher)"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Required Skills</Text>
              <TextInput
                style={styles.input}
                value={formData.requiredSkills}
                onChangeText={(value) => updateFormData('requiredSkills', value)}
                placeholder="React, Node.js, TypeScript (comma separated)"
                placeholderTextColor="#9CA3AF"
                multiline
              />
              <Text style={styles.helperText}>Separate skills with commas</Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Job Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(value) => updateFormData('description', value)}
                placeholder="Describe the role, responsibilities, and requirements..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={[styles.createButton, loading && styles.createButtonDisabled]}
              onPress={handleCreateJob}
              disabled={loading}
            >
              <Text style={styles.createButtonText}>
                {loading ? 'Creating Job...' : 'Create Job & Notify Candidates'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  form: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputContainer: {
    marginBottom: 20,
  },
  halfWidth: {
    width: '48%',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1F2937',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0
, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  picker: {
    height: 50,
    color: '#1F2937',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  salaryPreview: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 
4,
  },
  previewSection: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#166534',
    marginBottom: 8,
  },
  previewText: {
    fontSize: 18,
    color: '#15803D',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  createButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
