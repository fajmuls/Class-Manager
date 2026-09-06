import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');
googleProvider.addScope('https://www.googleapis.com/auth/drive.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/spreadsheets');
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

let cachedAccessToken: string | null = sessionStorage.getItem('google_access_token');

export const getAccessToken = (): string | null => {
  if (!cachedAccessToken) {
    cachedAccessToken = sessionStorage.getItem('google_access_token');
  }
  return cachedAccessToken;
};

export const setAccessToken = (token: string | null) => {
  cachedAccessToken = token;
  if (token) {
    sessionStorage.setItem('google_access_token', token);
  } else {
    sessionStorage.removeItem('google_access_token');
  }
};

export const signInWithGoogle = async (): Promise<{ user: FirebaseUser; accessToken?: string }> => {
  const result = await signInWithPopup(auth, googleProvider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const token = credential?.accessToken;
  if (token) {
    setAccessToken(token);
  }
  return { user: result.user, accessToken: token };
};

export const signOutFirebase = async () => {
  setAccessToken(null);
  await signOut(auth);
};

export enum OperationType {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerData: Array<{
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoURL: string | null;
    }>;
  };
}

export function handleFirestoreError(error: any, operationType: OperationType, path: string | null): never {
  const user = auth.currentUser;
  const errorInfo: FirestoreErrorInfo = {
    error: error?.message || String(error),
    operationType,
    path,
    authInfo: {
      userId: user?.uid,
      email: user?.email,
      emailVerified: user?.emailVerified,
      isAnonymous: user?.isAnonymous,
      tenantId: user?.tenantId,
      providerData: (user?.providerData || []).map(p => ({
        providerId: p.providerId,
        displayName: p.displayName,
        email: p.email,
        photoURL: p.photoURL,
      })),
    },
  };
  console.error('Firestore Error:', JSON.stringify(errorInfo));
  throw new Error(JSON.stringify(errorInfo));
}

export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    console.log('Firebase connection initialized successfully');
  }
}
