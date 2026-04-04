import { User, Booking, TicketType, ParkingType, SystemSettings, DEFAULT_PRICES, AuditLog, RegistrationStatus, SurnameEntry } from '../types';

const STORAGE_KEY_USERS = 'svar_db_users';
const STORAGE_KEY_BOOKINGS = 'svar_db_bookings';
const STORAGE_KEY_ID_COUNTER = 'svar_db_id_counter';
const STORAGE_KEY_BOOKING_COUNTER = 'svar_db_booking_counter';
const STORAGE_KEY_SETTINGS = 'svar_db_settings';
const STORAGE_KEY_RECENT_LOGIN = 'svar_smart_recent_login';
const STORAGE_KEY_AUDIT_LOGS = 'svar_db_audit_logs';
const STORAGE_KEY_SURNAMES = 'svar_db_surnames';
const STORAGE_KEY_FEEDBACKS = 'svar_db_feedbacks';
const STORAGE_KEY_INQUIRIES = 'svar_db_inquiries';

// --- SURNAME DATA INITIALIZATION ---
const INITIAL_SURNAMES_RAW = [
  // A
  "Adreja", "આદ્રેજા", "Adajania", "અડાજણીયા", "Adiyecha", "અડીયેચા", "Erapada", "એરપડા",
  "Agheda", "અઘેડા", "Aghera", "અઘેરા", "Agotariya", "અગોતરીયા", "Ahalpara", "આહલપરા",
  "Ajmeriya", "અજમેરીયા", "Abhiyaniya", "Akhiyaniya", "અખીયાણીયા", "Ambasana", "અંબાસણા",
  "Amraniya", "આમરણીયા", "Anovadiya", "અનોવાડીયા", "Anuvadiya", "અનુવાડીયા",
  
  // B
  "Badrakiya", "બદ્રકીયા", "Bakraniya", "બકરાણીયા", "Bamroliya", "બામરોલીયા",
  "Barsopiya", "બારસૌપીયા", "Basopiya", "બાસોપીયા", "Bavlecha", "બાવળેચા",
  "Bhadeshiya", "ભાડેશીયા", "Bhakodiya", "ભકોડીયા", "Bhalara", "ભાલારા",
  "Bhardiya", "ભારદીયા", "Bhesaniya", "ભેસાણીયા", "Bhetasiya", "ભેટાસીયા",
  "Boraniya", "બોરાણીયા",

  // C
  "Champanera", "ચાંપાનેરા", "Chandresa", "ચંદ્રેસા", "Chandvaniya", "ચંદવાણીયા",
  "Chansvaniya", "Chapavadiya", "છાપાવાડિયા", "Charola", "ચારોલા",
  "Chaniyara", "છનીયારા", "Chatraliya", "છત્રાલીયા", "Chatravada", "છત્રાવાડા",

  // D
  "Dahisariya", "દહિસરિયા", "Dashadiya", "દશાડીયા", "Devaliya", "દેવળીયા",
  "Devghadiya", "દેવઘડીયા", "Dhanesara", "ધનેસરા", "Dhareya", "ધારૈયા",
  "Dharecha", "ધારેચા", "Dharvaliya", "ધારવલિયા", "Dholkiya", "ધોળકીયા",
  "Dhrangadhriya", "ધ્રાંગધરીયા", "Dudakiya", "દુદકીયા", "Dudhaiya", "દૂધૈયા",

  // G
  "Gajjar", "ગજ્જર", "Galchat", "ગલચટ", "Gangajaliya", "ગંગાજળિયા",
  "Gharvaliya", "ઘરવલીયા", "Ghorecha", "ઘોરેચા", "Godhaniya", "ગોધાણીયા",
  "Gotrejiya", "ગોત્રેજિયા", "Govindiya", "ગોવિંદીયા", "Gujadiya", "ગુજાડિયા",
  "Gundecha", "ગુંદેચા", "Gunjariya", "ગુંજારીયા",

  // I, J
  "Isalaniya", "ઇસલાણીયા", "Jadvani", "જાદવાણી", "Jagudniya", "જગુદનિયા",
  "Jakasaniya", "જાકાસણીયા", "Jalalpariya", "જલાલપરીયા", "Jalera", "જાલેરા",
  "Jamnapara", "જમનાપરા", "Jolapara", "જોલાપરા", "Jotaniya", "જોટાણીયા",
  "Juvaradiya", "જુવારદિયા",

  // K
  "Kadecha", "કડેચા", "Kaloliya", "કલોલીયા", "Kalovariya", "કલોવરિયા",
  "Kalsara", "કલસારા", "Kamboya", "કંબોયા", "Kandhiya", "કાંધીયા",
  "Kanojiya", "કનોજીયા", "Kansora", "કાંસોરા", "Kararjiya", "કારારજીયા",
  "Kargathara", "કરગથરા", "Karsala", "કરસાળા", "Kathrecha", "કથ્રેચા",
  "Khambhayata", "ખંભાયતા", "Khandalpur", "ખંડાલપુર", "Kharecha", "ખારેચા",
  "Khordiya", "ખોરદિયા", "Kochranba", "કોચરંબા", "Kocharliya", "કોચરલીયા",
  "Kothav", "કોઠાવ", "Kuvaradiya", "કુંવારદીયા",

  // L
  "Lakhvada", "લાખવાડા", "Lalluvadiya", "લલ્લુવાડીયા", "Limbachiya", "લીંબચીયા",

  // M
  "Madhavi", "માધવી", "Mahidiya", "મહિદડિયા", "Mahidhariya", "મહીધરીયા",
  "Mandviya", "માંડવીયા", "માંડવિયા", "Mathasuriya", "માથાસુરિયા",
  "Mahemdavadiya", "મહેમદાવાદીયા", "Mesvaniya", "મેસવાણીયા",
  "Modashiya", "મોડાશીયા", "Modasiya", "મોડાસીયા", "Mulsaniya", "મુલસાણીયા",

  // N
  "Nagevadiya", "નગેવાડીયા", "Nagrecha", "નાગ્રેચા", "Nandasa", "નાંદાસા",
  "Nandoliya", "નાંદોળીયા", "Nandoriya", "નાંદોરીયા", "Nayakpura", "નાયકપુરા",

  // P
  "Panara", "પનારા", "Panchasara", "પંચાસરા", "Panchiniya", "પાંછીણીયા",
  "Patanvadiya", "પાટણવડીયા", "Patdiya", "પાટડીયા", "Patvagar", "પટવાગર",
  "Peshavariya", "પેશાવરીયા", "Pilojpara", "પીલોજપરા", "Pisavadiya", "પીસાવાડીયા",

  // R, S
  "Ramparia", "રામપરિયા", "Samicha", "સમીચા", "Sanchaniya", "સંચાણીયા",
  "Santricha", "સંચ્રીચા", "Sancharesa", "સંચરેસા", "Sankdecha", "સાંકડેચા",
  "Sankhalpara", "સંખલપરા", "Santhaliya", "સાંથલીયા", "Sapara", "સાપરા",
  "Sapavadiya", "સાપાવાડિયા", "Sarsaiya", "સરસૈયા", "Sarsecha", "સરસેચા",
  "Sarvaliya", "સરવાલીયા", "Satpariya", "સાતપરીયા", "Savajdiya", "સાવજડિયા",
  "Sersiya", "સેરસિયા", "Shersiya", "શેરસીયા", "Siddhpur", "Siddhpura", "સિદ્ધપુરા",
  "Sidhpara", "સિદપરા", "Simejiya", "સીમેજીયા", "Sinroja", "સીનરોજા",
  "Sitpara", "સિતપરા", "Solgama", "સોલગામા", "Sodagar", "Sondagar", "સોંડાગર",
  "Sonigra", "સોનીગ્રા", "Surajiya", "સુરાજીયા", "Sureliya", "સુરેલીયા",
  "Surja", "સુરજા", "Suvaliya", "સુવાલીયા", "Suvara", "સુવારા",

  // T
  "Talsaniya", "તલસાણીયા", "Tranjya", "Trajya", "ત્રાણ્જીયા", "Tretiya", "ત્રેટીયા",

  // U
  "Uchadiya", "ઉચાડીયા", "Uchediya", "ઉચેડીયા", "Ughroja", "ઉઘરોજા",
  "Ujaniya", "ઉજાણીયા", "Ujeniya", "ઉજેનીયા", "Umraliya", "ઉમરાલીયા",
  "Umradiya", "ઉમરાદિયા",

  // V
  "Vadecha", "વડેચા", "Vadesha", "વાડેશા", "Vadgama", "વડગામા",
  "Vadhvana", "વઢવાણા", "Vadodariya", "વાડોદરીયા", "Vaghadiya", "વઘાડિયા",
  "Vaghasana", "વાઘસણા", "Valambhiya", "વાલંભીયા", "Valsadiya", "વલસાડીયા",
  "Vamja", "વામજા", "Vanodiya", "વણોદીયા", "Varmora", "વરમોરા",
  "Varsiga", "વરસીગા", "Vasaniya", "વસાણીયા", "Vastchhagiya", "વસ્તછગીયા",
  "Vavdiya", "વાવડીયા", "Vekariya", "વેકરિયા", "Velgadha", "વેલગઢા",
  "Viramgama", "વિરમગામા", "Virshodiya", "વિરશોડિયા", "Visavadiya", "વિસાવડીયા",
  "Visnagara", "વિસનગરા", "Visroliya", "વિસરોલિયા", "Vithalpara", "વિઠ્ઠલપરા",
  "Voraliya", "વોરાલીઆ",

  // Z
  "Zalera", "ઝાલેરા", "Zinzuvadiya", "ઝીંઝુવાડીયા"
];

// --- HELPER FUNCTIONS ---

const normalizeSurname = (surname: string): string => {
  if (!surname) return '';
  // 1. Convert to lowercase
  // 2. Remove all spaces
  // 3. Remove common special characters (keep Gujarati chars)
  return surname.toLowerCase().replace(/[\s\-_.]/g, '').trim();
};

const getStoredSurnames = (): SurnameEntry[] => {
  const stored = localStorage.getItem(STORAGE_KEY_SURNAMES);
  if (stored) {
    const parsed: SurnameEntry[] = JSON.parse(stored);
    // Backfill id for old entries that may lack it
    const updated = parsed.map((e, i) => ({ id: e.id || `s_${i}_${Date.now()}`, ...e }));
    return updated;
  }
  
  // Initialize if empty
  const initialEntries: SurnameEntry[] = INITIAL_SURNAMES_RAW.map((s, i) => ({
    id: `s_init_${i}`,
    surname: s,
    normalized: normalizeSurname(s),
    addedBy: 'SYSTEM',
    addedAt: new Date().toISOString()
  }));
  localStorage.setItem(STORAGE_KEY_SURNAMES, JSON.stringify(initialEntries));
  return initialEntries;
};

const checkSurnameInWhitelist = (surname: string): boolean => {
  const normalizedInput = normalizeSurname(surname);
  const whitelist = getStoredSurnames();
  return whitelist.some(entry => entry.normalized === normalizedInput);
};

// CRASH PREVENTION: Robust storage loader with strict type/null checking
const loadFromStorage = <T>(key: string, defaultVal: T): T => {
  try {
    const stored = localStorage.getItem(key);
    
    // Check for "null", "undefined" strings or empty
    if (!stored || stored === 'null' || stored === 'undefined') {
        return defaultVal;
    }
    
    const parsed = JSON.parse(stored);
    
    // If parsed is literally null or undefined, return default
    if (parsed === null || parsed === undefined) {
        return defaultVal;
    }

    // If defaultVal is an array, ensure parsed is an array
    if (Array.isArray(defaultVal) && !Array.isArray(parsed)) {
        console.warn(`Data corruption detected for ${key}. Expected array, got ${typeof parsed}. Resetting to default.`);
        return defaultVal;
    }

    // If defaultVal is an object (and not null), ensure parsed is an object
    if (typeof defaultVal === 'object' && defaultVal !== null && !Array.isArray(defaultVal)) {
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
             console.warn(`Data corruption detected for ${key}. Expected object. Resetting.`);
             return defaultVal;
        }
    }

    return parsed;
  } catch (e) {
    console.warn(`Error loading ${key} from storage. Resetting to default to prevent crash.`, e);
    return defaultVal;
  }
};

// Helper to save to storage with Self-Healing Quota protection
const saveToStorage = (key: string, data: any): boolean => {
  try {
    if (data === undefined) return false; // Don't save undefined
    const serialized = JSON.stringify(data);
    localStorage.setItem(key, serialized);
    return true;
  } catch (e: any) {
    console.error("Storage quota exceeded or write error", e);
    
    // SELF-HEALING STRATEGY
    if (e.name === 'QuotaExceededError' || e.code === 22 || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        console.warn("Attempting storage cleanup...");
        try {
            // 1. Clear Audit Logs (Least critical)
            localStorage.removeItem(STORAGE_KEY_AUDIT_LOGS);
            auditLogs = [];
            
            // 2. Clear Recent Login
            localStorage.removeItem(STORAGE_KEY_RECENT_LOGIN);

            // 3. Try saving again
            try {
                const serializedRetry = JSON.stringify(data);
                localStorage.setItem(key, serializedRetry);
                console.log("Storage recovered after cleanup.");
                return true;
            } catch(retryErr) {
                console.error("Critical Storage Failure: Unable to save data even after cleanup.", retryErr);
                return false;
            }
        } catch (cleanupError) {
             console.error("Cleanup failed", cleanupError);
             return false;
        }
    }
    return false;
  }
};

// Initial Data Loading with Crash Safety
// ------------------------------------------------

let users: User[] = loadFromStorage<User[]>(STORAGE_KEY_USERS, []);

let bookings: Booking[] = loadFromStorage<Booking[]>(STORAGE_KEY_BOOKINGS, []);

let auditLogs: AuditLog[] = loadFromStorage<AuditLog[]>(STORAGE_KEY_AUDIT_LOGS, []);
let surnameWhitelist: SurnameEntry[] = loadFromStorage<SurnameEntry[]>(STORAGE_KEY_SURNAMES, []);
if (surnameWhitelist.length === 0) {
    surnameWhitelist = getStoredSurnames();
}

// Ensure settings always have defaults merged to prevent crash on missing keys
const storedSettings = loadFromStorage<Partial<SystemSettings>>(STORAGE_KEY_SETTINGS, {});
let settings: SystemSettings = {
    parkingFull: storedSettings.parkingFull ?? false,
    lastAnnouncement: storedSettings.lastAnnouncement ?? "",
    lastAnnouncementTime: storedSettings.lastAnnouncementTime ?? "",
    registrationOpen: storedSettings.registrationOpen ?? true,
    eventStartDate: storedSettings.eventStartDate ?? "2026-10-15T18:00",
    eventEndDate: storedSettings.eventEndDate ?? "2026-10-24T23:59",
    prices: { ...DEFAULT_PRICES, ...storedSettings.prices },
    passDownloadEnabled: storedSettings.passDownloadEnabled ?? false
};

let idCounter = loadFromStorage<number>(STORAGE_KEY_ID_COUNTER, 100);
let bookingCounter = loadFromStorage<number>(STORAGE_KEY_BOOKING_COUNTER, 100);

export const mockDb = {
  logAction: async (action: string, details: string, adminId: string = 'ADMIN'): Promise<void> => {
      return new Promise(resolve => {
          auditLogs = loadFromStorage(STORAGE_KEY_AUDIT_LOGS, auditLogs);
          const newLog: AuditLog = {
              id: Date.now().toString(),
              action,
              details,
              timestamp: new Date().toISOString(),
              adminId
          };
          auditLogs.unshift(newLog); 
          // Optimization: Keep logs strictly limited to 50 to save space
          if (auditLogs.length > 50) auditLogs = auditLogs.slice(0, 50);
          
          saveToStorage(STORAGE_KEY_AUDIT_LOGS, auditLogs);
          resolve();
      });
  },

  getAuditLogs: async (): Promise<AuditLog[]> => {
      return new Promise(resolve => {
          auditLogs = loadFromStorage(STORAGE_KEY_AUDIT_LOGS, auditLogs);
          resolve([...auditLogs]);
      });
  },

  checkUserExists: async (aadhaar: string): Promise<boolean> => {
      return new Promise(resolve => {
          try {
             const cleanAadhaar = aadhaar.replace(/\s/g, '');
             const currentUsers = loadFromStorage<User[]>(STORAGE_KEY_USERS, users);
             const exists = currentUsers.some(u => u.aadhaar === cleanAadhaar);
             resolve(exists);
          } catch(e) {
             console.error("DB check failed", e);
             resolve(false); 
          }
      });
  },

  // NEW: Check surname against whitelist
  checkSurname: async (surname: string): Promise<boolean> => {
      return new Promise(resolve => {
          const exists = checkSurnameInWhitelist(surname);
          resolve(exists);
      });
  },

  // NEW: Add surname to whitelist (Admin)
  addSurname: (surname: string, adminId: string): Promise<void> => {
      return new Promise((resolve, reject) => {
          (async () => {
            try {
                const normalized = normalizeSurname(surname);
                const currentWhitelist = getStoredSurnames();
                const exists = currentWhitelist.some(s => s.normalized === normalized);
                
                if (!exists) {
                    const newEntry: SurnameEntry = {
                        id: `s_${Date.now()}`,
                        surname: surname,
                        normalized: normalized,
                        addedBy: adminId,
                        addedAt: new Date().toISOString()
                    };
                    currentWhitelist.push(newEntry);
                    saveToStorage(STORAGE_KEY_SURNAMES, currentWhitelist);
                    await mockDb.logAction("ADD_SURNAME", `Added surname: ${surname}`);
                    
                    // Auto-approve pending users
                    const currentUsers = await mockDb.getUsers();
                    let updatedCount = 0;
                    const updatedUsers = currentUsers.map(u => {
                        if (u.registrationStatus === RegistrationStatus.SURNAME_REVIEW && normalizeSurname(u.surname) === normalized) {
                            updatedCount++;
                            return { ...u, registrationStatus: RegistrationStatus.PENDING_APPROVAL };
                        }
                        return u;
                    });
                    
                    if (updatedCount > 0) {
                        saveToStorage(STORAGE_KEY_USERS, updatedUsers);
                        await mockDb.logAction("AUTO_APPROVE", `Auto-approved ${updatedCount} users after adding surname ${surname}`);
                    }
                }
                resolve();
            } catch (e) {
                console.error("Failed to add surname", e);
                reject(e);
            }
          })();
      });
  },

  getSurnames: async (): Promise<SurnameEntry[]> => {
      return new Promise(resolve => resolve(getStoredSurnames()));
  },

  deleteSurname: async (id: string): Promise<void> => {
      return new Promise((resolve, reject) => {
          try {
              const currentWhitelist = getStoredSurnames();
              const updated = currentWhitelist.filter(e => e.id !== id);
              saveToStorage(STORAGE_KEY_SURNAMES, updated);
              mockDb.logAction("DELETE_SURNAME", `Removed surname with id: ${id}`);
              resolve();
          } catch (e) {
              console.error("Failed to delete surname", e);
              reject(e);
          }
      });
  },

  createUser: async (user: Omit<User, 'id' | 'createdAt' | 'verified' | 'registrationStatus'>): Promise<User> => {
    return new Promise(async (resolve, reject) => {
      setTimeout(async () => {
        try {
            // Reload latest users to avoid race conditions (in a real app this is handled by DB)
            users = loadFromStorage(STORAGE_KEY_USERS, users);
            
            // 1. Check Duplicate Mobile
            if (users.some(u => u.phone === user.phone && u.aadhaar !== user.aadhaar.replace(/\s/g, ''))) {
                reject(new Error("This mobile number is already registered."));
                return;
            }

            // 2. Check Duplicate Surname + Father Name Combination
            const normSurname = normalizeSurname(user.surname);
            const normFather = user.fatherName.toLowerCase().trim();
            
            const duplicateUser = users.find(u => 
                normalizeSurname(u.surname) === normSurname && 
                u.fatherName.toLowerCase().trim() === normFather &&
                u.aadhaar !== user.aadhaar.replace(/\s/g, '')
            );

            if (duplicateUser) {
                reject(new Error("A user with this Surname and Father Name already exists."));
                return;
            }

            const cleanAadhaar = user.aadhaar.replace(/\s/g, '');
            const existingUser = users.find(u => u.aadhaar === cleanAadhaar);
            
            if (existingUser) {
                // Update existing user
                existingUser.fullName = user.fullName;
                existingUser.surname = user.surname;
                existingUser.fatherName = user.fatherName;
                existingUser.phone = user.phone;
                existingUser.email = user.email; // BUG FIX: Ensure email is saved
                existingUser.selfieUrl = user.selfieUrl;
                if (user.profilePhotoUrl) existingUser.profilePhotoUrl = user.profilePhotoUrl;
                existingUser.aadhaarCardUrl = user.aadhaarCardUrl;
                
                // Re-check surname if changed
                const isSurnameValid = checkSurnameInWhitelist(user.surname);
                // Only change status if it was SURNAME_REVIEW or if it becomes SURNAME_REVIEW
                if (!isSurnameValid) {
                     existingUser.registrationStatus = RegistrationStatus.SURNAME_REVIEW;
                } else if (existingUser.registrationStatus === RegistrationStatus.SURNAME_REVIEW && isSurnameValid) {
                     existingUser.registrationStatus = RegistrationStatus.PENDING_APPROVAL;
                }
                
                if (saveToStorage(STORAGE_KEY_USERS, users)) {
                    resolve(existingUser);
                } else {
                    reject(new Error("Storage Full: Could not update user data. Clear browser cache."));
                }
                return;
            }

            idCounter = loadFromStorage(STORAGE_KEY_ID_COUNTER, idCounter);
            idCounter++;
            saveToStorage(STORAGE_KEY_ID_COUNTER, idCounter);
            
            const newId = `SVAR-${idCounter}`;
            
            // Check surname validity
            const isSurnameValid = checkSurnameInWhitelist(user.surname);
            // If surname is in whitelist, set to PENDING_APPROVAL (waiting for manual verification of docs). 
            // If not, set to SURNAME_REVIEW.
            const status = isSurnameValid ? RegistrationStatus.PENDING_APPROVAL : RegistrationStatus.SURNAME_REVIEW;

            const newUser: User = {
            ...user,
            aadhaar: cleanAadhaar,
            id: newId,
            verified: false, 
            registrationStatus: status,
            createdAt: new Date().toISOString()
            };
            
            // Optimistic update
            users.push(newUser);
            
            if (saveToStorage(STORAGE_KEY_USERS, users)) {
                // Log if surname review needed
                if (status === RegistrationStatus.SURNAME_REVIEW) {
                    mockDb.logAction("REGISTRATION_ALERT", `User ${newUser.fullName} (${newUser.id}) flagged for Surname Review: ${newUser.surname}`);
                }
                
                // Send Registration Email ONLY if Surname Review is pending
                if (status === RegistrationStatus.SURNAME_REVIEW && newUser.email) {
                    mockDb.sendEmail(
                        newUser.email,
                        "SVAR 2026 - Registration Successful",
                        `Hello ${newUser.fullName},\n\nYour registration for SVAR 2026 is successful. Your User ID is ${newUser.id}.\n\nStatus: ${newUser.registrationStatus === RegistrationStatus.SURNAME_REVIEW ? 'Pending Surname Review' : 'Pending Admin Approval'}\n\nPlease wait for admin approval before booking your pass.\n\nRegards,\nSVAR Team`,
                        `<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #F8FAFC; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
                          <div style="background-color: #20324C; padding: 30px 20px; text-align: center; border-bottom: 4px solid #731515;">
                            <h1 style="margin: 0; color: #FFFFFF; font-size: 26px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">SVAR 2026</h1>
                            <p style="margin: 8px 0 0 0; color: #A4CDDF; font-size: 14px;">Registration Confirmation</p>
                          </div>
                          <div style="padding: 30px; color: #334155; line-height: 1.6; font-size: 16px;">
                            <p style="margin-top: 0;">Dear <strong>${newUser.fullName}</strong>,</p>
                            <p style="text-align: justify;">Thank you for registering for the <strong>SVAR 2026</strong> event. We are thrilled to have you join us for this grand celebration.</p>
                            
                            <div style="margin: 30px 0; padding: 20px; background-color: #FFFFFF; border: 1px solid #e2e8f0; border-radius: 6px;">
                              <h3 style="margin: 0 0 15px 0; color: #20324C; font-size: 18px; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">Registration Details</h3>
                              <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                  <td style="padding: 8px 0; color: #64748b; font-weight: 500; width: 45%;">Name</td>
                                  <td style="padding: 8px 0; color: #0f172a; font-weight: 600; text-align: right;">${newUser.fullName}</td>
                                </tr>
                                <tr>
                                  <td style="padding: 8px 0; border-top: 1px solid #f1f5f9; color: #64748b; font-weight: 500;">User ID</td>
                                  <td style="padding: 8px 0; border-top: 1px solid #f1f5f9; color: #234B55; font-weight: 700; text-align: right;">${newUser.id}</td>
                                </tr>
                                <tr>
                                  <td style="padding: 8px 0; border-top: 1px solid #f1f5f9; color: #64748b; font-weight: 500;">Current Status</td>
                                  <td style="padding: 8px 0; border-top: 1px solid #f1f5f9; color: ${newUser.registrationStatus === RegistrationStatus.SURNAME_REVIEW ? '#d97706' : '#2D5B6F'}; font-weight: 600; text-align: right;">${newUser.registrationStatus === RegistrationStatus.SURNAME_REVIEW ? 'Pending Surname Review' : 'Pending Admin Approval'}</td>
                                </tr>
                              </table>
                            </div>
                            
                            <p style="text-align: justify;">Your profile is currently under review by our administration team. You will be able to book your exclusive event passes once your registration has been successfully verified.</p>
                            <p>If you have any questions, please contact our support team.</p>
                            <br/>
                            <p style="margin: 0; color: #20324C; font-weight: 600;">Warm Regards,</p>
                            <p style="margin: 0; color: #731515; font-weight: 700;">The SVAR Team</p>
                          </div>
                          <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                            <p style="margin: 0; color: #94a3b8; font-size: 12px;">&copy; 2026 SVAR Events. All rights reserved.</p>
                          </div>
                        </div>`
                    );
                }

                resolve(newUser);
            } else {
                // Rollback
                users.pop();
                reject(new Error("Storage Full: Registration failed. Please free up space on your device."));
            }
        } catch (e) {
            console.error("Create user failed", e);
            reject(new Error("System Error: Unable to process registration."));
        }
      }, 300);
    });
  },

  createBooking: async (booking: Omit<Booking, 'id' | 'timestamp' | 'status'> & { verified?: boolean }): Promise<Booking> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
            bookings = loadFromStorage(STORAGE_KEY_BOOKINGS, bookings);
            bookingCounter = loadFromStorage(STORAGE_KEY_BOOKING_COUNTER, bookingCounter);
            
            bookingCounter++;
            
            const newBookingId = `SVAR-PASS-${bookingCounter}`;
            const isPaid = !!booking.paymentId;

            const newBooking: Booking = {
            id: newBookingId,
            userId: booking.userId,
            ticketType: booking.ticketType,
            parkingType: booking.parkingType,
            parkingCount: booking.parkingCount,
            totalAmount: booking.totalAmount,
            paymentId: booking.paymentId,
            signature: booking.signature,
            status: isPaid ? 'CONFIRMED' : 'PENDING',
            timestamp: new Date().toISOString()
            };
            
            const existingBookingIndex = bookings.findIndex(b => b.userId === booking.userId);
            let success = false;

            if (existingBookingIndex !== -1) {
                if (bookings[existingBookingIndex].status !== 'CONFIRMED') {
                    bookings[existingBookingIndex] = newBooking;
                    success = saveToStorage(STORAGE_KEY_BOOKINGS, bookings);
                } else {
                    resolve(bookings[existingBookingIndex]);
                    return;
                }
            } else {
                bookings.push(newBooking);
                success = saveToStorage(STORAGE_KEY_BOOKINGS, bookings);
                saveToStorage(STORAGE_KEY_BOOKING_COUNTER, bookingCounter); // Only increment if push likely to succeed
            }
            
            if (success) {
                if (isPaid) {
                    users = loadFromStorage(STORAGE_KEY_USERS, users);
                    const userIndex = users.findIndex(u => u.id === booking.userId);
                    if (userIndex !== -1) {
                        users[userIndex].verified = true;
                        users[userIndex].registrationStatus = RegistrationStatus.APPROVED;
                        saveToStorage(STORAGE_KEY_USERS, users);

                        // Send Booking Email
                        const user = users[userIndex];
                        if (user.email) {
                            mockDb.sendEmail(
                                user.email,
                                "SVAR 2026 - Booking Success",
                                `Hello ${user.fullName},\n\nYour booking for SVAR 2026 is successful!\n\nBooking ID: ${newBooking.id}\nAmount: ₹${newBooking.totalAmount}\n\nYou can view your digital pass in the app.\n\nRegards,\nSVAR Team`,
                                `<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #F8FAFC; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
                                  <div style="background-color: #20324C; padding: 30px 20px; text-align: center; border-bottom: 4px solid #731515;">
                                    <h1 style="margin: 0; color: #FFFFFF; font-size: 26px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">SVAR 2026</h1>
                                    <p style="margin: 8px 0 0 0; color: #A4CDDF; font-size: 14px;">Booking Success</p>
                                  </div>
                                  <div style="padding: 30px; color: #334155; line-height: 1.6; font-size: 16px;">
                                    <p style="margin-top: 0;">Dear <strong>${user.fullName}</strong>,</p>
                                    <p style="text-align: justify;">Congratulations! Your booking for <strong>SVAR 2026</strong> is successful. Get ready to experience the ultimate celebration.</p>
                                    
                                    <div style="margin: 30px 0; padding: 20px; background-color: #FFFFFF; border: 1px solid #e2e8f0; border-radius: 6px;">
                                      <h3 style="margin: 0 0 15px 0; color: #20324C; font-size: 18px; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">Booking Invoice</h3>
                                      <table style="width: 100%; border-collapse: collapse;">
                                        <tr>
                                          <td style="padding: 8px 0; color: #64748b; font-weight: 500; width: 45%;">Name</td>
                                          <td style="padding: 8px 0; color: #0f172a; font-weight: 600; text-align: right;">${user.fullName}</td>
                                        </tr>
                                        <tr>
                                          <td style="padding: 8px 0; border-top: 1px solid #f1f5f9; color: #64748b; font-weight: 500;">Booking ID</td>
                                          <td style="padding: 8px 0; border-top: 1px solid #f1f5f9; color: #234B55; font-weight: 700; text-align: right;">${newBooking.id}</td>
                                        </tr>
                                        <tr>
                                          <td style="padding: 8px 0; border-top: 1px solid #f1f5f9; color: #64748b; font-weight: 500;">Pass Type</td>
                                          <td style="padding: 8px 0; border-top: 1px solid #f1f5f9; color: #0f172a; font-weight: 600; text-align: right; text-transform: capitalize;">${newBooking.ticketType === TicketType.MALE ? 'Male Pass' : 'Female Pass'}</td>
                                        </tr>
                                        <tr>
                                          <td style="padding: 8px 0; border-top: 1px solid #f1f5f9; color: #64748b; font-weight: 500;">Total Amount</td>
                                          <td style="padding: 8px 0; border-top: 1px solid #f1f5f9; color: #731515; font-weight: 700; text-align: right;">₹${newBooking.totalAmount}</td>
                                        </tr>
                                      </table>
                                    </div>
                                    
                                    <p style="text-align: justify; color: #64748b; font-size: 14px;"><strong>Note:</strong> Please present your digital pass from the SVAR app or website at the venue entrance. A physical print is not required.</p>
                                    <br/>
                                    <p style="margin: 0; color: #20324C; font-weight: 600;">We look forward to hosting you!</p>
                                    <p style="margin: 0; color: #731515; font-weight: 700;">The SVAR Team</p>
                                  </div>
                                  <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                                    <p style="margin: 0; color: #94a3b8; font-size: 12px;">&copy; 2026 SVAR Events. All rights reserved.</p>
                                  </div>
                                </div>`
                            );
                        }
                    }
                } else {
                    // Send PENDING booking email
                    users = loadFromStorage(STORAGE_KEY_USERS, users);
                    const userIndex = users.findIndex(u => u.id === booking.userId);
                    if (userIndex !== -1) {
                        const user = users[userIndex];
                        if (user.email) {
                            mockDb.sendEmail(
                                user.email,
                                "SVAR 2026 - Booking Pending",
                                `Hello ${user.fullName},\n\nYour booking request for SVAR 2026 has been received.\n\nBooking ID: ${newBooking.id}\nAmount: ₹${newBooking.totalAmount}\n\nYour payment status is currently PENDING. Please complete the offline payment or wait for admin approval to get your confirmed pass.\n\nRegards,\nSVAR Team`,
                                `<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #F8FAFC; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
                                  <div style="background-color: #d97706; padding: 30px 20px; text-align: center; border-bottom: 4px solid #b45309;">
                                    <h1 style="margin: 0; color: #FFFFFF; font-size: 26px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">SVAR 2026</h1>
                                    <p style="margin: 8px 0 0 0; color: #fde68a; font-size: 14px;">Booking Pending</p>
                                  </div>
                                  <div style="padding: 30px; color: #334155; line-height: 1.6; font-size: 16px;">
                                    <p style="margin-top: 0;">Dear <strong>${user.fullName}</strong>,</p>
                                    <p style="text-align: justify;">We have received your pass booking request for <strong>SVAR 2026</strong>.</p>
                                    
                                    <div style="margin: 30px 0; padding: 20px; background-color: #FFFFFF; border: 1px solid #e2e8f0; border-radius: 6px;">
                                      <h3 style="margin: 0 0 15px 0; color: #20324C; font-size: 18px; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">Booking Details</h3>
                                      <table style="width: 100%; border-collapse: collapse;">
                                        <tr>
                                          <td style="padding: 8px 0; color: #64748b; font-weight: 500; width: 45%;">Name</td>
                                          <td style="padding: 8px 0; color: #0f172a; font-weight: 600; text-align: right;">${user.fullName}</td>
                                        </tr>
                                        <tr>
                                          <td style="padding: 8px 0; border-top: 1px solid #f1f5f9; color: #64748b; font-weight: 500;">Booking ID</td>
                                          <td style="padding: 8px 0; border-top: 1px solid #f1f5f9; color: #d97706; font-weight: 700; text-align: right;">${newBooking.id}</td>
                                        </tr>
                                        <tr>
                                          <td style="padding: 8px 0; border-top: 1px solid #f1f5f9; color: #64748b; font-weight: 500;">Pass Type</td>
                                          <td style="padding: 8px 0; border-top: 1px solid #f1f5f9; color: #0f172a; font-weight: 600; text-align: right; text-transform: capitalize;">${newBooking.ticketType === TicketType.MALE ? 'Male Pass' : 'Female Pass'}</td>
                                        </tr>
                                        <tr>
                                          <td style="padding: 8px 0; border-top: 1px solid #f1f5f9; color: #64748b; font-weight: 500;">Total Amount</td>
                                          <td style="padding: 8px 0; border-top: 1px solid #f1f5f9; color: #d97706; font-weight: 700; text-align: right;">₹${newBooking.totalAmount}</td>
                                        </tr>
                                      </table>
                                    </div>
                                    
                                    <p style="text-align: justify; color: #64748b; font-size: 14px;"><strong>Note:</strong> Your payment status is currently <strong>PENDING</strong>. If you intend to pay offline, please visit the registration desk. Once the payment is confirmed, your digital pass will be generated.</p>
                                    <br/>
                                    <p style="margin: 0; color: #20324C; font-weight: 600;">Thank you,</p>
                                    <p style="margin: 0; color: #731515; font-weight: 700;">The SVAR Team</p>
                                  </div>
                                </div>`
                            );
                        }
                    }
                }
                resolve(newBooking);
            } else {
                reject(new Error("Storage Full: Could not save booking."));
            }
        } catch(e) {
             console.error("Booking creation failed", e);
             reject(new Error("Local Database Error: Unable to save booking."));
        }
      }, 300);
    });
  },

  getUsers: async (): Promise<User[]> => {
    return new Promise(resolve => {
        users = loadFromStorage(STORAGE_KEY_USERS, users);
        resolve([...users]);
    });
  },

  getUserById: async (id: string): Promise<User | undefined> => {
    return new Promise(resolve => {
        users = loadFromStorage(STORAGE_KEY_USERS, users);
        resolve(users.find(u => u.id === id));
    });
  },

  updateUser: async (userId: string, updates: Partial<User>): Promise<User> => {
    return new Promise((resolve, reject) => {
      users = loadFromStorage(STORAGE_KEY_USERS, users);
      const index = users.findIndex(u => u.id === userId);
      if (index !== -1) {
        users[index] = { ...users[index], ...updates };
        if (saveToStorage(STORAGE_KEY_USERS, users)) {
          mockDb.logAction("UPDATE_USER", `User ${userId} updated profile`);
          resolve(users[index]);
        } else {
          reject(new Error("Storage Full: Could not update user data."));
        }
      } else {
        reject(new Error("User not found"));
      }
    });
  },

  deleteUser: async (userId: string): Promise<void> => {
      return new Promise(async (resolve) => {
          users = loadFromStorage<User[]>(STORAGE_KEY_USERS, users);
          bookings = loadFromStorage<Booking[]>(STORAGE_KEY_BOOKINGS, bookings);
          
          users = users.filter(u => u.id !== userId);
          bookings = bookings.filter(b => b.userId !== userId);
          
          saveToStorage(STORAGE_KEY_USERS, users);
          saveToStorage(STORAGE_KEY_BOOKINGS, bookings);
          
          // Cascading delete on server-side verifications
          try {
              await fetch('/api/admin/delete-verification', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ userId })
              });
          } catch (e) {
              console.warn("Server-side verification delete failed", e);
          }
          
          mockDb.logAction("DELETE_USER", `Deleted user ID: ${userId}`);
          resolve();
      });
  },

  loginUser: async (aadhaar: string): Promise<User | undefined> => {
    return new Promise(resolve => {
        try {
            const cleanAadhaar = aadhaar.replace(/\s/g, '');
            users = loadFromStorage(STORAGE_KEY_USERS, users);
            const user = users.find(u => u.aadhaar === cleanAadhaar);
            
            // Removed recent login saving feature as requested
            
            resolve(user);
        } catch(e) {
            console.error("Login failed", e);
            resolve(undefined);
        }
    });
  },

  getRecentLogin: (): { name: string, aadhaar: string } | null => {
      // Feature removed as requested
      return null;
  },

  getBookings: async (): Promise<Booking[]> => {
    return new Promise(resolve => {
        bookings = loadFromStorage(STORAGE_KEY_BOOKINGS, bookings);
        resolve([...bookings]);
    });
  },

  updateBookingStatus: async (bookingId: string, status: 'PENDING' | 'CONFIRMED' | 'REJECTED'): Promise<void> => {
    return new Promise(async resolve => {
        bookings = loadFromStorage(STORAGE_KEY_BOOKINGS, bookings);
        const index = bookings.findIndex(b => b.id === bookingId);
        if (index !== -1) {
            const oldStatus = bookings[index].status;
            bookings[index].status = status;
            saveToStorage(STORAGE_KEY_BOOKINGS, bookings);
            mockDb.logAction("UPDATE_BOOKING_STATUS", `Booking ${bookingId} updated to ${status}`);
            
            // SEND SUCCESS EMAIL IF IT BECAME CONFIRMED
            if (status === 'CONFIRMED' && oldStatus !== 'CONFIRMED') {
                users = loadFromStorage(STORAGE_KEY_USERS, users);
                const user = users.find(u => u.id === bookings[index].userId);
                if (user && user.email) {
                    await mockDb.sendEmail(
                        user.email,
                        "SVAR 2026 - Booking Success",
                        `Hello ${user.fullName},\n\nYour booking for SVAR 2026 has been CONFIRMED by the administration!\n\nBooking ID: ${bookings[index].id}\n\nYou can now view and download your digital pass in the app.\n\nRegards,\nSVAR Team`,
                        `<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #F8FAFC; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
                          <div style="background-color: #16a34a; padding: 30px 20px; text-align: center; border-bottom: 4px solid #14532d;">
                            <h1 style="margin: 0; color: #FFFFFF; font-size: 26px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">SVAR 2026</h1>
                            <p style="margin: 8px 0 0 0; color: #dcfce7; font-size: 14px;">Booking Confirmed</p>
                          </div>
                          <div style="padding: 30px; color: #334155; line-height: 1.6; font-size: 16px;">
                            <p style="margin-top: 0;">Dear <strong>${user.fullName}</strong>,</p>
                            <p style="text-align: justify;">Your pending pass has been successfully verified and <strong>CONFIRMED</strong> by the administration!</p>
                            
                            <div style="margin: 30px 0; padding: 20px; background-color: #FFFFFF; border: 1px solid #e2e8f0; border-radius: 6px;">
                              <h3 style="margin: 0 0 15px 0; color: #20324C; font-size: 18px; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">Confirmed Booking Details</h3>
                              <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                  <td style="padding: 8px 0; color: #64748b; font-weight: 500; width: 45%;">Name</td>
                                  <td style="padding: 8px 0; color: #0f172a; font-weight: 600; text-align: right;">${user.fullName}</td>
                                </tr>
                                <tr>
                                  <td style="padding: 8px 0; border-top: 1px solid #f1f5f9; color: #64748b; font-weight: 500;">Booking ID</td>
                                  <td style="padding: 8px 0; border-top: 1px solid #f1f5f9; color: #16a34a; font-weight: 700; text-align: right;">${bookings[index].id}</td>
                                </tr>
                                <tr>
                                  <td style="padding: 8px 0; border-top: 1px solid #f1f5f9; color: #64748b; font-weight: 500;">Pass Type</td>
                                  <td style="padding: 8px 0; border-top: 1px solid #f1f5f9; color: #0f172a; font-weight: 600; text-align: right; text-transform: capitalize;">${bookings[index].ticketType === TicketType.MALE ? 'Male Pass' : 'Female Pass'}</td>
                                </tr>
                              </table>
                            </div>
                            
                            <p style="text-align: justify; color: #64748b; font-size: 14px;"><strong>Next Steps:</strong> You can now login to your profile on the SVAR platform and view/download your official pass. Remember to carry it digitally or printed physically at the venue.</p>
                            <br/>
                            <p style="margin: 0; color: #20324C; font-weight: 600;">We look forward to hosting you!</p>
                            <p style="margin: 0; color: #731515; font-weight: 700;">The SVAR Team</p>
                          </div>
                        </div>`
                    );
                }
            }
        }
        resolve();
    });
  },

  updateUserVerification: async (userId: string, status: boolean): Promise<void> => {
    return new Promise(async resolve => {
      users = loadFromStorage(STORAGE_KEY_USERS, users);
      const userIndex = users.findIndex(u => u.id === userId);
      if (userIndex !== -1) {
          const oldStatus = users[userIndex].verified;
          users[userIndex].verified = status;
          users[userIndex].registrationStatus = status ? RegistrationStatus.APPROVED : RegistrationStatus.REJECTED; // Make sure it can be rejected
          saveToStorage(STORAGE_KEY_USERS, users);
          mockDb.logAction("UPDATE_VERIFICATION", `User ${userId} verified: ${status}`);
          
          if (status === true && oldStatus === false && users[userIndex].email) {
              await mockDb.sendEmail(
                  users[userIndex].email,
                  "SVAR 2026 - Profile Verified",
                  `Hello ${users[userIndex].fullName},\n\nYour profile verification for SVAR 2026 is complete and APPROVED.\n\nYou can now login and book your pass anytime!\n\nRegards,\nSVAR Team`,
                  `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
                      <div style="background: #16a34a; color: white; padding: 20px; text-align: center;">
                          <h2 style="margin: 0;">SVAR 2026 - Profile Verified</h2>
                      </div>
                      <div style="padding: 30px; line-height: 1.6;">
                          <p>Dear <strong>${users[userIndex].fullName}</strong>,</p>
                          <div style="background: #f0fdf4; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0; font-size: 16px;">
                              Your profile has been successfully verified by our team.
                          </div>
                          <p>You can now proceed to book your event passes on the SVAR Portal.</p>
                          <br/>
                          <p>Regards,<br/><strong>SVAR Organizing Committee</strong></p>
                      </div>
                  </div>`
              );
          }
      }
      resolve();
    });
  },

  updateRegistrationStatus: async (userId: string, status: RegistrationStatus): Promise<void> => {
      return new Promise(resolve => {
          users = loadFromStorage(STORAGE_KEY_USERS, users);
          const index = users.findIndex(u => u.id === userId);
          if (index !== -1) {
              users[index].registrationStatus = status;
              saveToStorage(STORAGE_KEY_USERS, users);
              mockDb.logAction("UPDATE_REG_STATUS", `User ${userId} status: ${status}`);
          }
          resolve();
      });
  },

  getSettings: async (): Promise<SystemSettings> => {
    return new Promise(resolve => {
        const freshSettings = loadFromStorage<Partial<SystemSettings>>(STORAGE_KEY_SETTINGS, {});
        const merged: SystemSettings = {
            parkingFull: freshSettings.parkingFull ?? settings.parkingFull,
            lastAnnouncement: freshSettings.lastAnnouncement ?? settings.lastAnnouncement,
            lastAnnouncementTime: freshSettings.lastAnnouncementTime ?? settings.lastAnnouncementTime,
            registrationOpen: freshSettings.registrationOpen ?? settings.registrationOpen,
            eventStartDate: freshSettings.eventStartDate ?? settings.eventStartDate,
            eventEndDate: freshSettings.eventEndDate ?? settings.eventEndDate,
            prices: { ...DEFAULT_PRICES, ...freshSettings.prices },
            passDownloadEnabled: freshSettings.passDownloadEnabled ?? settings.passDownloadEnabled
        };
        settings = merged;
        resolve(settings);
    });
  },

  updateSettings: async (newSettings: Partial<SystemSettings>): Promise<SystemSettings> => {
      return new Promise(resolve => {
          settings = { ...settings, ...newSettings };
          saveToStorage(STORAGE_KEY_SETTINGS, settings);
          mockDb.logAction("UPDATE_SETTINGS", `Updated settings keys: ${Object.keys(newSettings).join(', ')}`);
          resolve(settings);
      });
  },

  getSmartAnalytics: async () => {
      return new Promise<{predictedFootfall: number, peakTime: string}>(resolve => {
          bookings = loadFromStorage(STORAGE_KEY_BOOKINGS, bookings);
          const totalBookings = bookings.length;
          const predicted = Math.floor(totalBookings * 1.5) + 100; 
          resolve({
              predictedFootfall: predicted,
              peakTime: '09:30 PM'
          });
      });
  },

  saveFeedback: async (feedback: { name: string, suggestion: string }): Promise<void> => {
      return new Promise(resolve => {
          const feedbacks = loadFromStorage<any[]>(STORAGE_KEY_FEEDBACKS, []);
          feedbacks.unshift({
              id: Date.now().toString(),
              ...feedback,
              timestamp: new Date().toISOString()
          });
          saveToStorage(STORAGE_KEY_FEEDBACKS, feedbacks);
          resolve();
      });
  },

  getFeedbacks: async (): Promise<any[]> => {
      return new Promise(resolve => {
          resolve(loadFromStorage<any[]>(STORAGE_KEY_FEEDBACKS, []));
      });
  },

  saveInquiry: async (inquiry: { name: string, phone: string, email: string, message: string }): Promise<void> => {
      return new Promise(resolve => {
          const inquiries = loadFromStorage<any[]>(STORAGE_KEY_INQUIRIES, []);
          inquiries.unshift({
              id: Date.now().toString(),
              ...inquiry,
              timestamp: new Date().toISOString()
          });
          saveToStorage(STORAGE_KEY_INQUIRIES, inquiries);
          resolve();
      });
  },

  getInquiries: async (): Promise<any[]> => {
      return new Promise(resolve => {
          resolve(loadFromStorage<any[]>(STORAGE_KEY_INQUIRIES, []));
      });
  },

  resetDatabase: async (): Promise<void> => {
      console.log("[mockDb] Resetting entire database...");
      return new Promise(async (resolve, reject) => {
          try {
              // 1. Clear all localStorage keys used by the app
              const keysToClear = [
                  STORAGE_KEY_USERS,
                  STORAGE_KEY_BOOKINGS,
                  STORAGE_KEY_ID_COUNTER,
                  STORAGE_KEY_BOOKING_COUNTER,
                  STORAGE_KEY_SETTINGS,
                  STORAGE_KEY_AUDIT_LOGS,
                  STORAGE_KEY_RECENT_LOGIN,
                  STORAGE_KEY_FEEDBACKS,
                  STORAGE_KEY_INQUIRIES,
                  'svar_user_id' // Clear current session too
              ];
              
              keysToClear.forEach(key => localStorage.removeItem(key));
              
              // 2. Reset module-level variables
              users = [];
              bookings = [];
              auditLogs = [];
              idCounter = 100;
              bookingCounter = 100;
              
              // 3. Re-initialize settings to defaults
              settings = {
                  parkingFull: false,
                  lastAnnouncement: "",
                  lastAnnouncementTime: "",
                  registrationOpen: true,
                  eventStartDate: "2026-10-15T18:00",
                  eventEndDate: "2026-10-24T23:59",
                  prices: { ...DEFAULT_PRICES },
                  passDownloadEnabled: true
              };
              saveToStorage(STORAGE_KEY_SETTINGS, settings);
              
              // 4. Reset surnames to initial state
              localStorage.removeItem(STORAGE_KEY_SURNAMES);
              surnameWhitelist = getStoredSurnames();

              console.log("[mockDb] Database reset complete.");
              resolve();
          } catch (error) {
              console.error("[mockDb] Error during database reset:", error);
              reject(error);
          }
      });
  },

  sendEmail: async (to: string, subject: string, text: string, html?: string): Promise<void> => {
      try {
          const response = await fetch('/api/send-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ to, subject, text, html })
          });
          
          if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              console.error("[Email] Send failed:", response.status, errorData);
          }
      } catch (e) {
          console.error("Failed to trigger email send", e);
      }
  }
};
