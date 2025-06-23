import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useQuery } from 'convex/react';
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

export default function BrowseJobsScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedExperience, setSelectedExperience] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');

  const activeJobs = useQuery(api.jobs.getActiveJobs);

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

  const filteredJobs = activeJobs?.filter(job => {
    const matchesSearch = 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.requiredSkills.some(skill => 
        skill.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesExperience = selectedExperience === 'all' || 
      (selectedExperience === 'fresher' && job.experienceRequired === 0) ||
      (selectedExperience === 'junior' && job.experienceRequired >= 1 && job.experienceRequired <= 3) ||
      (selectedExperience === 'mid' && job.experienceRequired >= 4 && job.experienceRequired <= 7) ||
      (selectedExperience === 'senior' && job.experienceRequired >= 8);

    const matchesLocation = selectedLocation === 'all' || 
      job.location.toLowerCase().includes(selectedLocation.toLowerCase());

    return matchesSearch && matchesExperience && matchesLocation;
  }) || [];

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

  const getExperienceText = (years: number) => {
    if (years === 0) return 'Fresher';
    if (years === 1) return '1 year';
    return `${years} years`;
  };

  const experienceFilters = [
    { key: 'all', label: 'All Experience' },
    { key: 'fresher', label: 'Fresher (0 years)' },
    { key: 'junior', label: 'Junior (1-3 years)' },
    { key: 'mid', label: 'Mid-level (4-7 years)' },
    { key: 'senior', label: 'Senior (8+ years)' },
  ];

  const locationFilters = [
    { key: 'all', label: 'All Locations' },
    { key: 'bhopal', label: 'Bhopal' },
    { key: 'guwahati', label: 'Guwahati' },
    { key: 'remote', label: 
'Remote' },
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
      <Header title="Browse Jobs" showBack={true} />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search jobs, skills, or departments..."
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <View style={styles.filterGroup}>
            <Text style={styles.filterGroupTitle}>Experience:</Text>
            {experienceFilters.map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterChip,
                  selectedExperience === filter.key && styles.filterChipActive
                ]}
                onPress={() => setSelectedExperience(filter.key)}
              >
                <Text style={[
                  styles.filterText,
                  selectedExperience === filter.key && styles.filterTextActive
                ]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <View style={styles.filterGroup}>
            <Text style={styles.filterGroupTitle}>Location:</Text>
            {locationFilters.map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterChip,
                  selectedLocation === filter.key && styles.filterChipActive
                ]}
                onPress={() => setSelectedLocation(filter.key)}
              >
                <Text style={[
                  styles.filterText,
                  selectedLocation === filter.key && styles.filterTextActive
                ]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Jobs List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Results Header */}
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsText}>
            {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} found
          </Text>
          <TouchableOpacity 
            style={styles.clearFiltersButton}
            onPress={() => {
              setSearchQuery('');
              setSelectedExperience('all');
              setSelectedLocation('all');
            }}
          >
            <Text style={styles.clearFiltersText}>Clear All</Text>
          </TouchableOpacity>
        </View>

        {/* Jobs */}
        {filteredJobs.length > 0 ? (
          filteredJobs.map((job) => (
            <TouchableOpacity
              key={job._id}
              style={styles.jobCard}
              onPress={() => router.push(`/
jobs/${job._id}` as any)}
            >
              <View style={styles.jobHeader}>
                <View style={styles.jobTitleContainer}>
                  <Text style={styles.jobTitle}>{job.title}</Text>
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>NEW</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.bookmarkButton}>
                  <Ionicons name="bookmark-outline" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.jobInfo}>
                <View style={styles.jobInfoRow}>
                  <Ionicons name="business" size={16} color="#6B7280" />
                  <Text style={styles.jobInfoText}>{job.department}</Text>
                </View>
                <View style={styles.jobInfoRow}>
                  <Ionicons name="location" size={16} color="#6B7280" />
                  <Text style={styles.jobInfoText}>{job.location}</Text>
                </View>
                <View style={styles.jobInfoRow}>
                  <Ionicons name="time" size={16} color="#6B7280" />
                  <Text style={styles.jobInfoText}>{getExperienceText(job.experienceRequired)} experience</Text>
                </View>
              </View>

              <Text style={styles.jobSalary}>
                {formatSalary(job.salaryMin, job.salaryMax, job.currency)}
              </Text>

              <View style={styles.jobSkills}>
                {job.requiredSkills.slice(0, 4).map((skill, index) => (
                  <View key={index} style={styles.skillTag}>
                    <Text style={styles.skillText}>{skill}</Text>
                  </View>
                ))}
                {job.requiredSkills.length > 4 && (
                  <View style={styles.moreSkillsTag}>
                    <Text style={styles.moreSkillsText}>+{job.requiredSkills.length - 4}</Text>
                  </View>
                )}
              </View>

              <View style={styles.jobFooter}>

                <Text style={styles.jobDate}>
                  Posted {new Date(job.createdAt).toLocaleDateString()}
                </Text>
                <View style={styles.applyButton}>
                  <Text style={styles.applyButtonText}>Apply Now</Text>
                  <Ionicons name="arrow-forward" size={16} color="#3B82F6" />
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyStateTitle}>No Jobs Found</Text>
            <Text style={styles.emptyStateText}>
              {searchQuery || selectedExperience !== 'all' || selectedLocation !== 'all'
                ? 'No jobs match your search criteria. Try adjusting your filters.'
                : 'No active jobs available at the moment.'
              }
            </Text>
            <TouchableOpacity
              style={styles.clearSearchButton}
              onPress={() => {
                setSearchQuery('');
                setSelectedExperience('all');
                setSelectedLocation('all');
              }}
            >
              <Text style={styles.clearSearchButtonText}>Clear Filters</Text>
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
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterScroll: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterGroupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginRight: 8,
  },
  filterChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterText: {
    fontSize: 12,
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
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultsText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  clearFiltersButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  clearFiltersText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
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
  }
,
  newBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  newBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  bookmarkButton: {
    padding: 4,
  },
  jobInfo: {
    marginBottom: 12,
  },
  jobInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  jobInfoText: {
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  skillText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
  },
  moreSkillsTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  moreSkillsText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF8FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  applyButtonText: {
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
});