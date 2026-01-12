// Firebase Configuration
import { initializeApp } from 'firebase/app';
import { getAnalytics, logEvent, Analytics } from 'firebase/analytics';
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    User as FirebaseUser
} from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyDWHPok9lzp1zFERffT1qTYpl8jTWIehQU",
    authDomain: "capi-47f63.firebaseapp.com",
    projectId: "capi-47f63",
    storageBucket: "capi-47f63.firebasestorage.app",
    messagingSenderId: "652718075950",
    appId: "1:652718075950:web:bc93c5e6dccfa537222fbf",
    measurementId: "G-JDEWBRYQ4Z"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Configure Google Provider
googleProvider.setCustomParameters({
    prompt: 'select_account'
});

// Initialize Analytics (only in browser environment)
let analytics: Analytics | null = null;

if (typeof window !== 'undefined') {
    analytics = getAnalytics(app);
}

// --- Google Authentication Functions ---

export interface GoogleUserData {
    uid: string;
    email: string;
    name: string;
    photoURL: string | null;
    emailVerified: boolean;
}

/**
 * Sign in with Google popup
 * Returns user data if successful
 */
export const signInWithGoogle = async (): Promise<GoogleUserData> => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        return {
            uid: user.uid,
            email: user.email || '',
            name: user.displayName || '',
            photoURL: user.photoURL,
            emailVerified: user.emailVerified
        };
    } catch (error: any) {
        console.error('Google Sign-In Error:', error);
        throw error;
    }
};

/**
 * Sign out from Firebase
 */
export const signOutFromFirebase = async (): Promise<void> => {
    try {
        await firebaseSignOut(auth);
    } catch (error) {
        console.error('Sign Out Error:', error);
        throw error;
    }
};

/**
 * Get current Firebase user
 */
export const getCurrentFirebaseUser = (): FirebaseUser | null => {
    return auth.currentUser;
};

/**
 * Listen to auth state changes
 */
export const onAuthChange = (callback: (user: FirebaseUser | null) => void) => {
    return onAuthStateChanged(auth, callback);
};

// Helper function to track custom events
export const trackEvent = (eventName: string, eventParams?: Record<string, unknown>) => {
    if (analytics) {
        logEvent(analytics, eventName, eventParams);
    }
};

// Pre-defined event trackers for common actions
export const firebaseAnalytics = {
    // Page Views
    pageView: (pageName: string) => {
        trackEvent('page_view', { page_name: pageName });
    },

    // User Actions
    userLogin: (method: string = 'email') => {
        trackEvent('login', { method });
    },

    userSignUp: (method: string = 'email') => {
        trackEvent('sign_up', { method });
    },

    userLogout: () => {
        trackEvent('logout');
    },

    // Subscription Events
    startTrial: () => {
        trackEvent('start_trial');
    },

    subscriptionPurchase: (planName: string, amount: number) => {
        trackEvent('purchase', {
            plan_name: planName,
            value: amount,
            currency: 'BRL'
        });
    },

    // Feature Usage
    featureUsed: (featureName: string) => {
        trackEvent('feature_used', { feature_name: featureName });
    },

    // AI Assistant
    aiAssistantUsed: (action: string) => {
        trackEvent('ai_assistant', { action });
    },

    // Sales/Transactions
    saleCompleted: (amount: number, method: string) => {
        trackEvent('sale_completed', {
            value: amount,
            currency: 'BRL',
            payment_method: method
        });
    },

    // Errors
    errorOccurred: (errorType: string, errorMessage: string) => {
        trackEvent('error', {
            error_type: errorType,
            error_message: errorMessage
        });
    }
};

export { app, auth, analytics };
