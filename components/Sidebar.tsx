import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  userId: string;
  role: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface SidebarProps {
  visible: boolean;
  onClose: () => void;
  user: User | null;
}

const { width } = Dimensions.get('window');

export default function Sidebar({ visible, onClose, user }: SidebarProps) {
  const handleLogout = async () => {
    await AsyncStorage.removeItem('user');
    onClose();
    router.replace('/');
  };

  const navigateTo = (path: string) => {
    onClose();
    router.push(path as any);
  };

  const adminMenuItems = [
    { icon: 'home', title: 'Dashboard', path: '/dashboard/admin' },
    { icon: 'briefcase', title: 'Manage Jobs', path: '/jobs/list' },
    { icon: 'add-circle', title: 'Create Job', path: '/jobs/create' },
    { icon: 'people', title: 'Candidates', path: '/candidates/list' },
    { icon: 'document-text', title: 'Applications', path: '/applications/manage' },
    { icon: 'notifications', title: 'Notifications', path: '/notifications' },
  ];

  const candidateMenuItems = [
    { icon: 'search', title: 'Browse Jobs', path: '/jobs/browse' },
    { icon: 'document-text', title: 'My Applications', path: '/applications/my' },
    { icon: 'person', title: 'Edit Profile', path: '/profile/edit' },
    { icon: 'cloud-upload', title: 'Upload Resume', path: '/resume/upload' },
    { icon: 'notifications', title: 'Notifications', path: '/notifications' },
  ];

  const menuItems = user?.role === 'candidate' ? candidateMenuItems : adminMenuItems;

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} />
        <View style={styles.sidebar}>
          <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.userInfo}>
                <View style={styles.avatar}>
                  <Ionicons name="person" size={24} color="#3B82F6" />
                </View>
                <View style={styles.userDetails}>
                  <Text style={styles.userName}>
                    {user ? `${user.firstName} ${user.lastName}` : 'Guest'}
                  </Text>
                  <Text style={styles.userRole}>{user?.role?.toUpperCase() || 'GUEST'}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Menu Items */}
            <ScrollView style={styles.menu}>
              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.menuItem}
                  onPress={() => navigateTo(item.path)}
                >
                  <Ionicons name={item.icon as any} size={20} color="#6B7280" />
                  <Text style={styles.menuText}>{item.title}</Text>
                  <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Ionicons name="log-out" size={20} color="#EF4444" />
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>

              <View style={styles.brandingSection}>
                <View style={styles.logoContainer}>
                  <Image
                    source={require('../assets/Slrd.png')}
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.brandingText}>SLRD Hiring System</Text>
              </View>
            </View>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sidebar: {
    width: width * 0.8,
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EBF8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  userRole: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
    marginTop: 2,
  },

  closeButton: {
    padding: 4,
  },
  menu: {
    flex: 1,
    paddingTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 16,
  },
  logoutText: {
    fontSize: 16,
    color: '#EF4444',
    marginLeft: 12,
    fontWeight: '600',
  },
  brandingSection: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoImage: {
  width: 40,
  height: 40,
  borderRadius: 8,
},

  brandingText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
});
