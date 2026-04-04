import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MASTER_KEY, User, Booking, SystemSettings, DEFAULT_PRICES, AuditLog, RegistrationStatus, Task, TaskStatus, SurnameEntry } from '../types';
import { mockDb } from '../services/mockDb';
import { CheckCircle, XCircle, Lock, Shield, IndianRupee, Users, Ticket, AlertTriangle, Mic, Volume2, Car, Ban, Radio, Phone, FileText, ExternalLink, TrendingUp, Clock, Settings, Save, Calendar, ToggleRight, ToggleLeft, Search, Download, Loader2, RefreshCw, Filter, FileDown, ScanLine, History, Camera, Eye, MoreVertical, Wifi, CreditCard, ChevronDown, Mail, X, Trash2, ListTodo, Plus, CheckSquare } from 'lucide-react';
import { Logo } from '../components/Logo';
import { QRCodeCanvas } from 'qrcode.react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import Webcam from 'react-webcam';
import jsQR from 'jsqr';

const Admin: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [keyInput, setKeyInput] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [settings, setSettings] = useState<SystemSettings | null>(null);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

    // Real-time user simulation
    const [activeUsers, setActiveUsers] = useState(0);

    // Update real stats instead of fake random numbers
    useEffect(() => {
        const calculateActiveUsers = () => {
             const base = users.length;
             const activeBookings = bookings.filter(b => b.status === 'CONFIRMED').length;
             // Calculate a realistic metric
             setActiveUsers(base > 0 ? base + Math.floor(activeBookings / 2) : 0);
        };
        calculateActiveUsers();
    }, [users, bookings]);

    // Tabs
    const [activeTab, setActiveTab] = useState<'dashboard' | 'registrations' | 'scanner' | 'audit' | 'settings' | 'payments' | 'verification' | 'analytics' | 'reports' | 'content' | 'feedback' | 'inquiries' | 'tasks' | 'surnames'>('dashboard');

    // Tasks State
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isCreatingTask, setIsCreatingTask] = useState(false);
    const [newTaskData, setNewTaskData] = useState({
        title: '',
        description: '',
        assignedTo: '',
        priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH',
        dueDate: ''
    });

    // Registration Management
    const [passSearch, setPassSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [verificationFilter, setVerificationFilter] = useState<string>('ALL'); // Added Verification Filter
    const [generatingPassId, setGeneratingPassId] = useState<string | null>(null);
    const [selectedPassUser, setSelectedPassUser] = useState<{ user: User, booking: Booking } | null>(null);
    const [viewUser, setViewUser] = useState<User | null>(null);
    const [previewPassData, setPreviewPassData] = useState<{ user: User, booking: Booking } | null>(null);
    const adminPassRef = useRef<HTMLDivElement>(null);

    // Smart Analytics
    const [analytics, setAnalytics] = useState<{ predictedFootfall: number, peakTime: string } | null>(null);

    // Announcement State
    const [announcement, setAnnouncement] = useState('');
    const [isBroadcasting, setIsBroadcasting] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [confirmModal, setConfirmModal] = useState<{
        show: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({ show: false, title: '', message: '', onConfirm: () => { } });
    const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

    // Edit Settings State
    const [editPrices, setEditPrices] = useState(DEFAULT_PRICES);
    const [editRegistrationOpen, setEditRegistrationOpen] = useState(true);
    const [editStartDate, setEditStartDate] = useState('');
    const [editEndDate, setEditEndDate] = useState('');
    const [editPassDownloadEnabled, setEditPassDownloadEnabled] = useState(false);
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    // Scanner State
    const webcamRef = useRef<Webcam>(null);
    const scannerCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const [scannedResult, setScannedResult] = useState<{ id: string, valid: boolean, user?: User, booking?: Booking } | null>(null);
    const [isScanning, setIsScanning] = useState(true);
    const [scanFlash, setScanFlash] = useState<string | null>(null);

    // Audit Log Filters
    const [auditFilterAction, setAuditFilterAction] = useState<string>('ALL');
    const [auditFilterAdmin, setAuditFilterAdmin] = useState<string>('');

    // Feedback & Inquiries
    const [feedbacks, setFeedbacks] = useState<any[]>([]);
    const [inquiries, setInquiries] = useState<any[]>([]);

    // Surname Management
    const [surnamesList, setSurnamesList] = useState<SurnameEntry[]>([]);
    const [newSurname, setNewSurname] = useState('');
    const [isAddingSurname, setIsAddingSurname] = useState(false);

    const handleDeleteUser = async (userId: string) => {
        console.log(`[Admin] Attempting to delete user: ${userId}`);
        setConfirmModal({
            show: true,
            title: "Delete User",
            message: "Are you sure you want to delete this user? This will also remove their bookings and cannot be undone.",
            onConfirm: async () => {
                try {
                    // 1. Delete from local mock DB
                    await mockDb.deleteUser(userId);

                    // 2. Delete from server-side verifications
                    try {
                        await fetch('/api/admin/delete-verification', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ userId })
                        });
                    } catch (serverErr) {
                        console.warn("[Admin] Server-side verification deletion failed", serverErr);
                    }

                    // 3. Refresh UI
                    await fetchData();
                    await fetchVerifications();

                    setSuccessMessage("User deleted successfully.");
                    setTimeout(() => setSuccessMessage(null), 3000);
                } catch (e) {
                    console.error("[Admin] Failed to delete user", e);
                    setErrorMessage("Failed to delete user.");
                    setTimeout(() => setErrorMessage(null), 3000);
                } finally {
                    setConfirmModal(prev => ({ ...prev, show: false }));
                }
            }
        });
    };

    const handleAddSurname = async () => {
        if (!newSurname.trim()) return;
        setIsAddingSurname(true);
        try {
            await mockDb.addSurname(newSurname, 'ADMIN');
            setSuccessMessage(`Surname "${newSurname}" added to whitelist. Matching pending users have been auto-approved.`);
            setTimeout(() => setSuccessMessage(null), 4000);
            setNewSurname('');
            await fetchData();
        } catch (e) {
            console.error(e);
            setErrorMessage("Failed to add surname.");
            setTimeout(() => setErrorMessage(null), 3000);
        } finally {
            setIsAddingSurname(false);
        }
    };

    // Load Voices & Cleanup
    useEffect(() => {
        // Feature detection for SpeechSynthesis
        if (!('speechSynthesis' in window)) return;

        const loadVoices = () => {
            const available = window.speechSynthesis.getVoices();
            setVoices(available);
        };
        loadVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }

        return () => {
            window.speechSynthesis.cancel();
        };
    }, []);

    // Real-time data polling: refresh admin data every 8 seconds so any booking/payment/registration shows up instantly
    useEffect(() => {
        if (!isAuthenticated) return;

        // Initial load
        fetchData();

        const interval = setInterval(() => {
            fetchData();
        }, 8000); // Poll every 8 seconds

        return () => clearInterval(interval);
    }, [isAuthenticated]);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (keyInput === MASTER_KEY) {
            setIsAuthenticated(true);
            fetchData();
            mockDb.logAction("LOGIN", "Admin logged in");
        } else {
            setErrorMessage("Invalid Master Key");
            setTimeout(() => setErrorMessage(null), 3000);
        }
    };

    // Verification Queue State
    const [verifications, setVerifications] = useState<any[]>([]);
    const [isLoadingVerifications, setIsLoadingVerifications] = useState(false);

    const fetchVerifications = async () => {
        setIsLoadingVerifications(true);
        try {
            const response = await fetch('/api/admin/verifications');
            const data = await response.json();
            setVerifications(data);
        } catch (e) {
            console.error("Failed to fetch verifications", e);
        } finally {
            setIsLoadingVerifications(false);
        }
    };

    const handleVerificationAction = async (id: number, status: 'approved' | 'rejected') => {
        try {
            const verification = verifications.find(v => v.id === id);
            const response = await fetch('/api/admin/verify-action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status })
            });
            if (response.ok) {
                if (verification && verification.user_id) {
                    await mockDb.updateUserVerification(verification.user_id, status === 'approved');
                }
                fetchVerifications();
                fetchData(); // Refresh main data too
            }
        } catch (e) {
            console.error("Failed to update verification status", e);
        }
    };

    const fetchTasks = async () => {
        try {
            const response = await fetch('/api/admin/tasks');
            const data = await response.json();
            setTasks(data);
        } catch (e) {
            console.error("Failed to fetch tasks", e);
        }
    };

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        const task: Task = {
            id: `TASK-${Date.now()}`,
            ...newTaskData,
            status: TaskStatus.PENDING,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        try {
            const response = await fetch('/api/admin/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(task)
            });
            if (response.ok) {
                setIsCreatingTask(false);
                setNewTaskData({ title: '', description: '', assignedTo: '', priority: 'MEDIUM', dueDate: '' });
                fetchTasks();
                mockDb.logAction("TASK_CREATE", `Created task: ${task.title}`);
            }
        } catch (e) {
            console.error("Failed to create task", e);
        }
    };

    const handleUpdateTaskStatus = async (id: string, status: TaskStatus) => {
        try {
            const response = await fetch('/api/admin/tasks/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status })
            });
            if (response.ok) {
                fetchTasks();
                mockDb.logAction("TASK_UPDATE", `Updated task ${id} to ${status}`);
            }
        } catch (e) {
            console.error("Failed to update task", e);
        }
    };

    const handleDeleteTask = async (id: string) => {
        setConfirmModal({
            show: true,
            title: "Delete Task",
            message: "Are you sure you want to delete this task?",
            onConfirm: async () => {
                try {
                    const response = await fetch('/api/admin/tasks/delete', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id })
                    });
                    if (response.ok) {
                        fetchTasks();
                        mockDb.logAction("TASK_DELETE", `Deleted task ${id}`);
                        setSuccessMessage("Task deleted successfully");
                        setTimeout(() => setSuccessMessage(null), 3000);
                    }
                } catch (e) {
                    setErrorMessage("Failed to delete task");
                    setTimeout(() => setErrorMessage(null), 3000);
                } finally {
                    setConfirmModal(prev => ({ ...prev, show: false }));
                }
            }
        });
    };

    const fetchData = async () => {
        const [u, b, s, a, logs, f, i, sList] = await Promise.all([
            mockDb.getUsers(),
            mockDb.getBookings(),
            mockDb.getSettings(),
            mockDb.getSmartAnalytics(),
            mockDb.getAuditLogs(),
            mockDb.getFeedbacks(),
            mockDb.getInquiries(),
            mockDb.getSurnames()
        ]);
        setUsers(u);
        setBookings(b);
        setSettings(s);
        setAnalytics(a);
        setAuditLogs(logs);
        setFeedbacks(f);
        setInquiries(i);
        setSurnamesList(sList);
        fetchTasks();
        fetchVerifications();

        if (s) {
            setEditPrices(s.prices);
            setEditRegistrationOpen(s.registrationOpen);
            setEditStartDate(s.eventStartDate);
            setEditEndDate(s.eventEndDate);
            setEditPassDownloadEnabled(s.passDownloadEnabled || false);
        }
    };

    const fetchServerSettings = async () => {
        try {
            const response = await fetch('/api/admin/settings');
            const data = await response.json();
            if (data) {
                setEditPassDownloadEnabled(data.pass_download_enabled === 1);
            }
        } catch (e) {
            console.error("Failed to fetch server settings", e);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchServerSettings();
        }
    }, [isAuthenticated]);

    // Audio Feedback for Scanner
    const playScanSound = (success: boolean) => {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;

        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        if (success) {
            // Success: High pitch beep sequence
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
            osc.start();
            osc.stop(ctx.currentTime + 0.15);
        } else {
            // Failure: Low pitch buzz
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.3);
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
            osc.start();
            osc.stop(ctx.currentTime + 0.3);
        }
    };

    // Optimized Scanner Loop
    useEffect(() => {
        if (activeTab !== 'scanner' || !isScanning) return;

        // Reuse canvas or create once
        if (!scannerCanvasRef.current) {
            scannerCanvasRef.current = document.createElement("canvas");
        }

        const interval = setInterval(() => {
            if (!isScanning) {
                clearInterval(interval);
                return;
            }

            if (webcamRef.current && webcamRef.current.video && scannerCanvasRef.current) {
                const video = webcamRef.current.video;
                // Strict check to ensure video is ready
                if (video.readyState === 4) {
                    const canvas = scannerCanvasRef.current;

                    // Only resize if dimensions changed to avoid memory thrashing
                    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
                        canvas.width = video.videoWidth;
                        canvas.height = video.videoHeight;
                    }

                    const ctx = canvas.getContext("2d", { willReadFrequently: true });
                    if (ctx) {
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                        try {
                            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                            const code = jsQR(imageData.data, imageData.width, imageData.height);

                            if (code) {
                                handleScan(code.data);
                            }
                        } catch (e) {
                            // Ignore sporadic frame read errors
                        }
                    }
                }
            }
        }, 500);

        return () => clearInterval(interval);
    }, [activeTab, isScanning, bookings, users]);

    const handleScan = (data: string) => {
        if (!data) return;

        try {
            let bookingId: string | null = null;

            // Robust parsing: Try JSON first, fallback to string if it looks like an ID
            try {
                const parsed = JSON.parse(data);
                bookingId = parsed.passId || parsed.id;
            } catch (e) {
                // Not JSON, check if it matches ID pattern
                if (data.includes('SVAR-PASS-')) {
                    bookingId = data;
                }
            }

            if (bookingId) {
                const booking = bookings.find(b => b.id === bookingId);

                if (booking) {
                    const user = users.find(u => u.id === booking.userId);

                    if (user) {
                        // Perform strict validation
                        const isValid = booking.status === 'CONFIRMED' && user.verified;

                        setScannedResult({
                            id: bookingId,
                            valid: isValid,
                            user,
                            booking
                        });
                        setIsScanning(false);
                        playScanSound(isValid);

                        // Trigger visual feedback
                        setScanFlash(isValid ? 'bg-green-100/50' : 'bg-red-100/50');
                        setTimeout(() => setScanFlash(null), 2000);

                        let logMsg = `Scanned ${bookingId} - ${isValid ? 'APPROVED' : 'DENIED'}`;
                        if (!isValid) {
                            if (booking.status !== 'CONFIRMED') logMsg += ` (Status: ${booking.status})`;
                            if (!user.verified) logMsg += ` (User Not Verified)`;
                        }
                        mockDb.logAction("SCAN_ENTRY", logMsg);
                    } else {
                        // Booking exists but User missing (Data Integrity Issue)
                        setScannedResult({ id: bookingId, valid: false });
                        setIsScanning(false);
                        playScanSound(false);
                        setScanFlash('bg-red-100/50');
                        setTimeout(() => setScanFlash(null), 2000);
                        mockDb.logAction("SCAN_ENTRY", `Scanned ${bookingId}: DENIED (User Data Missing)`);
                    }
                } else {
                    // Booking ID not found in system
                    setScannedResult({ id: bookingId, valid: false });
                    setIsScanning(false);
                    playScanSound(false);
                    setScanFlash('bg-red-100/50');
                    setTimeout(() => setScanFlash(null), 2000);
                    mockDb.logAction("SCAN_ENTRY", `Scanned ${bookingId}: DENIED (Invalid Pass ID)`);
                }
            }
        } catch (e) {
            console.error("Scanner Error", e);
        }
    };

    const resetScanner = () => {
        setScannedResult(null);
        setIsScanning(true);
        setScanFlash(null);
    };

    const saveSystemSettings = async () => {
        if (!settings) return;
        setIsSavingSettings(true);

        const changes: string[] = [];
        if (editRegistrationOpen !== settings.registrationOpen) changes.push(`Registration: ${editRegistrationOpen ? 'OPEN' : 'CLOSED'}`);
        if (editStartDate !== settings.eventStartDate) changes.push(`Start Date: ${editStartDate}`);
        if (editEndDate !== settings.eventEndDate) changes.push(`End Date: ${editEndDate}`);

        // Price changes
        if (editPrices.MALE_PASS !== settings.prices.MALE_PASS) changes.push(`Male Pass: ${settings.prices.MALE_PASS}->${editPrices.MALE_PASS}`);
        if (editPrices.FEMALE_PASS !== settings.prices.FEMALE_PASS) changes.push(`Female Pass: ${settings.prices.FEMALE_PASS}->${editPrices.FEMALE_PASS}`);
        if (editPrices.TWO_WHEELER !== settings.prices.TWO_WHEELER) changes.push(`2W Parking: ${settings.prices.TWO_WHEELER}->${editPrices.TWO_WHEELER}`);
        if (editPrices.FOUR_WHEELER !== settings.prices.FOUR_WHEELER) changes.push(`4W Parking: ${settings.prices.FOUR_WHEELER}->${editPrices.FOUR_WHEELER}`);

        await mockDb.updateSettings({
            prices: editPrices,
            registrationOpen: editRegistrationOpen,
            eventStartDate: editStartDate,
            eventEndDate: editEndDate,
            passDownloadEnabled: editPassDownloadEnabled
        });

        // Update server-side settings
        try {
            await fetch('/api/admin/settings/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pass_download_enabled: editPassDownloadEnabled ? 1 : 0 })
            });
        } catch (serverErr) {
            console.warn("[Admin] Server-side settings update failed", serverErr);
        }

        if (changes.length > 0) {
            await mockDb.logAction("SETTINGS_UPDATE", `Updated: ${changes.join(', ')}`);
        }

        setIsSavingSettings(false);
        setSuccessMessage("Event Settings Updated Successfully");
        setTimeout(() => setSuccessMessage(null), 3000);
        fetchData();
    };

    const speakText = (text: string) => {
        if (!('speechSynthesis' in window)) {
            return;
        }
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const preferredVoice = voices.find(v => v.name.includes('Google US English')) || voices.find(v => v.lang === 'en-US');
        if (preferredVoice) utterance.voice = preferredVoice;
        speechRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    };

    const handleBroadcast = async () => {
        if (!announcement) return;

        // 1. Speak the announcement (Ground PA System)
        speakText(announcement);
        setIsBroadcasting(true);

        // 2. Send Announcement Emails to ALL users
        try {
            const allUsers = await mockDb.getUsers();
            const usersWithEmail = allUsers.filter(u => u.email);

            // Send in batches or just trigger them
            for (const user of usersWithEmail) {
                await mockDb.sendEmail(
                    user.email!,
                    "SVAR 2026 - Important Announcement",
                    `Important Announcement from SVAR Team:\n\n${announcement}\n\nRegards,\nSVAR Team`,
                    `
                  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
                      <div style="background: #731515; color: white; padding: 20px; text-align: center;">
                          <h2 style="margin: 0;">SVAR 2026 ANNOUNCEMENT</h2>
                      </div>
                      <div style="padding: 30px; line-height: 1.6;">
                          <p>Hello,</p>
                          <p>We have an important update regarding the event:</p>
                          <div style="background: #fff5f5; border-left: 4px solid #731515; padding: 15px; margin: 20px 0; font-style: italic;">
                              "${announcement}"
                          </div>
                          <p>Please stay tuned for more updates.</p>
                          <br/>
                          <p>Regards,<br/><strong>SVAR Organizing Committee</strong></p>
                      </div>
                  </div>
                  `
                );
            }
        } catch (err) {
            console.error("Failed to send broadcast emails", err);
        }

        // 3. Update Global Settings for Website Display
        await mockDb.updateSettings({
            lastAnnouncement: announcement,
            lastAnnouncementTime: new Date().toISOString()
        });

        await fetchData();
        mockDb.logAction("BROADCAST", `Announcement: ${announcement}`);

        setTimeout(() => {
            setIsBroadcasting(false);
            setAnnouncement('');
        }, 5000);
    };

    const handleClearAnnouncement = async () => {
        await mockDb.updateSettings({
            lastAnnouncement: '',
            lastAnnouncementTime: ''
        });
        await fetchData();
        mockDb.logAction("CLEAR_BROADCAST", "Cleared global announcement");
    };

    const toggleParking = async () => {
        if (!settings) return;
        const newStatus = !settings.parkingFull;
        const msg = newStatus
            ? "Attention please. Parking is now Full. Please use alternative parking areas."
            : "Attention please. Parking is now Open for all vehicles.";

        speakText(msg);

        // Update both parking status and global announcement
        await mockDb.updateSettings({
            parkingFull: newStatus,
            lastAnnouncement: msg,
            lastAnnouncementTime: new Date().toISOString()
        });

        // Send Parking Status Email to ALL users
        try {
            const allUsers = await mockDb.getUsers();
            const usersWithEmail = allUsers.filter(u => u.email);
            const subject = newStatus ? "SVAR 2026 - Parking Full" : "SVAR 2026 - Parking Now Open";
            for (const user of usersWithEmail) {
                await mockDb.sendEmail(
                    user.email!,
                    subject,
                    `Dear ${user.fullName},\n\n${msg}\n\nRegards,\nSVAR Organizing Committee`,
                    `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
                      <div style="background: #731515; color: white; padding: 20px; text-align: center;">
                          <h2 style="margin: 0;">SVAR 2026 - ${newStatus ? '🅿️ Parking Full' : '🅿️ Parking Open'}</h2>
                      </div>
                      <div style="padding: 30px; line-height: 1.6;">
                          <p>Dear <strong>${user.fullName}</strong>,</p>
                          <div style="background: ${newStatus ? '#fff5f5' : '#f0fdf4'}; border-left: 4px solid ${newStatus ? '#731515' : '#16a34a'}; padding: 15px; margin: 20px 0; font-size: 16px; font-weight: bold;">
                              ${msg}
                          </div>
                          <p>Please plan your visit accordingly.</p>
                          <br/>
                          <p>Regards,<br/><strong>SVAR Organizing Committee</strong></p>
                      </div>
                    </div>`
                );
            }
        } catch (err) {
            console.error("Failed to send parking emails", err);
        }

        await fetchData();
        mockDb.logAction("PARKING_TOGGLE", `Parking ${newStatus ? 'FULL' : 'OPEN'}`);
    };

    const toggleUserVerification = async (userId: string, currentStatus: boolean) => {
        setConfirmModal({
            show: true,
            title: "Verify User",
            message: `Are you sure you want to ${currentStatus ? 'revoke' : 'grant'} verification for this user?`,
            onConfirm: async () => {
                await mockDb.updateUserVerification(userId, !currentStatus);
                await fetchData();
                setSuccessMessage(`User verification ${currentStatus ? 'revoked' : 'granted'} successfully`);
                setTimeout(() => setSuccessMessage(null), 3000);
                setConfirmModal(prev => ({ ...prev, show: false }));
            }
        });
    };

    const handleExportCSV = () => {
        const headers = ['User ID', 'Full Name', 'Phone', 'Aadhaar', 'Verified', 'Created At', 'Booking ID', 'Status', 'Ticket Type', 'Parking', 'Amount', 'Payment ID'];
        const rows = filteredUsers.map(user => {
            const booking = getBookingForUser(user.id);
            return [
                user.id, `"${user.fullName}"`, user.phone, `'${user.aadhaar}`, user.verified ? 'Yes' : 'No',
                user.createdAt, booking?.id || 'N/A', booking?.status || 'NO_BOOKING', booking?.ticketType || '-',
                booking?.parkingType || '-', booking ? booking.totalAmount : 0, booking?.paymentId || '-'
            ].join(',');
        });
        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `SVAR_Registrations_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        mockDb.logAction("EXPORT_CSV", "Downloaded registration CSV");
    };

    const handleExportBookingsCSV = () => {
        const headers = ["Booking ID", "User Name", "Phone", "Ticket Type", "Parking", "Amount", "Status", "Date"];
        const rows = bookings.map(b => {
            const user = users.find(u => u.id === b.userId);
            return [
                b.id,
                user?.fullName || 'Unknown',
                user?.phone || 'N/A',
                b.ticketType,
                b.parkingType,
                b.totalAmount,
                b.status,
                new Date(b.timestamp).toLocaleDateString()
            ];
        });

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `SVAR_Booking_Report_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleUpdateBookingStatus = async (bookingId: string, newStatus: string) => {
        if (newStatus === 'CONFIRMED' || newStatus === 'PENDING' || newStatus === 'REJECTED') {
            setConfirmModal({
                show: true,
                title: "Update Booking Status",
                message: `Are you sure you want to change the booking status to ${newStatus}?`,
                onConfirm: async () => {
                    await mockDb.updateBookingStatus(bookingId, newStatus as any);
                    await fetchData();
                    setSuccessMessage(`Booking status updated to ${newStatus}`);
                    setTimeout(() => setSuccessMessage(null), 3000);
                    setConfirmModal(prev => ({ ...prev, show: false }));
                }
            });
        }
    };

    const getBookingForUser = (userId: string) => bookings.find(b => b.userId === userId);
    const getUserForBooking = (userId: string) => users.find(u => u.id === userId);

    const totalRevenue = bookings.filter(b => b.status === 'CONFIRMED').reduce((acc, curr) => acc + curr.totalAmount, 0);
    const verifiedUsers = users.filter(u => u.verified).length;
    const pendingUsers = users.filter(u => !u.verified).length;


    const filteredUsers = users.filter(u => {
        const searchLower = passSearch.toLowerCase();
        const cleanSearch = passSearch.replace(/\s/g, '');
        const matchesSearch =
            u.fullName?.toLowerCase().includes(searchLower) ||
            u.id?.toLowerCase().includes(searchLower) ||
            u.phone?.includes(searchLower) ||
            u.aadhaar?.includes(cleanSearch) ||
            u.aadhaar?.toLowerCase().includes(searchLower) || false; // added ?. and fallback

        const booking = getBookingForUser(u.id);
        let matchesStatus = true;
        if (statusFilter !== 'ALL') {
            if (statusFilter === 'NO_BOOKING') {
                matchesStatus = !booking;
            } else {
                matchesStatus = booking?.status === statusFilter;
            }
        }

        let matchesVerification = true;
        if (verificationFilter !== 'ALL') {
            if (verificationFilter === 'SURNAME_REVIEW') {
                matchesVerification = u.registrationStatus === 'SURNAME_REVIEW';
            } else if (verificationFilter === 'APPROVED') {
                matchesVerification = u.registrationStatus === 'APPROVED' || u.registrationStatus === 'PENDING_APPROVAL';
            } else if (verificationFilter === 'VERIFIED') {
                matchesVerification = u.verified;
            } else if (verificationFilter === 'PENDING') {
                matchesVerification = !u.verified;
            }
        }

        return matchesSearch && matchesStatus && matchesVerification;
    });

    // Sort payments by timestamp descending (newest first)
    const successfulPayments = bookings
        .filter(b => b.paymentId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const handleExportPaymentsCSV = () => {
        const headers = ['Payment ID', 'Booking ID', 'User Name', 'User ID', 'Amount', 'Date', 'Status'];
        const rows = successfulPayments.map(payment => {
            const user = getUserForBooking(payment.userId);
            return [
                payment.paymentId,
                payment.id,
                `"${user?.fullName || 'Unknown'}"`,
                payment.userId,
                payment.totalAmount,
                new Date(payment.timestamp).toLocaleString(),
                'SUCCESS'
            ].join(',');
        });
        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `SVAR_Payments_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        mockDb.logAction("EXPORT_PAYMENTS", "Downloaded payments CSV");
    };

    const filteredAuditLogs = auditLogs.filter(log => {
        const matchesAction = auditFilterAction === 'ALL' || log.action === auditFilterAction;
        const matchesAdmin = auditFilterAdmin === '' || log.adminId?.toLowerCase().includes(auditFilterAdmin.toLowerCase());
        return matchesAction && matchesAdmin;
    });

    const uniqueActions = ['ALL', ...new Set(auditLogs.map(log => log.action))];

    const handleRegeneratePass = async (user: User, booking: Booking) => {
        setGeneratingPassId(user.id);
        setSelectedPassUser({ user, booking });

        // Allow DOM update for ghost canvas
        setTimeout(async () => {
            if (!adminPassRef.current) return;
            try {
                const canvas = await html2canvas(adminPassRef.current, {
                    scale: 2, // Retain 2x scale for quality source
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: "#FFFFFF", // Use pure white for clean JPEG compression
                    logging: false,
                    width: 800,
                    height: 1200
                });

                // Optimization: Use JPEG 0.70 for balanced size and QR clarity
                // At 2x scale (1600x2400), 0.70 quality provides a small file size (~300KB)
                // without compromising the readability of the QR code.
                const imgData = canvas.toDataURL('image/jpeg', 0.70);

                // Use compress: true in jsPDF for internal stream compression
                const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', compress: true });
                const pageWidth = pdf.internal.pageSize.getWidth();
                const printWidth = 90;
                const printHeight = (1200 / 800) * printWidth;
                const x = (pageWidth - printWidth) / 2;
                const y = 20;

                pdf.setDrawColor(180, 180, 180);
                pdf.setLineWidth(0.5);
                pdf.setLineDashPattern([3, 3], 0);
                pdf.rect(x - 2, y - 2, printWidth + 4, printHeight + 4);
                pdf.setLineDashPattern([], 0);
                pdf.addImage(imgData, 'JPEG', x, y, printWidth, printHeight);
                pdf.setFontSize(10);
                pdf.text("ADMIN GENERATED COPY", pageWidth / 2, y + printHeight + 10, { align: "center" });

                pdf.save(`ADMIN_COPY_${user.id}.pdf`);
                mockDb.logAction("GENERATE_PASS", `Generated pass for user ${user.id}`);
            } catch (e) {
                console.error(e);
                setErrorMessage("Failed to regenerate pass. Please try again on a desktop device.");
                setTimeout(() => setErrorMessage(null), 4000);
            } finally {
                setGeneratingPassId(null);
                setSelectedPassUser(null);
            }
        }, 1500);
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center px-4">
                <div className="bg-white border border-viren-200 p-8 max-w-md w-full text-center shadow-2xl animate-liquid-up rounded-lg">
                    <div className="w-16 h-16 bg-viren-50 flex items-center justify-center mx-auto mb-6 text-viren-950 border border-viren-200 rounded-full">
                        <Lock size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-viren-950 mb-6 font-serif">SVAR Admin Core</h2>
                    <form onSubmit={handleLogin}>
                        <input
                            type="password"
                            value={keyInput}
                            onChange={(e) => setKeyInput(e.target.value)}
                            placeholder="Enter Master Key"
                            className="w-full bg-viren-50 border border-viren-200 p-3 text-viren-950 mb-4 focus:border-viren-red outline-none transition-colors rounded-md"
                        />
                        <button type="submit" className="btn-viren-filled w-full py-3">
                            Access Portal
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="py-12 px-4 max-w-7xl mx-auto relative">

            {/* 
        ================================================================
        PIXEL PERFECT PASS GENERATION CANVAS (Hidden)
        Fixed 800x1200px Canvas using Absolute Positioning
        ================================================================
      */}
            {selectedPassUser && (
                <div style={{ position: 'absolute', left: '-9999px', top: 0, zIndex: -1 }}>
                    <div
                        ref={adminPassRef}
                        style={{
                            width: '800px',
                            height: '1200px',
                            backgroundColor: '#FFFFFF',
                            position: 'relative',
                            overflow: 'hidden',
                            fontFamily: "'Inter', sans-serif",
                            color: '#1E293B'
                        }}
                    >
                        {/* Header Block */}
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '800px', height: '380px', backgroundColor: '#20324C' }}></div>

                        {/* Decorative Elements */}
                        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '300px', height: '300px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)' }}></div>
                        <div style={{ position: 'absolute', top: '50px', left: '-50px', width: '200px', height: '200px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.05)' }}></div>

                        {/* Event Title */}
                        <div style={{ position: 'absolute', top: '60px', left: '0', width: '800px', textAlign: 'center' }}>
                            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '64px', fontWeight: 'bold', color: '#FFFFFF', margin: 0, letterSpacing: '2px' }}>SVAR 2026</h1>
                            <p style={{ fontSize: '20px', color: '#94A3B8', letterSpacing: '6px', textTransform: 'uppercase', marginTop: '10px' }}>Shri Vishwakarma Arvachin Rasotsav</p>
                        </div>

                        {/* Profile Photo - Centered (800/2 - 250/2 = 275) */}
                        <div style={{
                            position: 'absolute',
                            top: '200px',
                            left: '275px',
                            width: '250px',
                            height: '250px',
                            backgroundColor: '#FFFFFF',
                            borderRadius: '50%',
                            border: '8px solid #FFFFFF',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                            overflow: 'hidden'
                        }}>
                            <img
                                src={selectedPassUser.user.profilePhotoUrl || selectedPassUser.user.selfieUrl}
                                crossOrigin="anonymous"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        </div>

                        {/* User Name & Phone */}
                        <div style={{ position: 'absolute', top: '480px', left: '0', width: '800px', textAlign: 'center' }}>
                            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '48px', fontWeight: 'bold', color: '#0F172A', margin: 0, textTransform: 'uppercase' }}>{selectedPassUser.user.fullName}</h2>
                            {/* Fixed Phone Positioning */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '10px' }}>
                                <span style={{ fontSize: '28px', color: '#64748B', fontWeight: '500', fontFamily: 'monospace' }}>+91 {selectedPassUser.user.phone}</span>
                            </div>
                        </div>

                        {/* Details Grid - Centered (800/2 - 600/2 = 100) */}
                        <div style={{
                            position: 'absolute',
                            top: '600px',
                            left: '100px',
                            width: '600px',
                            height: '140px',
                            borderTop: '2px solid #E2E8F0',
                            borderBottom: '2px solid #E2E8F0',
                            display: 'flex'
                        }}>
                            <div style={{ width: '300px', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRight: '2px solid #E2E8F0' }}>
                                <span style={{ fontSize: '18px', textTransform: 'uppercase', color: '#64748B', fontWeight: 'bold' }}>Booking ID</span>
                                <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#20324C', marginTop: '5px', fontFamily: 'monospace' }}>{selectedPassUser.booking.id.split('-').pop()}</span>
                            </div>
                            <div style={{ width: '300px', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontSize: '18px', textTransform: 'uppercase', color: '#64748B', fontWeight: 'bold' }}>Pass Type</span>
                                <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#731515', marginTop: '5px' }}>{selectedPassUser.booking.ticketType}</span>
                            </div>
                        </div>

                        {/* QR Code */}
                        <div style={{ position: 'absolute', top: '780px', left: '0', width: '800px', textAlign: 'center' }}>
                            <div style={{ display: 'inline-block', padding: '20px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px' }}>
                                <QRCodeCanvas
                                    value={JSON.stringify({ passId: selectedPassUser.booking.id, uid: selectedPassUser.user.id })}
                                    size={220}
                                    fgColor="#000000"
                                    level="Q"
                                />
                            </div>
                        </div>

                        {/* Footer with Venue Details - Absolutely Positioned */}
                        <div style={{ position: 'absolute', bottom: '0', left: '0', width: '800px', height: '120px', backgroundColor: '#20324C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ textAlign: 'center', color: 'white', padding: '0 40px' }}>
                                <p style={{ fontSize: '24px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>PD Malaviya College Ground</p>
                                <p style={{ fontSize: '18px', opacity: 0.9, marginTop: '8px', margin: '5px 0 0 0' }}>Gondal Road, Rajkot • Gate Opens 6:00 PM</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ADMIN HEADER */}
            <div className="flex flex-col xl:flex-row justify-between items-center mb-10 border-b border-viren-200 pb-6 gap-6 xl:gap-0">
                <div className="flex items-center gap-4 mb-4 md:mb-0">
                    <div>
                        <h1 className="text-3xl font-bold text-viren-950 font-serif">Admin Dashboard</h1>
                        <p className="text-viren-600 text-xs tracking-wider uppercase">Gajjar Suthar Gnati • High Command</p>
                    </div>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                    <div className="flex flex-wrap justify-center bg-white rounded-lg border border-viren-200 p-1 gap-1">
                        <button onClick={() => setActiveTab('dashboard')} className={`px-3 py-2 rounded text-sm font-bold flex items-center gap-2 ${activeTab === 'dashboard' ? 'bg-viren-950 text-white' : 'text-viren-600 hover:bg-viren-50'}`}><TrendingUp size={16} /> Dash</button>
                        <button onClick={() => setActiveTab('registrations')} className={`px-3 py-2 rounded text-sm font-bold flex items-center gap-2 ${activeTab === 'registrations' ? 'bg-viren-950 text-white' : 'text-viren-600 hover:bg-viren-50'}`}><Users size={16} /> Registry</button>
                        <button onClick={() => setActiveTab('scanner')} className={`px-3 py-2 rounded text-sm font-bold flex items-center gap-2 ${activeTab === 'scanner' ? 'bg-viren-950 text-white' : 'text-viren-600 hover:bg-viren-50'}`}><ScanLine size={16} /> Scanner</button>
                        <button onClick={() => { setActiveTab('verification'); fetchVerifications(); }} className={`px-3 py-2 rounded text-sm font-bold flex items-center gap-2 ${activeTab === 'verification' ? 'bg-viren-950 text-white' : 'text-viren-600 hover:bg-viren-50'}`}><Shield size={16} /> Verification</button>
                        <button onClick={() => setActiveTab('settings')} className={`px-3 py-2 rounded text-sm font-bold flex items-center gap-2 ${activeTab === 'settings' ? 'bg-viren-950 text-white' : 'text-viren-600 hover:bg-viren-50'}`}><Settings size={16} /> Config</button>
                        <button onClick={() => setActiveTab('payments')} className={`px-3 py-2 rounded text-sm font-bold flex items-center gap-2 ${activeTab === 'payments' ? 'bg-viren-950 text-white' : 'text-viren-600 hover:bg-viren-50'}`}><CreditCard size={16} /> Payments</button>
                        <button onClick={() => setActiveTab('analytics')} className={`px-3 py-2 rounded text-sm font-bold flex items-center gap-2 ${activeTab === 'analytics' ? 'bg-viren-950 text-white' : 'text-viren-600 hover:bg-viren-50'}`}><TrendingUp size={16} /> Analytics</button>
                        <button onClick={() => setActiveTab('reports')} className={`px-3 py-2 rounded text-sm font-bold flex items-center gap-2 ${activeTab === 'reports' ? 'bg-viren-950 text-white' : 'text-viren-600 hover:bg-viren-50'}`}><FileDown size={16} /> Reports</button>
                        <button onClick={() => setActiveTab('content')} className={`px-3 py-2 rounded text-sm font-bold flex items-center gap-2 ${activeTab === 'content' ? 'bg-viren-950 text-white' : 'text-viren-600 hover:bg-viren-50'}`}><FileText size={16} /> Content</button>
                        <button onClick={() => setActiveTab('feedback')} className={`px-3 py-2 rounded text-sm font-bold flex items-center gap-2 ${activeTab === 'feedback' ? 'bg-viren-950 text-white' : 'text-viren-600 hover:bg-viren-50'}`}><Volume2 size={16} /> Feedback</button>
                        <button onClick={() => setActiveTab('inquiries')} className={`px-3 py-2 rounded text-sm font-bold flex items-center gap-2 ${activeTab === 'inquiries' ? 'bg-viren-950 text-white' : 'text-viren-600 hover:bg-viren-50'}`}><Mail size={16} /> Inquiries</button>
                        <button onClick={() => { setActiveTab('tasks'); fetchTasks(); }} className={`px-3 py-2 rounded text-sm font-bold flex items-center gap-2 ${activeTab === 'tasks' ? 'bg-viren-950 text-white' : 'text-viren-600 hover:bg-viren-50'}`}><ListTodo size={16} /> Tasks</button>
                        <button onClick={() => { setActiveTab('surnames'); fetchData(); }} className={`px-3 py-2 rounded text-sm font-bold flex items-center gap-2 ${activeTab === 'surnames' ? 'bg-viren-950 text-white' : 'text-viren-600 hover:bg-viren-50'}`}><Users size={16} /> Surnames</button>
                        <button onClick={() => setActiveTab('audit')} className={`px-3 py-2 rounded text-sm font-bold flex items-center gap-2 ${activeTab === 'audit' ? 'bg-viren-950 text-white' : 'text-viren-600 hover:bg-viren-50'}`}><History size={16} /> Logs</button>
                    </div>
                    <button onClick={() => setIsAuthenticated(false)} className="px-4 py-2 border border-viren-200 text-viren-700 bg-white hover:bg-red-50 hover:border-red-500 hover:text-red-600 active:bg-red-500 active:text-white transition-colors font-medium rounded-md">Logout</button>
                </div>
            </div>

            {activeTab === 'dashboard' && (
                <>
                    {/* DASHBOARD CONTENT */}
                    {analytics && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                            <div className="lg:col-span-2 bg-gradient-to-r from-viren-950 to-viren-900 rounded-lg p-6 text-white shadow-lg relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5">
                                    <TrendingUp size={150} />
                                </div>
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-sm uppercase tracking-widest font-bold text-viren-200 flex items-center gap-2">
                                        <Ticket size={16} /> Live Registration Stats
                                    </h3>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={async () => {
                                                const approvedUsers = users.filter(u => u.verified && getBookingForUser(u.id)?.status === 'CONFIRMED');
                                                if (approvedUsers.length === 0) {
                                                    setErrorMessage("No approved users with confirmed bookings found.");
                                                    setTimeout(() => setErrorMessage(null), 3000);
                                                    return;
                                                }
                                                setConfirmModal({
                                                    show: true,
                                                    title: "Batch Generate Passes",
                                                    message: `Generate and download passes for all ${approvedUsers.length} approved users? This may take some time.`,
                                                    onConfirm: async () => {
                                                        setConfirmModal(prev => ({ ...prev, show: false }));
                                                        setSuccessMessage("Batch generation started. Please wait...");
                                                        setTimeout(() => setSuccessMessage(null), 3000);

                                                        for (const user of approvedUsers) {
                                                            const booking = getBookingForUser(user.id);
                                                            if (booking) {
                                                                await handleRegeneratePass(user, booking);
                                                            }
                                                        }
                                                        setSuccessMessage("Batch generation complete.");
                                                        setTimeout(() => setSuccessMessage(null), 3000);
                                                    }
                                                });
                                            }}
                                            className="bg-viren-100 hover:bg-viren-200 border border-viren-300 text-viren-950 text-[10px] font-bold px-3 py-1 rounded flex items-center gap-1 transition-all"
                                        >
                                            <Download size={12} /> Generate All Pass
                                        </button>
                                        <button
                                            onClick={async () => {
                                                setConfirmModal({
                                                    show: true,
                                                    title: "Reset Database",
                                                    message: "ARE YOU SURE? This will delete ALL users, bookings, and logs. This action cannot be undone.",
                                                    onConfirm: async () => {
                                                        try {
                                                            await mockDb.resetDatabase();
                                                            try {
                                                                await fetch('/api/admin/reset-db', { method: 'POST' });
                                                            } catch (serverErr) {
                                                                console.warn("[Admin] Server-side reset failed", serverErr);
                                                            }
                                                            setSuccessMessage("Database reset successfully.");
                                                            setTimeout(() => {
                                                                setSuccessMessage(null);
                                                                window.location.reload();
                                                            }, 2000);
                                                        } catch (err) {
                                                            console.error("[Admin] Reset failed", err);
                                                            alert("Failed to reset database.");
                                                        } finally {
                                                            setConfirmModal(prev => ({ ...prev, show: false }));
                                                        }
                                                    }
                                                });
                                            }}
                                            className="bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 text-red-200 text-[10px] font-bold px-3 py-1 rounded flex items-center gap-1 transition-all"
                                        >
                                            <RefreshCw size={12} /> Reset DB
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                                    <div>
                                        <p className="text-xs text-viren-200 mb-1">Total Registered</p>
                                        <p className="text-3xl font-bold">{users.length}</p>
                                        <p className="text-[10px] text-viren-400">All time registrations</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-viren-200 mb-1">Confirmed Bookings</p>
                                        <p className="text-3xl font-bold text-green-400">{bookings.filter(b => b.status === 'CONFIRMED').length}</p>
                                        <p className="text-[10px] text-viren-400">Paid & confirmed</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-viren-200 mb-1">Total Revenue</p>
                                        <p className="text-3xl font-bold">₹{totalRevenue.toLocaleString()}</p>
                                        <p className="text-[10px] text-viren-400">From confirmed bookings</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-viren-200 mb-1">Surname Review Pending</p>
                                        <p className="text-3xl font-bold text-yellow-400">{users.filter(u => u.registrationStatus === 'SURNAME_REVIEW').length}</p>
                                        <p className="text-[10px] text-viren-400">Needs admin action</p>
                                    </div>
                                </div>
                            </div>


                            {/* NEW: Event Message / Global Announcement Widget */}
                            <div className="bg-white border border-viren-200 rounded-lg p-6 shadow-sm">
                                <h3 className="text-sm font-bold text-viren-950 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Radio size={16} className="text-viren-red" /> Global Announcement
                                </h3>
                                <div className="space-y-4">
                                    <textarea
                                        value={announcement}
                                        onChange={(e) => setAnnouncement(e.target.value)}
                                        placeholder="Type event update or emergency message..."
                                        className="w-full h-24 bg-viren-50 border border-viren-200 rounded-lg p-3 text-sm focus:border-viren-red outline-none resize-none"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleBroadcast}
                                            disabled={isBroadcasting || !announcement}
                                            className={`flex-grow py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${isBroadcasting ? 'bg-viren-100 text-viren-400' : 'bg-viren-950 text-white hover:bg-black shadow-md'
                                                }`}
                                        >
                                            {isBroadcasting ? <Loader2 className="animate-spin" size={16} /> : <Volume2 size={16} />}
                                            {isBroadcasting ? 'Broadcasting...' : 'Broadcast & Send Mail'}
                                        </button>
                                        <button
                                            onClick={handleClearAnnouncement}
                                            className="px-4 py-3 rounded-lg font-bold text-sm border border-viren-200 text-viren-600 hover:bg-viren-50 transition-all"
                                            title="Clear Announcement from Website"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-viren-500 text-center italic">
                                        * This will speak on ground, send emails to all users, and show on website.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                        <div className="bg-white p-6 rounded-lg border border-viren-200 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-100 text-green-700 flex items-center justify-center rounded-full">
                                <IndianRupee size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-viren-600 uppercase font-bold">Total Collection</p>
                                <h3 className="text-2xl font-bold text-viren-950">₹{totalRevenue.toLocaleString()}</h3>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-lg border border-viren-200 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 text-blue-700 flex items-center justify-center rounded-full">
                                <Ticket size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-viren-600 uppercase font-bold">Active Passes</p>
                                <h3 className="text-2xl font-bold text-viren-950">{verifiedUsers}</h3>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-lg border border-viren-200 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 bg-yellow-100 text-yellow-700 flex items-center justify-center rounded-full">
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-viren-600 uppercase font-bold">Pending Approvals</p>
                                <h3 className="text-2xl font-bold text-viren-950">{pendingUsers}</h3>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-8 mb-10">
                        <div className="bg-white border border-viren-200 rounded-lg p-6 shadow-lg flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold font-serif text-viren-950 flex items-center gap-2"><Car className="text-viren-800" /> Parking Control</h3>
                                <button
                                    onClick={toggleParking}
                                    className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-colors shadow-sm ${!settings?.parkingFull ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}
                                >
                                    {!settings?.parkingFull ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                                    {!settings?.parkingFull ? 'OPEN' : 'FULL'}
                                </button>
                            </div>
                            <div className="flex-grow flex flex-col items-center justify-center">
                                <button
                                    onClick={toggleParking}
                                    className={`w-full py-8 rounded-lg text-2xl font-bold shadow-inner transition-all flex flex-col items-center gap-2 border-4 ${settings?.parkingFull ? 'bg-red-50 text-red-600 border-red-500' : 'bg-green-50 text-green-600 border-green-500'}`}
                                >
                                    {settings?.parkingFull ? <Ban size={48} /> : <CheckCircle size={48} />}
                                    {settings?.parkingFull ? 'FULL' : 'OPEN'}
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {activeTab === 'settings' && (
                <div className="mb-10 bg-white border border-viren-200 rounded-lg p-6 shadow-lg animate-fade-in">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold font-serif text-viren-950 flex items-center gap-2">
                            <Settings className="text-viren-red" /> Event Configuration & Pricing
                        </h3>
                        <button
                            onClick={saveSystemSettings}
                            disabled={isSavingSettings}
                            className="flex items-center gap-2 bg-viren-950 text-white px-4 py-2 rounded hover:bg-viren-800 transition-colors"
                        >
                            {isSavingSettings ? <Radio className="animate-spin" size={16} /> : <Save size={16} />}
                            Save Changes
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            {/* General Controls */}
                            <div className="space-y-2">
                                <h4 className="text-sm font-bold text-viren-600 uppercase tracking-wide border-b border-viren-100 pb-2">General Controls</h4>
                                <div className="flex items-center justify-between bg-viren-50 p-4 rounded border border-viren-200">
                                    <div>
                                        <p className="font-bold text-viren-900">Registration Status</p>
                                        <p className="text-xs text-viren-500">Allow new users to book passes</p>
                                    </div>
                                    <button
                                        onClick={() => setEditRegistrationOpen(!editRegistrationOpen)}
                                        className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold transition-colors ${editRegistrationOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                                    >
                                        {editRegistrationOpen ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                                        {editRegistrationOpen ? 'OPEN' : 'CLOSED'}
                                    </button>
                                </div>

                                <div className="flex items-center justify-between bg-viren-50 p-4 rounded border border-viren-200">
                                    <div>
                                        <p className="font-bold text-viren-900">Pass Download Control</p>
                                        <p className="text-xs text-viren-500">Enable or disable pass downloads for users</p>
                                    </div>
                                    <button
                                        onClick={() => setEditPassDownloadEnabled(!editPassDownloadEnabled)}
                                        className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold transition-colors ${editPassDownloadEnabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                                    >
                                        {editPassDownloadEnabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                                        {editPassDownloadEnabled ? 'ENABLED' : 'DISABLED'}
                                    </button>
                                </div>
                            </div>

                            {/* Event Timings */}
                            <div className="space-y-2">
                                <h4 className="text-sm font-bold text-viren-600 uppercase tracking-wide border-b border-viren-100 pb-2">Event Timings</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-viren-500 mb-1 font-bold">Start Date & Time</label>
                                        <input
                                            type="datetime-local"
                                            value={editStartDate}
                                            onChange={(e) => setEditStartDate(e.target.value)}
                                            className="w-full p-2 border border-viren-200 rounded text-sm bg-viren-50 font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-viren-500 mb-1 font-bold">End Date & Time</label>
                                        <input
                                            type="datetime-local"
                                            value={editEndDate}
                                            onChange={(e) => setEditEndDate(e.target.value)}
                                            className="w-full p-2 border border-viren-200 rounded text-sm bg-viren-50 font-mono"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-viren-600 uppercase tracking-wide border-b border-viren-100 pb-2">Ticket Pricing (INR)</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-viren-500 mb-1">Male Pass</label>
                                    <input type="number" value={editPrices.MALE_PASS} onChange={(e) => setEditPrices({ ...editPrices, MALE_PASS: parseInt(e.target.value) || 0 })} className="w-full p-2 border border-viren-200 rounded text-sm bg-viren-50 font-bold" />
                                </div>
                                <div>
                                    <label className="block text-xs text-viren-500 mb-1">Female Pass</label>
                                    <input type="number" value={editPrices.FEMALE_PASS} onChange={(e) => setEditPrices({ ...editPrices, FEMALE_PASS: parseInt(e.target.value) || 0 })} className="w-full p-2 border border-viren-200 rounded text-sm bg-viren-50 font-bold" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-2">
                                <div>
                                    <label className="block text-xs text-viren-500 mb-1">2-Wheeler</label>
                                    <input type="number" value={editPrices.TWO_WHEELER} onChange={(e) => setEditPrices({ ...editPrices, TWO_WHEELER: parseInt(e.target.value) || 0 })} className="w-full p-2 border border-viren-200 rounded text-sm bg-viren-50 font-bold" />
                                </div>
                                <div>
                                    <label className="block text-xs text-viren-500 mb-1">4-Wheeler</label>
                                    <input type="number" value={editPrices.FOUR_WHEELER} onChange={(e) => setEditPrices({ ...editPrices, FOUR_WHEELER: parseInt(e.target.value) || 0 })} className="w-full p-2 border border-viren-200 rounded text-sm bg-viren-50 font-bold" />
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-red-100">
                                <h4 className="text-sm font-bold text-red-600 uppercase tracking-wide mb-4 flex items-center gap-2">
                                    <AlertTriangle size={16} /> Danger Zone
                                </h4>
                                <button
                                    onClick={async () => {
                                        setConfirmModal({
                                            show: true,
                                            title: "Reset Database",
                                            message: "ARE YOU SURE? This will delete ALL users, bookings, and logs. This action cannot be undone.",
                                            onConfirm: async () => {
                                                try {
                                                    // 1. Reset local mock DB
                                                    await mockDb.resetDatabase();

                                                    // 2. Reset server-side DB
                                                    try {
                                                        await fetch('/api/admin/reset-db', { method: 'POST' });
                                                    } catch (serverErr) {
                                                        console.warn("[Admin] Server-side reset failed", serverErr);
                                                    }

                                                    setSuccessMessage("Database reset successfully.");
                                                    setTimeout(() => {
                                                        setSuccessMessage(null);
                                                        window.location.reload();
                                                    }, 2000);
                                                } catch (err) {
                                                    console.error("[Admin] Reset failed", err);
                                                    alert("Failed to reset database.");
                                                } finally {
                                                    setConfirmModal(prev => ({ ...prev, show: false }));
                                                }
                                            }
                                        });
                                    }}
                                    className="w-full bg-red-50 border border-red-200 text-red-600 font-bold py-3 rounded hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                                >
                                    <RefreshCw size={16} /> Reset Entire Database
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'registrations' && (
                /* REGISTRATIONS TAB */
                <div className="space-y-6">


                    {/* PENDING USERS MANAGEMENT SECTION */}
                    <div className="bg-white p-6 rounded-lg border border-viren-200 shadow-sm">
                        <h2 className="text-xl font-bold text-viren-950 mb-4 flex items-center gap-2">
                            <Clock className="text-viren-600" size={20} /> Pending Users Management
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-viren-50 text-viren-600 uppercase text-[10px] font-bold">
                                    <tr>
                                        <th className="p-3">User</th>
                                        <th className="p-3">Phone</th>
                                        <th className="p-3">Status</th>
                                        <th className="p-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-viren-100">
                                    {users.filter(u => !u.verified).length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="p-4 text-center text-viren-400 italic text-sm">No pending users at the moment.</td>
                                        </tr>
                                    ) : (
                                        users.filter(u => !u.verified).slice(0, 5).map(user => (
                                            <tr key={user.id} className="hover:bg-viren-50 transition-colors">
                                                <td className="p-3">
                                                    <div className="font-bold text-sm text-viren-950">{user.fullName}</div>
                                                    <div className="text-[10px] text-viren-500">{user.id}</div>
                                                </td>
                                                <td className="p-3 text-sm">{user.phone}</td>
                                                <td className="p-3">
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-700 border border-yellow-200 uppercase">
                                                        Pending
                                                    </span>
                                                </td>
                                                <td className="p-3 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <a
                                                            href={`tel:${user.phone}`}
                                                            className="p-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                                            title="Call User"
                                                        >
                                                            <Phone size={14} />
                                                        </a>
                                                        <button
                                                            onClick={() => toggleUserVerification(user.id, false)}
                                                            className="p-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                                                            title="Approve"
                                                        >
                                                            <CheckCircle size={14} />
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                if (window.confirm(`Reject registration for "${user.fullName}"?`)) {
                                                                    await mockDb.updateRegistrationStatus(user.id, RegistrationStatus.REJECTED);
                                                                    await fetchData();
                                                                }
                                                            }}
                                                            className="p-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                                                            title="Reject"
                                                        >
                                                            <Ban size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                            {users.filter(u => !u.verified).length > 5 && (
                                <div className="mt-3 text-center">
                                    <button
                                        onClick={() => {
                                            setVerificationFilter('PENDING');
                                            setStatusFilter('ALL');
                                        }}
                                        className="text-xs text-viren-600 font-bold hover:underline"
                                    >
                                        View all {users.filter(u => !u.verified).length} pending users
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg border border-viren-200 shadow-sm space-y-4">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <h2 className="text-xl font-bold text-viren-950 flex items-center gap-2"><Search size={20} /> Registry Filters</h2>
                            <button onClick={handleExportCSV} className="btn-viren flex items-center gap-2 px-4 py-2 text-sm">
                                <FileDown size={16} /> Export CSV
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Search Input */}
                            <div className="col-span-1 md:col-span-2 relative">
                                <input
                                    type="text"
                                    value={passSearch}
                                    onChange={(e) => setPassSearch(e.target.value)}
                                    placeholder="Search by User ID, Name, Phone or Aadhaar..."
                                    className="w-full p-3 pl-10 bg-viren-50 border border-viren-200 rounded-lg outline-none focus:border-viren-red"
                                />
                                <Search className="absolute left-3 top-3.5 text-viren-400" size={18} />
                            </div>

                            {/* Registration Status Filter */}
                            <div className="relative">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full p-3 pl-10 bg-viren-50 border border-viren-200 rounded-lg outline-none focus:border-viren-red appearance-none"
                                >
                                    <option value="ALL">All Booking Status</option>
                                    <option value="CONFIRMED">Confirmed</option>
                                    <option value="PENDING">Pending Payment</option>
                                    <option value="REJECTED">Rejected</option>
                                    <option value="NO_BOOKING">No Booking</option>
                                </select>
                                <Filter className="absolute left-3 top-3.5 text-viren-400" size={18} />
                            </div>

                            {/* User Verification Filter */}
                            <div className="relative">
                                <select
                                    value={verificationFilter}
                                    onChange={(e) => setVerificationFilter(e.target.value)}
                                    className="w-full p-3 pl-10 bg-viren-50 border border-viren-200 rounded-lg outline-none focus:border-viren-red appearance-none"
                                >
                                    <option value="ALL">All Users</option>
                                    <option value="SURNAME_REVIEW">Surname Review Pending</option>
                                    <option value="APPROVED">Surname Approved</option>
                                    <option value="VERIFIED">ID Verified</option>
                                    <option value="PENDING">ID Not Verified</option>
                                </select>
                                <Shield className="absolute left-3 top-3.5 text-viren-400" size={18} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-viren-200 overflow-hidden shadow-xl rounded-lg">
                        <div className="p-4 bg-viren-50 border-b border-viren-200 flex justify-between items-center">
                            <h3 className="text-viren-950 font-semibold flex items-center gap-2">
                                <Users size={18} className="text-viren-red" />
                                Filtered Users ({filteredUsers.length})
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-viren-100 text-viren-600 uppercase text-xs">
                                    <tr>
                                        <th className="p-4">User Details</th>
                                        <th className="p-4">Family Info</th>
                                        <th className="p-4">Booking Info</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4">Manage</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-viren-200">
                                    {filteredUsers.map(user => {
                                        const booking = getBookingForUser(user.id);
                                        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=random&color=fff&size=128`;
                                        return (
                                            <tr key={user.id} className={`hover:bg-viren-50 transition-colors ${user.registrationStatus === 'SURNAME_REVIEW' ? 'bg-orange-50' : ''}`}>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-viren-100 overflow-hidden border border-viren-200 shrink-0">
                                                            <img
                                                                src={user.profilePhotoUrl || user.selfieUrl || avatarUrl}
                                                                alt="Profile"
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    const target = e.target as HTMLImageElement;
                                                                    if (target.src !== avatarUrl) {
                                                                        target.src = avatarUrl;
                                                                    }
                                                                }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-viren-950">{user.fullName}</div>
                                                            <div className="text-xs text-viren-600 font-mono">ID: {user.id}</div>
                                                            <div className="text-xs text-viren-600">{user.phone}</div>
                                                            <div className="text-[10px] text-viren-400 mt-1">Joined: {new Date(user.createdAt).toLocaleDateString()}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-sm">
                                                        <p><span className="text-xs text-viren-500 font-bold uppercase">Surname:</span> {user.surname}</p>
                                                        <p><span className="text-xs text-viren-500 font-bold uppercase">Father:</span> {user.fatherName}</p>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    {booking ? (
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-1">
                                                                <select
                                                                    value={booking.status}
                                                                    onChange={(e) => handleUpdateBookingStatus(booking.id, e.target.value)}
                                                                    className={`px-2 py-0.5 text-[10px] font-bold border rounded uppercase outline-none cursor-pointer ${booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800 border-green-300' :
                                                                        booking.status === 'PENDING' ? 'bg-yellow-50 text-yellow-800 border-yellow-300' :
                                                                            'bg-red-50 text-red-800 border-red-300'
                                                                        }`}
                                                                >
                                                                    <option value="CONFIRMED">CONFIRMED</option>
                                                                    <option value="PENDING">PENDING</option>
                                                                    <option value="REJECTED">REJECTED</option>
                                                                </select>
                                                            </div>
                                                            <div className="text-xs font-bold">{booking.ticketType}</div>
                                                            {booking.parkingType !== 'NONE' && <div className="text-[10px] text-viren-600">Parking: {booking.parkingType}</div>}

                                                            {/* UPDATED: Payment Details */}
                                                            <div className="flex items-center gap-1 text-xs text-viren-800 font-bold mt-1 pt-1 border-t border-viren-100">
                                                                <IndianRupee size={10} /> {booking.totalAmount.toLocaleString()}
                                                            </div>
                                                            {booking.paymentId && (
                                                                <div className="flex items-center gap-1 text-[10px] text-viren-500 font-mono" title="Payment ID">
                                                                    <CreditCard size={10} /> {booking.paymentId.slice(0, 10)}...
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-400 italic">No Booking</span>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex flex-col gap-2">
                                                        {user.registrationStatus === 'SURNAME_REVIEW' ? (
                                                            <div className="flex items-center gap-1 text-orange-600 text-xs font-bold bg-orange-100 px-2 py-1 rounded border border-orange-200">
                                                                <AlertTriangle size={14} /> Surname Review
                                                            </div>
                                                        ) : user.verified ? (
                                                            <div className="flex items-center gap-1 text-green-700 text-xs font-bold"><CheckCircle size={14} /> Verified</div>
                                                        ) : (
                                                            <div className="flex items-center gap-1 text-red-500 text-xs"><XCircle size={14} /> Not Verified</div>
                                                        )}

                                                        {user.registrationStatus !== 'SURNAME_REVIEW' && (
                                                            <button
                                                                onClick={() => toggleUserVerification(user.id, user.verified)}
                                                                className="text-[10px] underline text-viren-600 hover:text-viren-950"
                                                            >
                                                                Toggle ID Status
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex flex-col gap-2 items-start w-full">
                                                        {user.registrationStatus === 'SURNAME_REVIEW' ? (
                                                            <>
                                                                <button
                                                                    onClick={async () => {
                                                                        setConfirmModal({
                                                                            show: true,
                                                                            title: "Approve Surname",
                                                                            message: `Approve surname "${user.surname}" and add to whitelist?`,
                                                                            onConfirm: async () => {
                                                                                await mockDb.addSurname(user.surname, 'ADMIN');
                                                                                await mockDb.updateRegistrationStatus(user.id, RegistrationStatus.APPROVED);
                                                                                await fetchData();
                                                                                setSuccessMessage("Surname approved and whitelisted");
                                                                                setTimeout(() => setSuccessMessage(null), 3000);
                                                                                setConfirmModal(prev => ({ ...prev, show: false }));
                                                                            }
                                                                        });
                                                                    }}
                                                                    className="flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-bold bg-green-600 text-white rounded hover:bg-green-700 transition-colors w-full"
                                                                >
                                                                    <CheckCircle size={14} /> Approve Surname
                                                                </button>
                                                                <button
                                                                    onClick={async () => {
                                                                        setConfirmModal({
                                                                            show: true,
                                                                            title: "Reject Registration",
                                                                            message: `Reject registration for "${user.fullName}"?`,
                                                                            onConfirm: async () => {
                                                                                await mockDb.updateRegistrationStatus(user.id, RegistrationStatus.REJECTED);
                                                                                await fetchData();
                                                                                setSuccessMessage("Registration rejected");
                                                                                setTimeout(() => setSuccessMessage(null), 3000);
                                                                                setConfirmModal(prev => ({ ...prev, show: false }));
                                                                            }
                                                                        });
                                                                    }}
                                                                    className="flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-bold bg-red-600 text-white rounded hover:bg-red-700 transition-colors w-full"
                                                                >
                                                                    <Ban size={14} /> Reject
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteUser(user.id)}
                                                                    className="flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-bold bg-red-50 text-red-600 border border-red-100 rounded hover:bg-red-100 transition-colors w-full"
                                                                >
                                                                    <Trash2 size={14} /> Delete User
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                {booking && user.verified && (
                                                                    <button
                                                                        onClick={() => handleRegeneratePass(user, booking)}
                                                                        disabled={generatingPassId === user.id}
                                                                        className="flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-bold bg-viren-950 text-white rounded hover:bg-black transition-colors w-full"
                                                                    >
                                                                        {generatingPassId === user.id ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />}
                                                                        Download
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => setViewUser(user)}
                                                                    className="flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100 rounded hover:bg-blue-100 transition-colors w-full"
                                                                >
                                                                    <Eye size={14} /> View Details
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        const booking = getBookingForUser(user.id);
                                                                        if (booking) {
                                                                            setPreviewPassData({ user, booking });
                                                                        } else {
                                                                            setErrorMessage("Is user ki koi booking nahi mili.");
                                                                            setTimeout(() => setErrorMessage(null), 3000);
                                                                        }
                                                                    }}
                                                                    className="flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-bold bg-viren-100 text-viren-950 rounded hover:bg-viren-200 transition-colors w-full"
                                                                >
                                                                    <Ticket size={14} /> View Pass
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteUser(user.id)}
                                                                    className="flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-bold bg-red-50 text-red-600 border border-red-100 rounded hover:bg-red-100 transition-colors w-full"
                                                                >
                                                                    <Trash2 size={14} /> Delete User
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredUsers.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="p-8 text-center text-viren-500 italic">No users found matching your filters.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'payments' && (
                /* PAYMENT HISTORY TAB */
                <div className="space-y-6 animate-fade-in">
                    <div className="bg-white p-6 rounded-lg border border-viren-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                        <h2 className="text-xl font-bold text-viren-950 flex items-center gap-2"><CreditCard size={20} /> Payment History</h2>
                        <div className="flex items-center gap-3">
                            <div className="text-sm font-bold bg-green-50 text-green-700 px-3 py-1 rounded-full border border-green-200">
                                Total Success: ₹{successfulPayments.reduce((acc, curr) => acc + curr.totalAmount, 0).toLocaleString()}
                            </div>
                            <button onClick={handleExportPaymentsCSV} className="btn-viren flex items-center gap-2 px-3 py-1 text-xs">
                                <FileDown size={14} /> CSV
                            </button>
                        </div>
                    </div>

                    <div className="bg-white border border-viren-200 overflow-hidden shadow-xl rounded-lg">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-viren-100 text-viren-600 uppercase text-xs">
                                    <tr>
                                        <th className="p-4">Transaction Details</th>
                                        <th className="p-4">User</th>
                                        <th className="p-4 text-right">Amount</th>
                                        <th className="p-4 text-right">Date & Time</th>
                                        <th className="p-4 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-viren-200 text-sm">
                                    {successfulPayments.map(payment => {
                                        const user = getUserForBooking(payment.userId);
                                        return (
                                            <tr key={payment.id} className="hover:bg-viren-50 transition-colors">
                                                <td className="p-4">
                                                    <div className="font-mono font-bold text-viren-950">{payment.paymentId}</div>
                                                    <div className="text-xs text-viren-500">Ref: {payment.id}</div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="font-bold text-viren-900">{user?.fullName || 'Unknown User'}</div>
                                                    <div className="text-xs text-viren-500 font-mono">{payment.userId}</div>
                                                </td>
                                                <td className="p-4 text-right font-bold text-viren-950">
                                                    ₹{payment.totalAmount.toLocaleString()}
                                                </td>
                                                <td className="p-4 text-right text-viren-600 font-mono text-xs">
                                                    {new Date(payment.timestamp).toLocaleString()}
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-green-100 text-green-800 border border-green-200">
                                                        Success
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {successfulPayments.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-viren-500 italic">No payment history found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'audit' && (
                /* AUDIT LOGS TAB */
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg border border-viren-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between">
                        <h2 className="text-xl font-bold text-viren-950 flex items-center gap-2"><History size={20} /> System Audit Logs</h2>
                        <div className="flex flex-col md:flex-row gap-3">
                            <div className="relative">
                                <select
                                    value={auditFilterAction}
                                    onChange={(e) => setAuditFilterAction(e.target.value)}
                                    className="appearance-none bg-viren-50 border border-viren-200 text-sm rounded px-3 py-2 pr-8 focus:border-viren-red outline-none w-full md:w-auto"
                                >
                                    {uniqueActions.map(action => (
                                        <option key={action} value={action}>{action}</option>
                                    ))}
                                </select>
                                <ChevronDown size={14} className="absolute right-2 top-3 text-viren-400 pointer-events-none" />
                            </div>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Filter by Admin ID..."
                                    value={auditFilterAdmin}
                                    onChange={(e) => setAuditFilterAdmin(e.target.value)}
                                    className="bg-viren-50 border border-viren-200 text-sm rounded px-3 py-2 pl-8 focus:border-viren-red outline-none w-full md:w-auto"
                                />
                                <Search size={14} className="absolute left-2.5 top-2.5 text-viren-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-viren-200 overflow-hidden shadow-xl rounded-lg">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-viren-100 text-viren-600 uppercase text-xs">
                                    <tr>
                                        <th className="p-4">Action</th>
                                        <th className="p-4">Details</th>
                                        <th className="p-4">Admin</th>
                                        <th className="p-4 text-right">Timestamp</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-viren-200 text-sm">
                                    {filteredAuditLogs.map(log => (
                                        <tr key={log.id} className="hover:bg-viren-50 transition-colors">
                                            <td className="p-4 font-bold text-viren-800 text-xs uppercase">{log.action}</td>
                                            <td className="p-4 text-viren-600">{log.details}</td>
                                            <td className="p-4 text-viren-500 font-mono text-xs">{log.adminId}</td>
                                            <td className="p-4 text-right text-viren-400 text-xs font-mono">{new Date(log.timestamp).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    {filteredAuditLogs.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="p-8 text-center text-viren-500 italic">No logs found matching criteria.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'scanner' && (
                <div className="flex flex-col items-center justify-center min-h-[500px] bg-white border border-viren-200 rounded-lg shadow-lg p-6 relative overflow-hidden transition-colors duration-300">
                    <div className={`absolute inset-0 pointer-events-none transition-colors duration-500 ${scanFlash || 'bg-transparent'}`}></div>
                    <h2 className="text-2xl font-bold text-viren-950 mb-4 flex items-center gap-2 relative z-10"><Camera size={24} /> Gate Entry Scanner</h2>

                    {!scannedResult ? (
                        <div className="w-full max-w-md bg-black rounded-lg overflow-hidden relative aspect-square border-4 border-viren-950 z-10">
                            <Webcam
                                ref={webcamRef}
                                audio={false}
                                className="w-full h-full object-cover"
                                videoConstraints={{ facingMode: "environment" }}
                                screenshotFormat="image/jpeg"
                                disablePictureInPicture={true}
                                imageSmoothing={true}
                                mirrored={false}
                                onUserMedia={() => { }}
                                forceScreenshotSourceSize={true}
                                onUserMediaError={() => { }}
                                screenshotQuality={1}
                            />
                            <div className="absolute inset-0 border-[40px] border-black/50 pointer-events-none flex items-center justify-center">
                                <div className="w-64 h-64 border-2 border-red-500/50 rounded-lg animate-pulse relative">
                                    <div className="absolute top-0 left-0 w-full h-0.5 bg-red-500 animate-[float_2s_infinite]"></div>
                                </div>
                            </div>
                            <p className="absolute bottom-4 w-full text-center text-white text-sm font-bold bg-black/50 py-1">Align QR Code within frame</p>
                        </div>
                    ) : (
                        <div className="w-full max-w-md animate-fade-in text-center p-8 bg-viren-50 rounded-xl border-2 border-dashed border-viren-300 z-10">
                            {scannedResult.valid ? (
                                <>
                                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                                        <CheckCircle size={48} />
                                    </div>
                                    <h2 className="text-3xl font-bold text-green-800 mb-2">ENTRY APPROVED</h2>
                                    <div className="bg-white p-4 rounded-lg shadow-sm text-left mb-6">
                                        <p className="text-sm text-gray-500 uppercase">User Name</p>
                                        <p className="text-xl font-bold text-viren-950 mb-2">{scannedResult.user?.fullName}</p>
                                        <p className="text-sm text-gray-500 uppercase">Ticket Type</p>
                                        <p className="text-lg font-bold text-viren-red">{scannedResult.booking?.ticketType}</p>
                                    </div>
                                    <div className="flex items-center justify-center mb-6">
                                        <img src={scannedResult.user?.profilePhotoUrl || scannedResult.user?.selfieUrl} className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover" />
                                    </div>
                                    <button onClick={resetScanner} className="btn-viren-filled w-full py-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all">Scan Next</button>
                                </>
                            ) : (
                                <>
                                    <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                        <Ban size={48} />
                                    </div>
                                    <h2 className="text-3xl font-bold text-red-800 mb-2">ENTRY DENIED</h2>
                                    <p className="text-red-600 mb-6">Invalid QR Code or User not verified.</p>
                                    <div className="bg-white p-4 rounded-lg shadow-sm text-left mb-6 border border-red-200">
                                        <p className="text-xs text-gray-400 font-mono">Scan Data: {scannedResult.id}</p>
                                    </div>
                                    <button onClick={resetScanner} className="btn-viren w-full py-3">Scan Next</button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'verification' && (
                <div className="bg-white border border-viren-200 rounded-lg shadow-xl overflow-hidden animate-fade-in">
                    <div className="p-6 border-b border-viren-200 bg-viren-950 text-white flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-bold font-serif flex items-center gap-2"><Shield /> Identity Verification Queue</h3>
                            <p className="text-xs text-viren-300 uppercase tracking-widest mt-1">Manual Approval for Face Matching Discrepancies</p>
                        </div>
                        <button onClick={fetchVerifications} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <RefreshCw size={20} className={isLoadingVerifications ? 'animate-spin' : ''} />
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-viren-50 text-viren-950 text-xs font-bold uppercase tracking-widest border-b border-viren-200">
                                    <th className="px-6 py-4">User Details</th>
                                    <th className="px-6 py-4">Aadhaar Card</th>
                                    <th className="px-6 py-4">Live Selfie</th>
                                    <th className="px-6 py-4 text-center">Match Score</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-viren-100">
                                {verifications.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-20 text-center text-viren-400 italic font-serif">
                                            {isLoadingVerifications ? 'Loading verification requests...' : 'No pending verification requests found.'}
                                        </td>
                                    </tr>
                                ) : (
                                    verifications.map((v) => (
                                        <tr key={v.id} className="hover:bg-viren-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-viren-950">{v.name}</p>
                                                <p className="text-xs text-viren-600 font-mono mt-1">{v.aadhaar_number}</p>
                                                <p className="text-[10px] text-viren-400 mt-1">{new Date(v.created_at).toLocaleString()}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="w-24 h-16 bg-gray-100 rounded border border-viren-200 overflow-hidden cursor-zoom-in" onClick={() => window.open(v.aadhaar_image_path.replace('./public', ''), '_blank')}>
                                                    <img src={v.aadhaar_image_path.replace('./public', '')} className="w-full h-full object-cover" />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="w-16 h-16 bg-gray-100 rounded-full border border-viren-200 overflow-hidden cursor-zoom-in mx-auto" onClick={() => window.open(v.selfie_image_path.replace('./public', ''), '_blank')}>
                                                    <img src={v.selfie_image_path.replace('./public', '')} className="w-full h-full object-cover" />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${v.face_match_score >= 70 ? 'bg-green-100 text-green-700' :
                                                    v.face_match_score >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {v.face_match_score}%
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${v.verification_status === 'approved' ? 'bg-green-100 text-green-800' :
                                                    v.verification_status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {v.verification_status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {v.verification_status === 'pending' && (
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handleVerificationAction(v.id, 'approved')}
                                                            className="p-2 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                                                            title="Approve"
                                                        >
                                                            <CheckCircle size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleVerificationAction(v.id, 'rejected')}
                                                            className="p-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                                                            title="Reject"
                                                        >
                                                            <XCircle size={18} />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* VIEW DETAILS MODAL */}
            {viewUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
                        <button
                            onClick={() => setViewUser(null)}
                            className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-viren-950 transition-colors"
                        >
                            <XCircle size={24} />
                        </button>

                        <div className="p-6 md:p-8">
                            <h2 className="text-2xl font-bold text-viren-950 mb-6 border-b border-viren-200 pb-4 font-serif">User Details: {viewUser.fullName}</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="bg-viren-50 p-6 rounded-lg border border-viren-200">
                                        <h3 className="font-bold text-viren-950 mb-4 flex items-center gap-2"><Users size={18} /> Personal Info</h3>
                                        <div className="space-y-2">
                                            <p className="text-sm text-viren-700"><span className="font-bold text-viren-900 w-24 inline-block">ID:</span> {viewUser.id}</p>
                                            <p className="text-sm text-viren-700"><span className="font-bold text-viren-900 w-24 inline-block">Surname:</span> {viewUser.surname}</p>
                                            <p className="text-sm text-viren-700"><span className="font-bold text-viren-900 w-24 inline-block">Father Name:</span> {viewUser.fatherName}</p>
                                            <p className="text-sm text-viren-700"><span className="font-bold text-viren-900 w-24 inline-block">Phone:</span> {viewUser.phone}</p>
                                            <p className="text-sm text-viren-700"><span className="font-bold text-viren-900 w-24 inline-block">Aadhaar:</span> {viewUser.aadhaar}</p>
                                            <p className="text-sm text-viren-700"><span className="font-bold text-viren-900 w-24 inline-block">Registered:</span> {new Date(viewUser.createdAt).toLocaleString()}</p>
                                            <p className="text-sm text-viren-700"><span className="font-bold text-viren-900 w-24 inline-block">Status:</span>
                                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${viewUser.verified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {viewUser.verified ? 'Verified' : 'Pending Verification'}
                                                </span>
                                            </p>
                                        </div>
                                    </div>

                                    {(() => {
                                        const booking = getBookingForUser(viewUser.id);
                                        if (booking) {
                                            return (
                                                <div className="bg-viren-50 p-6 rounded-lg border border-viren-200">
                                                    <h3 className="font-bold text-viren-950 mb-4 flex items-center gap-2"><Ticket size={18} /> Booking Info</h3>
                                                    <div className="space-y-2">
                                                        <p className="text-sm text-viren-700"><span className="font-bold text-viren-900 w-24 inline-block">Booking ID:</span> {booking.id}</p>
                                                        <p className="text-sm text-viren-700"><span className="font-bold text-viren-900 w-24 inline-block">Status:</span>
                                                            <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                                {booking.status}
                                                            </span>
                                                        </p>
                                                        <p className="text-sm text-viren-700"><span className="font-bold text-viren-900 w-24 inline-block">Type:</span> {booking.ticketType}</p>
                                                        <p className="text-sm text-viren-700"><span className="font-bold text-viren-900 w-24 inline-block">Parking:</span> {booking.parkingType} {booking.parkingCount > 0 && `(${booking.parkingCount})`}</p>
                                                        <p className="text-sm text-viren-700"><span className="font-bold text-viren-900 w-24 inline-block">Amount:</span> ₹{booking.totalAmount}</p>
                                                        <p className="text-sm text-viren-700"><span className="font-bold text-viren-900 w-24 inline-block">Tx ID:</span> <span className="font-mono text-xs">{booking.paymentId || 'N/A'}</span></p>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            localStorage.setItem('svar_user_id', viewUser.id);
                                                            window.open('#/pass', '_blank');
                                                        }}
                                                        className="mt-4 flex items-center justify-center gap-2 w-full py-2 bg-viren-950 text-white rounded font-bold hover:bg-viren-800 transition-colors"
                                                    >
                                                        <Ticket size={18} /> View Digital Pass
                                                    </button>
                                                </div>
                                            );
                                        }
                                        return <div className="p-6 border border-dashed border-gray-300 rounded-lg text-gray-400 text-sm text-center flex flex-col items-center justify-center h-32 italic">No Booking Found</div>;
                                    })()}
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <h3 className="font-bold text-viren-950 mb-3 text-sm uppercase tracking-wide">Profile Photo (Pass)</h3>
                                        <div className="aspect-square w-40 h-40 bg-gray-100 rounded-lg overflow-hidden border border-viren-200 shadow-sm mx-auto md:mx-0">
                                            <img
                                                src={viewUser.profilePhotoUrl || viewUser.selfieUrl}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(viewUser.fullName)}&background=random&color=fff&size=128`;
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-viren-950 mb-3 text-sm uppercase tracking-wide">Verification Documents</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-gray-50 p-2 rounded border border-gray-200">
                                                <p className="text-[10px] text-gray-500 font-bold mb-2 uppercase text-center">Live Selfie</p>
                                                <div className="aspect-[3/4] bg-white rounded overflow-hidden border border-gray-100 shadow-sm">
                                                    <img src={viewUser.selfieUrl} className="w-full h-full object-cover" />
                                                </div>
                                            </div>
                                            <div className="bg-gray-50 p-2 rounded border border-gray-200">
                                                <p className="text-[10px] text-gray-500 font-bold mb-2 uppercase text-center">Aadhaar Card</p>
                                                <div className="aspect-[3/4] bg-white rounded overflow-hidden border border-gray-100 shadow-sm flex items-center justify-center relative">
                                                    {viewUser.aadhaarCardUrl?.startsWith('data:application/pdf') ? (
                                                        <div
                                                            className="w-full h-full flex flex-col items-center justify-center text-center p-2 cursor-pointer hover:bg-gray-50 transition-colors group"
                                                            onClick={() => {
                                                                const win = window.open();
                                                                if (win) {
                                                                    win.document.write('<iframe src="' + viewUser.aadhaarCardUrl + '" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>');
                                                                }
                                                            }}
                                                        >
                                                            <FileText size={40} className="text-red-500 mb-2 group-hover:scale-110 transition-transform" />
                                                            <p className="text-xs font-bold text-gray-600">View PDF</p>
                                                            <p className="text-[9px] text-blue-500 mt-1 underline">Click to Open</p>
                                                        </div>
                                                    ) : (
                                                        <img src={viewUser.aadhaarCardUrl} className="w-full h-full object-contain" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'analytics' && (
                <div className="space-y-8 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-lg border border-viren-200 shadow-sm">
                            <p className="text-xs font-bold text-viren-500 uppercase mb-1">Total Registrations</p>
                            <h3 className="text-3xl font-bold text-viren-950">{users.length}</h3>
                            <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-viren-950" style={{ width: `${Math.min(100, (users.length / 5000) * 100)}%` }}></div>
                            </div>
                            <p className="text-[10px] text-viren-400 mt-2">Target: 5,000 passes</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg border border-viren-200 shadow-sm">
                            <p className="text-xs font-bold text-viren-500 uppercase mb-1">Conversion Rate</p>
                            <h3 className="text-3xl font-bold text-viren-950">
                                {users.length > 0 ? ((bookings.filter(b => b.status === 'CONFIRMED').length / users.length) * 100).toFixed(1) : 0}%
                            </h3>
                            <p className="text-[10px] text-green-500 mt-2 flex items-center gap-1"><TrendingUp size={10} /> High intent audience</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg border border-viren-200 shadow-sm">
                            <p className="text-xs font-bold text-viren-500 uppercase mb-1">Avg. Booking Value</p>
                            <h3 className="text-3xl font-bold text-viren-950">
                                ₹{bookings.length > 0 ? (bookings.reduce((acc, b) => acc + b.totalAmount, 0) / bookings.length).toFixed(0) : 0}
                            </h3>
                            <p className="text-[10px] text-viren-400 mt-2">Per successful transaction</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg border border-viren-200 shadow-sm">
                            <p className="text-xs font-bold text-viren-500 uppercase mb-1">Parking Utilization</p>
                            <h3 className="text-3xl font-bold text-viren-950">
                                {bookings.filter(b => b.parkingType !== 'NONE').length}
                            </h3>
                            <p className="text-[10px] text-orange-500 mt-2">Slots filling fast</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white p-6 rounded-lg border border-viren-200 shadow-lg">
                            <h3 className="font-bold text-viren-950 mb-6 flex items-center gap-2"><Ticket size={18} /> Ticket Distribution</h3>
                            <div className="space-y-4">
                                {['MALE', 'FEMALE'].map(type => {
                                    const count = bookings.filter(b => b.ticketType === type).length;
                                    const percentage = bookings.length > 0 ? (count / bookings.length) * 100 : 0;
                                    return (
                                        <div key={type}>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="font-bold">{type} PASS</span>
                                                <span className="text-viren-600">{count} ({percentage.toFixed(1)}%)</span>
                                            </div>
                                            <div className="h-4 bg-viren-50 rounded-full overflow-hidden">
                                                <div className={`h-full ${type === 'MALE' ? 'bg-blue-500' : 'bg-pink-500'}`} style={{ width: `${percentage}%` }}></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-lg border border-viren-200 shadow-lg">
                            <h3 className="font-bold text-viren-950 mb-6 flex items-center gap-2"><Car size={18} /> Parking Analytics</h3>
                            <div className="space-y-4">
                                {['TWO_WHEELER', 'FOUR_WHEELER'].map(type => {
                                    const count = bookings.filter(b => b.parkingType === type).length;
                                    const percentage = bookings.length > 0 ? (count / bookings.length) * 100 : 0;
                                    return (
                                        <div key={type}>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="font-bold">{type.replace('_', ' ')}</span>
                                                <span className="text-viren-600">{count} ({percentage.toFixed(1)}%)</span>
                                            </div>
                                            <div className="h-4 bg-viren-50 rounded-full overflow-hidden">
                                                <div className="h-full bg-viren-950" style={{ width: `${percentage}%` }}></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'reports' && (
                <div className="bg-white border border-viren-200 rounded-lg shadow-xl overflow-hidden animate-fade-in">
                    <div className="p-6 border-b border-viren-200 flex justify-between items-center bg-viren-50">
                        <div>
                            <h3 className="text-xl font-bold text-viren-950">Booking Reports</h3>
                            <p className="text-sm text-viren-600">Comprehensive list of all financial transactions and bookings</p>
                        </div>
                        <button onClick={handleExportBookingsCSV} className="btn-viren-filled flex items-center gap-2">
                            <Download size={18} /> Export Master Report
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-viren-100 text-viren-600 uppercase text-xs font-bold">
                                <tr>
                                    <th className="p-4">Booking ID</th>
                                    <th className="p-4">User</th>
                                    <th className="p-4">Type</th>
                                    <th className="p-4">Amount</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-viren-100">
                                {bookings.map(b => {
                                    const user = users.find(u => u.id === b.userId);
                                    return (
                                        <tr key={b.id} className="hover:bg-viren-50 transition-colors">
                                            <td className="p-4 font-mono text-xs">{b.id}</td>
                                            <td className="p-4">
                                                <p className="font-bold text-sm">{user?.fullName || 'Unknown'}</p>
                                                <p className="text-[10px] text-viren-500">{user?.phone}</p>
                                            </td>
                                            <td className="p-4 text-xs font-bold">{b.ticketType}</td>
                                            <td className="p-4 text-sm font-bold">₹{b.totalAmount}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${b.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                    {b.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-xs text-viren-500">{new Date(b.timestamp).toLocaleDateString()}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'content' && (
                <div className="bg-white border border-viren-200 rounded-lg p-8 shadow-xl animate-fade-in max-w-4xl mx-auto">
                    <h3 className="text-2xl font-bold font-serif text-viren-950 mb-8 border-b border-viren-100 pb-4">Content Management</h3>

                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-viren-700">Event Name</label>
                                <input type="text" defaultValue="SVAR 2026" className="w-full p-3 bg-viren-50 border border-viren-200 rounded outline-none focus:border-viren-red" />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-viren-700">Venue Name</label>
                                <input type="text" defaultValue="PD Malaviya College Ground" className="w-full p-3 bg-viren-50 border border-viren-200 rounded outline-none focus:border-viren-red" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-viren-700">Event Description</label>
                            <textarea
                                defaultValue="Experience the grandeur of tradition meeting luxury. Join us for a night of rhythm, devotion, and celebration in the heart of Rajkot."
                                className="w-full p-3 bg-viren-50 border border-viren-200 rounded h-32 outline-none focus:border-viren-red"
                            />
                        </div>

                        <div className="p-6 bg-viren-50 rounded-lg border border-viren-200">
                            <h4 className="font-bold text-viren-950 mb-4 flex items-center gap-2"><Camera size={18} /> Gallery Management</h4>
                            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <div key={i} className="aspect-square bg-white border border-viren-200 rounded flex items-center justify-center relative group cursor-pointer overflow-hidden shadow-sm">
                                        <img src={`https://picsum.photos/seed/navratri${i}/200/200`} className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity" />
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                                            <RefreshCw className="text-white" size={20} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <p className="text-[10px] text-viren-500 mt-4 italic">* This is a visual representation. Actual image management requires a cloud storage integration.</p>
                        </div>

                        <div className="flex justify-end pt-6 border-t border-viren-100">
                            <button className="btn-viren-filled px-10 py-3 flex items-center gap-2">
                                <Save size={20} /> Update Website Content
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'feedback' && (
                <div className="bg-white border border-viren-200 rounded-lg shadow-xl animate-fade-in overflow-hidden">
                    <div className="p-6 border-b border-viren-100 flex justify-between items-center bg-viren-50">
                        <div>
                            <h3 className="text-xl font-bold text-viren-950">User Feedback</h3>
                            <p className="text-sm text-viren-600">Suggestions and feedback from the Services page</p>
                        </div>
                        <div className="bg-viren-950 text-white px-4 py-1 rounded-full text-xs font-bold">
                            {feedbacks.length} Total
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-viren-100 text-viren-600 uppercase text-xs font-bold">
                                <tr>
                                    <th className="p-4">Date</th>
                                    <th className="p-4">User Name</th>
                                    <th className="p-4">Suggestion / Feedback</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-viren-100">
                                {feedbacks.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="p-8 text-center text-viren-400 italic">No feedback received yet.</td>
                                    </tr>
                                ) : (
                                    feedbacks.map((f, idx) => (
                                        <tr key={idx} className="hover:bg-viren-50 transition-colors">
                                            <td className="p-4 text-xs text-viren-500 whitespace-nowrap">{new Date(f.timestamp).toLocaleString()}</td>
                                            <td className="p-4 font-bold text-sm text-viren-950">{f.name}</td>
                                            <td className="p-4 text-sm text-viren-700 leading-relaxed">{f.suggestion}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'inquiries' && (
                <div className="bg-white border border-viren-200 rounded-lg shadow-xl animate-fade-in overflow-hidden">
                    <div className="p-6 border-b border-viren-100 flex justify-between items-center bg-viren-50">
                        <div>
                            <h3 className="text-xl font-bold text-viren-950">Contact Inquiries</h3>
                            <p className="text-sm text-viren-600">Messages received from the Contact Us page</p>
                        </div>
                        <div className="bg-viren-red text-white px-4 py-1 rounded-full text-xs font-bold">
                            {inquiries.length} Messages
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-viren-100 text-viren-600 uppercase text-xs font-bold">
                                <tr>
                                    <th className="p-4">Date</th>
                                    <th className="p-4">Contact Details</th>
                                    <th className="p-4">Message</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-viren-100">
                                {inquiries.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="p-8 text-center text-viren-400 italic">No inquiries received yet.</td>
                                    </tr>
                                ) : (
                                    inquiries.map((i, idx) => (
                                        <tr key={idx} className="hover:bg-viren-50 transition-colors">
                                            <td className="p-4 text-xs text-viren-500 whitespace-nowrap">{new Date(i.timestamp).toLocaleString()}</td>
                                            <td className="p-4">
                                                <p className="font-bold text-sm text-viren-950">{i.name}</p>
                                                <p className="text-xs text-viren-600">{i.phone}</p>
                                                {i.email && <p className="text-[10px] text-viren-500">{i.email}</p>}
                                            </td>
                                            <td className="p-4 text-sm text-viren-700 leading-relaxed">
                                                {i.message.includes('Tier:') ? (
                                                    <div className="flex flex-col gap-2">
                                                        <div className="whitespace-pre-wrap mb-2">{i.message}</div>
                                                    </div>
                                                ) : (
                                                    <div className="whitespace-pre-wrap">{i.message}</div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'tasks' && (
                <div className="bg-white rounded-lg border border-viren-200 shadow-sm overflow-hidden animate-fade-in">
                    <div className="p-6 border-b border-viren-100 flex justify-between items-center bg-viren-50">
                        <div>
                            <h3 className="text-xl font-bold text-viren-950 flex items-center gap-2"><ListTodo className="text-viren-red" /> Task Management</h3>
                            <p className="text-sm text-viren-600">Assign and track event management tasks</p>
                        </div>
                        <button
                            onClick={() => setIsCreatingTask(true)}
                            className="btn-viren-filled flex items-center gap-2"
                        >
                            <Plus size={18} /> Add New Task
                        </button>
                    </div>

                    {isCreatingTask && (
                        <div className="p-6 bg-viren-50 border-b border-viren-200 animate-slide-down">
                            <form onSubmit={handleCreateTask} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-viren-700 uppercase mb-1">Task Title</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full p-2 border border-viren-200 rounded focus:ring-2 focus:ring-viren-500 outline-none"
                                        placeholder="e.g. Verify user documents"
                                        value={newTaskData.title}
                                        onChange={e => setNewTaskData({ ...newTaskData, title: e.target.value })}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-viren-700 uppercase mb-1">Description</label>
                                    <textarea
                                        className="w-full p-2 border border-viren-200 rounded focus:ring-2 focus:ring-viren-500 outline-none h-20"
                                        placeholder="Provide details about the task..."
                                        value={newTaskData.description}
                                        onChange={e => setNewTaskData({ ...newTaskData, description: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-viren-700 uppercase mb-1">Assign To</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 border border-viren-200 rounded focus:ring-2 focus:ring-viren-500 outline-none"
                                        placeholder="Admin Name / Team"
                                        value={newTaskData.assignedTo}
                                        onChange={e => setNewTaskData({ ...newTaskData, assignedTo: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs font-bold text-viren-700 uppercase mb-1">Priority</label>
                                        <select
                                            className="w-full p-2 border border-viren-200 rounded focus:ring-2 focus:ring-viren-500 outline-none"
                                            value={newTaskData.priority}
                                            onChange={e => setNewTaskData({ ...newTaskData, priority: e.target.value as any })}
                                        >
                                            <option value="LOW">Low</option>
                                            <option value="MEDIUM">Medium</option>
                                            <option value="HIGH">High</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-viren-700 uppercase mb-1">Due Date</label>
                                        <input
                                            type="date"
                                            className="w-full p-2 border border-viren-200 rounded focus:ring-2 focus:ring-viren-500 outline-none"
                                            value={newTaskData.dueDate}
                                            onChange={e => setNewTaskData({ ...newTaskData, dueDate: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="md:col-span-2 flex justify-end gap-2 mt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreatingTask(false)}
                                        className="px-4 py-2 text-viren-600 hover:bg-viren-100 rounded font-bold transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn-viren-filled px-6"
                                    >
                                        Create Task
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="p-6">
                        <div className="grid grid-cols-1 gap-4">
                            {tasks.length === 0 ? (
                                <div className="text-center py-12 bg-viren-50 rounded-lg border-2 border-dashed border-viren-200">
                                    <ListTodo size={48} className="mx-auto text-viren-300 mb-4" />
                                    <p className="text-viren-500 italic">No tasks assigned yet. Start by creating one!</p>
                                </div>
                            ) : (
                                tasks.map(task => (
                                    <div key={task.id} className="bg-white border border-viren-200 rounded-lg p-4 hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${task.priority === 'HIGH' ? 'bg-red-100 text-red-600' :
                                                    task.priority === 'MEDIUM' ? 'bg-orange-100 text-orange-600' :
                                                        'bg-blue-100 text-blue-600'
                                                    }`}>
                                                    {task.priority}
                                                </span>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${task.status === TaskStatus.COMPLETED ? 'bg-green-100 text-green-600' :
                                                    task.status === TaskStatus.IN_PROGRESS ? 'bg-viren-100 text-viren-600' :
                                                        'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {task.status.replace('_', ' ')}
                                                </span>
                                                <h4 className="font-bold text-viren-950">{task.title}</h4>
                                            </div>
                                            <p className="text-sm text-viren-700 mb-2">{task.description}</p>
                                            <div className="flex flex-wrap gap-4 text-xs text-viren-500">
                                                <span className="flex items-center gap-1"><Users size={12} /> {task.assignedTo || 'Unassigned'}</span>
                                                <span className="flex items-center gap-1"><Calendar size={12} /> Due: {task.dueDate || 'No date'}</span>
                                                <span className="flex items-center gap-1"><Clock size={12} /> Created: {new Date(task.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {task.status !== TaskStatus.COMPLETED && (
                                                <button
                                                    onClick={() => handleUpdateTaskStatus(task.id, task.status === TaskStatus.PENDING ? TaskStatus.IN_PROGRESS : TaskStatus.COMPLETED)}
                                                    className="p-2 text-viren-600 hover:bg-viren-50 rounded-full transition-colors"
                                                    title={task.status === TaskStatus.PENDING ? "Start Task" : "Complete Task"}
                                                >
                                                    {task.status === TaskStatus.PENDING ? <RefreshCw size={20} /> : <CheckSquare size={20} />}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDeleteTask(task.id)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                                title="Delete Task"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Success Toast */}
            {successMessage && (
                <div className="fixed bottom-8 right-8 z-[100] animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="bg-viren-950 text-white px-6 py-4 rounded-lg shadow-2xl border border-viren-800 flex items-center gap-3">
                        <div className="bg-green-500 rounded-full p-1">
                            <CheckCircle size={20} className="text-white" />
                        </div>
                        <div>
                            <p className="font-bold text-sm">Success</p>
                            <p className="text-xs text-viren-300">{successMessage}</p>
                        </div>
                        <button onClick={() => setSuccessMessage(null)} className="ml-4 text-viren-400 hover:text-white">
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Error Toast */}
            {errorMessage && (
                <div className="fixed bottom-8 right-8 z-[100] animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="bg-red-950 text-white px-6 py-4 rounded-lg shadow-2xl border border-red-900 flex items-center gap-3">
                        <div className="bg-red-500 rounded-full p-1">
                            <XCircle size={20} className="text-white" />
                        </div>
                        <div>
                            <p className="font-bold text-sm">Error</p>
                            <p className="text-xs text-red-300">{errorMessage}</p>
                        </div>
                        <button onClick={() => setErrorMessage(null)} className="ml-4 text-red-400 hover:text-white">
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* ================================================================
    PASS PREVIEW MODAL (Admin Dashboard ke andar hi dikhega)
    ================================================================ */}
            {previewPassData && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
                    <div className="relative bg-white rounded-2xl overflow-hidden shadow-2xl max-w-sm w-full border border-viren-200">

                        {/* Close Button */}
                        <button
                            onClick={() => setPreviewPassData(null)}
                            className="absolute top-4 right-4 z-50 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-all"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex flex-col items-center">
                            {/* Pass Header */}
                            <div className="w-full bg-[#20324C] p-6 text-center text-white relative">
                                <h1 className="text-2xl font-serif font-bold tracking-widest">SVAR 2026</h1>
                                <p className="text-[7px] tracking-[3px] opacity-70 uppercase mt-1">Shri Vishwakarma Arvachin Rasotsav</p>

                                {/* Profile Picture */}
                                <div className="mt-4 w-28 h-28 mx-auto rounded-full border-4 border-white overflow-hidden shadow-lg bg-gray-100">
                                    <img
                                        src={previewPassData.user.profilePhotoUrl || previewPassData.user.selfieUrl}
                                        className="w-full h-full object-cover"
                                        alt="User Profile"
                                        onError={(e) => (e.currentTarget.src = "https://ui-avatars.com/api/?name=User")}
                                    />
                                </div>
                            </div>

                            {/* Pass Body */}
                            <div className="p-6 w-full text-center space-y-4 bg-white">
                                <div>
                                    <h2 className="text-xl font-bold text-viren-950 uppercase">{previewPassData.user.fullName}</h2>
                                    <p className="text-viren-600 font-mono text-sm font-bold">+91 {previewPassData.user.phone}</p>
                                </div>

                                <div className="flex border-t border-b border-gray-100 py-3">
                                    <div className="flex-1 border-r border-gray-100">
                                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Pass ID</p>
                                        <p className="font-bold text-viren-950 font-mono">{previewPassData.booking.id.split('-').pop()}</p>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Category</p>
                                        <p className="font-bold text-viren-red">{previewPassData.booking.ticketType}</p>
                                    </div>
                                </div>

                                {/* QR Code */}
                                <div className="bg-white p-3 rounded-xl inline-block border-2 border-dashed border-viren-100">
                                    <QRCodeCanvas
                                        value={JSON.stringify({ passId: previewPassData.booking.id, uid: previewPassData.user.id })}
                                        size={130}
                                        level="H"
                                    />
                                </div>

                                <div className="text-[10px] text-viren-500 font-medium">
                                    <p>PD Malaviya College Ground, Rajkot</p>
                                    <p className="mt-1 opacity-60 italic">Official Admin Preview</p>
                                </div>
                            </div>

                            {/* Modal Action Footer */}
                            <div className="w-full bg-viren-50 p-4 border-t border-viren-100 flex gap-2">
                                <button
                                    onClick={() => {
                                        handleRegeneratePass(previewPassData.user, previewPassData.booking);
                                    }}
                                    className="flex-1 bg-viren-950 text-white py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-black transition-all text-sm"
                                >
                                    <Download size={16} /> Download PDF
                                </button>
                                <button
                                    onClick={() => setPreviewPassData(null)}
                                    className="px-4 py-2.5 bg-white border border-viren-200 text-viren-700 rounded-lg font-bold text-sm"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* ================================================================
             PASS PREVIEW MODAL (Admin Dashboard ke andar hi dikhega)
             ================================================================ */}
            {previewPassData && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
                    <div className="relative bg-white rounded-2xl overflow-hidden shadow-2xl max-w-sm w-full border border-viren-200">

                        {/* Close Button */}
                        <button
                            onClick={() => setPreviewPassData(null)}
                            className="absolute top-4 right-4 z-50 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-all"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex flex-col items-center">
                            {/* Pass Header */}
                            <div className="w-full bg-[#20324C] p-6 text-center text-white relative">
                                <h1 className="text-2xl font-serif font-bold tracking-widest">SVAR 2026</h1>
                                <p className="text-[7px] tracking-[3px] opacity-70 uppercase mt-1">Shri Vishwakarma Arvachin Rasotsav</p>

                                {/* Profile Picture */}
                                <div className="mt-4 w-28 h-28 mx-auto rounded-full border-4 border-white overflow-hidden shadow-lg bg-gray-100">
                                    <img
                                        src={previewPassData.user.profilePhotoUrl || previewPassData.user.selfieUrl}
                                        className="w-full h-full object-cover"
                                        alt="User Profile"
                                        onError={(e) => (e.currentTarget.src = "https://ui-avatars.com/api/?name=User")}
                                    />
                                </div>
                            </div>

                            {/* Pass Body */}
                            <div className="p-6 w-full text-center space-y-4 bg-white">
                                <div>
                                    <h2 className="text-xl font-bold text-viren-950 uppercase">{previewPassData.user.fullName}</h2>
                                    <p className="text-viren-600 font-mono text-sm font-bold">+91 {previewPassData.user.phone}</p>
                                </div>

                                <div className="flex border-t border-b border-gray-100 py-3">
                                    <div className="flex-1 border-r border-gray-100">
                                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Pass ID</p>
                                        <p className="font-bold text-viren-950 font-mono">{previewPassData.booking.id.split('-').pop()}</p>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Category</p>
                                        <p className="font-bold text-viren-red">{previewPassData.booking.ticketType}</p>
                                    </div>
                                </div>

                                {/* QR Code */}
                                <div className="bg-white p-3 rounded-xl inline-block border-2 border-dashed border-viren-100">
                                    <QRCodeCanvas
                                        value={JSON.stringify({ passId: previewPassData.booking.id, uid: previewPassData.user.id })}
                                        size={130}
                                        level="H"
                                    />
                                </div>

                                <div className="text-[10px] text-viren-500 font-medium">
                                    <p>PD Malaviya College Ground, Rajkot</p>
                                    <p className="mt-1 opacity-60 italic">Official Admin Preview</p>
                                </div>
                            </div>
                            {/* Modal Action Footer */}
                            <div className="w-full bg-viren-50 p-4 border-t border-viren-100 flex gap-2">
                                <button
                                    onClick={() => {
                                        handleRegeneratePass(previewPassData.user, previewPassData.booking);
                                    }}
                                    className="flex-1 bg-viren-950 text-white py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-black transition-all text-sm"
                                >
                                    <Download size={16} /> Download PDF
                                </button>
                                <button
                                    onClick={() => setPreviewPassData(null)}
                                    className="px-4 py-2.5 bg-white border border-viren-200 text-viren-700 rounded-lg font-bold text-sm"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* SURNAMES MANAGEMENT TAB */}
            {activeTab === 'surnames' && (
                <div className="space-y-6 animate-fade-in mb-10">
                    <div className="bg-white p-8 rounded-lg border border-viren-200 shadow-lg">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-viren-100">
                            <div>
                                <h2 className="text-2xl font-bold font-serif text-viren-950 flex items-center gap-2">
                                    <Users className="text-viren-red" size={24} /> Surname Whitelist Management
                                </h2>
                                <p className="text-viren-600 text-sm mt-1">Add or remove permitted surnames (English / Gujarati)</p>
                            </div>
                            <div className="bg-viren-50 px-5 py-3 rounded-lg border border-viren-200 text-center">
                                <p className="text-[10px] text-viren-500 uppercase font-bold">Total Whitelisted</p>
                                <p className="text-3xl font-bold text-viren-950 leading-none">{surnamesList.length}</p>
                            </div>
                        </div>

                        {/* Add Surname Form */}
                        <div className="mb-8 p-6 bg-viren-50/50 border border-viren-200 rounded-lg">
                            <label className="block text-sm font-bold text-viren-800 mb-2 uppercase tracking-wide">Add New Surname</label>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <input
                                    type="text"
                                    value={newSurname}
                                    onChange={(e) => setNewSurname(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddSurname()}
                                    placeholder="Enter Surname"
                                    className="flex-grow p-4 border border-viren-300 rounded-lg focus:border-viren-red outline-none font-bold text-viren-950 w-full shadow-inner"
                                />
                                <button
                                    onClick={handleAddSurname}
                                    disabled={!newSurname.trim() || isAddingSurname}
                                    className="bg-viren-950 text-white px-8 py-4 rounded-lg font-bold hover:bg-black disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap transition-all shadow-md active:scale-95 sm:w-auto"
                                >
                                    {isAddingSurname ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                                    Add Surname
                                </button>
                            </div>
                            <p className="text-xs text-viren-500 mt-2 flex items-center gap-1">
                                <CheckCircle size={12} className="text-green-500" />
                                Adding a surname instantly approves any active pending registrations with that surname.
                            </p>
                        </div>

                        {/* Surname List */}
                        <div>
                            <h3 className="text-lg font-bold text-viren-950 mb-4 border-b pb-2 flex items-center gap-2">
                                <Shield size={18} className="text-viren-600" /> Current Whitelisted Surnames
                            </h3>
                            {surnamesList.length === 0 ? (
                                <div className="text-center p-10 text-viren-400 italic bg-viren-50 rounded border border-viren-100">
                                    No surnames in the whitelist yet. Add one above.
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[500px] overflow-y-auto pr-1">
                                    {surnamesList.map((entry) => (
                                        <div key={entry.id} className="bg-white border border-viren-200 p-3 rounded-lg shadow-sm hover:border-viren-400 hover:shadow-md transition-all flex justify-between items-center group">
                                            <span className="font-semibold text-viren-900 text-sm truncate">{entry.surname}</span>
                                            <button
                                                title="Remove Surname"
                                                onClick={async () => {
                                                    if (window.confirm(`Remove "${entry.surname}" from whitelist?`)) {
                                                        await mockDb.deleteSurname(entry.id);
                                                        fetchData();
                                                    }
                                                }}
                                                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity p-1 ml-1 flex-shrink-0"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Modal */}
            {confirmModal.show && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4 text-viren-950">
                                <div className="bg-viren-100 p-2 rounded-lg">
                                    <AlertTriangle size={24} className="text-viren-800" />
                                </div>
                                <h3 className="text-xl font-bold font-serif">{confirmModal.title}</h3>
                            </div>
                            <p className="text-viren-700 mb-6">{confirmModal.message}</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                                    className="flex-1 px-4 py-2 border border-viren-200 text-viren-700 font-bold rounded-lg hover:bg-viren-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        confirmModal.onConfirm();
                                    }}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Admin;