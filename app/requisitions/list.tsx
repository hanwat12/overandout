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
import { Id } from '@/convex/_generated/dataModel';

interface User {
  userId: string;
  role: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function RequisitionsListScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const requisitions = useQuery(api.requisitions.getAllRequisitions);
  const updateRequisitionStatus = useMutation(api.requisitions.updateRequisitionStatus);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        if (parsedUser.role !== 'admin' && parsedUser.role !== 'hr') {
          Alert.alert('Access Denied', 'You do not have permission to view requisitions');
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
      case 'pending':
        return '#F59E0B';
      case 'approved':
        return '#10B981';
      case 'closed':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'approved':
        return 'Approved';
      case 'closed':
        return 'Closed';
      default:
        return status;
    }
  };

  const handleStatusUpdate = async (requisitionId: Id<'requisitions'>, status: string) => {
    if (!user) return;

    try {
      await updateRequisitionStatus({
        requisitionId,
        status: status as any,
        approvedBy: status === 'approved' ? (user.userId as Id<'users'>) : undefined,
      });
      Alert.alert('Success', `Requisition ${status} successfully`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update requisition status');
    }
  };

  const showStatusOptions = (requisition: any) => {
    const options = [];

    if (requisition.status === 'pending') {
      options.push({
        text: 'Approve',
        onPress: () => handleStatusUpdate(requisition._id, 'approved'),
      });
    }

    if (requisition.status !== 'closed') {
      options.push({
        text: 'Close',
        style: 'destructive' as const,
        onPress: () => handleStatusUpdate(requisition._id, 'closed'),
      });
    }

    options.push({ text: 'Cancel', style: 'cancel' as const });

    Alert.alert('Update Status', 'Choose an action:', options);
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
        title="Requisitions"
        showBack={true}
        rightComponent={
          user.role === 'admin' ? (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push('/requisitions/create' as any)}
            >
              <Ionicons name="add" size={24} color="#3B82F6" />
            </TouchableOpacity>
          ) : undefined
        }
      />

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.content}>
          {requisitions?.map((requisition) => (
            <TouchableOpacity
              key={requisition._id}
              style={styles.requisitionCard}
              onPress={() => router.push(`/requisitions/${requisition._id}` as any)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.titleContainer}>
                  <Text style={styles.jobRole}>{requisition.jobRole}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(requisition.status) },
                    ]}
                  >
                    <Text style={styles.statusText}>{getStatusText(requisition.status)}</Text>
                  </View>
                </View>

                {user.role === 'admin' && (
                  <TouchableOpacity
                    style={styles.moreButton}
                    onPress={() => showStatusOptions(requisition)}
                  >
                    <Ionicons name="ellipsis-horizontal" size={20} color="#6B7280" />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.cardContent}>
                <View style={styles.infoRow}>
                  <Ionicons name="business" size={16} color="#6B7280" />
                  <Text style={styles.infoText}>{requisition.department}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="time" size={16} color="#6B7280" />
                  <Text style={styles.infoText}>
                    {requisition.experienceRequired} years experience
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="people" size={16} color="#6B7280" />
                  <Text style={styles.infoText}>{requisition.numberOfPositions} position(s)</Text>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="person" size={16} color="#6B7280" />
                  <Text style={styles.infoText}>Created by {requisition.creatorName}</Text>
                </View>
              </View>

              {requisition.skillsRequired.length > 0 && (
                <View style={styles.skillsContainer}>
                  {requisition.skillsRequired.slice(0, 3).map((skill: string, index: number) => (
                    <View key={index} style={styles.skillTag}>
                      <Text style={styles.skillText}>{skill}</Text>
                    </View>
                  ))}
                  {requisition.skillsRequired.length > 3 && (
                    <Text style={styles.moreSkills}>+{requisition.skillsRequired.length - 3}</Text>
                  )}
                </View>
              )}

              <View style={styles.cardFooter}>
                <Text style={styles.dateText}>
                  Created {new Date(requisition.createdAt).toLocaleDateString()}
                </Text>
                {requisition.approvedAt && (
                  <Text style={styles.approvedText}>Approved by {requisition.approverName}</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}

          {requisitions?.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={64} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No Requisitions Found</Text>
              <Text style={styles.emptyDescription}>
                {user.role === 'admin'
                  ? 'Create your first requisition to get started'
                  : 'No requisitions have been created yet'}
              </Text>
              {user.role === 'admin' && (
                <TouchableOpacity
                  style={styles.createButton}
                  onPress={() => router.push('/requisitions/create' as any)}
                >
                  <Text style={styles.createButtonText}>Create Requisition</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  addButton: {
    padding: 8,
  },
  requisitionCard: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  jobRole: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  moreButton: {
    padding: 4,
  },
  cardContent: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
  },
  skillsContainer: {
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
    alignSelf: 'center',
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  dateText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  approvedText: {
    fontSize: 12,
    color: '#10B981',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
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
    fontSize: 16,
    fontWeight: '600',
  },
});
