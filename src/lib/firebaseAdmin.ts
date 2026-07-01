import { initializeApp, getApps, getApp, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getAuth, Auth } from "firebase-admin/auth";
import { getStorage, Storage } from "firebase-admin/storage";

let app: App | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let storage: Storage | null = null;

function getFirebaseAdminApp(): App {
  if (!app) {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT_KEY environment variable is missing. Please configure it in your Vercel/environment settings."
      );
    }
    try {
      const serviceAccount = JSON.parse(serviceAccountKey);
      app = getApps().length > 0
        ? getApp()
        : initializeApp({
            credential: cert(serviceAccount),
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          });
    } catch (error: any) {
      throw new Error(`Failed to initialize Firebase Admin: ${error.message}`);
    }
  }
  return app;
}

export const adminDb = new Proxy({} as Firestore, {
  get(target, prop, receiver) {
    if (!db) {
      db = getFirestore(getFirebaseAdminApp());
    }
    const value = Reflect.get(db, prop);
    if (typeof value === "function") {
      return value.bind(db);
    }
    return value;
  },
});

export const adminAuth = new Proxy({} as Auth, {
  get(target, prop, receiver) {
    if (!auth) {
      auth = getAuth(getFirebaseAdminApp());
    }
    const value = Reflect.get(auth, prop);
    if (typeof value === "function") {
      return value.bind(auth);
    }
    return value;
  },
});

export const adminStorage = new Proxy({} as Storage, {
  get(target, prop, receiver) {
    if (!storage) {
      storage = getStorage(getFirebaseAdminApp());
    }
    const value = Reflect.get(storage, prop);
    if (typeof value === "function") {
      return value.bind(storage);
    }
    return value;
  },
});


