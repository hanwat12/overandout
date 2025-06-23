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

export default function JobListScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const jobs = useQuery(api.jobs.getAllJobs);
  const updateJob = useMutation(api.jobs.updateJob);
  const deleteJob = useMutation(api.jobs.deleteJob);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        if (parsedUser.role !== 'admin' && parsedUser.role !== 'hr') {
          Alert.alert('Access Denied', 'You do not have permission to manage jobs');
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

  const toggleJobStatus = async (jobId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'closed' : 'active';
    
    Alert.alert(
      'Change Job Status',
      `Are you sure you want to ${newStatus === 'active' ? 'activate' : 'close'} this job?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await updateJob({
                jobId: jobId as any,
                status: newStatus as any,
              });
              Alert.alert('Success', `Job ${newStatus === 'active' ? 'activated' : 'closed'} successfully`);
            } catch (error) {
              Alert.alert('Error', 'Failed to update job status');
            }
          },
        },
      ]
    );
  };

  const handleDeleteJob = async (jobId: string, jobTitle: string) => {
    Alert.alert(
      'Delete Job',
      `Are you sure you want to permanently delete "${jobTitle}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteJob({ jobId: jobId as any });
              Alert.alert('Success', 'Job deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete job');
            }
          },
        },
      ]
    );
  };

  const formatSalary = (min: number, max: number, currency: string = 'INR') => {
    const symbol = currency === 'INR' ? '₹' : '$';
    if (currency === 'INR') {
      // Indian formatting with lakhs
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
      <Header 
        title="Manage Jobs" 
        showBack={true}
        rightComponent={
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => router.push('/jobs/create' as any)}
          >
            <Ionicons name="add" size={24} color="#3B82F6" />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats Header */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{jobs?.length || 0}</Text>
            <Text style={styles.statLabel}>Total Jobs</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {jobs?.filter(job => job.status === 'active').length || 0}
            </Text>
            <Text style={styles.statLabel}>Active Jobs</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {jobs?.filter(job => job.status === 'closed').length || 0}
            </Text>
            <Text style={styles.statLabel}>Closed Jobs</Text>
          </View>
        </View>

        {/* Jobs List */}
        {jobs && jobs.length > 0 ? (
          jobs.map((job) => (
            <View key={job._id} style={styles.jobCard}>
              <View style={styles.jobHeader}>
                <View style={styles.jobTitleContainer}>
                  <Text style={styles.jobTitle}>{job.title}</Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: job.status === 'active' ? '#10B981' : '#6B7280' }
                  ]}>
                    <Text style={styles.statusText}>{job.status}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.moreButton}
                  onPress={() => router.push(`/jobs/${job._id}` as any)}
                >
                  <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.jobInfo}>
                <View style={styles.infoRow}>
                  <Ionicons name="business" size={16} color="#6B7280" />
                  <Text style={styles.infoText}>{job.department}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="location" size={16} color="#6B7280" />
                  <Text style={styles.infoText}>{job.location}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="time" size={16} color="#6B7280" />
                  <Text style={styles.infoText}>{job.experienceRequired} years experience</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="person" size={16} color="#6B7280" />
                  <Text style={styles.infoText}>Posted by {job.posterName}</Text>
                </View>
              </View>

              <Text style={styles.jobSalary}>
                {formatSalary(job.salaryMin, job.salaryMax, job.currency)}
              </Text>

              <View style={styles.jobSkills}>
                {job.requiredSkills.slice(0, 3).map((skill, index) => (
                  <View key={index} style={styles.skillTag}>
                    <Text style={styles.skillText}>{skill}</Text>
                  </View>
                ))}
                {job.requiredSkills.length > 3 && (
                  <Text style={styles.moreSkills}>+{job.requiredSkills.length - 3}</Text>
                )}
              </View>

              <View style={styles.jobActions}>
               
 <TouchableOpacity
                  style={styles.viewButton}
                  onPress={() => router.push(`/jobs/${job._id}` as any)}
                >
                  <Ionicons name="eye" size={16} color="#3B82F6" />
                  <Text style={styles.viewButtonText}>View Details</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    { backgroundColor: job.status === 'active' ? '#FEF2F2' : '#F0FDF4' }
                  ]}
                  onPress={() => toggleJobStatus(job._id, job.status)}
                >
                  <Ionicons 
                    name={job.status === 'active' ? 'pause' : 'play'} 
                    size={16} 
                    color={job.status === 'active' ? '#EF4444' : '#10B981'} 
                  />
                  <Text style={[
                    styles.statusButtonText,
                    { color: job.status === 'active' ? '#EF4444' : '#10B981' }
                  ]}>
                    {job.status === 'active' ? 'Close' : 'Activate'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteJob(job._id, job.title)}
                >
                  <Ionicons name="trash" size={16} color="#EF4444" />
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.jobDate}>
                Posted {new Date(job.createdAt).toLocaleDateString()}
              </Text>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="briefcase-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyStateTitle}>No Jobs Posted</Text>
            <Text style={styles.emptyStateText}>
              Start by creating your first job posting
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push('/jobs/create' as any)}
            >
              <Text style={styles.createButtonText}>Create Job</Text>
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
  addButton: {
    padding: 8,
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
  jobCard: {
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  jobTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    color:
 '#FFFFFF',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  moreButton: {
    padding: 4,
  },
  jobInfo: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  jobSalary: {
    fontSize: 18,
    color: '#10B981',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  jobSkills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
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
  jobActions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF8FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
  },
  viewButtonText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
    marginLeft: 4,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
  },
  deleteButtonText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
    marginLeft: 4,
  },
  jobDate: {
    fontSize: 12,
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
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});