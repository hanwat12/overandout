import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
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

interface Notification {
  _id: Id<'notifications'>;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: number;
  relatedId?: string;
}

export default function NotificationsScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const notifications = useQuery(
    api.notifications.getUserNotifications,
    user ? { userId: user.userId as Id<"users"> } : "skip"
  ) as Notification[] | undefined;

  const markAsRead = useMutation(api.notifications.markNotificationAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllNotificationsAsRead);

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

  const handleNotificationPress = async (notification: Notification) => {
    try {
      if (!notification.isRead) {
        await markAsRead({ notificationId: notification._id });
      }

      // Navigate based on notification type
      if (notification.type === 'application_status' && notification.relatedId) {
        if (user?.role === 'candidate') {
          router.push('/applications/my' as any);
        } else {
          router.push('/applications/manage' as any);
        }
      } else if (notification.type === 'job_posted' && notification.relatedId) {
        router.push(`/jobs/${notification.relatedId}` as any);
      }
    } catch (error) {
      console.error('Error handling notification press:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      if (user) {
        await markAllAsRead({ userId: user.userId as Id<"users"> });
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'application_status': return 'document-text';
      case 'interview_scheduled': return 'calendar';
      case 'job_posted': return 'briefcase';
      default: return 'notifications';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'application_status': return '#3B82F6';
      case 'interview_scheduled': return '#8B5CF6';
      case 'job_posted': return '#10B981';
      default: return '#6B7280';
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
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

  const unreadNotifications = notifications?.filter((n: Notification) => !n.isRead) || [];
  const readNotifications = notifications?.filter((n: Notification) => n.isRead) || [];

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Notifications" 
        showBack={true}
        rightComponent={
          unreadNotifications.length > 0 ? (
            <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.markAllButton}>
              <Text style={styles.markAllText}>Mark All Read</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Unread Notifications */}
        {unreadNotifications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>New ({unreadNotifications.length})</Text>
            {unreadNotifications.map((notification: Notification) => (
              <TouchableOpacity
                key={notification._id}
                style={[styles.notificationCard, styles.unreadCard]}
                onPress={() => handleNotificationPress(notification)}
              >
                <View style={styles.notificationContent}>
                  <View style={[
                    styles.iconContainer,
                    { backgroundColor: `${getNotificationColor(notification.type)}20` }
                  ]}>
                    <Ionicons 
                      name={getNotificationIcon(notification.type) as any} 
                      size={20} 
                      color={getNotificationColor(notification.type)} 
                    />
                  </View>
                  <View style={styles.textContent}>
                    <Text style={styles.notificationTitle}>{notification.title}</Text>
                    <Text style={styles.notificationMessage}>{notification.message}</Text>
                    <Text style={styles.notificationTime}>
                      {formatTimeAgo(notification.createdAt)}
                    </Text>
                  </View>
                  <View style={styles.unreadDot} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Read Notifications */}
        {readNotifications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Earlier</Text>
            {readNotifications.map((notification: Notification) => (
              <TouchableOpacity
                key={notification._id}
                style={styles.notificationCard}
                onPress={() => handleNotificationPress(notification)}
              >
                <View style={styles.notificationContent}>
                  <View style={[
                    styles.iconContainer,
                    { backgroundColor: `${getNotificationColor(notification.type)}20` }
                  ]}>
                    <Ionicons 
                      name={getNotificationIcon(notification.type) as any} 
                      size={20} 
                      color={getNotificationColor(notification.type)} 
                    />
                  </View>
                  <View style={styles.textContent}>
                    <Text style={[styles.notificationTitle, styles.readTitle]}>
                      {notification.title}
                    </Text>
                    <Text style={[styles.notificationMessage, styles.readMessage]}>
                      {notification.message}
                    </Text>
                    <Text style={styles.notificationTime}>
                      {formatTimeAgo(notification.createdAt)}
                    </Text>
        
          </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Empty State */}
        {(!notifications || notifications.length === 0) && (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyStateTitle}>No Notifications</Text>
            <Text style={styles.emptyStateText}>
              You're all caught up! Notifications will appear here when you have updates.
            </Text>
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
  markAllButton: {
    padding: 8,
  },
  markAllText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  readTitle: {
    color: '#6B7280',
    fontWeight: '600',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 8,
  },
  readMessage: {
    color: '#9CA3AF',
  },
  notificationTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    marginLeft: 8,
    marginTop: 4,
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
});