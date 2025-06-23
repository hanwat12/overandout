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
} from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Header from '@/components/Header';

interface User {
  userId: string;
  role: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function ApplicationListScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const jobs = useQuery(api.jobs.getAllJobs);
  const updateApplicationStatus = useMutation(api.applications.updateApplicationStatus);

  // Get all applications for all jobs
  const allApplications = React.useMemo(() => {
    if (!jobs) return [];
    
    const applications: any[] = [];
    jobs.forEach(job => {
      // This would need to be implemented to get applications for each job
      // For now, we'll use a placeholder
    });
    return applications;
  }, [jobs]);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        if (parsedUser.role !== 'admin' && parsedUser.role !== 'hr') {
          Alert.alert('Access Denied', 'You do not have permission to view applications');
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

  const handleStatusUpdate = async (applicationId: string, newStatus: string) => {
    try {
      await updateApplicationStatus(
        {
          applicationId: applicationId as any,
          status: newStatus as any,
          reviewedBy: user?.userId as any,
        });
      Alert.alert('Success', 'Application status updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update application status');
    }
  };

  const statusFilters = [

    { key: 'all', label: 'All', count: allApplications.length },
    { key: 'applied', label: 'Applied', count: allApplications.filter(app => app.status === 'applied').length },
    { key: 'screening', label: 'Screening', count: allApplications.filter(app => app.status === 'screening').length },
    { key: 'interview_scheduled', label: 'Interview', count: allApplications.filter(app => app.status === 'interview_scheduled').length },
    { key: 'selected', label: 'Selected', count: allApplications.filter(app => app.status === 'selected').length },
    { key: 'rejected', label: 'Rejected', count: allApplications.filter(app => app.status === 'rejected').length },
  ];

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
      <Header title="All Applications" showBack={true} />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search applications by candidate or job..."
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
            <Text style={styles.statNumber}>{allApplications.length}</Text>
            <Text style={styles.statLabel}>Total Applications</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {allApplications.filter(app => app.status === 'applied').length}
            </Text>
            <Text style={styles.statLabel}>New Applications</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {allApplications.filter(app => ['interview_scheduled', 'interviewed'].includes(app.status)).length}
            </Text>
            <Text style={styles.statLabel}>In Interview</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {allApplications.filter(app => app.status === 'selected').length}
            </Text>
            <Text style={styles.statLabel}>Selected</Text>
          </View>
        </View>

        {/* Applications List */}
        {jobs && jobs.length > 0 ? (
         
 jobs.map((job) => (
            <View key={job._id} style={styles.jobSection}>
              <View style={styles.jobHeader}>
                <Text style={styles.jobTitle}>{job.title}</Text>
                <Text style={styles.jobDepartment}>{job.department}</Text>
              </View>
              
              {/* Placeholder for applications - would need to implement getApplicationsByJob query */}
              <View style={styles.applicationPlaceholder}>
                <Ionicons name="document-text-outline" size={32} color="#9CA3AF" />
                <Text style={styles.placeholderText}>
                  Applications for this job will appear here
                </Text>
                <TouchableOpacity
                  style={styles.viewJobButton}
                  onPress={() => router.push(`/jobs/${job._id}` as any)}
                >
                  <Text style={styles.viewJobButtonText}>View Job Details</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyStateTitle}>No Applications Yet</Text>
            <Text style={styles.emptyStateText}>
              Applications will appear here once candidates start applying to jobs
            </Text>
            <TouchableOpacity
              style={styles.createJobButton}
              onPress={() => router.push('/jobs/create' as any)}
            >
              <Text style={styles.createJobButtonText}>Create Job Posting</Text>
            </TouchableOpacity>
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

  jobSection: {
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
  jobHeader: {
    marginBottom: 16,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  jobDepartment: {
    fontSize: 14,
    color: '#6B7280',
  },
  applicationPlaceholder: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  viewJobButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewJobButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
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
  createJobButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createJobButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});