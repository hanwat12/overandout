import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Id } from '@/convex/_generated/dataModel';
import Header from '@/components/Header';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { applyToJob } from '../../convex/applications';

interface User {
  _id: Id<'users'>;
  userId: string;
  role: string;
  firstName: string;
  lastName: string;
  email: string;
  resumeUrl?: string;
}

export default function JobDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);
  const [applicationSuccess, setApplicationSuccess] = useState(false);
  const [coverLetterError, setCoverLetterError] = useState('');
  const [resume, setResume] = useState<{ name: string; uri: string; type: string } | null>(null);
  const [uploadingResume, setUploadingResume] = useState(false);

  const job = useQuery(api.jobs.getJobById, { jobId: id as Id<'jobs'> });
  const hasApplied = useQuery(
    api.applications.getApplicationsByCandidate,
    user
      ? {
          jobId: id as Id<'jobs'>,
          candidateId: user._id,
        }
      : 'skip'
  );

  const applyToJob = useMutation(api.applications.applyToJob);
  const uploadResume = useMutation(api.files.uploadResume);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          if (!parsedUser._id && parsedUser.userId) {
            parsedUser._id = parsedUser.userId;
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

    loadUserData();
  }, []);

  const pickResume = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        setResume({
          name: file.name,
          uri: file.uri,
          type: file.mimeType || 'application/pdf',
        });
      }
    } catch (error) {
      console.error('Error picking resume:', error);
      Alert.alert('Error', 'Failed to pick resume file');
    }
  };

  const uploadResumeFile = async () => {
    if (!resume || !user) return null;

    try {
      setUploadingResume(true);
      const fileContent = await FileSystem.readAsStringAsync(resume.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const resumeUrl = await uploadResume({
        fileName: resume.name,
        mimeType: resume.type,
        fileData: fileContent,
        userId: user._id,
      });

      return resumeUrl;
    } catch (error) {
      console.error('Error uploading resume:', error);
      Alert.alert('Error', 'Failed to upload resume');
      return null;
    } finally {
      setUploadingResume(false);
    }
  };

  const validateAndApply = async () => {
    if (coverLetter.trim().length > 0 && coverLetter.trim().length < 50) {
      setCoverLetterError('Cover letter should be at least 50 characters');
      return;
    }

    if (!resume && !user?.resumeUrl) {
      Alert.alert('Resume Required', 'Please upload your resume before applying');
      return;
    }

    setCoverLetterError('');
    await handleApply();
  };

  const handleApply = async () => {
    if (!user || !job || applying) return;

    setApplying(true);
    try {
      let resumeUrl = user.resumeUrl;

      if (resume) {
        const uploadedUrl = await uploadResumeFile();
        if (uploadedUrl) {
          resumeUrl = uploadedUrl;
        }
      }

      await applyToJob({
        jobId: job._id,
        candidateId: user._id,
        coverLetter: coverLetter.trim() || undefined,
      });

      setApplicationSuccess(true);
      Alert.alert('Application Submitted', 'Your application has been submitted successfully!', [
        {
          text: 'OK',
          onPress: () => {
            setShowApplicationModal(false);
            setCoverLetter('');
            setApplicationSuccess(false);
            router.push('/candidates/list' as any); // Redirect to candidate list
          },
        },
      ]);
    } catch (error) {
      Alert.alert(
        'Application Error',
        error instanceof Error ? error.message : 'Failed to submit application. Please try again.'
      );
    } finally {
      setApplying(false);
    }
  };

  const formatSalary = (min: number, max: number) => {
    return `₹${min.toLocaleString()} - ₹${max.toLocaleString()}`;
  };

  const getExperienceText = (years: number) => {
    if (years === 0) return 'Entry Level';
    if (years === 1) return '1 year';
    return `${years} years`;
  };

  if (!job) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </SafeAreaView>
    );
  }

  const isCandidate = user?.role === 'candidate';
  const hasUserApplied = hasApplied && hasApplied.length > 0;
  const canApply = isCandidate && !hasUserApplied;

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Job Details"
        showBack={true}
        rightComponent={
          <TouchableOpacity style={styles.shareButton}>
            <Ionicons name="share-outline" size={24} color="#1F2937" />
          </TouchableOpacity>
        }
      />

      <View style={styles.contentContainer}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Job Header */}
          <View style={styles.jobHeader}>
            <View style={styles.jobTitleSection}>
              <Text style={styles.jobTitle}>{job.title}</Text>
              <View style={styles.statusContainer}>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: job.status === 'active' ? '#10B981' : '#6B7280' },
                  ]}
                >
                  <Text style={styles.statusText}>{job.status}</Text>
                </View>
              </View>
            </View>

            <Text style={styles.jobSalary}>{formatSalary(job.salaryMin, job.salaryMax)}</Text>

            <View style={styles.jobMetaInfo}>
              <View style={styles.metaItem}>
                <Ionicons name="business" size={16} color="#6B7280" />
                <Text style={styles.metaText}>{job.department}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="location" size={16} color="#6B7280" />
                <Text style={styles.metaText}>{job.location}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="time" size={16} color="#6B7280" />
                <Text style={styles.metaText}>
                  {getExperienceText(job.experienceRequired)} experience
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="calendar" size={16} color="#6B7280" />
                <Text style={styles.metaText}>
                  Posted {new Date(job._creationTime).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>

          {/* Required Skills */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Required Skills</Text>
            <View style={styles.skillsContainer}>
              {job.requiredSkills.map((skill, index) => (
                <View key={index} style={styles.skillTag}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Job Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Job Description</Text>
            <Text style={styles.description}>{job.description}</Text>
          </View>

          {/* Posted By */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Posted By</Text>
            <View style={styles.posterInfo}>
              <View style={styles.posterAvatar}>
                <Ionicons name="person" size={24} color="#3B82F6" />
              </View>
              <View style={styles.posterDetails}>
                <Text style={styles.posterName}>{job.posterName}</Text>
                <Text style={styles.posterRole}>HR Manager</Text>
              </View>
            </View>
          </View>
          <View style={styles.section}>
            {canApply && (
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setShowApplicationModal(true)}
              >
                <Text style={styles.applyButtonText}>Apply to this Job</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

        {canApply && !applicationSuccess && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => setShowApplicationModal(true)}
              disabled={applying}
            >
              {applying ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.applyButtonText}>Apply for this Job</Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Application Modal */}
      <Modal
        visible={showApplicationModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => {
          if (!applying) setShowApplicationModal(false);
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => !applying && setShowApplicationModal(false)}
              style={styles.modalCloseButton}
              disabled={applying}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Apply for Job</Text>
            <TouchableOpacity
              onPress={validateAndApply}
              disabled={applying || uploadingResume}
              style={[
                styles.modalSubmitButton,
                (applying || uploadingResume) && styles.modalSubmitButtonDisabled,
              ]}
            >
              <Text style={styles.modalSubmitText}>
                {applying || uploadingResume ? 'Submitting...' : 'Submit'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.modalJobInfo}>
              <Text style={styles.modalJobTitle}>{job.title}</Text>
              <Text style={styles.modalJobDepartment}>{job.department}</Text>
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Resume</Text>
              {user?.resumeUrl && !resume ? (
                <View style={styles.resumeContainer}>
                  <Ionicons name="document-text" size={24} color="#3B82F6" />
                  <Text style={styles.resumeText}>Using your current resume</Text>
                </View>
              ) : resume ? (
                <View style={styles.resumeContainer}>
                  <Ionicons name="document-text" size={24} color="#3B82F6" />
                  <Text style={styles.resumeText}>{resume.name}</Text>
                  <TouchableOpacity onPress={() => setResume(null)}>
                    <Ionicons name="close" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ) : null}
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={pickResume}
                disabled={uploadingResume}
              >
                <Text style={styles.uploadButtonText}>
                  {uploadingResume ? 'Uploading...' : 'Upload New Resume'}
                </Text>
              </TouchableOpacity>
              <Text style={styles.uploadHint}>PDF or Word documents only (max 5MB)</Text>
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Cover Letter (Optional)</Text>
              <TextInput
                style={[styles.coverLetterInput, coverLetterError ? styles.inputError : null]}
                value={coverLetter}
                onChangeText={(text) => {
                  setCoverLetter(text);
                  if (coverLetterError) setCoverLetterError('');
                }}
                placeholder="Tell us why you're interested in this position and what makes you a great fit..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={8}
                textAlignVertical="top"
              />
              {coverLetterError ? <Text style={styles.errorText}>{coverLetterError}</Text> : null}
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Application Summary</Text>
              <View style={styles.summaryCard}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Position:</Text>
                  <Text style={styles.summaryValue}>{job.title}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Department:</Text>
                  <Text style={styles.summaryValue}>{job.department}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Salary Range:</Text>
                  <Text style={styles.summaryValue}>
                    {formatSalary(job.salaryMin, job.salaryMax)}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Applicant:</Text>
                  <Text style={styles.summaryValue}>
                    {user?.firstName} {user?.lastName}
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  shareButton: {
    padding: 8,
  },
  contentContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  jobHeader: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  jobTitleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  jobTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
  },
  statusContainer: {
    marginLeft: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  jobSalary: {
    fontSize: 28,
    color: '#10B981',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  jobMetaInfo: {
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 12,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  skillTag: {
    backgroundColor: '#EBF8FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  skillText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  posterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  posterAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EBF8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  posterDetails: {
    flex: 1,
  },
  posterName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  posterRole: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  applyButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalCloseText: {
    fontSize: 16,
    color: '#6B7280',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalSubmitButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modalSubmitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  modalSubmitText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 24,
  },
  modalJobInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  modalJobTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  modalJobDepartment: {
    fontSize: 16,
    color: '#6B7280',
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  coverLetterInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
    height: 120,
    textAlignVertical: 'top',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 8,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  uploadButton: {
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  uploadButtonText: {
    color: '#1F2937',
    fontWeight: '600',
  },
  uploadHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  resumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  resumeText: {
    flex: 1,
    marginLeft: 8,
    color: '#1F2937',
  },
});
