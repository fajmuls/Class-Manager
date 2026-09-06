import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role, ClassInfo, PermissionCode } from '../types/index.ts';
import { api } from '../services/api.ts';
import {
  auth,
  signInWithGoogle,
  signOutFirebase,
  getAccessToken,
  setAccessToken,
} from '../services/firebase.ts';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { UnauthorizedDomainModal } from '../components/Auth/UnauthorizedDomainModal.tsx';

interface AuthContextType {
  user: User | null;
  role: Role | null;
  permissions: PermissionCode[];
  classInfo: ClassInfo | null;
  allUsers: User[];
  isLoading: boolean;
  firebaseUser: FirebaseUser | null;
  googleAccessToken: string | null;
  isSuperAdmin: boolean;
  claimStatus: {
    requiresClaim: boolean;
    isPendingApproval: boolean;
    claimRequest?: any;
  };
  hasPermission: (permission: PermissionCode) => boolean;
  switchUser: (userId: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithEmailDirect: (email: string, displayName?: string) => Promise<void>;
  openDomainHelper: () => void;
  logoutGoogle: () => Promise<void>;
  assignUserRole: (userId: string, roleId: string) => Promise<void>;
  refreshAuth: () => Promise<void>;
  updateClassInfoState: (info: ClassInfo) => void;
  setClassInfo: (info: ClassInfo) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<PermissionCode[]>([]);
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [googleAccessToken, setGoogleAccessTokenState] = useState<string | null>(getAccessToken());
  const [showDomainModal, setShowDomainModal] = useState(false);
  const [claimStatus, setClaimStatus] = useState<{
    requiresClaim: boolean;
    isPendingApproval: boolean;
    claimRequest?: any;
  }>({
    requiresClaim: false,
    isPendingApproval: false,
  });

  const loadInitialData = async (activeEmail?: string) => {
    try {
      setIsLoading(true);
      const [meData, usersList] = await Promise.all([
        api.getMe(),
        api.getAllUsers(),
      ]);

      setUser(meData.user);
      setRole(meData.role);
      setPermissions(meData.permissions as PermissionCode[]);
      setClassInfo(meData.classInfo);
      setAllUsers(usersList);
    } catch (err) {
      console.error('Failed to load user or class data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Listen to Firebase Auth state
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser && fbUser.email) {
        try {
          const res = await api.googleLogin({
            email: fbUser.email,
            displayName: fbUser.displayName,
            photoURL: fbUser.photoURL,
            uid: fbUser.uid,
          });

          if (res.requiresClaim || res.isPendingApproval) {
            setClaimStatus({
              requiresClaim: Boolean(res.requiresClaim),
              isPendingApproval: Boolean(res.isPendingApproval),
              claimRequest: res.claimRequest,
            });
          } else {
            setClaimStatus({
              requiresClaim: false,
              isPendingApproval: false,
            });
          }

          if (res.user) {
            setUser(res.user);
            setRole(res.role);
            setPermissions(res.permissions as PermissionCode[]);
            setClassInfo(res.classInfo);
          }
          const usersList = await api.getAllUsers();
          setAllUsers(usersList);
        } catch (err) {
          console.error('Failed to sync google login with backend:', err);
          await loadInitialData();
        } finally {
          setIsLoading(false);
        }
      } else {
        setClaimStatus({ requiresClaim: false, isPendingApproval: false });
        await loadInitialData();
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      setIsLoading(true);
      const res = await signInWithGoogle();
      if (res.accessToken) {
        setGoogleAccessTokenState(res.accessToken);
      }
      if (res.user.email) {
        const syncRes = await api.googleLogin({
          email: res.user.email,
          displayName: res.user.displayName,
          photoURL: res.user.photoURL,
          uid: res.user.uid,
        });

        if (syncRes.requiresClaim || syncRes.isPendingApproval) {
          setClaimStatus({
            requiresClaim: Boolean(syncRes.requiresClaim),
            isPendingApproval: Boolean(syncRes.isPendingApproval),
            claimRequest: syncRes.claimRequest,
          });
        } else {
          setClaimStatus({
            requiresClaim: false,
            isPendingApproval: false,
          });
        }

        if (syncRes.user) {
          setUser(syncRes.user);
          setRole(syncRes.role);
          setPermissions(syncRes.permissions as PermissionCode[]);
          setClassInfo(syncRes.classInfo);
        }
        const usersList = await api.getAllUsers();
        setAllUsers(usersList);
      }
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      const errMsg = err?.message || String(err);
      if (
        errMsg.includes('auth/unauthorized-domain') ||
        err?.code === 'auth/unauthorized-domain' ||
        errMsg.includes('unauthorized-domain')
      ) {
        // Otomatis buka modal panduan otorisasi domain & bypass login
        setShowDomainModal(true);
      } else {
        alert(err.message || 'Gagal login dengan Google');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithEmailDirect = async (email: string, displayName?: string) => {
    try {
      setIsLoading(true);
      const cleanEmail = email.trim();
      const cleanName = displayName?.trim() || cleanEmail.split('@')[0];
      const syncRes = await api.googleLogin({
        email: cleanEmail,
        displayName: cleanName,
        photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=2563eb&color=fff`,
        uid: `manual_${Date.now()}_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
      });

      if (syncRes.requiresClaim || syncRes.isPendingApproval) {
        setClaimStatus({
          requiresClaim: Boolean(syncRes.requiresClaim),
          isPendingApproval: Boolean(syncRes.isPendingApproval),
          claimRequest: syncRes.claimRequest,
        });
      } else {
        setClaimStatus({
          requiresClaim: false,
          isPendingApproval: false,
        });
      }

      if (syncRes.user) {
        setUser(syncRes.user);
        setRole(syncRes.role);
        setPermissions(syncRes.permissions as PermissionCode[]);
        setClassInfo(syncRes.classInfo);
      }
      const usersList = await api.getAllUsers();
      setAllUsers(usersList);
      setShowDomainModal(false);
    } catch (err: any) {
      console.error('Direct Login Error:', err);
      alert(err.message || 'Gagal masuk akun');
    } finally {
      setIsLoading(false);
    }
  };

  const openDomainHelper = () => setShowDomainModal(true);

  const logoutGoogle = async () => {
    try {
      setIsLoading(true);
      await signOutFirebase();
      setGoogleAccessTokenState(null);
      setFirebaseUser(null);
      setClaimStatus({ requiresClaim: false, isPendingApproval: false });
      await api.switchUser('usr_superadmin');
      await loadInitialData();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const isSuperAdmin = Boolean(
    user?.email?.toLowerCase() === 'mrachmanfm@gmail.com' ||
    firebaseUser?.email?.toLowerCase() === 'mrachmanfm@gmail.com' ||
    role?.id === 'role_superadmin'
  );

  const hasPermission = (permission: PermissionCode): boolean => {
    if (isSuperAdmin) return true;
    if (!role) return false;
    return permissions.includes(permission);
  };

  const switchUser = async (userId: string) => {
    setIsLoading(true);
    try {
      await api.switchUser(userId);
      await loadInitialData();
    } catch (err) {
      console.error('Failed to switch user:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const assignUserRole = async (userId: string, roleId: string) => {
    const res = await api.assignUserRole(userId, roleId);
    if (res.success) {
      const usersList = await api.getAllUsers();
      setAllUsers(usersList);
      if (user?.id === userId) {
        setRole(res.role);
        setPermissions(res.role.permissions as PermissionCode[]);
      }
    }
  };

  const refreshAuth = async () => {
    setClaimStatus({ requiresClaim: false, isPendingApproval: false });
    await loadInitialData();
  };

  const updateClassInfoState = (info: ClassInfo) => {
    setClassInfo(info);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        permissions,
        classInfo,
        allUsers,
        isLoading,
        firebaseUser,
        googleAccessToken,
        isSuperAdmin,
        claimStatus,
        hasPermission,
        switchUser,
        loginWithGoogle,
        loginWithEmailDirect,
        openDomainHelper,
        logoutGoogle,
        assignUserRole,
        refreshAuth,
        updateClassInfoState,
        setClassInfo: updateClassInfoState,
      }}
    >
      {children}
      <UnauthorizedDomainModal
        isOpen={showDomainModal}
        onClose={() => setShowDomainModal(false)}
      />
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
