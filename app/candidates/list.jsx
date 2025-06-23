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
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Header from '@/components/Header';

/**
 * @typedef {Object} User
 * @property {string} userId
 * @property {string} role
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} email
 */

export default function CandidateListScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const candidates = useQuery(api.candidates.getAllCandidates);
  const applications = useQuery(api.applications.getAllApplications); // You may need to implement this API

  const candidatesWithApplications = applications?.map(app => ({
    ...app.candidate, // candidate details
    jobTitle: app.job.title,
    appliedAt: app.appliedAt,
    resumeUrl: app.resumeUrl,
    coverLetter: app.coverLetter,
  })) || [];

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        if (parsedUser.role !== 'admin' && parsedUser.role !== 'hr') {
          Alert.alert('Access Denied', 'You do not have permission to view candidates');
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

  const filteredCandidates = candidates?.filter(candidate =>
    `${candidate.firstName} ${candidate.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    candidate.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    candidate.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase())) ||
    candidate.location.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getExperienceLevel = (years) => {
    if (years === 0) return 'Entry Level';
    if (years <= 2) return 'Junior';
    if (years <= 5) return 'Mid-Level';

    if (years <= 8) return 'Senior';
    return 'Expert';
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
      <Header title="Candidates" showBack={true} />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search candidates by name, skills, or location..."
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

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
            <Text style={styles.statNumber}>{candidates?.length || 0}</Text>
            <Text style={styles.statLabel}>Total Candidates</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {candidates?.filter(c => c.experience >= 3).length || 0}
            </Text>
            <Text style={styles.statLabel}>Experienced</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {candidates?.filter(c => c.resumeId).length || 0}
            </Text>
            <Text style={styles.statLabel}>With Resume</Text>
          </View>
        </View>

        {/* Results Header */}
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsText}>
            {filteredCandidates.length} candidate{filteredCandidates.length !== 1 ? 's' : ''} found
          </Text>
        </View>

        {/* Candidates List */}
        {candidatesWithApplications.length > 0 ? (
          candidatesWithApplications.map((candidate, idx) => (
            <View key={idx} style={styles.candidateCard}>
              <Text style={styles.candidateName}>{candidate.firstName} {candidate.lastName}</Text>
              <Text style={styles.candidateEmail}>{candidate.email}</Text>
              <Text style={styles.jobTitle}>Applied for: {candidate.jobTitle}</Text>
              <Text style={styles.applicationDate}>Applied on: {new Date(candidate.appliedAt).toLocaleDateString()}</Text>
              {candidate.resumeUrl && (
                <TouchableOpacity onPress={() => {/* open resume */}}>
                  <Text style={styles.resumeLink}>View Resume</Text>
                </TouchableOpacity>
              )}
              <Text numberOfLines={2}>{candidate.coverLetter}</Text>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyStateTitle}>
              {searchQuery ? 'No Candidates Found' : 'No Candidates Yet'}
            </Text>
            <Text style={styles.emptyStateText}>
              {searchQuery 
       
         ? `No candidates match "${searchQuery}". Try different keywords.`
                : 'Candidates will appear here once they register on the platform.'
              }
            </Text>
            {searchQuery && (
              <TouchableOpacity
                style={styles.clearSearchButton}
                onPress={() => setSearchQuery('')}
              >
                <Text style={styles.clearSearchButtonText}>Clear Search</Text>
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
  resultsHeader: {
    marginBottom: 16,
  },
  resultsText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  candidateCard: {
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
  candidateHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  candidateAvatar: {
    width: 56,

    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  candidateInitials: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  candidateInfo: {
    flex: 1,
  },
  candidateName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  candidateEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  candidateMeta: {
    gap: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  candidateActions: {
    flexDirection: 'row',
    gap: 8,
  },
  resumeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EBF8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  educationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  educationText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
  },
  candidateSummary: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
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
  moreSkillsTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  moreSkillsText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  candidateFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  socialLinks: {
    flexDirection: 'row',
    gap: 8,
  },
  socialButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF8FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewProfileText: {
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
  clearSearchButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  clearSearchButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  jobTitle: {
    fontSize: 14,
    color: '#374151',
    marginTop: 4,
    marginBottom: 4,
  },
  applicationDate: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  resumeLink: {
    fontSize: 14,
    color: '#3B82F6',
    textDecorationLine: 'underline',
    marginBottom: 8,
  },
});
