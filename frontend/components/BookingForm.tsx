import React, { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Check, AlertCircle, Loader2, RefreshCw, Upload, Image as ImageIcon, CreditCard, FileText, AlertTriangle, UserCircle, Sparkles, Smartphone, Wallet, X, ShieldCheck, Ban, ArrowRight, Scan, Eye, FileType, Zap } from 'lucide-react';
import { DEFAULT_PRICES, PARKING_LIMITS, TicketType, ParkingType, RegistrationStatus, SurnameEntry } from '../types';
import { mockDb } from '../services/mockDb';
import { useNavigate, Link } from 'react-router-dom';
import * as faceapi from 'face-api.js';
import { Logo } from './Logo';
import { compressImage } from '../utils/imageProcessor';

const steps = ['Details', 'Verification', 'Passes', 'Payment'];

declare global {
    interface Window {
        Razorpay: any;
        aistudio: {
            hasSelectedApiKey: () => Promise<boolean>;
            openSelectKey: () => Promise<void>;
        };
    }
}

const RAZORPAY_KEY_ID = "rzp_test_S6c0fBtu9nFKwc"; 

// Robust script loader with timeout
const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        if (window.Razorpay) {
            resolve(true);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        
        // Network timeout for script
        const timeoutId = setTimeout(() => {
            console.error("Razorpay script load timed out");
            resolve(false);
        }, 10000);

        script.onload = () => {
            clearTimeout(timeoutId);
            resolve(true);
        };
        script.onerror = () => {
            clearTimeout(timeoutId);
            resolve(false);
        };
        document.body.appendChild(script);
    });
};

export const BookingForm: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  
  // AI State
  const [aiVerifying, setAiVerifying] = useState(false);
  const [isAiVerified, setIsAiVerified] = useState(false);
  const [needsApiKey, setNeedsApiKey] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [qualityWarning, setQualityWarning] = useState<string | null>(null);
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  
  // Settings State
  const [prices, setPrices] = useState(DEFAULT_PRICES);
  const [registrationOpen, setRegistrationOpen] = useState(true);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  // Form State
  const [fullName, setFullName] = useState('');
  const [surname, setSurname] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(''); // Added email state
  const [existingUserFound, setExistingUserFound] = useState(false);
  const [isCheckingUser, setIsCheckingUser] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [surnames, setSurnames] = useState<SurnameEntry[]>([]);
  const [showSurnameSuggestions, setShowSurnameSuggestions] = useState(false);
  
  // Upload Errors
  const [uploadErrors, setUploadErrors] = useState<{ [key: string]: string | null }>({
    profile: null,
    aadhaar: null
  });
  
  // Validation Errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  // Terms & Confirmation
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Profile Photo
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  // Verification State (Manual Uploads Only)
  const [selfie, setSelfie] = useState<string | null>(null);
  const [aadhaarFile, setAadhaarFile] = useState<string | null>(null);
  const [aadhaarFileName, setAadhaarFileName] = useState<string>('');
  
  const [ticketType, setTicketType] = useState<TicketType>(TicketType.MALE);
  const [parkingType, setParkingType] = useState<ParkingType>(ParkingType.NONE);
  const [parkingCount, setParkingCount] = useState(0);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<{id: string, amount: number, txId: string} | null>(null);
  const [cameraError, setCameraError] = useState(false);
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights';
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
        setIsModelsLoaded(true);
      } catch (e) {
        console.error("Failed to load face-api models", e);
      }
    };
    loadModels();
  }, []);
  
  // Refs
  const webcamRef = useRef<Webcam>(null);
  const aadhaarInputRef = useRef<HTMLInputElement>(null);
  const profilePhotoInputRef = useRef<HTMLInputElement>(null);

  const uploadImageToServer = async (base64Image: string, prefix: string): Promise<string> => {
      try {
        const response = await fetch('/api/upload-single', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64Image, prefix })
        });
        const data = await response.json();
        if (data.success) return data.url;
        throw new Error(data.error || "Upload failed");
      } catch (e) {
        console.error(`Failed to upload ${prefix} image`, e);
        return base64Image; // Fallback to base64 if server upload fails
      }
  };

  useEffect(() => {
      const fetchSettings = async () => {
          try {
            const [settings, sList] = await Promise.all([
                mockDb.getSettings(),
                mockDb.getSurnames()
            ]);
            setPrices(settings.prices);
            setRegistrationOpen(settings.registrationOpen);
            setSurnames(sList);
          } catch (e) {
            console.error("Failed to load settings", e);
            setApiError("Failed to load event settings. Please refresh the page.");
          } finally {
            setIsLoadingSettings(false);
          }
      };
      fetchSettings();
  }, []);

  useEffect(() => {
    let interval: any;
    if (registrationStatus === RegistrationStatus.SURNAME_REVIEW && userId) {
        interval = setInterval(async () => {
            const user = await mockDb.getUserById(userId);
            if (user && user.registrationStatus !== RegistrationStatus.SURNAME_REVIEW) {
                setRegistrationStatus(user.registrationStatus);
                setApiError(null);
            }
        }, 5000);
    }
    return () => clearInterval(interval);
  }, [registrationStatus, userId]);

  const validateField = (name: string, value: string) => {
    let error = '';
    switch (name) {
      case 'fullName':
        if (!value.trim()) error = 'Full Name is required.';
        break;
      case 'surname':
        if (!value.trim()) error = 'Surname is required.';
        break;
      case 'fatherName':
        if (!value.trim()) error = 'Father Name is required.';
        break;
      case 'phone':
        if (!value) error = 'Phone number is required.';
        else if (!/^[6-9]\d{9}$/.test(value)) error = 'Invalid 10-digit number.';
        break;
      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'Invalid email address.';
        break;
      case 'aadhaar':
        const cleanAadhaar = value.replace(/\s/g, '');
        if (!value) error = 'Aadhaar number is required.';
        else if (cleanAadhaar.length !== 12) error = 'Must be 12 digits.';
        break;
    }
    setErrors(prev => ({ ...prev, [name]: error }));
    return error;
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      validateField(name, value);
  };

  const formatAadhaar = (val: string) => {
      const digits = val.replace(/\D/g, '');
      const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
      return formatted.substring(0, 14);
  };

  const handleAadhaarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      const formatted = formatAadhaar(val);
      setAadhaar(formatted);
      if (formatted.length === 14) {
          setIsCheckingUser(true);
          try {
            const exists = await mockDb.checkUserExists(formatted);
            setExistingUserFound(exists);
          } catch(e) {
            console.error("DB check failed");
          }
          setIsCheckingUser(false);
      }
  };

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
        setSelfie(imageSrc);
    } else {
        setCameraError(true);
    }
  }, [webcamRef]);

  const handleAadhaarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setUploadErrors(prev => ({ ...prev, aadhaar: null }));
    
    if (file) {
      // 1. Size Limit Check (10MB)
      if (file.size > 10 * 1024 * 1024) {
          setUploadErrors(prev => ({ ...prev, aadhaar: "File size too large. Max limit is 10MB." }));
          return;
      }

      // 2. File Type Check (Images only for face-api)
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
          setUploadErrors(prev => ({ ...prev, aadhaar: "Invalid file type. Please upload a JPG, PNG, or WEBP image for Aadhaar verification." }));
          return;
      }

      setCompressing(true);
      try {
          try {
              const compressed = await compressImage(file);
              setAadhaarFile(compressed);
              setAadhaarFileName(file.name);
          } catch (e: any) {
              console.warn("Compression failed, trying direct read", e);
              const reader = new FileReader();
              reader.readAsDataURL(file);
              reader.onload = (e) => {
                  setAadhaarFile(e.target?.result as string);
                  setAadhaarFileName(file.name);
              };
              reader.onerror = () => {
                  setUploadErrors(prev => ({ ...prev, aadhaar: "Failed to read file. Please try another image." }));
              };
          }
      } catch (e: any) {
          console.error("File Processing Failed", e);
          setUploadErrors(prev => ({ ...prev, aadhaar: e.message || "Could not process file. Please try another format." }));
      } finally {
          setCompressing(false);
      }
    }
    if (event.target) event.target.value = '';
  };

  const handleProfilePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setUploadErrors(prev => ({ ...prev, profile: null }));
    
    if (file) {
      // 1. Size Limit Check (5MB)
      if (file.size > 5 * 1024 * 1024) {
          setUploadErrors(prev => ({ ...prev, profile: "Profile photo must be smaller than 5MB." }));
          return;
      }

      // 2. File Type Check
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
          setUploadErrors(prev => ({ ...prev, profile: "Please upload a valid image (JPG, PNG, or WEBP)." }));
          return;
      }

      setCompressing(true);
      try {
          const compressed = await compressImage(file);
          // NEW: Upload to backend immediately to save localStorage space
          const url = await uploadImageToServer(compressed, 'profile');
          setProfilePhoto(url);
      } catch (e: any) {
          console.error("Image Compression/Upload Failed", e);
          setUploadErrors(prev => ({ ...prev, profile: e.message || "Could not process image. Please try again." }));
      } finally {
          setCompressing(false);
      }
    }
    if (event.target) event.target.value = '';
  };

  const handleNext = async () => {
    if (currentStep === 0) {
        if (!fullName || !surname || !fatherName || !phone || !aadhaar || !email || !profilePhoto || existingUserFound) return;
        
        setLoading(true);
        try {
            const user = await mockDb.createUser({
                fullName, surname, fatherName, aadhaar, phone, email, selfieUrl: '', profilePhotoUrl: profilePhoto!, aadhaarCardUrl: ''
            });
            setUserId(user.id);
            setRegistrationStatus(user.registrationStatus);
            
            if (user.registrationStatus === 'SURNAME_REVIEW') {
                setLoading(false);
                return;
            }
            
            setLoading(false);
            setCurrentStep(prev => prev + 1);
        } catch (e: any) {
            console.error("Registration Failed", e);
            setApiError(e.message || "Registration failed. Please try again.");
            setLoading(false);
            return;
        }
    } else if (currentStep === 1) {
        // Identity Verification Step (face-api.js)
        if (!selfie || !aadhaarFile) return;
        
        if (!isModelsLoaded) {
            setVerificationError("Face detection models are still loading. Please wait a moment.");
            return;
        }

        if (isAiVerified && !aiVerifying) {
            setCurrentStep(prev => prev + 1);
            return;
        }
        
        setAiVerifying(true);
        setVerificationError(null);
        setQualityWarning(null);
        setAiSuggestions([]);
        
        // Use setTimeout to allow the UI to update and show the "Scanning Face..." state
        // before the heavy face-api processing starts.
        setTimeout(async () => {
            try {
                // Load images in parallel
                const [selfieImg, aadhaarImg, profileImg] = await Promise.all([
                    faceapi.fetchImage(selfie),
                    faceapi.fetchImage(aadhaarFile),
                    profilePhoto ? faceapi.fetchImage(profilePhoto) : Promise.resolve(null)
                ]);
                
                // Helper to detect face with fallback - Optimized for speed
                const detectFace = async (img: HTMLImageElement) => {
                    // Try Tiny Face Detector first for speed (good for modern mobile/desktop)
                    let detection = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
                        .withFaceLandmarks()
                        .withFaceDescriptor();
                    
                    // Fallback to SSD Mobilenet only if Tiny fails
                    if (!detection) {
                        detection = await faceapi.detectSingleFace(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
                            .withFaceLandmarks()
                            .withFaceDescriptor();
                    }
                    
                    return detection;
                };

                // Run detections in parallel to prevent sequential blocking
                const [selfieDetection, aadhaarDetection, profileDetection] = await Promise.all([
                    detectFace(selfieImg),
                    detectFace(aadhaarImg),
                    profileImg ? detectFace(profileImg) : Promise.resolve(null)
                ]);

                if (!selfieDetection) {
                    throw new Error("Could not detect face in your selfie. Please ensure your face is clearly visible and well-lit.");
                }

                if (!aadhaarDetection) {
                    throw new Error("Could not detect face in your Aadhaar card. Please ensure the Aadhaar card photo is clearly visible.");
                }
                
                // 1. Compare Live Selfie with Aadhaar
                const selfieAadhaarMatcher = new faceapi.FaceMatcher(selfieDetection);
                const selfieAadhaarMatch = selfieAadhaarMatcher.findBestMatch(aadhaarDetection.descriptor);
                const selfieAadhaarScore = Math.round((1 - selfieAadhaarMatch.distance) * 100);
                
                let finalMatchScore = selfieAadhaarScore;
                let verified = selfieAadhaarScore >= 40;
                let verificationMethod = "Live Selfie + Aadhaar";

                // 2. Fallback: If Live Selfie doesn't match Aadhaar, try Profile Photo + Aadhaar
                if (!verified && profileDetection) {
                    const profileAadhaarMatcher = new faceapi.FaceMatcher(profileDetection);
                    const profileAadhaarMatch = profileAadhaarMatcher.findBestMatch(aadhaarDetection.descriptor);
                    const profileAadhaarScore = Math.round((1 - profileAadhaarMatch.distance) * 100);

                    if (profileAadhaarScore >= 45) {
                        // If Profile Photo matches Aadhaar, we MUST ensure Live Selfie matches Profile Photo
                        const selfieProfileMatcher = new faceapi.FaceMatcher(selfieDetection);
                        const selfieProfileMatch = selfieProfileMatcher.findBestMatch(profileDetection.descriptor);
                        const selfieProfileScore = Math.round((1 - selfieProfileMatch.distance) * 100);

                        if (selfieProfileScore >= 50) {
                            verified = true;
                            finalMatchScore = profileAadhaarScore;
                            verificationMethod = "Profile Photo + Aadhaar (Live Verified)";
                        } else {
                            setVerificationError(`Face match failed. Your live selfie does not match your uploaded profile photo.`);
                            setAiVerifying(false);
                            return;
                        }
                    }
                }
                
                setMatchScore(finalMatchScore);
                
                if (!verified) {
                    setVerificationError(`Face match failed (Score: ${finalMatchScore}%). Please ensure the Aadhaar card photo matches your current appearance.`);
                    setAiVerifying(false);
                    return;
                }
                
                setIsAiVerified(true);
                console.log(`Verification successful via ${verificationMethod}. Score: ${finalMatchScore}%`);
                
                // Save to backend for admin review
                let apiData = null;
                try {
                    const response = await fetch('/api/verify-identity', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: fullName,
                            aadhaarNumber: aadhaar,
                            phone,
                            faceMatchScore: finalMatchScore,
                            selfieImage: selfie,
                            aadhaarImage: aadhaarFile,
                            userId
                        })
                    });
                    apiData = await response.json();
                } catch (apiErr) {
                    console.warn("Backend storage failed, continuing with local storage only", apiErr);
                }

                // Update user in mock DB
                if (userId) {
                     // NEW: Ensure we are using the returned paths from the API
                     const finalSelfie = (apiData as any)?.selfiePath || selfie;
                     const finalAadhaar = (apiData as any)?.aadhaarPath || aadhaarFile;

                     await mockDb.createUser({
                        fullName, surname, fatherName, aadhaar, phone, email, selfieUrl: finalSelfie, profilePhotoUrl: profilePhoto!, aadhaarCardUrl: finalAadhaar
                    });
                }
                
                setAiVerifying(false);
                
                // Proceed automatically
                setTimeout(() => {
                    setCurrentStep(prev => prev + 1);
                }, 1000);
                
            } catch (error: any) {
                console.error("Verification Failed", error);
                setVerificationError(error.message || "Identity verification failed. Please try again with clearer images.");
                setAiVerifying(false);
            }
        }, 500);
    } else {
        setCurrentStep(prev => prev + 1);
    }
  };

  const calculateTotal = () => {
    let total = ticketType === TicketType.MALE ? prices.MALE_PASS : prices.FEMALE_PASS;
    if (parkingType === ParkingType.TWO_WHEELER) total += (parkingCount * prices.TWO_WHEELER);
    if (parkingType === ParkingType.FOUR_WHEELER) total += (parkingCount * prices.FOUR_WHEELER);
    return total;
  };

  const handlePayment = async () => {
    if (paymentProcessing) return;
    setPaymentProcessing(true);
    setApiError(null);
    
    if (!navigator.onLine) {
        setApiError("No internet connection. Please connect to proceed.");
        setPaymentProcessing(false);
        return;
    }

    const isScriptLoaded = await loadRazorpayScript();
    if (!isScriptLoaded) {
        setApiError("Payment gateway failed to load. Please check your internet connection.");
        setPaymentProcessing(false);
        return;
    }
    
    try {
        // User already created in Step 0, update with selfie/aadhaar if needed
        // Actually, we should update the user with the selfie and aadhaar file now
        if (userId) {
             // We can update the user here if we want to save the selfie/aadhaar
             // But mockDb.createUser handles updates if aadhaar matches.
             // Let's just create/update again to be safe and ensure all fields are saved.
             await mockDb.createUser({
                fullName, surname, fatherName, aadhaar, phone, email, selfieUrl: selfie!, profilePhotoUrl: profilePhoto!, aadhaarCardUrl: aadhaarFile!
            });
        } else {
            // Fallback if userId missing (shouldn't happen)
             const user = await mockDb.createUser({
                fullName, surname, fatherName, aadhaar, phone, email, selfieUrl: selfie!, profilePhotoUrl: profilePhoto!, aadhaarCardUrl: aadhaarFile!
            });
            setUserId(user.id);
        }
        
        const totalAmount = calculateTotal();

        const options = {
            key: RAZORPAY_KEY_ID, 
            amount: totalAmount * 100, 
            currency: "INR",
            name: "SVAR 2026",
            description: "Event Entry Pass",
            handler: async function (response: any) {
                try {
                    // Use the most up-to-date userId
                    let currentUserId = userId;
                    if (!currentUserId) {
                        const user = await mockDb.loginUser(aadhaar);
                        if (user) currentUserId = user.id;
                    }
                    
                    if (!currentUserId) {
                        throw new Error("User not found. Please register first.");
                    }
                    
                    const newBooking = await mockDb.createBooking({
                        userId: currentUserId, ticketType, parkingType, parkingCount, totalAmount, paymentId: response.razorpay_payment_id
                    });
                    
                    setBookingDetails({
                        id: newBooking.id,
                        amount: totalAmount,
                        txId: response.razorpay_payment_id
                    });
                    


                    setBookingComplete(true);
                    // Auto-login: set user ID in local storage so Profile page can show the pass immediately
                    localStorage.setItem('svar_user_id', currentUserId);
                } catch (bookingError: any) {
                     console.error("Booking Creation Failed after Payment", bookingError);
                     setApiError(`Payment received (ID: ${response.razorpay_payment_id}) but booking failed: ${bookingError.message}. Please screenshot this and contact support.`);
                } finally {
                    setPaymentProcessing(false);
                }
            },
            prefill: { name: fullName, contact: phone },
            modal: { ondismiss: () => setPaymentProcessing(false) }
        };

        const rzp1 = new window.Razorpay(options);
        rzp1.on('payment.failed', function (response: any){
            setPaymentProcessing(false);
            setApiError(`Payment Failed: ${response.error.description || 'Transaction declined'}`);
        });
        rzp1.open();
    } catch (err: any) {
        setPaymentProcessing(false);
        setApiError(err.message || "An unexpected error occurred. Please try again.");
    }
  };

  if (isLoadingSettings) return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-20 h-20 text-gold-500 animate-pulse drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]">
            <Logo animated={true} />
          </div>
          <p className="text-gold-400 text-sm font-serif tracking-widest">Loading Event Settings...</p>
      </div>
  );

  if (!registrationOpen) {
      return (
          <div className="bg-obsidian-900 border border-obsidian-800 rounded-xl p-10 max-w-2xl mx-auto shadow-2xl text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-red-900/10 to-transparent pointer-events-none"></div>
              <Ban className="text-red-500 w-16 h-16 mx-auto mb-6 drop-shadow-md" />
              <h2 className="text-3xl font-bold text-white mb-4 font-serif">Registrations Closed</h2>
              <p className="text-gray-400 mb-8 font-light">We are no longer accepting new registrations for SVAR 2026.</p>
              <Link to="/login" className="bg-gold-600 hover:bg-gold-500 text-obsidian-950 font-bold px-8 py-3 rounded shadow-lg hover:shadow-gold-500/20 transition-all inline-block">Login with Existing Pass</Link>
          </div>
      );
  }

  if (bookingComplete && bookingDetails) {
      return (
          <div className="text-center py-20 animate-liquid-up max-w-2xl mx-auto">
              <div className="inline-block relative">
                 <div className="absolute inset-0 bg-viren-red/20 rounded-full animate-ping opacity-20"></div>
                 <Check className="relative text-white w-24 h-24 mx-auto mb-6 bg-viren-red rounded-full p-5 border-4 border-white shadow-xl" />
              </div>
              <h2 className="text-3xl font-bold text-viren-950 mb-2 font-serif">Booking Confirmed!</h2>
              <p className="text-viren-600 mb-8 font-light">Your payment has been successfully processed.</p>
              
              <div className="bg-white border border-viren-200 rounded-xl p-6 mb-8 text-left max-w-md mx-auto shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-viren-red"></div>
                  <div className="flex justify-between mb-2">
                      <span className="text-viren-500 text-sm uppercase tracking-wider">Booking ID</span>
                      <span className="font-mono font-bold text-viren-950">{bookingDetails.id}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                      <span className="text-viren-500 text-sm uppercase tracking-wider">Transaction ID</span>
                      <span className="font-mono font-bold text-viren-600 text-xs">{bookingDetails.txId}</span>
                  </div>
                  <div className="border-t border-viren-100 my-4"></div>
                  <div className="flex justify-between items-center">
                      <span className="text-viren-950 font-bold font-serif text-lg">Amount Paid</span>
                      <span className="text-viren-red font-bold text-xl">₹{bookingDetails.amount}</span>
                  </div>
              </div>

              <button onClick={() => navigate('/pass')} className="btn-viren-filled w-full max-w-xs py-4 shadow-xl flex items-center justify-center gap-2 mx-auto rounded-lg">
                View Digital Pass <ArrowRight size={18} />
              </button>
          </div>
      );
  }

  return (
    <>
    {/* TOP MANDATORY NOTICE */}
    <div className="mb-8 bg-[#731515] text-[#FFFFFF] p-4 rounded-lg border-l-4 border-white shadow-lg animate-fade-in relative overflow-hidden">
        <div className="absolute inset-0 bg-white/5 pointer-events-none"></div>
        <div className="flex items-center gap-3 relative z-10">
            <ShieldCheck className="text-white shrink-0" size={24} />
            <div>
                <h4 className="font-bold text-sm uppercase tracking-wider text-white">Security Notice / સુરક્ષા સૂચના</h4>
                <p className="text-xs text-white mt-1 leading-relaxed">
                    Aadhar card and real face match thase tyare j pass book thase. Please ensure your Aadhaar card has an updated photo.
                    <br/>
                    આધાર કાર્ડ અને અસલી ચહેરો મેચ થશે ત્યારે જ પાસ બુક થશે. મહેરબાની કરીને આધાર કાર્ડ અપડેટેડ ફોટા વાળું અપલોડ કરો.
                </p>
            </div>
        </div>
    </div>

    <div className="bg-obsidian-900 border border-obsidian-800 rounded-xl p-8 max-w-3xl mx-auto shadow-2xl animate-liquid-up relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gold-300 via-gold-500 to-gold-300"></div>
      <AnimatePresence>
        {paymentProcessing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-obsidian-950/95 z-50 flex flex-col items-center justify-center rounded-lg backdrop-blur-sm">
                <div className="w-24 h-24 text-gold-500 mb-6 drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]">
                    <Logo animated={true} />
                </div>
                <h3 className="text-xl font-bold text-gold-100 mb-2 font-serif">Processing Payment</h3>
                <p className="text-gold-400 text-sm animate-pulse tracking-widest">Please do not refresh the page...</p>
            </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between mb-12 relative">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-obsidian-800 -z-10"></div>
        {steps.map((step, idx) => (
            <div key={idx} className="flex flex-col items-center gap-2 bg-obsidian-900 px-2">
                <div className={`w-8 h-8 flex items-center justify-center text-xs font-bold transition-all duration-300 rounded-full border-2 ${idx <= currentStep ? 'bg-gold-500 text-obsidian-950 border-gold-500 shadow-[0_0_10px_rgba(212,175,55,0.5)]' : 'bg-obsidian-800 text-gray-500 border-obsidian-700'}`}>
                    {idx + 1}
                </div>
                <span className={`text-xs uppercase tracking-wider ${idx <= currentStep ? 'text-gold-400 font-bold' : 'text-gray-600'}`}>{step}</span>
            </div>
        ))}
      </div>

      <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
        {currentStep === 0 && (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-bold text-viren-950 font-serif">Personal Details</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-viren-800 text-sm mb-2 font-semibold">Full Name</label>
                        <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} onBlur={handleBlur} name="fullName" className="w-full bg-viren-50 border p-3 rounded-md outline-none focus:border-viren-red" placeholder="Name as per Aadhaar" />
                        {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                    </div>
                    <div>
                        <label className="block text-viren-800 text-sm mb-2 font-semibold">Surname</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                value={surname} 
                                onChange={e => {
                                    setSurname(e.target.value);
                                    setShowSurnameSuggestions(true);
                                }} 
                                onFocus={() => setShowSurnameSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowSurnameSuggestions(false), 200)}
                                name="surname" 
                                className="w-full bg-viren-50 border p-3 rounded-md outline-none focus:border-viren-red" 
                                placeholder="Surname" 
                            />
                            {showSurnameSuggestions && surname.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-viren-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                                    {surnames
                                        .filter(s => s.surname.toLowerCase().includes(surname.toLowerCase()) || s.normalized.includes(surname.toLowerCase()))
                                        .slice(0, 10)
                                        .map((s, idx) => (
                                            <div 
                                                key={idx} 
                                                className="p-2 hover:bg-viren-50 cursor-pointer text-sm border-b border-viren-50 last:border-0"
                                                onClick={() => {
                                                    setSurname(s.surname);
                                                    setShowSurnameSuggestions(false);
                                                }}
                                            >
                                                {s.surname}
                                            </div>
                                        ))
                                    }
                                    {surnames.filter(s => s.surname.toLowerCase().includes(surname.toLowerCase())).length === 0 && (
                                        <div className="p-2 text-xs text-viren-500 italic">No matching surname found. Admin review required.</div>
                                    )}
                                </div>
                            )}
                        </div>
                        {errors.surname && <p className="text-red-500 text-xs mt-1">{errors.surname}</p>}
                    </div>
                    <div>
                        <label className="block text-viren-800 text-sm mb-2 font-semibold">Father Name</label>
                        <input type="text" value={fatherName} onChange={e => setFatherName(e.target.value)} onBlur={handleBlur} name="fatherName" className="w-full bg-viren-50 border p-3 rounded-md outline-none focus:border-viren-red" placeholder="Father Name" />
                        {errors.fatherName && <p className="text-red-500 text-xs mt-1">{errors.fatherName}</p>}
                    </div>
                    <div>
                        <label className="block text-viren-800 text-sm mb-2 font-semibold">Phone Number</label>
                        <input type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} onBlur={handleBlur} name="phone" className="w-full bg-viren-50 border p-3 rounded-md outline-none focus:border-viren-red" placeholder="10-digit mobile" />
                        {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                    </div>
                    <div>
                        <label className="block text-viren-800 text-sm mb-2 font-semibold">Email Address <span className="text-red-500">*</span></label>
                        <input type="email" required value={email} onChange={e => setEmail(e.target.value)} name="email" className="w-full bg-viren-50 border p-3 rounded-md outline-none focus:border-viren-red" placeholder="example@email.com" />
                        <p className="text-[10px] text-viren-600 mt-1 leading-tight">
                            Booking Success ane Admin Announcement na email aa address par moklashe. Sacho email nakho.
                        </p>
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                    </div>
                </div>
                <div>
                    <label className="block text-viren-800 text-sm mb-2 font-semibold flex justify-between">
                        <span>Aadhaar Number</span>
                        {isCheckingUser && <Loader2 className="animate-spin w-4 h-4" />}
                    </label>
                    <input type="text" value={aadhaar} onChange={handleAadhaarChange} onBlur={handleBlur} name="aadhaar" className="w-full bg-viren-50 border p-3 rounded-md outline-none focus:border-viren-red" placeholder="0000 0000 0000" />
                    {errors.aadhaar && <p className="text-red-500 text-xs mt-1">{errors.aadhaar}</p>}
                    {existingUserFound && (
                        <p className="text-red-500 text-xs mt-1 flex items-center justify-between">
                            <span>Aadhaar already registered.</span>
                            <Link to="/login" className="text-viren-950 font-bold underline">Login instead &rarr;</Link>
                        </p>
                    )}
                    
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
                        <p className="font-bold mb-1">Instruction / સૂચના:</p>
                        <p>User e potani surname Commu Tree app pramane nakhavani rehse ane jo koi ni pan surname list ma na hoy to admin na call back no wait kare.</p>
                        <p className="mt-2">વપરાશકર્તાએ પોતાની અટક કોમ્યુ ટ્રી એપ મુજબ નાખવાની રહેશે અને જો કોઈની પણ અટક લિસ્ટમાં ના હોય તો એડમિનના કોલ બેકની રાહ જુઓ.</p>
                    </div>
                </div>
                
                {apiError && (
                    <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg flex items-start gap-2 animate-shake">
                        <AlertCircle className="shrink-0 mt-0.5" size={18} />
                        <p className="text-sm font-medium">{apiError}</p>
                    </div>
                )}

                <div>
                    <label className="block text-viren-800 text-sm mb-2 font-semibold">Display Photo for Pass</label>
                    <div className="flex items-center gap-4">
                        <div onClick={() => profilePhotoInputRef.current?.click()} className={`w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer overflow-hidden bg-viren-50 relative ${uploadErrors.profile ? 'border-red-500' : 'border-viren-300'}`}>
                            {profilePhoto ? <img src={profilePhoto} className="w-full h-full object-cover" /> : <UserCircle className="text-viren-300 w-12 h-12" />}
                            {compressing && <div className="absolute inset-0 bg-white/80 flex items-center justify-center"><Loader2 className="animate-spin" /></div>}
                        </div>
                        <input type="file" ref={profilePhotoInputRef} onChange={handleProfilePhotoUpload} accept="image/png, image/jpeg, image/webp" className="hidden" />
                        <div className="flex flex-col gap-1">
                            <button onClick={() => profilePhotoInputRef.current?.click()} className="text-viren-red text-sm font-bold flex items-center gap-2"><ImageIcon size={16} /> Select Gallery Photo</button>
                            {uploadErrors.profile && <p className="text-red-500 text-[10px] font-bold flex items-center gap-1"><AlertCircle size={10}/> {uploadErrors.profile}</p>}
                        </div>
                    </div>
                </div>
                
                {registrationStatus === 'SURNAME_REVIEW' && (
                    <div className="p-4 bg-orange-50 border border-orange-200 text-orange-800 rounded-lg flex items-start gap-3 animate-fade-in">
                        <AlertTriangle className="shrink-0 mt-1" />
                        <div>
                            <h4 className="font-bold">Surname Verification Pending</h4>
                            <p className="text-sm mt-1">Tamari surname verification mate admin taraf thi 30-60 minute ma call aavse.</p>
                        </div>
                    </div>
                )}

                <button onClick={handleNext} disabled={!fullName || !surname || !fatherName || !phone || aadhaar.length < 14 || !profilePhoto || existingUserFound || compressing || loading || registrationStatus === 'SURNAME_REVIEW'} className="btn-viren-filled w-full mt-4 disabled:opacity-50 flex items-center justify-center gap-2">
                    {loading ? <Loader2 className="animate-spin" /> : 'Book Your Pass'}
                </button>
            </div>
        )}

        {currentStep === 1 && (
             <div className="space-y-8">
                <div className="text-center">
                    <h3 className="text-2xl font-bold text-viren-950 font-serif">Identity Verification</h3>
                    <p className="text-viren-600 text-sm mt-1">AI-powered face match & document verification.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <h4 className="font-bold text-viren-800 flex items-center gap-2 text-sm"><Camera size={16}/> 1. Live Selfie Capture</h4>
                        <div className="aspect-[4/5] bg-black rounded-lg overflow-hidden relative border-2 border-viren-200 shadow-inner">
                            {aiVerifying && (
                                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
                                    <div className="absolute inset-0 bg-blue-500/20 animate-pulse"></div>
                                    <motion.div 
                                        initial={{ top: '0%' }}
                                        animate={{ top: '100%' }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                        className="absolute left-0 right-0 h-1 bg-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.8)] z-20"
                                    />
                                    <div className="relative z-30 bg-viren-950/80 px-3 py-1 rounded-full text-[10px] text-blue-300 font-bold uppercase tracking-widest border border-blue-500/30">
                                        Scanning Face...
                                    </div>
                                </div>
                            )}
                            {!selfie ? (
                                <>
                                    <Webcam 
                                        audio={false} 
                                        ref={webcamRef} 
                                        screenshotFormat="image/jpeg"
                                        screenshotQuality={1}
                                        videoConstraints={{ 
                                            width: 1280, 
                                            height: 720, 
                                            facingMode: "user" 
                                        }}
                                        forceScreenshotSourceSize={true}
                                        className="w-full h-full object-cover transform scale-x-[-1]"
                                        onUserMediaError={(err) => {
                                            console.error("Webcam Error:", err);
                                            setCameraError(true);
                                        }} 
                                    />
                                    <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                                        <button onClick={capture} className="w-16 h-16 bg-white rounded-full border-4 border-viren-200 flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                                            <div className="w-12 h-12 bg-viren-red rounded-full"></div>
                                        </button>
                                    </div>
                                    {cameraError && (
                                        <div className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center text-white p-4 text-center">
                                            <AlertTriangle className="mb-2 text-red-500" size={32} />
                                            <p className="text-sm font-bold text-red-400 mb-2">Camera Access Denied</p>
                                            <p className="text-xs text-gray-300">Live selfie is strictly required for registration security.</p>
                                            <p className="text-[10px] text-gray-400 mt-4 mb-4 leading-relaxed max-w-xs">
                                                Please allow camera permissions in your browser settings and refresh the page. If you are on a mobile network, ensure you are accessing the site via a secure (HTTPS) link or localhost.
                                            </p>
                                            <label className="bg-white text-viren-950 px-4 py-2 rounded-md font-bold text-xs cursor-pointer hover:bg-gray-100 flex items-center gap-2 shadow-lg transition-transform hover:scale-105">
                                                <Camera size={14} /> Take Photo via Native Camera
                                                <input 
                                                    type="file" 
                                                    accept="image/*" 
                                                    capture="user" 
                                                    className="hidden" 
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            const reader = new FileReader();
                                                            reader.onload = (event) => {
                                                                if (event.target?.result) {
                                                                    setSelfie(event.target.result as string);
                                                                    setCameraError(false);
                                                                }
                                                            };
                                                            reader.readAsDataURL(file);
                                                        }
                                                    }} 
                                                />
                                            </label>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    <img src={selfie} className="w-full h-full object-cover transform scale-x-[-1]" />
                                    <button onClick={() => setSelfie(null)} className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors">
                                        <RefreshCw size={16} />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="font-bold text-viren-800 flex items-center gap-2 text-sm"><FileText size={16}/> 2. Aadhaar Card Upload</h4>
                        <div className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer relative h-full min-h-[300px] ${uploadErrors.aadhaar ? 'border-red-500 bg-red-50' : 'border-viren-300 bg-viren-50 hover:bg-viren-100'}`} onClick={() => aadhaarInputRef.current?.click()}>
                            {aiVerifying && (
                                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-lg">
                                    <div className="absolute inset-0 bg-blue-500/10 animate-pulse"></div>
                                    <motion.div 
                                        initial={{ top: '0%' }}
                                        animate={{ top: '100%' }}
                                        transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                                        className="absolute left-0 right-0 h-1 bg-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.8)] z-20"
                                    />
                                    <div className="relative z-30 bg-viren-950/80 px-3 py-1 rounded-full text-[10px] text-blue-300 font-bold uppercase tracking-widest border border-blue-500/30">
                                        Processing Biometrics...
                                    </div>
                                </div>
                            )}
                            {aadhaarFile ? (
                                <div className="flex flex-col items-center">
                                    {aadhaarFile.startsWith('data:application/pdf') ? (
                                        <FileText size={48} className="text-viren-red mb-2" />
                                    ) : (
                                        <img src={aadhaarFile} className="w-32 h-32 object-cover rounded-md mb-2 shadow-sm" />
                                    )}
                                    <p className="text-sm font-bold text-viren-950 truncate max-w-[200px]">{aadhaarFileName}</p>
                                    <p className="text-xs text-green-600 flex items-center gap-1 mt-1"><Check size={12} /> Uploaded</p>
                                    <button onClick={(e) => { e.stopPropagation(); setAadhaarFile(null); }} className="mt-4 text-xs text-red-500 underline">Remove</button>
                                </div>
                            ) : (
                                <>
                                    <Upload className={uploadErrors.aadhaar ? "text-red-400 mb-4" : "text-viren-400 mb-4"} size={32} />
                                    <p className={uploadErrors.aadhaar ? "text-sm font-bold text-red-700" : "text-sm font-bold text-viren-700"}>Click to Upload Aadhaar</p>
                                    <p className="text-xs text-viren-500 mt-1">Supports JPG, PNG (Max 10MB)</p>
                                    {uploadErrors.aadhaar && (
                                        <div className="mt-4 p-2 bg-red-100 text-red-700 text-xs rounded-md border border-red-200 flex items-center gap-2">
                                            <AlertCircle size={14} /> {uploadErrors.aadhaar}
                                        </div>
                                    )}
                                </>
                            )}
                            {compressing && (
                                <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
                                    <Loader2 className="animate-spin text-viren-red" />
                                </div>
                            )}
                        </div>
                        <input type="file" ref={aadhaarInputRef} onChange={handleAadhaarUpload} accept="image/*" className="hidden" />
                    </div>
                </div>

                {/* Biometric Verification Status UI */}
                {aiVerifying && (
                    <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg flex flex-col items-center justify-center text-center">
                        <div className="relative mb-4">
                            <ShieldCheck className="text-blue-600 animate-pulse" size={40} />
                            <div className="absolute inset-0 bg-blue-400/20 blur-xl rounded-full animate-pulse"></div>
                        </div>
                        <h4 className="font-bold text-blue-800 text-lg">Local Identity Verification</h4>
                        <p className="text-sm text-blue-600 mt-1">Matching your biometric data with the provided ID securely in your browser.</p>
                        <div className="w-full max-w-xs bg-blue-100 h-1.5 rounded-full mt-6 overflow-hidden">
                            <motion.div 
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 5, ease: "easeInOut" }}
                                className="h-full bg-blue-600"
                            />
                        </div>
                    </div>
                )}

                {isAiVerified && !aiVerifying && !verificationError && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-50 border border-green-200 p-6 rounded-lg flex flex-col items-center justify-center text-center">
                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white mb-3 shadow-lg shadow-green-200">
                            <Check size={24} strokeWidth={3} />
                        </div>
                        <h4 className="font-bold text-green-800 text-lg">Identity Verified Successfully</h4>
                        <p className="text-sm text-green-600 mt-1">Face match score: {matchScore}%</p>
                        {!qualityWarning && <p className="text-xs text-green-500 mt-2 italic">Proceeding to next step...</p>}
                    </motion.div>
                )}

                {verificationError && (
                    <div className="bg-red-50 border border-red-200 p-4 rounded-lg flex flex-col gap-3 animate-shake">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="text-red-600 shrink-0 mt-1" />
                            <div>
                                <h4 className="font-bold text-red-800">Verification Failed</h4>
                                <p className="text-sm text-red-600 mt-1">{verificationError}</p>
                            </div>
                        </div>
                        {aiSuggestions.length > 0 && (
                            <div className="ml-9 p-3 bg-white/50 rounded border border-red-100">
                                <p className="text-xs font-bold text-red-800 uppercase tracking-wider mb-2">Suggestions to fix:</p>
                                <ul className="text-xs text-red-700 space-y-1 list-disc ml-4">
                                    {aiSuggestions.map((s, i) => <li key={i}>{s}</li>)}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                {qualityWarning && (
                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg flex flex-col gap-3">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="text-yellow-600 shrink-0 mt-1" />
                            <div>
                                <h4 className="font-bold text-yellow-800">Verification Warning</h4>
                                <p className="text-sm text-yellow-600 mt-1">{qualityWarning}</p>
                            </div>
                        </div>
                        {aiSuggestions.length > 0 && (
                            <div className="ml-9 p-3 bg-white/50 rounded border border-yellow-100">
                                <p className="text-xs font-bold text-yellow-800 uppercase tracking-wider mb-2">Suggestions to improve:</p>
                                <ul className="text-xs text-yellow-700 space-y-1 list-disc ml-4">
                                    {aiSuggestions.map((s, i) => <li key={i}>{s}</li>)}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex gap-4">
                    <button onClick={() => {
                        setCurrentStep(prev => prev - 1);
                        setIsAiVerified(false);
                        setQualityWarning(null);
                        setVerificationError(null);
                    }} className="flex-1 py-3 border border-viren-300 rounded-md font-bold text-viren-600 hover:bg-viren-50" disabled={aiVerifying}>Back</button>
                    <button onClick={handleNext} disabled={!selfie || !aadhaarFile || aiVerifying} className="flex-1 btn-viren-filled py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                        {aiVerifying ? <Loader2 className="animate-spin" /> : 
                         isAiVerified ? 'Proceed Anyway' : 'Verify & Proceed'}
                    </button>
                </div>
             </div>
        )}

        {currentStep === 2 && (
            <div className="space-y-6">
                <h3 className="text-2xl font-bold text-viren-950 font-serif">Select Your Passes</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div onClick={() => setTicketType(TicketType.MALE)} className={`p-6 border-2 cursor-pointer transition-all rounded-lg ${ticketType === TicketType.MALE ? 'border-viren-red bg-viren-redbg ring-2 ring-viren-red/20' : 'border-viren-200 bg-white'}`}>
                        <h4 className="font-bold text-viren-950">Male Pass</h4>
                        <p className="text-viren-red font-bold text-xl mt-1">₹{prices.MALE_PASS}</p>
                    </div>
                    <div onClick={() => setTicketType(TicketType.FEMALE)} className={`p-6 border-2 cursor-pointer transition-all rounded-lg ${ticketType === TicketType.FEMALE ? 'border-viren-red bg-viren-redbg ring-2 ring-viren-red/20' : 'border-viren-200 bg-white'}`}>
                        <h4 className="font-bold text-viren-950">Female Pass</h4>
                        <p className="text-viren-red font-bold text-xl mt-1">₹{prices.FEMALE_PASS}</p>
                    </div>
                </div>
                <div>
                    <label className="block text-viren-800 text-sm mb-2 font-semibold">Parking Requirements</label>
                    <select value={parkingType} onChange={e => {setParkingType(e.target.value as ParkingType); setParkingCount(0);}} className="w-full bg-viren-50 border border-viren-200 p-3 rounded-md outline-none focus:border-viren-red">
                        <option value={ParkingType.NONE}>No Parking Needed</option>
                        <option value={ParkingType.TWO_WHEELER}>Two Wheeler (₹{prices.TWO_WHEELER}/Vehicle)</option>
                        <option value={ParkingType.FOUR_WHEELER}>Four Wheeler (₹{prices.FOUR_WHEELER}/Vehicle)</option>
                    </select>
                </div>
                {parkingType !== ParkingType.NONE && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                        <label className="block text-viren-800 text-sm mb-2 font-semibold">Number of Vehicles</label>
                        <input type="number" min="1" max={parkingType === ParkingType.TWO_WHEELER ? PARKING_LIMITS.TWO_WHEELER : PARKING_LIMITS.FOUR_WHEELER} value={parkingCount} onChange={e => setParkingCount(Math.min(parseInt(e.target.value) || 0, 5))} className="w-full bg-viren-50 border border-viren-200 p-3 rounded-md" />
                    </motion.div>
                )}
                <button onClick={handleNext} className="btn-viren-filled w-full mt-4 shadow-lg">Final Review & Checkout</button>
            </div>
        )}

        {currentStep === 3 && (
            <div className="space-y-6">
                <h3 className="text-2xl font-bold text-viren-950 font-serif">Order Summary</h3>
                <div className="bg-viren-50 p-6 rounded-lg border border-viren-200">
                    <div className="flex justify-between py-2 border-b border-viren-200/50">
                        <span className="text-viren-700 font-medium">Pass Type:</span>
                        <span className="font-bold text-viren-950">{ticketType}</span>
                    </div>
                    {parkingType !== ParkingType.NONE && (
                        <div className="flex justify-between py-2 border-b border-viren-200/50">
                            <span className="text-viren-700 font-medium">Parking ({parkingCount} Unit):</span>
                            <span className="font-bold text-viren-950">₹{parkingCount * (parkingType === ParkingType.TWO_WHEELER ? prices.TWO_WHEELER : prices.FOUR_WHEELER)}</span>
                        </div>
                    )}
                    <div className="flex justify-between py-4 mt-2">
                        <span className="text-xl font-bold text-viren-950">Total Payable:</span>
                        <span className="text-2xl font-bold text-viren-red">₹{calculateTotal()}</span>
                    </div>
                </div>

                {apiError && (
                    <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg flex items-start gap-2">
                        <AlertCircle className="shrink-0 mt-0.5" size={18} />
                        <p className="text-sm font-medium">{apiError}</p>
                    </div>
                )}
                
                <div className="flex items-start gap-3 p-4 bg-viren-50 border border-viren-200 rounded-md">
                    <input type="checkbox" id="terms" checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)} className="mt-1 w-4 h-4 text-viren-red rounded" />
                    <label htmlFor="terms" className="text-xs text-viren-700 leading-relaxed cursor-pointer">
                        I confirm that the uploaded identity images are authentic and belong to me. I agree to the <button type="button" onClick={() => setShowTermsModal(true)} className="text-viren-950 font-bold underline">Terms of Entry</button>.
                    </label>
                </div>

                <button onClick={() => setShowConfirmation(true)} disabled={!agreedToTerms || paymentProcessing} className="btn-viren-filled w-full py-4 flex flex-col items-center justify-center gap-1 shadow-2xl h-auto disabled:opacity-50">
                    <span className="flex items-center gap-2 text-lg">Secure Checkout <ShieldCheck size={20}/></span>
                    <span className="text-[10px] opacity-70 uppercase tracking-widest font-bold">Encrypted Transaction</span>
                </button>
            </div>
        )}
      </motion.div>
    </div>

    {/* Confirmation Modal */}
    <AnimatePresence>
        {showConfirmation && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-lg p-8 max-w-sm w-full shadow-2xl">
                    <h3 className="text-xl font-bold text-viren-950 flex items-center gap-2 mb-4 font-serif">Confirm & Pay</h3>
                    <div className="bg-viren-50 p-4 rounded mb-6 text-sm">
                        <p className="flex justify-between mb-2"><span>Payable Amount:</span> <span className="font-bold text-viren-red">₹{calculateTotal()}</span></p>
                        <p className="text-[10px] text-viren-500 italic">By clicking pay, you will be redirected to the secure gateway.</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setShowConfirmation(false)} className="flex-1 py-3 text-viren-600 font-bold">Cancel</button>
                        <button onClick={handlePayment} className="flex-1 btn-viren-filled py-3">Pay Now</button>
                    </div>
                </motion.div>
            </div>
        )}
    </AnimatePresence>

    {/* Terms Modal */}
    <AnimatePresence>
        {showTermsModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white rounded-lg max-w-lg w-full shadow-2xl flex flex-col max-h-[80vh]">
                    <div className="p-4 border-b flex justify-between items-center bg-viren-950 text-white rounded-t-lg">
                        <h3 className="font-bold">Terms & Conditions</h3>
                        <button onClick={() => setShowTermsModal(false)}><X size={20}/></button>
                    </div>
                    <div className="p-6 overflow-y-auto text-sm space-y-4">
                        <p className="font-bold text-viren-red">1. Mandatory Identity Check</p>
                        <p>Our AI face recognition system ensures that the pass holder is the same individual as the Aadhaar card holder. Discrepancies will lead to entry denial without refund.</p>
                        <p className="font-bold text-viren-red">2. Dress Code</p>
                        <p>Traditional Gujarati attire is mandatory for all participants. Management reserves the right to deny entry for dress code violations.</p>
                        <p className="font-bold text-viren-red">3. Non-Transferable</p>
                        <p>Digital passes are locked to your biometric ID and Aadhaar number. They cannot be sold or transferred.</p>
                    </div>
                    <div className="p-4 border-t text-right">
                        <button onClick={() => setShowTermsModal(false)} className="btn-viren-filled px-6 py-2">Close</button>
                    </div>
                </motion.div>
            </div>
        )}
    </AnimatePresence>
    </>
  );
};