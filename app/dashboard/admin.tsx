import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import NotificationBell from '@/components/NotificationBell';

interface User {
  userId: string;
  role: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const stats = useQuery(api.applications.getDashboardStats);
  const jobs = useQuery(api.jobs.getAllJobs);
  // const candidates = useQuery(api.candidates.getAllCandidates);
  const recentApplications = useQuery(api.applications.getAllApplicationsForHR);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
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

  const formatSalary = (min: number, max: number, currency: string = 'INR') => {
    const symbol = currency === 'INR' ? '₹' : '$';
    if (currency === 'INR') {
      const minLakhs =
        min >= 100000 ? `${(min / 100000).toFixed(1)}L` : `${(min / 1000).toFixed(0)}K`;
      const maxLakhs =
        max >= 100000 ? `${(max / 100000).toFixed(1)}L` : `${(max / 1000).toFixed(0)}K`;
      return `${symbol}${minLakhs} - ${symbol}${maxLakhs}`;
    }
    return `₹{symbol}₹{min.toLocaleString()} - ₹{symbol}₹{max.toLocaleString()}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied':
        return '#3B82F6';
      case 'screening':
        return '#F59E0B';
      case 'interview_scheduled':
        return '#8B5CF6';
      case 'interviewed':
        return '#6366F1';
      case 'selected':
        return '#10B981';
      case 'rejected':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'applied':
        return 'Applied';
      case 'screening':
        return 'Screening';
      case 'interview_scheduled':
        return 'Interview Scheduled';
      case 'interviewed':
        return 'Interviewed';
      case 'selected':
        return 'Selected';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
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
      <Header
        title="Admin Dashboard"
        showMenu={true}
        onMenuPress={() => setSidebarVisible(true)}
        rightComponent={
          <NotificationBell
            userId={user.userId}
            onPress={() => router.push('/notifications' as any)}
          />
        }
      />

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>
            {user.firstName} {user.lastName}
          </Text>

          <Text style={styles.userRole}>{user.role.toUpperCase()} DASHBOARD</Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="briefcase" size={24} color="#3B82F6" />
            </View>
            <Text style={styles.statNumber}>{stats?.totalJobs || 0}</Text>
            <Text style={styles.statLabel}>Total Jobs</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            </View>
            <Text style={styles.statNumber}>{stats?.activeJobs || 0}</Text>
            <Text style={styles.statLabel}>Active Jobs</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="document-text" size={24} color="#F59E0B" />
            </View>
            <Text style={styles.statNumber}>{stats?.totalApplications || 0}</Text>
            <Text style={styles.statLabel}>Applications</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="people" size={24} color="#8B5CF6" />
            </View>
            <Text style={styles.statNumber}>{stats?.selectedCandidates || 0}</Text>
            <Text style={styles.statLabel}>Selected</Text>
          </View>
        </View>

        {/* Pending Applications Alert */}
        {/* {stats?.pendingApplications && stats.pendingApplications > 0 && (
          <View style={styles.alertCard}>
            <View style={styles.alertIcon}>
              <Ionicons name="alert-circle" size={24} color="#F59E0B" />
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>
                {stats.pendingApplications} New Application{stats.pendingApplications > 1 ? 's' : ''}
              </Text>
              <Text style={styles.alertText}>
                Review and update application status
              </Text>
            </View>
            <TouchableOpacity
              style={styles.alertButton}
              onPress={() => router.push('/applications/manage' as any)}
            >
              <Text style={styles.alertButtonText}>Review</Text>
            </TouchableOpacity>
          </View>
        )} */}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/jobs/create' as any)}
            >
              <Ionicons name="add-circle" size={32} color="#3B82F6" />
              <Text style={styles.actionText}>Post New Job</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/jobs/list' as any)}
            >
              <Ionicons name="list" size={32} color="#10B981" />
              <Text style={styles.actionText}>Manage Jobs</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/candidates/list' as any)}
            >
              <Ionicons name="people-outline" size={32} color="#F59E0B" />
              <Text style={styles.actionText}>View Candidates</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/applications/manage' as any)}
            >
              <Ionicons name="document-text-outline" size={32} color="#8B5CF6" />
              <Text style={styles.actionText}>Applications</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/requisitions/create' as any)}
            >
              <Ionicons name="clipboard-outline" size={32} color="#EF4444" />
              <Text style={styles.actionText}>New Requisition</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/requisitions/list' as any)}
            >
              <Ionicons name="list-outline" size={32} color="#06B6D4" />
              <Text style={styles.actionText}>Manage Requisitions</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/resume/upload' as any)}
            >
              <Ionicons name="cloud-upload-outline" size={32} color="#84CC16" />
              <Text style={styles.actionText}>Upload Resumes</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Jobs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Jobs</Text>
            <TouchableOpacity onPress={() => router.push('/jobs/list' as any)}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {jobs?.slice(0, 3).map((job) => (
            <TouchableOpacity
              key={job._id}
              style={styles.jobCard}
              onPress={() => router.push(`/jobs/${job._id}` as any)}
            >
              <View style={styles.jobHeader}>
                <Text style={styles.jobTitle}>{job.title}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: job.status === 'active' ? '#10B981' : '#6B7280' },
                  ]}
                >
                  <Text style={styles.statusText}>{job.status}</Text>
                </View>
              </View>
              <Text style={styles.jobDepartment}>{job.department}</Text>
              <Text style={styles.jobLocation}>{job.location}</Text>
              <Text style={styles.jobSalary}>
                {formatSalary(job.salaryMin, job.salaryMax, job.currency)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Applications */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Applications</Text>
            <TouchableOpacity onPress={() => router.push('/applications/manage' as any)}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {recentApplications?.slice(0, 3).map((application) => (
            <TouchableOpacity
              key={application._id}
              style={styles.applicationCard}
              onPress={() => router.push('/applications/manage' as any)}
            >
              <View style={styles.applicationHeader}>
                <View style={styles.candidateInfo}>
                  <View style={styles.candidateAvatar}>
                    <Text style={styles.candidateInitials}>
                      {application.candidateName
                        ?.split(' ')
                        .map((n: string) => n[0])
                        .join('') || 'NA'}
                    </Text>
                  </View>
                  <View style={styles.candidateDetails}>
                    <Text style={styles.candidateName}>{application.candidateName}</Text>
                    <Text style={styles.candidateEmail}>{application.candidateEmail}</Text>
                    <Text style={styles.applicationJobTitle}>{application.jobTitle}</Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.applicationStatusBadge,
                    { backgroundColor: getStatusColor(application.status) },
                  ]}
                >
                  <Text style={styles.applicationStatusText}>
                    {getStatusText(application.status)}
                  </Text>
                </View>
              </View>
              <Text style={styles.applicationDate}>
                Applied {new Date(application.appliedAt).toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Candidates */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Candidates</Text>
            <TouchableOpacity onPress={() => router.push('/candidates/list' as any)}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {/* {candidates?.slice(0, 3).map((candidate) => (
            <View key={candidate._id} style={styles.candidateCard}>
              <View style={styles.candidateInfo}>
                <Text style={styles.candidateName}>
                  {candidate.firstName} {candidate.lastName}
                </Text>
                <Text style={styles.candidateEmail}>{candidate.email}</Text>
                <Text style={styles.candidateExperience}>
                  {candidate.experience} years experience
                </Text>
              </View>
              <View style={styles.candidateSkills}>
                {candidate.skills.slice(0, 2).map((skill, index) => (
                  <View key={index} style={styles.skillTag}>
                    <Text style={styles.skillText}>{skill}</Text>
                  </View>
                ))}
                {candidate.skills.length > 2 && (
                  <Text style={styles.moreSkills}>+{candidate.skills.length - 2}</Text>
                )}
              </View>
            </View>
          ))} */}
        </View>
      </ScrollView>

      <Sidebar visible={sidebarVisible} onClose={() => setSidebarVisible(false)} user={user} />
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
  scrollView: {
    flex: 1,
  },
  welcomeSection: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  greeting: {
    fontSize: 16,
    color: '#6B7280',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 4,
  },
  userRole: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  alertIcon: {
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400E',
    marginBottom: 2,
  },
  alertText: {
    fontSize: 14,
    color: '#92400E',
  },
  alertButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  alertButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  section: {
    padding: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  seeAllText: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 8,
    textAlign: 'center',
  },
  jobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
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
    marginBottom: 8,
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
    color: '#FFFFFF',
    fontWeight: '600',

    textTransform: 'uppercase',
  },
  jobDepartment: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  jobLocation: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  jobSalary: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: '600',
  },
  applicationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
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
    marginBottom: 12,
  },
  candidateInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  candidateAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  candidateInitials: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  candidateDetails: {
    flex: 1,
  },
  candidateName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  candidateEmail: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  applicationJobTitle: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
  },
  applicationStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  applicationStatusText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  applicationDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  candidateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  candidateExperience: {
    fontSize: 14,
    color: '#6B7280',
  },
  candidateSkills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
    marginTop: 12,
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
});
