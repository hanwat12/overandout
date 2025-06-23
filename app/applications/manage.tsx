import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  Linking,
} from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Header from '@/components/Header';
import { Id } from '@/convex/_generated/dataModel';

interface User {
  userId: string;
  role: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function ManageApplicationsScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  const applications = useQuery(api.applications.getAllApplicationsForHR);
  const updateApplicationStatus = useMutation(api.applications.updateApplicationStatus);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        if (parsedUser.role !== 'admin' && parsedUser.role !== 'hr') {
          Alert.alert('Access Denied', 'You do not have permission to manage applications');
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

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied': return '#3B82F6';
      case 'screening': return '#F59E0B';
      case 'interview_scheduled': return '#8B5CF6';
      case 'interviewed': return '#6366F1';
      case 'selected': return '#10B981';
      case 'rejected': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'applied': return 'Applied';
      case 'screening': return 'Screening';
      case 'interview_scheduled': return 'Interview Scheduled';
      case 'interviewed': return 'Interviewed';
      case 'selected': return 'Selected';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'applied': return 'document-text';
      case 'screening': return 'eye';
      case 'interview_scheduled': return 'calendar';
      case 'interviewed': return 'checkmark-circle';
      case 'selected': return 'trophy';
      case 'rejected': return 'close-circle';
      default: return 'help-circle';
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!selectedApplication || !user) return;

    try {
      await updateApplicationStatus({
        applicationId: selectedApplication._id,
        status: newStatus as any,
        reviewedBy: user.userId as Id<"users">,
        reviewNotes: reviewNotes.trim() || undefined,
      });

      Alert.alert('Success', 'Application status updated successfully');
      setShowStatusModal(false);
      setSelectedApplication(null);
      setReviewNotes('');
    } catch (error) {
      Alert.alert('Error', 'Failed to update application status');
    }
  };

  const openStatusModal = (application: any) => {
    setSelectedApplication(application);
    setReviewNotes('');
    setShowStatusModal(true);
  };

  const handleDownloadResume = async (resumeId: string | undefined, candidateName: string) => {
    try {
      if (!resumeId) {
        Alert.alert('No Resume', `${candidateName} has not uploaded a resume yet.`);
        return;
      }
      const downloadUrl = `https://files.convex.cloud/${resumeId}`;
      
      Alert.alert(
        'Download Resume',
        `Download resume for ${candidateName}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Download',
            onPress: () => {
              Linking.openURL(downloadUrl).catch(() => {
                Alert.alert('Error', 'Failed to open resume. Please try again.');
              });
            },
          },
        ]
      );
    } catch (error) {
      console.error('Resume download error:', error);
      Alert.alert('Error', 'Failed to download resume');
    }
  };

  const handleContactCandidate = (candidateEmail: string, candidateName: string) => {
    const subject = `Regarding your job application - SLRD Hiring`;
    const body = `Dear ${candidateName},\n\nThank you for your interest in our position.\n\nBest regards,\nSLRD HR Team`;
    const mailtoUrl = `mailto:${candidateEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    Linking.openURL(mailtoUrl).catch(() => {
      Alert.alert('Error', 'Could not open email client');
    });
  };

  const filteredApplications = applications?.filter(app => {
    const matchesStatus = selectedStatus === 'all' || app.status === selectedStatus;
    const matchesSearch = 
      app.candidateName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.candidateEmail?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesSearch;
  }) || [];

  const statusFilters = [
    { key: 'all', label: 'All', count: applications?.length || 0 },
    { key: 'applied', label: 'New', count: applications?.filter(app => app.status === 'applied').length || 0 },
    { key: 'screening', label: 'Screening', count: applications?.filter(app => app.status === 'screening').length || 0 },
    { key: 'interview_scheduled', label: 'Interview', count: applications?.filter(app => app.status === 'interview_scheduled').length || 0 },
    { key: 'selected', label: 'Selected', count: applications?.filter(app => app.status === 'selected').length || 0 },
    { key: 'rejected', label: 'Rejected', count: applications?.filter(app => app.status === 'rejected').length || 0 },
  ];

  const formatSalary = (min: number, max: number, currency: string = 'INR') => {
    const symbol = currency === 'INR' ? '₹' : '$';
    if (currency === 'INR') {
      const minLakhs = min >= 100000 ? `${(min / 100000).toFixed(1)}L` : `${(min / 1000).toFixed(0)}K`;
      const maxLakhs = max >= 100000 ? `${(max / 100000).toFixed(1)}L` : `${(max / 1000).toFixed(0)}K`;
      return `${symbol}${minLakhs} - ${symbol}${maxLakhs}`;
    }
    return `${symbol}${min.toLocaleString()} - ${symbol}${max.toLocaleString()}`;
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
      <Header title="Manage Applications" showBack={true} />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by candidate nam
e, job title, or email..."
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Status Filter */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {statusFilters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterChip,
                selectedStatus === filter.key && styles.filterChipActive
              ]}
              onPress={() => setSelectedStatus(filter.key)}
            >
              <Text style={[
                styles.filterText,
                selectedStatus === filter.key && styles.filterTextActive
              ]}>
                {filter.label} ({filter.count})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Summary Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{applications?.length || 0}</Text>
            <Text style={styles.statLabel}>Total Applications</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {applications?.filter(app => app.status === 'applied').length || 0}
            </Text>
            <Text style={styles.statLabel}>New Applications</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {applications?.filter(app => ['interview_scheduled', 'interviewed'].includes(app.status)).length || 0}
            </Text>
            <Text style={styles.statLabel}>In Interview</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {applications?.filter(app => app.status === 'selected').length || 0}
            </Text>
            <Text style={styles.statLabel}>Selected</Text>
          </View>
        </View>

        {/* Applications List */}
        {filteredApplications.length > 0 ? (
          filteredApplications.map((application) => (
            <TouchableOpacity
              key={application._id}
              style={styles.applicationCard}
              onPress={() => router.push(`/jobs/${application.jobId}` as any)}
            >
              <View style={styles.applicationHeader}>
                <View style={styles.candidateInfo}>
                  <View style={styles.candidateAvatar}>
                    <Text style={styles.candidateInitials}>
                      {application.candidateName?.split(' ').map((n: string) => n[0]).join('') || 'NA'}
                    </Text>
                  </View>
                  <View style={styles.candidateDetails}>
                    <Text style={styles.candidateName}>{application.candidateName}</Text>
                    <Text style={styles.candidateEmail}>{application.candidateEmail}</Text>
                    <Text style={styles.jobTitle}>{application.jobTitle}</Text>
                  </View>
                </View>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(application.status) }
                ]}>
                  <Ionicons 
                    name={getStatusIcon(application.status) as any} 
                    size={12} 
                    color="#FFFFFF" 
                    style={styles.
statusIcon}
                  />
                  <Text style={styles.statusText}>{getStatusText(application.status)}</Text>
                </View>
              </View>

              <View style={styles.applicationDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="business" size={16} color="#6B7280" />
                  <Text style={styles.detailText}>{application.jobDepartment}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="location" size={16} color="#6B7280" />
                  <Text style={styles.detailText}>{application.jobLocation}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="calendar" size={16} color="#6B7280" />
                  <Text style={styles.detailText}>
                    Applied {new Date(application.appliedAt).toLocaleDateString()}
                  </Text>
                </View>
                {application.candidateProfile && (
                  <View style={styles.detailRow}>
                    <Ionicons name="time" size={16} color="#6B7280" />
                    <Text style={styles.detailText}>
                      {application.candidateProfile.experience} years experience
                    </Text>
                  </View>
                )}
              </View>

              {application.candidateProfile?.skills && (
                <View style={styles.skillsSection}>
                  <Text style={styles.skillsTitle}>Skills:</Text>
                  <View style={styles.skillsContainer}>
                    {application.candidateProfile.skills.slice(0, 3).map((skill: string, index: number) => (
                      <View key={index} style={styles.skillTag}>
                        <Text style={styles.skillText}>{skill}</Text>
                      </View>
                    ))}
                    {application.candidateProfile.skills.length > 3 && (
                      <Text style={styles.moreSkills}>+{application.candidateProfile.skills.length - 3}</Text>
                    )}
                  </View>
                </View>
              )}

              {application.coverLetter && (
                <View style={styles.coverLetterSection}>
                  <Text style={styles.coverLetterTitle}>Cover Letter:</Text>
                  <Text style={styles.coverLetterText} numberOfLines={3}>
                    {application.coverLetter}
                  </Text>
                </View>
              )}

              <View style={styles.applicationActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    openStatusModal(application);
                  }}
                >
                  <Ionicons name="create" size={16} color="#3B82F6" />
                  <Text style={styles.actionButtonText}>Update Status</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.actionButton,
                    !application.candidateProfile?.resumeId && styles.disabledButton
                  ]}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDownloadResume(
                      application.candidateProfile?.resumeId, 
                      application.candidateName || 'Unknown'
                    );
                  }}
                  disabled={!application.candidateProfile?.resumeId}
                >
                  <Ionicons 
                    name="document-text" 
                    size={16} 
                    color={application.candidateProfile?.resumeId ? "#10B981" : "#9CA3AF"} 
                  />
                  <Text style={[
                    styles.actionButtonText,
                    !application.candidateProfile?.resumeId && styles.disabledText
                  ]}>
                    {application.candidateProfile?.resumeId ? 'Download Resume' : 'No Resume'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleContactCandidate(
                      application.candidateEmail || '', 
                      application.candidateName || 'Candidate'
                    );
                  }}
                >
                  <Ionicons name="mail" size={16} color="#F59E0B" />
                  <Text style={styles.actionButtonText}>Contact</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyStateTitle}>No Applications Found</Text>
            <Text style={styles.emptyStateText}>
              {searchQuery 
                ? `No applications match "${searchQuery}"`
                : 'Applications will appear here once candidates start applying'
              }
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Status Update Modal */}
      <Modal
        visible={showStatusModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowStatusModal(false)}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Update Application Status</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedApplication && (
              <View style={styles.applicationSummary}>
                <Text style={styles.summaryTitle}>
                  {selectedApplication.candidateName}
                </Text>
                <Text style={styles.summarySubtitle}>
                  Applied for {selectedApplication.jobTitle}
                </Text>
              </View>
            )}

            <View style={styles.statusOptions}>
              <Text style={styles.sectionTitle}>Select New Status:</Text>
              
              {['screening', 'interview_scheduled', 'interviewed', 'selected', 'rejected'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={styles.statusOption}
                  onPress={() => handleStatusUpdate(status)}
                >
                  <View style={[
                    styles.statusIndicator,
                    { backgroundColor: getStatusColor(status) }
                  ]} />
                  <Text style={styles.statusOptionText}>{getStatusText(status)}</Text>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.notesSection}>
              <Text style={styles.sectionTitle}>Review Notes (Optional):</Text>
              <TextInput
                style={styles.notesInput}
                value={reviewNotes}
                onChangeText={setReviewNotes}
                placeholder="Add notes about this candidate or decision..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
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
    backgroundColor: 
'#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1F2937',
  },
  clearButton: {
    padding: 4,
  },
  filterContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  filterChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  applicationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  applicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  candidateInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  candidateAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  candidateInitials: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  candidateDetails: {
    flex: 1,
  },
  candidateName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  candidateEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  jobTitle: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  applicationDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  skillsSection: {
    marginBottom: 16,
  },
  skillsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  skillTag: {
    backgroundColor: '#EBF8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  skillText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
  },
  moreSkills: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  coverLetterSection: {
    marginBottom: 16,
  },
  coverLetterTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  coverLetterText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  applicationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
  },
  disabledButton: {
    backgroundColor: '#F9FAFB',
    opacity: 0.6,
  },
  actionButtonText: {
    fontSize: 11,
    color: '#374151',
    fontWeight: '600',
    marginLeft: 4,
  },
  disabledText: {
    color: '#9CA3AF',
  },
  emptyState: {
    alignItems: 'center',
    padding: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
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
  placeholder: {
    width: 60,
  },
  modalContent: {
    flex: 1,
    padding: 24,
  },
  applicationSummary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  summarySubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  statusOptions: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusOptionText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  notesSection: {
    marginBottom: 24,
  },
  notesInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
    height: 100,
    textAlignVertical: 'top',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
});