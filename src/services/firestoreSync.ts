import {
  db,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
} from '../lib/firebase.ts';
import { ClassInfo, User, Role, Transaction, EventItem, TaskItem } from '../types/index.ts';

export type FirestoreConnectionStatus = 'connected' | 'connecting' | 'offline';

let connectionStatus: FirestoreConnectionStatus = 'connecting';
const statusListeners: Set<(status: FirestoreConnectionStatus) => void> = new Set();

export function setConnectionStatus(status: FirestoreConnectionStatus) {
  if (connectionStatus !== status) {
    connectionStatus = status;
    statusListeners.forEach((fn) => {
      try {
        fn(status);
      } catch (err) {
        console.error('Status listener error:', err);
      }
    });
  }
}

export function subscribeToConnectionStatus(fn: (status: FirestoreConnectionStatus) => void): () => void {
  statusListeners.add(fn);
  fn(connectionStatus);
  return () => {
    statusListeners.delete(fn);
  };
}

export function getConnectionStatus(): FirestoreConnectionStatus {
  return connectionStatus;
}

// ==========================================
// 1. CLASS MANAGEMENT (CLOUDFIRESTORE)
// ==========================================

export async function fetchClassesFromFirestore(): Promise<ClassInfo[]> {
  try {
    const classesRef = collection(db, 'classes');
    const snap = await getDocs(classesRef);
    const result: ClassInfo[] = [];

    snap.forEach((docSnap) => {
      const data = docSnap.data();
      result.push({
        id: docSnap.id,
        name: data.name || 'Kelas Manajer',
        code: data.code || '01SAKP014',
        academic_year: data.academic_year || '2026/2027',
        semester: data.semester || 'Semester 1 (Ganjil)',
        major: data.major || 'S1 Akuntansi',
        faculty: data.faculty || 'Fakultas Ekonomi dan Bisnis',
        description: data.description || '',
        monthly_dues_amount: Number(data.monthly_dues_amount) || 20000,
        created_at: data.created_at || new Date().toISOString(),
        updated_at: data.updated_at || new Date().toISOString(),
      });
    });

    // Check fallback doc 'classInfo/main' if classes collection is empty
    if (result.length === 0) {
      const singleRef = doc(db, 'classInfo', 'main');
      const singleSnap = await getDoc(singleRef);
      if (singleSnap.exists()) {
        const data = singleSnap.data();
        result.push({
          id: data.id || 'cls_main',
          name: data.name || 'Kelas Manajer',
          code: data.code || '01SAKP014',
          academic_year: data.academic_year || '2026/2027',
          semester: data.semester || 'Semester 1 (Ganjil)',
          major: data.major || 'S1 Akuntansi',
          faculty: data.faculty || 'Fakultas Ekonomi dan Bisnis',
          description: data.description || '',
          monthly_dues_amount: Number(data.monthly_dues_amount) || 20000,
          created_at: data.created_at || new Date().toISOString(),
          updated_at: data.updated_at || new Date().toISOString(),
        });
      }
    }

    setConnectionStatus('connected');
    return result;
  } catch (err) {
    console.warn('Firestore fetchClasses warning (Spark/offline fallback):', err);
    setConnectionStatus('offline');
    return [];
  }
}

export function subscribeToClasses(callback: (classes: ClassInfo[]) => void): () => void {
  try {
    const classesRef = collection(db, 'classes');
    return onSnapshot(
      classesRef,
      (snapshot) => {
        setConnectionStatus('connected');
        const list: ClassInfo[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            name: data.name || 'Kelas Manajer',
            code: data.code || '01SAKP014',
            academic_year: data.academic_year || '2026/2027',
            semester: data.semester || 'Semester 1 (Ganjil)',
            major: data.major || 'S1 Akuntansi',
            faculty: data.faculty || 'Fakultas Ekonomi dan Bisnis',
            description: data.description || '',
            monthly_dues_amount: Number(data.monthly_dues_amount) || 20000,
            created_at: data.created_at || new Date().toISOString(),
            updated_at: data.updated_at || new Date().toISOString(),
          });
        });
        callback(list);
      },
      (error) => {
        console.warn('Firestore classes onSnapshot listener warning:', error);
        setConnectionStatus('offline');
      }
    );
  } catch (err) {
    console.warn('Failed to subscribe to classes:', err);
    return () => {};
  }
}

export async function createClassInFirestore(classData: Partial<ClassInfo>): Promise<ClassInfo> {
  const classId = classData.id || `cls_${Date.now()}`;
  const now = new Date().toISOString();

  const newClass: ClassInfo = {
    id: classId,
    name: classData.name || 'Kelas Baru',
    code: classData.code || 'KLS-01',
    academic_year: classData.academic_year || '2026/2027',
    semester: classData.semester || 'Semester 1 (Ganjil)',
    major: classData.major || 'S1 Akuntansi',
    faculty: classData.faculty || 'Fakultas Ekonomi dan Bisnis',
    description: classData.description || '',
    monthly_dues_amount: Number(classData.monthly_dues_amount) || 20000,
    created_at: now,
    updated_at: now,
  };

  try {
    // 1. Save to /classes/{classId}
    await setDoc(doc(db, 'classes', classId), newClass, { merge: true });
    // 2. Also save as main active class in /classInfo/main for instant lookup
    await setDoc(doc(db, 'classInfo', 'main'), newClass, { merge: true });
    setConnectionStatus('connected');
  } catch (err) {
    console.warn('Could not write class to Firestore directly:', err);
  }

  // Always update local cache
  try {
    localStorage.setItem('cms_cached_classinfo', JSON.stringify(newClass));
    localStorage.setItem('cms_store_class_info', JSON.stringify(newClass));
  } catch {}

  return newClass;
}

export async function updateClassInFirestore(classId: string, classData: Partial<ClassInfo>): Promise<ClassInfo> {
  const now = new Date().toISOString();
  const updatedData = {
    ...classData,
    updated_at: now,
  };

  try {
    await setDoc(doc(db, 'classes', classId), updatedData, { merge: true });
    await setDoc(doc(db, 'classInfo', 'main'), updatedData, { merge: true });
    setConnectionStatus('connected');
  } catch (err) {
    console.warn('Could not update class in Firestore:', err);
  }

  try {
    const raw = localStorage.getItem('cms_cached_classinfo');
    if (raw) {
      const merged = { ...JSON.parse(raw), ...updatedData };
      localStorage.setItem('cms_cached_classinfo', JSON.stringify(merged));
    }
  } catch {}

  return updatedData as ClassInfo;
}

// ==========================================
// 2. REAL-TIME MEMBER SYNC (USERS COLLECTION)
// ==========================================

export function subscribeToMembers(callback: (members: User[]) => void): () => void {
  try {
    const usersRef = collection(db, 'users');
    return onSnapshot(
      usersRef,
      (snapshot) => {
        setConnectionStatus('connected');
        const list: User[] = [];
        const seenEmails = new Set<string>();

        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          const email = d.email || '';
          if (email && seenEmails.has(email.toLowerCase())) return;
          if (email) seenEmails.add(email.toLowerCase());

          // Map document to Classify Pro User structure
          const isSuper = email.toLowerCase() === 'mrachmanfm@gmail.com';
          const roleId = isSuper ? 'role_superadmin' : d.role_id || 'role_anggota';
          const roleName = isSuper ? 'Super Admin' : d.class_role || d.position || 'Anggota Kelas';

          list.push({
            id: docSnap.id,
            name: d.name || d.displayName || email.split('@')[0] || 'Mahasiswa',
            nim: d.nim || d.student_id || '2601001400',
            email: email,
            phone: d.phone || '',
            avatar: d.avatar || d.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(d.name || email)}&background=2563eb&color=fff`,
            class_id: d.class_id || 'cls_01sakp014',
            department: d.department || d.major || 'S1 Akuntansi',
            cohort: d.cohort || '2026',
            role_id: roleId,
            role_name: roleName,
            position: roleName,
            is_active: d.is_active !== false,
            joined_at: d.joined_at || d.created_at || new Date().toISOString(),
            created_at: d.created_at || new Date().toISOString(),
            updated_at: d.updated_at || new Date().toISOString(),
          });
        });

        // If Firestore had members, pass them to callback
        if (list.length > 0) {
          try {
            localStorage.setItem('cms_store_users', JSON.stringify(list));
          } catch {}
          callback(list);
        }
      },
      (error) => {
        console.warn('Firestore users onSnapshot warning:', error);
        setConnectionStatus('offline');
      }
    );
  } catch (err) {
    console.warn('Failed to subscribe to members:', err);
    return () => {};
  }
}

export async function fetchMembersFromFirestore(): Promise<User[]> {
  try {
    const usersRef = collection(db, 'users');
    const snap = await getDocs(usersRef);
    const list: User[] = [];
    const seenEmails = new Set<string>();

    snap.forEach((docSnap) => {
      const d = docSnap.data();
      const email = d.email || '';
      if (email && seenEmails.has(email.toLowerCase())) return;
      if (email) seenEmails.add(email.toLowerCase());

      const isSuper = email.toLowerCase() === 'mrachmanfm@gmail.com';
      const roleId = isSuper ? 'role_superadmin' : d.role_id || 'role_anggota';
      const roleName = isSuper ? 'Super Admin' : d.class_role || d.position || 'Anggota Kelas';

      list.push({
        id: docSnap.id,
        name: d.name || d.displayName || email.split('@')[0] || 'Mahasiswa',
        nim: d.nim || d.student_id || '2601001400',
        email: email,
        phone: d.phone || '',
        avatar: d.avatar || d.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(d.name || email)}&background=2563eb&color=fff`,
        class_id: d.class_id || 'cls_01sakp014',
        department: d.department || 'S1 Akuntansi',
        cohort: d.cohort || '2026',
        role_id: roleId,
        role_name: roleName,
        position: roleName,
        is_active: d.is_active !== false,
        joined_at: d.joined_at || new Date().toISOString(),
        created_at: d.created_at || new Date().toISOString(),
        updated_at: d.updated_at || new Date().toISOString(),
      });
    });

    if (list.length > 0) {
      setConnectionStatus('connected');
      try {
        localStorage.setItem('cms_store_users', JSON.stringify(list));
      } catch {}
      return list;
    }
  } catch (err) {
    console.warn('Firestore fetchMembers warning:', err);
    setConnectionStatus('offline');
  }

  // Fallback to local cache if offline
  try {
    const raw = localStorage.getItem('cms_store_users');
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export async function saveMemberToFirestore(memberData: Partial<User>): Promise<User> {
  const userId = memberData.id || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const isSuper = memberData.email?.toLowerCase() === 'mrachmanfm@gmail.com';
  const roleId = isSuper ? 'role_superadmin' : memberData.role_id || 'role_anggota';
  const position = isSuper ? 'Super Admin' : memberData.position || memberData.role_name || 'Anggota Kelas';

  const userDoc: User = {
    id: userId,
    name: memberData.name || 'Mahasiswa Baru',
    nim: memberData.nim || '',
    email: memberData.email || '',
    phone: memberData.phone || '',
    avatar: memberData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(memberData.name || 'User')}&background=2563eb&color=fff`,
    class_id: memberData.class_id || 'cls_01sakp014',
    department: memberData.department || 'S1 Akuntansi',
    cohort: memberData.cohort || '2026',
    role_id: roleId,
    role_name: position,
    position: position,
    is_active: memberData.is_active !== false,
    joined_at: memberData.joined_at || now,
    created_at: memberData.created_at || now,
    updated_at: now,
  };

  // Firestore isolated payload
  const firestorePayload = {
    name: userDoc.name,
    displayName: userDoc.name,
    nim: userDoc.nim,
    student_id: userDoc.nim,
    email: userDoc.email,
    phone: userDoc.phone,
    avatar: userDoc.avatar,
    photoURL: userDoc.avatar,
    class_id: userDoc.class_id,
    class_name: 'Kelas 01SAKP014',
    class_role: position,
    role_id: roleId,
    position: position,
    is_active: userDoc.is_active,
    updated_at: now,
    classify_pro_last_active: now,
  };

  try {
    await setDoc(doc(db, 'users', userId), firestorePayload, { merge: true });
    await setDoc(doc(db, 'members', userId), firestorePayload, { merge: true });
    setConnectionStatus('connected');
  } catch (err) {
    console.warn('Could not write member to Firestore directly:', err);
  }

  // Update local storage
  try {
    const raw = localStorage.getItem('cms_store_users');
    const list: User[] = raw ? JSON.parse(raw) : [];
    const idx = list.findIndex((u) => u.id === userId || (u.email && u.email === userDoc.email));
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...userDoc };
    } else {
      list.push(userDoc);
    }
    localStorage.setItem('cms_store_users', JSON.stringify(list));
  } catch {}

  return userDoc;
}

export async function deleteMemberFromFirestore(userId: string): Promise<boolean> {
  const now = new Date().toISOString();
  try {
    await updateDoc(doc(db, 'users', userId), {
      is_active: false,
      updated_at: now,
    });
    setConnectionStatus('connected');
    return true;
  } catch (err) {
    console.warn('Could not deactivate member in Firestore:', err);
    return false;
  }
}

// ==========================================
// 3. EXPORT LOCAL JSON BACKUP
// ==========================================

export async function exportClassBackupJSON(
  classInfo: ClassInfo | null,
  members: User[]
): Promise<void> {
  // Collect full dataset
  let transactions: Transaction[] = [];
  let events: EventItem[] = [];
  let tasks: TaskItem[] = [];

  try {
    const txRaw = localStorage.getItem('cms_store_transactions');
    if (txRaw) transactions = JSON.parse(txRaw);
    const evtRaw = localStorage.getItem('cms_store_events');
    if (evtRaw) events = JSON.parse(evtRaw);
    const tskRaw = localStorage.getItem('cms_store_tasks');
    if (tskRaw) tasks = JSON.parse(tskRaw);
  } catch {}

  const backupData = {
    app_version: 'v2.8.0',
    app_name: 'Classify Pro - Kelas Manajer',
    exported_at: new Date().toISOString(),
    system: {
      platform: 'Web Client / PWA / Cloud Firestore',
      environment: 'Spark Free Tier (Zero Paid Dependencies)',
    },
    class_info: classInfo,
    members_count: members.length,
    members: members,
    finance: {
      transactions_count: transactions.length,
      transactions: transactions,
    },
    agenda: {
      events_count: events.length,
      events: events,
    },
    tasks: {
      tasks_count: tasks.length,
      tasks: tasks,
    },
  };

  const jsonString = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const cleanCode = (classInfo?.code || 'kelas').replace(/[^a-zA-Z0-9_-]/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `cadangan-kelas-${cleanCode}-${dateStr}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
