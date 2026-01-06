"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { User, onAuthStateChanged, signOut as firebaseSignOut, GoogleAuthProvider, GithubAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp, getDoc, query, collection, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  signInWithGoogle: () => Promise<User | null>;
  signInWithGithub: () => Promise<User | null>;
  signInWithEmail: (email: string, password: string) => Promise<User | null>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<User | null>;
  enterGuestMode: () => Promise<boolean>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isGuest: false,
  signInWithGoogle: async () => null,
  signInWithGithub: async () => null,
  signInWithEmail: async () => null,
  signUpWithEmail: async () => null,
  enterGuestMode: async () => false,
  signOut: async () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);

      // Ensure user exists in Firestore when they're authenticated
      if (user) {
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);

          if (!userDoc.exists()) {
            // User exists in Auth but not Firestore - create their profile
            const baseName = (user.displayName || user.email?.split('@')[0] || 'user')
              .replace(/\s+/g, '')
              .toLowerCase()
              .substring(0, 10);
            const username = `@${baseName}_${Math.floor(Math.random() * 1000)}`;

            await setDoc(userDocRef, {
              email: user.email,
              displayName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
              photoURL: user.photoURL,
              provider: user.providerData[0]?.providerId || 'unknown',
              lastSignIn: serverTimestamp(),
              username: username,
              followerCount: 0,
              followingCount: 0,
            });
          }
        } catch (error) {
          console.error("[Auth] Error syncing user to Firestore:", error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async (): Promise<User | null> => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      'prompt': 'consent'
    });

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;

      await handleUserCreation(user, 'google', accessToken);
      return user;
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      return null;
    }
  };

  const signInWithGithub = async (): Promise<User | null> => {
    const provider = new GithubAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      await handleUserCreation(user, 'github');
      return user;
    } catch (error) {
      console.error("Github Sign-In Error:", error);
      return null;
    }
  };

  const signInWithEmail = async (email: string, password: string): Promise<User | null> => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      // No extra user creation logic needed usually for login, except ensuring firestore doc
      // but let's run it just in case to sync
      await handleUserCreation(result.user, 'email');
      return result.user;
    } catch (error) {
      console.error("Email Sign-In Error:", error);
      throw error;
    }
  }

  const signUpWithEmail = async (email: string, password: string, name: string): Promise<User | null> => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;
      await updateProfile(user, { displayName: name });
      // Create firestore doc
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        displayName: name,
        photoURL: user.photoURL,
        provider: 'email',
        lastSignIn: serverTimestamp(),
        username: await generateUniqueUsername(name || email.split('@')[0])
      }, { merge: true });

      return user;
    } catch (error) {
      console.error("Email Sign-Up Error:", error);
      throw error;
    }
  }

  const generateUniqueUsername = async (baseNameInput: string) => {
    const baseName = baseNameInput.replace(/\s+/g, '').toLowerCase().substring(0, 10);
    let isUnique = false;
    let attempt = 0;
    let finalUsername = '';

    while (!isUnique) {
      const suffix = attempt === 0 ? Math.floor(Math.random() * 1000) : Math.floor(Math.random() * 100000);
      const candidate = `@${baseName}_${suffix}`;

      const q = query(collection(db, "users"), where("username", "==", candidate));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        finalUsername = candidate;
        isUnique = true;
      }
      attempt++;
    }
    return finalUsername;
  }

  const handleUserCreation = async (user: User, providerName: string, accessToken?: string) => {
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    let finalUsername;
    if (userDoc.exists() && userDoc.data().username) {
      finalUsername = userDoc.data().username;
    } else {
      finalUsername = await generateUniqueUsername(user.displayName || user.email?.split('@')[0] || "user");
    }

    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      provider: providerName,
      lastSignIn: serverTimestamp(),
      accessToken: accessToken || null,
      username: finalUsername
    }, { merge: true });
  }

  const enterGuestMode = async (): Promise<boolean> => {
    const hasTested = localStorage.getItem('has_tested_app');
    if (hasTested === 'true') {
      return false;
    }
    setIsGuest(true);
    return true;
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setIsGuest(false);
      router.push('/login');
    } catch (error) {
      console.error("Sign Out Error:", error);
    }
  };

  const value = {
    user,
    loading,
    isGuest,
    signInWithGoogle,
    signInWithGithub,
    signInWithEmail,
    signUpWithEmail,
    enterGuestMode,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};