import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RelativePathString, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Id } from '@/convex/_generated/dataModel';
import Header from '@/components/Header';


interface User {
  userId: string;
  role: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function MyApplicationsScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const myApplications = useQuery(
    api.applications.getApplicationsByCandidate,
    user ? { candidateId: user.userId as Id<"users"> } : "skip"
  );

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        if (parsedUser.role !== 'candidate') {
          Alert.alert('Access Denied', 'This section is for candidates only');
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

  const statusFilters = [
    { key: 'all', label: 'All', count: myApplications?.length || 0 },
    { key: 'applied', label: 'Applied', count: myApplications?.filter(app => app.status === 'applied').length || 0 },
    { key: 'screening', label: 'Screening', count: myApplications?.filter(app => app.status === 'screening').length || 0 },
    { key: 'interview_scheduled', label: 'Interview', count: myApplications?.filter(app => app.status === 'interview_scheduled').length || 0 },
    { key: 'selected', label: 'Selected', count: myApplications?.filter(app => app.status === 'selected').length || 0 },
    { key: 'rejected', label: 'Rejected', count: myApplications?.filter(app => app.status === 'rejected').length || 0 },
  ];

  const filteredApplications = myApplications?.filter(app => 
    selectedStatus === 'all' || app.status === selectedStatus
  ) || [];

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
      <Header title="My Applications" showBack={true} />

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
            <Text style={styles.statNumber}>{myApplications?.length || 0}</Text>
            <Text style={styles.statLabel}>Total Applications</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {myApplications?.filter(app => ['interview_scheduled', 'interviewed', 'selected'].includes(app.status)).length || 0}
            </Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {myApplications?.filter(app => app.status === 'selected').length || 0}
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
              onPress={() =>router.push(`/applications/${application._id}` as RelativePathString)
}
            >
              <View style={styles.applicationHeader}>
                <View style={styles.applicationTitleContainer}>
                  <Text style={styles.applicationTitle}>{application.jobTitle}</Text>
                 <View style={[
  styles.statusBadge,
  { backgroundColor: getStatusColor(application.status) }
]}>
                    <Ionicons 
                      name={getStatusIcon(application.status) as any} 
                      size={12} 
                      color="#FFFFFF" 
                      style={styles.statusIcon}
                    />
                    <Text style={styles.statusText}>{getStatusText(application.status)}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.applicationInfo}>
                <View style={styles.infoRow}>
                  <Ionicons name="business" size={16} color="#6B7280" />
                  <Text style={styles.infoText}>{application.jobDepartment}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="location" size={16} color="#6B7280" />
                  <Text style={styles.infoText}>{application.jobLocation}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="calendar" size={16} color="#6B7280" />
                  <Text style={styles.infoText}>
                    Applied {new Date(application.appliedAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              {application.coverLetter && (
                <View style={styles.coverLetterPreview}>
                  <Text style={styles.coverLetterLabel}>Cover Letter:</Text>
                  <Text style={styles.coverLetterText} numberOfLines={2}>
                    {application.coverLetter}
                  </Text>
                </View>
              )}

              <View style={styles.applicationFooter}>
                <TouchableOpacity
                style={styles.viewJobButton}
                onPress={() =>router.push(`/Jobs/${application.jobId}` as RelativePathString)
}
              >
                  <Text style={styles.viewJobButtonText}>View Job</Text>
                  <Ionicons name="arrow-forward" size={16} color="#3B82F6" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyStateTitle}>
              {selectedStatus === 'all' ? 'No Applications Yet' : `No ${getStatusText(selectedStatus)} Applications`}
            </Text>
            <Text style={styles.emptyStateText}>
              {selectedStatus === 'all' 
                ? 'Start applying to jobs to see them here'
                : `You don't have any applications with ${getStatusText(selectedStatus).toLowerCase()} status`
              }
            </Text>
            {selectedStatus === 'all' && (
              <TouchableOpacity
                style={styles.browseButton}
                onPress={() => router.push('./Jobs/browse')}
              >
                <Text style={styles.browseButtonText}>Browse Jobs</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
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
    fontWeight: '600'
,
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
    marginBottom: 16,
  },
  applicationTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  applicationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
    marginRight: 12,
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
  applicationInfo: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  coverLetterPreview: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  coverLetterLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 4,
  },
  coverLetterText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  applicationFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  viewJobButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF8FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewJobButtonText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
    marginRight: 4,
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
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
