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
import { usePopup } from './PopupContext';

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
    const { showPopup } = usePopup();
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
    const [email, setEmail] = useState('');
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
    const [bookingDetails, setBookingDetails] = useState<{ id: string, amount: number, txId: string } | null>(null);
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
            return base64Image;
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
            } catch (e) {
                console.error("DB check failed");
            }
            setIsCheckingUser(false);
        }
    };

    const handleRetakeSelfie = () => {
        setSelfie(null);
        setIsAiVerified(false);
        setMatchScore(null);
        setVerificationError(null);
    };

    const capture = useCallback(() => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
            setSelfie(imageSrc);
            setIsAiVerified(false);
            setMatchScore(null);
        } else {
            setCameraError(true);
        }
    }, [webcamRef]);

    const handleAadhaarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        setUploadErrors(prev => ({ ...prev, aadhaar: null }));

        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                setUploadErrors(prev => ({ ...prev, aadhaar: "File size too large. Max limit is 10MB." }));
                return;
            }

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
            if (file.size > 5 * 1024 * 1024) {
                setUploadErrors(prev => ({ ...prev, profile: "Profile photo must be smaller than 5MB." }));
                return;
            }

            const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                setUploadErrors(prev => ({ ...prev, profile: "Please upload a valid image (JPG, PNG, or WEBP)." }));
                return;
            }

            setCompressing(true);
            try {
                const compressed = await compressImage(file);
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
            if (!fullName || !surname || !fatherName || !phone || !aadhaar || !profilePhoto || existingUserFound) return;

            setLoading(true);
            try {
                const user = await mockDb.createUser({
                    fullName, surname, fatherName, aadhaar, phone, email, selfieUrl: '', profilePhotoUrl: profilePhoto!, aadhaarCardUrl: ''
                });
                setUserId(user.id);
                setRegistrationStatus(user.registrationStatus);

                if (user.registrationStatus === 'SURNAME_REVIEW') {
                    setLoading(false);
                    showPopup({
                        titleEn: '⚠️ Surname Review Pending',
                        titleGu: '⚠️ અટક સમીક્ષા પેન્ડિંગ',
                        messageEn: `Your surname (${surname}) is currently under admin review. User ID: ${user.id}. Pass booking will unlock once approved.`,
                        messageGu: `તમારી અટક (${surname}) હાલ એડમિન ચકાસણી માટે પેન્ડિંગ છે. યુઝર આઈડી: ${user.id}. મંજૂરી મળ્યા પછી પાસ બુક થઈ શકશે.`,
                        type: 'warning'
                    });
                    return;
                }

                setLoading(false);
                setCurrentStep(prev => prev + 1);
            } catch (e: any) {
                console.error("Registration Failed", e);
                const msg = e.message || "Registration failed. Please try again.";
                setApiError(msg);
                setLoading(false);
                showPopup({
                    titleEn: '❌ Registration Error',
                    titleGu: '❌ નોંધણીમાં ભૂલ',
                    messageEn: msg,
                    messageGu: 'નોંધણીમાં સમસ્યા આવી છે. કૃપા કરીને માહિતી ચકાસી ફરી પ્રયાસ કરો.',
                    type: 'error'
                });
                return;
            }
        } else if (currentStep === 1) {
            if (!selfie || !aadhaarFile) return;

            if (!isModelsLoaded) {
                const msg = "Face detection models are still loading. Please wait a moment.";
                setVerificationError(msg);
                showPopup({
                    titleEn: '⏳ Loading AI Models',
                    titleGu: '⏳ એઆઈ મોડ્યુલ લોડ થઈ રહ્યું છે',
                    messageEn: msg,
                    messageGu: 'ચહેરાની તપાસ માટે સિસ્ટમ લોડ થઈ રહી છે. કૃપા કરીને થોડી ક્ષણો રાહ જુઓ.',
                    type: 'info'
                });
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

            setTimeout(async () => {
                try {
                    const [selfieImg, aadhaarImg, profileImg] = await Promise.all([
                        faceapi.fetchImage(selfie),
                        faceapi.fetchImage(aadhaarFile),
                        profilePhoto ? faceapi.fetchImage(profilePhoto) : Promise.resolve(null)
                    ]);

                    const detectFace = async (img: HTMLImageElement | null, label: string) => {
                        if (!img) return null;
                        try {
                            let detection = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.4 }))
                                .withFaceLandmarks()
                                .withFaceDescriptor();

                            if (!detection) {
                                detection = await faceapi.detectSingleFace(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.4 }))
                                    .withFaceLandmarks()
                                    .withFaceDescriptor();
                            }
                            return detection;
                        } catch (err) {
                            console.warn(`Face detection exception on ${label}`, err);
                            return null;
                        }
                    };

                    const [selfieDetection, aadhaarDetection, profileDetection] = await Promise.all([
                        detectFace(selfieImg, "Live Selfie"),
                        detectFace(aadhaarImg, "Aadhaar Card"),
                        detectFace(profileImg, "Profile Photo")
                    ]);

                    // 1. Check face detection for Live Selfie
                    if (!selfieDetection) {
                        const reason = "Could not detect a clear face in your Live Selfie. Please capture a clear front-facing selfie in bright lighting.";
                        setVerificationError(reason);
                        setAiVerifying(false);
                        showPopup({
                            titleEn: '❌ Pass Booking Unsuccessful',
                            titleGu: '❌ પાસ બુકિંગ અસફળ (લાઈવ સેલ્ફી ભૂલ)',
                            messageEn: `Reason: ${reason}`,
                            messageGu: `કારણ: લાઈવ સેલ્ફીમાં તમારો ચહેરો સ્પષ્ટ ઓળખાઈ શક્યો નથી. કૃપા કરીને ખુલ્લા અને સારા પ્રકાશમાં કેમેરા સામે રાખી સેલ્ફી ફરી લો.`,
                            type: 'error'
                        });
                        return;
                    }

                    // 2. Check face detection for Aadhaar Card Photo
                    if (!aadhaarDetection) {
                        const reason = "Could not detect a clear face in your uploaded Aadhaar Card photo. Please upload a clear, high-resolution Aadhaar card document.";
                        setVerificationError(reason);
                        setAiVerifying(false);
                        showPopup({
                            titleEn: '❌ Pass Booking Unsuccessful',
                            titleGu: '❌ પાસ બુકિંગ અસફળ (આધાર કાર્ડ ફોટો ભૂલ)',
                            messageEn: `Reason: ${reason}`,
                            messageGu: `કારણ: અપલોડ કરેલ આધાર કાર્ડના ફોટામાંથી ચહેરો ડિટેક્ટ થયો નથી. કૃપા કરીને આધાર કાર્ડનો સ્પષ્ટ અને વંચાય તેવો ફોટો અપલોડ કરો.`,
                            type: 'error'
                        });
                        return;
                    }

                    // 3. Check face detection for Profile Photo
                    if (!profileDetection) {
                        const reason = "Could not detect a clear face in your Profile Photo (Step 1). Please re-upload a clear portrait profile photo.";
                        setVerificationError(reason);
                        setAiVerifying(false);
                        showPopup({
                            titleEn: '❌ Pass Booking Unsuccessful',
                            titleGu: '❌ પાસ બુકિંગ અસફળ (પ્રોફાઈલ ફોટો ભૂલ)',
                            messageEn: `Reason: ${reason}`,
                            messageGu: `કારણ: સ્ટેપ ૧ માં અપલોડ કરેલ પ્રોફાઈલ ફોટામાં ચહેરો સ્પષ્ટ નથી. કૃપા કરીને તમારો સોલો પોટ્રેટ પ્રોફાઈલ ફોટો અપલોડ કરો.`,
                            type: 'error'
                        });
                        return;
                    }

                    // 4. Perform Pairwise 3-Photo AI Face Matching
                    // Pair A: Live Selfie vs Aadhaar Card
                    const selfieAadhaarMatcher = new faceapi.FaceMatcher(selfieDetection);
                    const selfieAadhaarMatch = selfieAadhaarMatcher.findBestMatch(aadhaarDetection.descriptor);
                    const selfieAadhaarScore = Math.round(Math.max(0, (1 - selfieAadhaarMatch.distance)) * 100);

                    // Pair B: Live Selfie vs Profile Photo
                    const selfieProfileMatcher = new faceapi.FaceMatcher(selfieDetection);
                    const selfieProfileMatch = selfieProfileMatcher.findBestMatch(profileDetection.descriptor);
                    const selfieProfileScore = Math.round(Math.max(0, (1 - selfieProfileMatch.distance)) * 100);

                    // Pair C: Profile Photo vs Aadhaar Card
                    const profileAadhaarMatcher = new faceapi.FaceMatcher(profileDetection);
                    const profileAadhaarMatch = profileAadhaarMatcher.findBestMatch(aadhaarDetection.descriptor);
                    const profileAadhaarScore = Math.round(Math.max(0, (1 - profileAadhaarMatch.distance)) * 100);

                    // Composite Match Score Across 3 Photos
                    const finalMatchScore = Math.round((selfieAadhaarScore + selfieProfileScore + profileAadhaarScore) / 3);
                    setMatchScore(finalMatchScore);

                    // Check 1: Aadhaar Card Belongs to Different Person Fraud Check (< 40%)
                    if (selfieAadhaarScore < 40 || profileAadhaarScore < 40) {
                        const minAadhaarScore = Math.min(selfieAadhaarScore, profileAadhaarScore);
                        const errReason = `Aadhaar Card mismatch detected. The photo on the uploaded Aadhaar card does not match your Live Selfie (${selfieAadhaarScore}%) or Profile Photo (${profileAadhaarScore}%). Minimum 40% match required.`;
                        setVerificationError(errReason);
                        setAiVerifying(false);
                        showPopup({
                            titleEn: '❌ Aadhaar Verification Rejected (Different Person)',
                            titleGu: '❌ આધાર ચકાસણી અસફળ (અલગ વ્યક્તિનો આધાર કાર્ડ)',
                            messageEn: `Security Rejection: ${errReason} Please upload your own valid Aadhaar card.`,
                            messageGu: `અપલોડ કરેલ આધાર કાર્ડ બીજા કોઈ વ્યક્તિનું લાગે છે. તમારા સેલ્ફી અને પ્રોફાઈલ ફોટા સાથે આધાર કાર્ડનો ચહેરો મેચ થતો નથી (મેચ સ્કોર: ${minAadhaarScore}%, મિનિમમ ૪૦% જરૂરી). કૃપા કરીને તમારો પોતાનો જ આધાર કાર્ડ અપલોડ કરો.`,
                            type: 'error'
                        });
                        return;
                    }

                    // Check 2: Live Selfie vs Profile Photo Match Check (< 40%)
                    if (selfieProfileScore < 40) {
                        const errReason = `Live Selfie does not match uploaded Profile Photo (${selfieProfileScore}%, minimum required: 40%).`;
                        setVerificationError(errReason);
                        setAiVerifying(false);
                        showPopup({
                            titleEn: '❌ Profile Photo Verification Failed',
                            titleGu: '❌ સેલ્ફી અને પ્રોફાઈલ ફોટો મેચ નિષ્ફળ',
                            messageEn: errReason,
                            messageGu: `તમારો લાઈવ સેલ્ફી અને પ્રોફાઈલ ફોટો એકબીજા સાથે મેચ થતો નથી (મેચ સ્કોર: ${selfieProfileScore}%, મિનિમમ ૪૦% જરૂરી). કૃપા કરીને તમારો સાચો ફોટો અપલોડ કરી સેલ્ફી ફરી લો.`,
                            type: 'error'
                        });
                        return;
                    }

                    // Check 3: Overall Composite Match Score Check (< 40%)
                    if (finalMatchScore < 40) {
                        const errReason = `Overall 3-photo face match score is ${finalMatchScore}% (Minimum required: 40%).`;
                        setVerificationError(errReason);
                        setAiVerifying(false);
                        showPopup({
                            titleEn: '❌ Pass Booking Unsuccessful',
                            titleGu: '❌ પાસ બુકિંગ અસફળ (ચહેરાની સામ્યતા ૪૦% થી ઓછી)',
                            messageEn: errReason,
                            messageGu: `તમારું પાસ બુકિંગ અસફળ રહ્યું છે. સેલ્ફી, આધાર કાર્ડ અને પ્રોફાઈલ ફોટાનો ચહેરો મેચ થતો નથી (ઓવરઓલ મેચ: ${finalMatchScore}%, મિનિમમ ૪૦% જરૂરી).`,
                            type: 'error'
                        });
                        return;
                    }

                    setIsAiVerified(true);
                    console.log(`3-Photo AI Face Verification successful. Composite Score: ${finalMatchScore}%`);

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
                        console.warn("Backend storage failed", apiErr);
                    }

                    if (userId) {
                        const finalSelfie = (apiData as any)?.selfiePath || selfie;
                        const finalAadhaar = (apiData as any)?.aadhaarPath || aadhaarFile;

                        await mockDb.createUser({
                            fullName, surname, fatherName, aadhaar, phone, email, selfieUrl: finalSelfie, profilePhotoUrl: profilePhoto!, aadhaarCardUrl: finalAadhaar
                        });
                    }

                    setAiVerifying(false);

                    setTimeout(() => {
                        setCurrentStep(prev => prev + 1);
                    }, 800);

                } catch (error: any) {
                    console.error("Verification Failed", error);
                    const errMsg = error.message || "Identity verification failed. Please try again with clearer photos.";
                    setVerificationError(errMsg);
                    setAiVerifying(false);
                    showPopup({
                        titleEn: '❌ Pass Booking Unsuccessful',
                        titleGu: '❌ પાસ બુકિંગ અસફળ',
                        messageEn: `Verification Error: ${errMsg}`,
                        messageGu: `કારણ: ઓળખ ચકાસણીમાં સિસ્ટમ ભૂલ આવી છે. કૃપા કરીને સ્પષ્ટ ફોટા ફરીથી અપલોડ કરી પ્રયાસ કરો.`,
                        type: 'error'
                    });
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
            const noNet = "No internet connection. Please connect to proceed.";
            setApiError(noNet);
            setPaymentProcessing(false);
            showPopup({
                titleEn: '🌐 Offline Warning',
                titleGu: '🌐 ઈન્ટરનેટ કનેક્શન નથી',
                messageEn: noNet,
                messageGu: 'તમારું ઈન્ટરનેટ બંધ છે. પેમેન્ટ પૂરું કરવા માટે કનેક્ટ કરો.',
                type: 'error'
            });
            return;
        }

        const isScriptLoaded = await loadRazorpayScript();
        if (!isScriptLoaded) {
            const scriptErr = "Payment gateway failed to load. Please check your internet connection.";
            setApiError(scriptErr);
            setPaymentProcessing(false);
            showPopup({
                titleEn: '❌ Payment Gateway Error',
                titleGu: '❌ પેમેન્ટ ગેટવે એરર',
                messageEn: scriptErr,
                messageGu: 'પેમેન્ટ ગેટવે લોડ થવામાં નિષ્ફળ રહ્યું છે. કૃપા કરીને કનેક્શન તપાસો.',
                type: 'error'
            });
            return;
        }

        try {
            if (userId) {
                await mockDb.createUser({
                    fullName, surname, fatherName, aadhaar, phone, email, selfieUrl: selfie!, profilePhotoUrl: profilePhoto!, aadhaarCardUrl: aadhaarFile!
                });
            } else {
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
                        let currentUserId = userId;
                        if (!currentUserId) {
                            const user = await mockDb.loginUser(aadhaar);
                            if (user) currentUserId = user.id;
                        }

                        const booking = await mockDb.createBooking({
                            userId: currentUserId!,
                            ticketType,
                            parkingType,
                            parkingCount,
                            totalAmount,
                            paymentId: response.razorpay_payment_id,
                            signature: response.razorpay_signature,
                            verified: true
                        });

                        setBookingDetails({
                            id: booking.id,
                            amount: totalAmount,
                            txId: response.razorpay_payment_id
                        });
                        setBookingComplete(true);
                        setPaymentProcessing(false);
                    } catch (e: any) {
                        console.error("Booking Creation Failed", e);
                        const msg = e.message || "Failed to record booking. Please contact support.";
                        setApiError(msg);
                        setPaymentProcessing(false);
                        showPopup({
                            titleEn: '❌ Booking Record Error',
                            titleGu: '❌ બુકિંગ રેકોર્ડ ભૂલ',
                            messageEn: msg,
                            messageGu: 'પેમેન્ટ સફળ થયું પણ બુકિંગ સેવ કરવામાં સમસ્યા આવી. કૃપા કરીને સપોર્ટનો સંપર્ક કરો.',
                            type: 'error'
                        });
                    }
                },
                prefill: {
                    name: fullName,
                    contact: phone,
                    email: email || `${phone}@svar.com`
                },
                theme: {
                    color: "#731515"
                }
            };

            const paymentObject = new window.Razorpay(options);
            paymentObject.open();
        } catch (e: any) {
            console.error("Payment Process Error", e);
            const msg = e.message || "Failed to initiate payment. Please try again.";
            setApiError(msg);
            setPaymentProcessing(false);
            showPopup({
                titleEn: '❌ Payment Initiation Failed',
                titleGu: '❌ પેમેન્ટ શરૂ કરી શકાયું નથી',
                messageEn: msg,
                messageGu: 'પેમેન્ટ ચાલુ કરવામાં સમસ્યા આવી છે. કૃપા કરીને ફરી પ્રયાસ કરો.',
                type: 'error'
            });
        }
    };

    if (isLoadingSettings) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-viren-950">
                <Loader2 className="w-10 h-10 animate-spin text-viren-red mb-4" />
                <p className="font-semibold text-lg font-serif">Loading SVAR Registration System...</p>
            </div>
        );
    }

    if (!registrationOpen) {
        return (
            <div className="max-w-xl mx-auto p-8 bg-white rounded-2xl shadow-xl border border-viren-200 text-center my-12 animate-fade-in">
                <div className="w-16 h-16 bg-red-100 text-viren-red rounded-full flex items-center justify-center mx-auto mb-4">
                    <Ban size={32} />
                </div>
                <h2 className="text-2xl font-bold font-serif text-viren-950 mb-2">Registrations Closed</h2>
                <p className="text-viren-600 mb-6">
                    Pass registrations for SVAR 2026 are currently closed by the event management. Please check back later or contact support for inquiries.
                </p>
                <button onClick={() => navigate('/')} className="btn-viren px-6 py-2">Return to Home</button>
            </div>
        );
    }

    if (bookingComplete && bookingDetails) {
        return (
            <div className="max-w-xl mx-auto p-8 bg-white rounded-2xl shadow-2xl border border-viren-200 text-center my-12 animate-liquid-up">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Check size={40} />
                </div>
                <h2 className="text-3xl font-bold font-serif text-viren-950 mb-2">Registration Confirmed!</h2>
                <p className="text-viren-600 text-sm mb-6">Your E-Pass for SVAR 2026 has been generated successfully.</p>

                <div className="bg-viren-50 p-6 rounded-xl border border-viren-200 text-left mb-6 space-y-3 text-sm">
                    <div className="flex justify-between border-b pb-2">
                        <span className="text-viren-600">Booking ID:</span>
                        <span className="font-bold text-viren-950">{bookingDetails.id}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                        <span className="text-viren-600">Name:</span>
                        <span className="font-bold text-viren-950">{fullName}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                        <span className="text-viren-600">Pass Type:</span>
                        <span className="font-bold text-viren-red">{ticketType} PASS</span>
                    </div>
                    <div className="flex justify-between font-bold text-base text-viren-950 pt-1">
                        <span>Total Paid:</span>
                        <span className="text-viren-red">₹{bookingDetails.amount}</span>
                    </div>
                </div>

                <Link
                    to="/pass"
                    className="btn-viren-filled w-full py-4 rounded-lg flex items-center justify-center gap-2 font-bold uppercase tracking-wider text-sm shadow-lg"
                >
                    <span>View & Download Pass</span>
                    <ArrowRight size={18} />
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
            {/* Stepper Header */}
            <div className="mb-10 bg-white p-6 rounded-3xl shadow-xl border border-slate-200/80">
                <div className="flex justify-between items-center relative">
                    {steps.map((label, idx) => (
                        <div key={label} className="flex flex-col items-center z-10 relative">
                            <div
                                className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-black transition-all border-2 ${
                                    idx === currentStep
                                        ? 'bg-[#731515] text-white border-amber-400 shadow-lg shadow-[#731515]/30 scale-110'
                                        : idx < currentStep
                                        ? 'bg-slate-900 text-white border-slate-900'
                                        : 'bg-slate-100 text-slate-400 border-slate-300'
                                }`}
                            >
                                {idx < currentStep ? <Check size={20} className="text-amber-300 stroke-[3]" /> : idx + 1}
                            </div>
                            <span className={`text-xs mt-2.5 font-bold tracking-wide uppercase ${idx === currentStep ? 'text-[#731515] font-extrabold' : idx < currentStep ? 'text-slate-800' : 'text-slate-400'}`}>
                                {label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {currentStep === 0 && (
                <div className="bg-white text-slate-900 p-6 sm:p-10 rounded-3xl shadow-2xl border border-slate-200/80 space-y-8 animate-fade-in">
                    <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
                        <h3 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-3">
                            <UserCircle className="text-[#731515]" size={28} />
                            <span>1. Member Personal Details</span>
                        </h3>
                        <span className="text-xs text-white bg-[#731515] px-3.5 py-1 rounded-full font-bold uppercase tracking-wider shadow">
                            Step 1 of 4
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Full Name *</label>
                            <input
                                type="text"
                                name="fullName"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                onBlur={handleBlur}
                                placeholder="Enter full name as on Aadhaar"
                                className="w-full p-4 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#731515] focus:bg-white focus:outline-none transition-all shadow-inner font-medium"
                            />
                            {errors.fullName && <p className="text-xs text-red-500 font-medium mt-1">{errors.fullName}</p>}
                        </div>

                        <div className="space-y-1.5 relative">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Surname *</label>
                            <input
                                type="text"
                                name="surname"
                                value={surname}
                                onChange={(e) => setSurname(e.target.value)}
                                onBlur={handleBlur}
                                placeholder="Enter surname (e.g. Gajjar, Suthar)"
                                className="w-full p-4 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#731515] focus:bg-white focus:outline-none transition-all shadow-inner font-medium"
                            />
                            {errors.surname && <p className="text-xs text-red-500 font-medium mt-1">{errors.surname}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Father's / Husband's Name *</label>
                            <input
                                type="text"
                                name="fatherName"
                                value={fatherName}
                                onChange={(e) => setFatherName(e.target.value)}
                                onBlur={handleBlur}
                                placeholder="Enter father's or husband's name"
                                className="w-full p-4 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#731515] focus:bg-white focus:outline-none transition-all shadow-inner font-medium"
                            />
                            {errors.fatherName && <p className="text-xs text-red-500 font-medium mt-1">{errors.fatherName}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Mobile Phone *</label>
                            <input
                                type="tel"
                                name="phone"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                onBlur={handleBlur}
                                placeholder="10-digit mobile number"
                                className="w-full p-4 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#731515] focus:bg-white focus:outline-none transition-all shadow-inner font-medium"
                            />
                            {errors.phone && <p className="text-xs text-red-500 font-medium mt-1">{errors.phone}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Aadhaar Number *</label>
                            <input
                                type="text"
                                name="aadhaar"
                                value={aadhaar}
                                onChange={handleAadhaarChange}
                                onBlur={handleBlur}
                                placeholder="12-digit Aadhaar number"
                                className="w-full p-4 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#731515] focus:bg-white focus:outline-none font-mono transition-all shadow-inner font-bold"
                            />
                            {errors.aadhaar && <p className="text-xs text-red-500 font-medium mt-1">{errors.aadhaar}</p>}
                            {existingUserFound && <p className="text-xs text-red-500 font-bold mt-1">This Aadhaar number is already registered.</p>}
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Profile Photo *</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleProfilePhotoUpload}
                                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#731515] file:text-white hover:file:bg-[#8E2121]"
                            />
                            {profilePhoto && <p className="text-xs text-emerald-600 font-bold mt-1 flex items-center gap-1"><Check size={14} /> Profile Photo Uploaded</p>}
                            {uploadErrors.profile && <p className="text-xs text-red-500 mt-1">{uploadErrors.profile}</p>}
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-200 flex justify-end">
                        <button
                            type="button"
                            onClick={handleNext}
                            disabled={loading || !fullName || !surname || !fatherName || !phone || !aadhaar || !profilePhoto || existingUserFound}
                            className="bg-[#731515] hover:bg-[#8E2121] text-white font-bold text-xs uppercase tracking-widest px-10 py-4 rounded-xl shadow-lg transition-transform hover:scale-[1.02] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <span>Next: Verification</span>}
                            <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            )}

            {currentStep === 1 && (
                <div className="bg-white text-slate-900 p-6 sm:p-10 rounded-3xl shadow-2xl border border-slate-200/80 space-y-8 animate-fade-in relative">
                    
                    {/* Fullscreen High-Tech AI Face Scan Overlay */}
                    {aiVerifying && (
                        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
                            <div className="bg-white border border-slate-200 p-8 sm:p-10 rounded-3xl max-w-md w-full text-center space-y-6 shadow-2xl animate-fade-in relative overflow-hidden">
                                {/* Glowing Laser Scan Line Animation */}
                                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-[#731515] to-amber-400 animate-pulse" />

                                <div className="w-24 h-24 mx-auto relative flex items-center justify-center">
                                    <div className="absolute inset-0 rounded-full border-4 border-[#731515]/30 animate-ping" />
                                    <div className="w-20 h-20 rounded-full bg-[#731515]/10 border-2 border-[#731515] flex items-center justify-center text-[#731515] shadow-inner">
                                        <Scan size={40} className="animate-pulse text-[#731515]" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-xl font-serif font-black text-slate-900 flex items-center justify-center gap-2">
                                        <Sparkles className="text-amber-500" size={20} />
                                        <span>AI Face Match Scanning...</span>
                                    </h3>
                                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                        Analyzing 3 Photos: Live Selfie, Aadhaar Card, & Profile Photo for 128D facial feature embedding match (Minimum 40% required).
                                    </p>
                                </div>

                                {/* Animated AI Progress Bar */}
                                <div className="space-y-3 pt-2">
                                    <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden border border-slate-200 relative p-0.5">
                                        <div className="bg-gradient-to-r from-[#731515] via-amber-500 to-[#731515] h-full rounded-full animate-pulse w-full" />
                                    </div>
                                    <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#731515]">
                                        <Loader2 size={16} className="animate-spin" />
                                        <span>Matching Face Descriptors & Verifying Similarity...</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
                        <h3 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-3">
                            <ShieldCheck className="text-[#731515]" size={28} />
                            <span>2. Identity Verification</span>
                        </h3>
                        <span className="text-xs text-white bg-[#731515] px-3.5 py-1 rounded-full font-bold uppercase tracking-wider shadow">
                            Step 2 of 4
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="border border-slate-200 p-6 rounded-2xl bg-slate-50/80 text-center space-y-4 shadow-sm">
                            <h4 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center justify-center gap-2">
                                <Camera size={18} className="text-[#731515]" />
                                <span>Live Selfie Capture</span>
                            </h4>
                            {selfie ? (
                                <div className="relative w-48 h-48 mx-auto rounded-2xl overflow-hidden border-2 border-[#731515] shadow-md group">
                                    <img src={selfie} alt="Selfie" className="w-full h-full object-cover" />
                                    {/* Visual Reticle Corner Overlay */}
                                    <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-amber-400" />
                                    <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-amber-400" />
                                    <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-amber-400" />
                                    <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-amber-400" />
                                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-[#731515] text-amber-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow">
                                        Selfie Captured
                                    </div>
                                </div>
                            ) : (
                                <Webcam
                                    audio={false}
                                    ref={webcamRef}
                                    screenshotFormat="image/jpeg"
                                    className="w-full h-48 object-cover rounded-2xl border border-slate-300 shadow-inner"
                                />
                            )}
                            <button
                                type="button"
                                onClick={selfie ? handleRetakeSelfie : capture}
                                className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-6 rounded-xl text-xs uppercase tracking-wider shadow transition-transform hover:scale-105 flex items-center justify-center gap-2 mx-auto"
                            >
                                {selfie ? (
                                    <>
                                        <RefreshCw size={14} />
                                        <span>Retake Selfie</span>
                                    </>
                                ) : (
                                    <>
                                        <Camera size={14} />
                                        <span>Capture Photo</span>
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="border border-slate-200 p-6 rounded-2xl bg-slate-50/80 text-center space-y-4 shadow-sm">
                            <h4 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center justify-center gap-2">
                                <Upload size={18} className="text-[#731515]" />
                                <span>Aadhaar Card Photo Upload</span>
                            </h4>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleAadhaarUpload}
                                className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#731515] file:text-white"
                            />
                            {aadhaarFile && <p className="text-xs text-emerald-600 font-bold flex items-center justify-center gap-1"><Check size={14} /> Aadhaar Document Uploaded</p>}
                            {uploadErrors.aadhaar && <p className="text-xs text-red-500 mt-1">{uploadErrors.aadhaar}</p>}
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-200 flex justify-between items-center">
                        <button
                            type="button"
                            onClick={() => setCurrentStep(0)}
                            className="px-6 py-3 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold uppercase tracking-wider"
                        >
                            Back
                        </button>
                        <button
                            type="button"
                            disabled={!selfie || !aadhaarFile || aiVerifying}
                            onClick={handleNext}
                            className="bg-[#731515] hover:bg-[#8E2121] text-white font-bold text-xs uppercase tracking-widest px-10 py-4 rounded-xl shadow-lg transition-transform hover:scale-[1.02] flex items-center gap-2 disabled:opacity-50"
                        >
                            {aiVerifying ? <Loader2 size={18} className="animate-spin" /> : <span>Start AI Face Match & Proceed</span>}
                            <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            )}

            {currentStep === 2 && (
                <div className="bg-white text-slate-900 p-6 sm:p-10 rounded-3xl shadow-2xl border border-slate-200/80 space-y-8 animate-fade-in">
                    <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
                        <h3 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-3">
                            <FileType className="text-[#731515]" size={28} />
                            <span>3. Pass Selection & Parking</span>
                        </h3>
                        <span className="text-xs text-white bg-[#731515] px-3.5 py-1 rounded-full font-bold uppercase tracking-wider shadow">
                            Step 3 of 4
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <button
                            type="button"
                            onClick={() => setTicketType(TicketType.MALE)}
                            className={`p-6 rounded-2xl border-2 text-center transition-all ${
                                ticketType === TicketType.MALE 
                                    ? 'border-[#731515] bg-[#731515]/5 text-[#731515] shadow-xl font-bold' 
                                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'
                            }`}
                        >
                            <div className="text-lg font-serif font-bold">Male Pass (Season Ticket)</div>
                            <div className="text-2xl mt-2 font-mono font-bold text-[#731515]">₹{prices.MALE_PASS}</div>
                            <div className="text-xs text-slate-500 mt-2">All 9 Nights Full Event Access</div>
                        </button>
                        <button
                            type="button"
                            onClick={() => setTicketType(TicketType.FEMALE)}
                            className={`p-6 rounded-2xl border-2 text-center transition-all ${
                                ticketType === TicketType.FEMALE 
                                    ? 'border-[#731515] bg-[#731515]/5 text-[#731515] shadow-xl font-bold' 
                                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'
                            }`}
                        >
                            <div className="text-lg font-serif font-bold">Female Pass (Season Ticket)</div>
                            <div className="text-2xl mt-2 font-mono font-bold text-[#731515]">₹{prices.FEMALE_PASS}</div>
                            <div className="text-xs text-slate-500 mt-2">All 9 Nights Full Event Access</div>
                        </button>
                    </div>

                    <div className="space-y-3">
                        <h4 className="font-bold text-sm text-slate-800 uppercase tracking-wider">Add Parking Slot (Optional)</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <button
                                type="button"
                                onClick={() => { setParkingType(ParkingType.NONE); setParkingCount(0); }}
                                className={`p-4 rounded-xl border text-xs font-bold uppercase transition-all ${parkingType === ParkingType.NONE ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-100 text-slate-700 border-slate-300'}`}
                            >
                                No Parking
                            </button>
                            <button
                                type="button"
                                onClick={() => { setParkingType(ParkingType.TWO_WHEELER); setParkingCount(1); }}
                                className={`p-4 rounded-xl border text-xs font-bold uppercase transition-all ${parkingType === ParkingType.TWO_WHEELER ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-100 text-slate-700 border-slate-300'}`}
                            >
                                2-Wheeler (+₹{prices.TWO_WHEELER})
                            </button>
                            <button
                                type="button"
                                onClick={() => { setParkingType(ParkingType.FOUR_WHEELER); setParkingCount(1); }}
                                className={`p-4 rounded-xl border text-xs font-bold uppercase transition-all ${parkingType === ParkingType.FOUR_WHEELER ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-100 text-slate-700 border-slate-300'}`}
                            >
                                4-Wheeler (+₹{prices.FOUR_WHEELER})
                            </button>
                        </div>
                    </div>

                    <div className="p-6 bg-[#731515]/10 rounded-2xl border-2 border-[#731515]/30 flex justify-between items-center shadow-md">
                        <span className="font-bold text-slate-900 text-base">Total Payable Amount:</span>
                        <span className="text-3xl font-black text-[#731515] font-mono">₹{calculateTotal()}</span>
                    </div>

                    <div className="pt-6 border-t border-slate-200 flex justify-between items-center">
                        <button
                            type="button"
                            onClick={() => setCurrentStep(1)}
                            className="px-6 py-3 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold uppercase tracking-wider"
                        >
                            Back
                        </button>
                        <button
                            type="button"
                            onClick={handleNext}
                            className="bg-[#731515] hover:bg-[#8E2121] text-white font-bold text-xs uppercase tracking-widest px-10 py-4 rounded-xl shadow-lg transition-transform hover:scale-[1.02] flex items-center gap-2"
                        >
                            <span>Proceed to Payment</span>
                            <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            )}

            {currentStep === 3 && (
                <div className="bg-white text-slate-900 p-6 sm:p-10 rounded-3xl shadow-2xl border border-slate-200/80 space-y-8 animate-fade-in">
                    <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
                        <h3 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-3">
                            <CreditCard className="text-[#731515]" size={28} />
                            <span>4. Payment & Pass Generation</span>
                        </h3>
                        <span className="text-xs text-white bg-[#731515] px-3.5 py-1 rounded-full font-bold uppercase tracking-wider shadow">
                            Step 4 of 4
                        </span>
                    </div>

                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-300 space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                            <span className="font-semibold text-slate-700">Final Pass Amount:</span>
                            <span className="text-3xl font-black text-[#731515] font-mono">₹{calculateTotal()}</span>
                        </div>
                        <div className="text-xs text-slate-600 leading-relaxed">
                            * Payment is secured via Razorpay encrypted checkout. Once paid, your digital pass will be activated instantly.
                        </div>
                    </div>

                    <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <input
                            type="checkbox"
                            id="terms"
                            checked={agreedToTerms}
                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                            className="w-5 h-5 text-[#731515] rounded focus:ring-[#731515] cursor-pointer"
                        />
                        <label htmlFor="terms" className="text-xs text-slate-700 cursor-pointer">
                            I agree to the <button type="button" onClick={() => setShowTermsModal(true)} className="text-[#731515] font-bold underline">Terms & Conditions</button> and SVAR Garba rules.
                        </label>
                    </div>

                    <div className="pt-6 border-t border-slate-200 flex justify-between items-center">
                        <button
                            type="button"
                            onClick={() => setCurrentStep(2)}
                            className="px-6 py-3 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold uppercase tracking-wider"
                        >
                            Back
                        </button>
                        <button
                            type="button"
                            disabled={!agreedToTerms || paymentProcessing}
                            onClick={handlePayment}
                            className="bg-[#731515] hover:bg-[#8E2121] text-white font-bold text-xs uppercase tracking-widest px-10 py-4 rounded-xl shadow-lg transition-transform hover:scale-[1.02] flex items-center gap-2 disabled:opacity-50"
                        >
                            {paymentProcessing ? <Loader2 size={18} className="animate-spin" /> : <span>Pay ₹{calculateTotal()} Now</span>}
                        </button>
                    </div>
                </div>
            )}

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
        </div>
    );
};