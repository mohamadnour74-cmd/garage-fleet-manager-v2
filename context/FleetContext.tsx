
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { FleetItem, MaintenanceRecord, Settings, FleetType, UserProfile, UserRole, UserDocument, StatusHistoryRecord, FleetStatus } from '../types';
import { MOCK_SETTINGS, INITIAL_FLEET, INITIAL_RECORDS } from '../constants';
import { db, auth } from '../services/firebaseConfig';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth as getAuthSecondary } from "firebase/auth";
import { firebaseConfigRaw } from '../services/firebaseConfig'; // Import raw config
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  writeBatch,
  query,
  where,
  getDocs,
  limit,
  setDoc,
  getDoc
} from 'firebase/firestore';

interface FleetContextType {
  fleet: FleetItem[];
  loading: boolean;
  isDemoMode: boolean;
  connectionError: string | null;
  currentUser: UserProfile | null;
  systemHasUsers: boolean | null; 
  demoRecords: MaintenanceRecord[];
  demoStatusHistory: StatusHistoryRecord[]; // For Demo Mode
  settings: Settings;
  login: (email: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  createFirstAdmin: (email: string, pass: string, name: string) => Promise<void>;
  createNewUser: (email: string, pass: string, name: string, role: UserRole) => Promise<UserDocument>;
  deleteUser: (userId: string) => Promise<void>;
  getAllUsers: () => Promise<UserDocument[]>;
  addFleetItem: (item: FleetItem) => Promise<void>;
  updateFleetItem: (item: FleetItem) => Promise<void>;
  deleteFleetItem: (id: string, type: FleetType) => Promise<void>;
  importFleet: (items: FleetItem[]) => Promise<void>;
  clearFleet: () => Promise<void>;
  addRecord: (record: MaintenanceRecord, vehicleType: FleetType) => Promise<void>;
}

const FleetContext = createContext<FleetContextType | undefined>(undefined);

export const FleetProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [fleet, setFleet] = useState<FleetItem[]>([]);
  const [settings, setSettings] = useState<Settings>(MOCK_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  // Demo Data States
  const [demoRecords, setDemoRecords] = useState<MaintenanceRecord[]>(INITIAL_RECORDS);
  const [demoStatusHistory, setDemoStatusHistory] = useState<StatusHistoryRecord[]>([]);
  const [demoUsers, setDemoUsers] = useState<UserDocument[]>([
      { id: 'demo-admin', name: 'Demo Manager', email: 'admin@garage.com', role: 'manager', createdAt: new Date().toISOString() },
      { id: 'demo-staff', name: 'John Mechanic', email: 'john@garage.com', role: 'staff', createdAt: new Date().toISOString() }
  ]);

  // User Auth State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [systemHasUsers, setSystemHasUsers] = useState<boolean | null>(null);

  // 1. Initial Load
  useEffect(() => {
    let unsubVehicles: () => void;
    let unsubEquipment: () => void;

    const initApp = async () => {
        setLoading(true);

        // A. Check for Users Collection
        try {
            const usersRef = collection(db, 'users');
            const snapshot = await getDocs(query(usersRef, limit(1)));
            setSystemHasUsers(!snapshot.empty);
        } catch (error: any) {
             console.warn("Firestore Connection Failed (likely invalid API Key):", error);
             setConnectionError(error.message || "Unknown Error");
             setIsDemoMode(true);
             setSystemHasUsers(true); 
             // Auto-login to demo if not already logged in
             if (!localStorage.getItem('garage_current_user')) {
                 const demoProfile: UserProfile = { id: 'demo-admin', name: 'Demo Manager', role: 'manager', email: 'admin@garage.com' };
                 setCurrentUser(demoProfile);
                 localStorage.setItem('garage_current_user', JSON.stringify(demoProfile));
             }
             setFleet(INITIAL_FLEET);
             setLoading(false);
             return;
        }

        // B. Setup Auth Listener
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Fetch Role from Firestore
                const userDocRef = doc(db, 'users', user.uid);
                try {
                  const userDocSnap = await getDoc(userDocRef);
                  
                  if (userDocSnap.exists()) {
                      const userData = userDocSnap.data() as UserDocument;
                      const profile: UserProfile = { id: user.uid, name: userData.name, role: userData.role, email: userData.email };
                      setCurrentUser(profile);
                      localStorage.setItem('garage_current_user', JSON.stringify(profile));
                  } else {
                      // Fallback for manually created firebase users without firestore doc
                      const profile: UserProfile = { id: user.uid, name: user.email?.split('@')[0] || 'Admin', role: 'manager', email: user.email || '' };
                      setCurrentUser(profile);
                      // Auto-create the missing doc
                      await setDoc(userDocRef, { name: profile.name, role: 'manager', email: profile.email, createdAt: new Date().toISOString() });
                  }
                } catch (err) {
                  console.error("Error fetching user profile:", err);
                  // Allow login even if firestore read fails (e.g. restrictive rules), fallback to basic auth info
                  const profile: UserProfile = { id: user.uid, name: user.email?.split('@')[0] || 'User', role: 'staff', email: user.email || '' };
                  setCurrentUser(profile);
                }
            } else {
                setCurrentUser(null);
                localStorage.removeItem('garage_current_user');
            }
        });

        // C. Setup Fleet Listeners
        const vehiclesCol = collection(db, 'vehicles');
        const equipmentCol = collection(db, 'equipment');

        unsubVehicles = onSnapshot(vehiclesCol, (snapshot) => {
          const vList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FleetItem));
          setFleet(prev => {
            const currentEquipment = prev.filter(i => i.type === 'EQUIPMENT');
            return [...currentEquipment, ...vList];
          });
          setLoading(false);
        }, (err) => {
            console.warn("Firestore Vehicles Read Failed", err);
            setLoading(false);
        });

        unsubEquipment = onSnapshot(equipmentCol, (snapshot) => {
          const eList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FleetItem));
          setFleet(prev => {
            const currentVehicles = prev.filter(i => i.type === 'VEHICLE');
            return [...currentVehicles, ...eList];
          });
          setLoading(false);
        }, (err) => {
            console.warn("Firestore Equipment Read Failed", err);
            setLoading(false);
        });
    };

    initApp();

    return () => {
        if (unsubVehicles) unsubVehicles();
        if (unsubEquipment) unsubEquipment();
    };
  }, []);

  // --- Auth Functions ---

  const login = async (email: string, pass: string) => {
    if (isDemoMode) {
        if (pass === '1234') {
            const demoProfile: UserProfile = { id: 'demo-admin', name: 'Demo Manager', role: 'manager', email };
            setCurrentUser(demoProfile);
            return { success: true };
        }
        return { success: false, message: 'Invalid demo password (1234)' };
    }
    try {
        await signInWithEmailAndPassword(auth, email, pass);
        return { success: true };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
  };

  const logout = () => {
    if (isDemoMode) {
        setCurrentUser(null);
    } else {
        signOut(auth);
    }
    localStorage.removeItem('garage_current_user');
  };

  const createFirstAdmin = async (email: string, pass: string, name: string) => {
    const userCred = await createUserWithEmailAndPassword(auth, email, pass);
    const newUser: UserDocument = {
        id: userCred.user.uid,
        name,
        email,
        role: 'manager',
        createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'users', userCred.user.uid), newUser);
    setSystemHasUsers(true);
  };

  // Uses a secondary app instance to create user without logging out admin
  const createNewUser = async (email: string, pass: string, name: string, role: UserRole): Promise<UserDocument> => {
    if (currentUser?.role !== 'manager') throw new Error("Unauthorized");
    
    // DEMO MODE HANDLER
    if (isDemoMode) {
        const newUser: UserDocument = {
            id: `demo-user-${Date.now()}`,
            name,
            email,
            role,
            createdAt: new Date().toISOString()
        };
        setDemoUsers(prev => [...prev, newUser]);
        return newUser;
    }

    // Create unique app name to avoid "App named SecondaryApp already exists"
    const appName = `SecondaryApp-${Date.now()}`;
    const secondaryApp = initializeApp(firebaseConfigRaw, appName);
    const secondaryAuth = getAuthSecondary(secondaryApp);

    try {
        const userCred = await createUserWithEmailAndPassword(secondaryAuth, email, pass);
        const newUser: UserDocument = {
            id: userCred.user.uid,
            name,
            email,
            role,
            createdAt: new Date().toISOString()
        };
        // Use main app DB to write the user document
        await setDoc(doc(db, 'users', userCred.user.uid), newUser);
        await signOut(secondaryAuth); 
        return newUser;
    } catch (error) {
        throw error;
    } finally {
        await deleteApp(secondaryApp); // Cleanup is crucial
    }
  };

  const deleteUser = async (userId: string) => {
      if (currentUser?.role !== 'manager') throw new Error("Unauthorized");
      
      if (isDemoMode) {
          setDemoUsers(prev => prev.filter(u => u.id !== userId));
          return;
      }

      // Note: We can delete the doc, but deleting Auth user requires Cloud Functions or Admin SDK
      // For this client-side only app, we just remove them from Firestore so they lose access permissions
      await deleteDoc(doc(db, 'users', userId));
  };

  const getAllUsers = async (): Promise<UserDocument[]> => {
      if (currentUser?.role !== 'manager') return [];
      
      if (isDemoMode) {
          return demoUsers;
      }

      try {
        const snapshot = await getDocs(collection(db, 'users'));
        return snapshot.docs.map(doc => doc.data() as UserDocument);
      } catch (error) {
        console.error("Failed to fetch users (Permissions or Network):", error);
        return [];
      }
  };


  // --- Fleet Functions ---

  const getCollectionName = (type: FleetType) => type === 'VEHICLE' ? 'vehicles' : 'equipment';

  const addFleetItem = async (item: FleetItem) => {
    const now = new Date().toISOString();

    if (isDemoMode) {
        const newItem = { ...item, id: Date.now().toString() };
        // Create initial status record in demo
        const initialSessionId = `session_${Date.now()}`;
        const initialRecord: StatusHistoryRecord = {
             id: initialSessionId,
             fleetItemId: newItem.id,
             status: newItem.status,
             startTime: now
        };
        setDemoStatusHistory(prev => [initialRecord, ...prev]);
        setFleet(prev => [...prev, { ...newItem, currentStatusSessionId: initialSessionId }]);
        return;
    }

    const { id, ...data } = item; 
    const colName = getCollectionName(item.type);
    
    // 1. Create the Vehicle Document
    const docRef = await addDoc(collection(db, colName), data);

    // 2. Create the Initial Status History Record (Active/Workshop/etc.)
    const subCol = collection(db, colName, docRef.id, 'status_history');
    const historyRef = await addDoc(subCol, {
        fleetItemId: docRef.id,
        status: item.status,
        startTime: now
    });

    // 3. Link the session ID back to the vehicle
    await updateDoc(docRef, { currentStatusSessionId: historyRef.id });
  };

  const updateFleetItem = async (updatedItem: FleetItem) => {
    // Find previous state to check status change
    const oldItem = fleet.find(i => i.id === updatedItem.id);
    if (!oldItem) return;

    const statusChanged = oldItem.status !== updatedItem.status;
    
    // Updates to push
    let updates: any = { ...updatedItem };
    delete updates.id; // Don't save ID inside doc

    // --- Status Tracking Logic ---
    if (statusChanged) {
        const now = new Date().toISOString();
        
        // 1. Close previous session (ALWAYS, regardless of status type)
        if (oldItem.currentStatusSessionId) {
             if (isDemoMode) {
                 setDemoStatusHistory(prev => prev.map(rec => {
                     if (rec.id === oldItem.currentStatusSessionId) {
                         const start = new Date(rec.startTime);
                         const end = new Date(now);
                         const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                         return { ...rec, endTime: now, durationHours: Number(hours.toFixed(1)) };
                     }
                     return rec;
                 }));
             } else {
                 // Close Firestore Doc
                 const colName = getCollectionName(oldItem.type);
                 const historyRef = doc(db, colName, oldItem.id, 'status_history', oldItem.currentStatusSessionId);
                 
                 // Fetch start time to calculate duration properly
                 const historySnap = await getDoc(historyRef);
                 let durationHours = 0;
                 if (historySnap.exists()) {
                     const start = new Date(historySnap.data().startTime);
                     const end = new Date(now);
                     durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                 }

                 await updateDoc(historyRef, { 
                     endTime: now,
                     durationHours: Number(durationHours.toFixed(1))
                 }); 
             }
        }

        // 2. Open new session (ALWAYS)
        const newSessionId = `session_${Date.now()}`;
        const newRecord: StatusHistoryRecord = {
            id: newSessionId,
            fleetItemId: updatedItem.id,
            status: updatedItem.status,
            startTime: now
        };

        if (isDemoMode) {
            setDemoStatusHistory(prev => [newRecord, ...prev]);
            updates.currentStatusSessionId = newSessionId;
        } else {
            const colName = getCollectionName(updatedItem.type);
            const subCol = collection(db, colName, updatedItem.id, 'status_history');
            const docRef = await addDoc(subCol, newRecord); // Let Firestore gen ID
            updates.currentStatusSessionId = docRef.id;
        }
    }

    if (isDemoMode) {
        setFleet(prev => prev.map(f => f.id === updatedItem.id ? { ...f, ...updates } : f));
        return;
    }

    const colName = getCollectionName(updatedItem.type);
    const docRef = doc(db, colName, updatedItem.id);
    await updateDoc(docRef, updates);
  };

  const deleteFleetItem = async (id: string, type: FleetType) => {
    if (currentUser?.role !== 'manager') {
        alert("Permission Denied: Only Managers can delete assets.");
        return;
    }

    if (isDemoMode) {
        setFleet(prev => prev.filter(f => f.id !== id));
        return;
    }
    const colName = getCollectionName(type);
    await deleteDoc(doc(db, colName, id));
  };

  const importFleet = async (newItems: FleetItem[]) => {
    if (isDemoMode) {
        setFleet(prev => [...prev, ...newItems]);
        return;
    }
    const batch = writeBatch(db);
    newItems.forEach(item => {
      const colName = getCollectionName(item.type);
      const docRef = doc(collection(db, colName));
      const { id, ...data } = item;
      batch.set(docRef, data);
    });
    await batch.commit();
  };

  const clearFleet = async () => {
    if (currentUser?.role !== 'manager') {
        alert("Permission Denied: Only Managers can reset the database.");
        return;
    }
    if (!window.confirm("Are you sure?")) return;
    if (isDemoMode) {
        setFleet([]);
        setDemoRecords([]);
        setDemoStatusHistory([]);
        return;
    }
    const batch = writeBatch(db);
    fleet.forEach(item => {
      const colName = getCollectionName(item.type);
      batch.delete(doc(db, colName, item.id));
    });
    await batch.commit();
  };

  const addRecord = async (record: MaintenanceRecord, vehicleType: FleetType) => {
    const recordWithUser = {
        ...record,
        id: isDemoMode ? Date.now().toString() : record.id,
        createdBy: currentUser?.name || 'Unknown User'
    };

    const updates: any = {
      currentMeter: record.meterReading 
    };
    if (record.type !== 'REPAIR') {
      updates.lastServiceDate = record.date;
      if (record.nextDueDate) updates.nextServiceDate = record.nextDueDate;
      if (record.nextDueMeter) updates.nextServiceMeter = record.nextDueMeter;
    }

    if (isDemoMode) {
        setFleet(prev => prev.map(f => f.id === record.fleetItemId ? { ...f, ...updates } : f));
        setDemoRecords(prev => [recordWithUser, ...prev]); 
        return;
    }

    const colName = getCollectionName(vehicleType);
    const parentDocRef = doc(db, colName, record.fleetItemId);
    const subColName = record.type === 'REPAIR' ? 'breakdowns_repairs' : 'routine_maintenance';
    
    await addDoc(collection(parentDocRef, subColName), recordWithUser);
    await updateDoc(parentDocRef, updates);
  };

  return (
    <FleetContext.Provider
      value={{
        fleet,
        settings,
        loading,
        isDemoMode,
        connectionError,
        currentUser,
        systemHasUsers,
        demoRecords,
        demoStatusHistory,
        login,
        logout,
        createFirstAdmin,
        createNewUser,
        deleteUser,
        getAllUsers,
        addFleetItem,
        updateFleetItem,
        deleteFleetItem,
        importFleet,
        clearFleet,
        addRecord,
      }}
    >
      {children}
    </FleetContext.Provider>
  );
};

export const useFleet = () => {
  const context = useContext(FleetContext);
  if (!context) throw new Error('useFleet must be used within a FleetProvider');
  return context;
};
