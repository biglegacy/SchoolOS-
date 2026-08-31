import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { initializeFirestore, getFirestore, Firestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import firebaseConfigJson from '../../firebase-applet-config.json';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

let app: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;
let authInstance: Auth | null = null;
let storageInstance: FirebaseStorage | null = null;

const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey || "AIzaSyCvUZm5yTsmgO_9UfpMFDR7N9X5n5HfAOs",
  authDomain: firebaseConfigJson.authDomain || "aerobic-mechanic-1dw77.firebaseapp.com",
  projectId: firebaseConfigJson.projectId || "aerobic-mechanic-1dw77",
  storageBucket: firebaseConfigJson.storageBucket || "aerobic-mechanic-1dw77.firebasestorage.app",
  messagingSenderId: firebaseConfigJson.messagingSenderId || "211489567788",
  appId: firebaseConfigJson.appId || "1:211489567788:web:1356c1069a56344d050d89",
};

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  const dbId = (firebaseConfigJson as any).firestoreDatabaseId || undefined;
  if (dbId) {
    try {
      dbInstance = initializeFirestore(app, {
        experimentalAutoDetectLongPolling: true,
      }, dbId);
    } catch {
      dbInstance = getFirestore(app, dbId);
    }
  } else {
    try {
      dbInstance = initializeFirestore(app, {
        experimentalAutoDetectLongPolling: true,
      });
    } catch {
      dbInstance = getFirestore(app);
    }
  }
  authInstance = getAuth(app);
  storageInstance = getStorage(app);
} catch (err) {
  console.warn("Firebase initialization notice:", err);
}

export const appInstance = app;
export const db = dbInstance;
export const auth = authInstance;
export const storage = storageInstance;

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const currentAuth = auth?.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentAuth?.uid || null,
      email: currentAuth?.email || null,
      emailVerified: currentAuth?.emailVerified || false,
      isAnonymous: currentAuth?.isAnonymous || false,
      tenantId: currentAuth?.tenantId || null,
      providerInfo: currentAuth?.providerData?.map(p => ({
        providerId: p.providerId,
        email: p.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection check with server ping
export async function testFirestoreConnection(): Promise<boolean> {
  if (!db) return false;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.info("Firestore is currently running in offline persistent storage mode.");
    }
    return false;
  }
}
