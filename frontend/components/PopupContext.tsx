import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { mockDb } from '../services/mockDb';

export type PopupType = 'error' | 'success' | 'warning' | 'info';

export interface PopupData {
  titleEn: string;
  titleGu: string;
  messageEn: string;
  messageGu: string;
  type: PopupType;
  details?: Record<string, string | number>;
  autoCloseMs?: number;
  onClose?: () => void;
}

interface PopupContextType {
  popup: PopupData | null;
  isOpen: boolean;
  showPopup: (data: PopupData) => void;
  hidePopup: () => void;
}

const PopupContext = createContext<PopupContextType | undefined>(undefined);

const BROADCAST_CHANNEL_NAME = 'svar_announcements_channel';
const LAST_SHOWN_ANNOUNCEMENT_KEY = 'svar_last_shown_announcement_time';
const LAST_SHOWN_PARKING_KEY = 'svar_last_shown_parking_status';

// Helper function to guarantee high-quality Gujarati translation for all announcements
export const ensureGujaratiTranslation = (textEn: string, textGu?: string): string => {
  if (textGu && textGu.trim() !== '') return textGu;
  if (!textEn) return '';
  // If already contains Gujarati characters (Unicode range \u0A80-\u0AFF)
  if (/[\u0A80-\u0AFF]/.test(textEn)) return textEn;

  const lower = textEn.toLowerCase();

  if (lower.includes('parking') && lower.includes('full')) {
    return 'ધ્યાન આપો: ગરબા મેદાનનું વાહન પાર્કિંગ હવે ૧૦૦% ફૂલ થઈ ગયું છે. કૃપા કરીને બહાર પાર્ક કરો અથવા જાહેર વાહનનો ઉપયોગ કરો.';
  }
  if (lower.includes('parking') && (lower.includes('open') || lower.includes('available'))) {
    return 'સૂચના: વાહન પાર્કિંગ સુવિધા હવે તમામ વાહનો માટે ખુલ્લી છે.';
  }
  if (lower.includes('rain') || lower.includes('weather')) {
    return 'હવામાન અપડેટ: ગરબા મહોત્સવ નિયમિત સમયે જ યોજાશે.';
  }
  if (lower.includes('pass') && lower.includes('download')) {
    return 'પાસ અપડેટ: ડિજિટલ પાસ ડાઉનલોડિંગ હવે ઉપલબ્ધ છે.';
  }

  // Smart fallback translation
  return `મહત્વપૂર્ણ સૂચના: ${textEn}`;
};

export const PopupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [popup, setPopup] = useState<PopupData | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const showPopup = useCallback((data: PopupData) => {
    // Ensure Gujarati message is always present in Gujarati script
    const finalGu = ensureGujaratiTranslation(data.messageEn, data.messageGu);
    setPopup({
      ...data,
      messageGu: finalGu,
    });
    setIsOpen(true);
  }, []);

  const hidePopup = useCallback(() => {
    setIsOpen(false);
    if (popup?.onClose) {
      popup.onClose();
    }
  }, [popup]);

  // Handle local BroadcastChannel & storage events for multi-tab instant sync
  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        bc.onmessage = (event) => {
          if (event.data && event.data.type === 'ANNOUNCEMENT_BROADCAST') {
            const { announcement, announcementGu, parkingFull } = event.data;
            if (parkingFull) {
              showPopup({
                titleEn: '🚨 Vehicle Parking Alert',
                titleGu: '🚨 વાહન પાર્કિંગ સુચના / એલર્ટ',
                messageEn: 'ATTENTION: Parking space is now FULL! Please park outside the venue or use public transit.',
                messageGu: 'ધ્યાન આપો: ગરબા મેદાનનું વાહન પાર્કિંગ હવે ફૂલ થઈ ગયું છે! કૃપા કરીને વેન્યુ બહાર વાહન પાર્ક કરો અથવા જાહેર વાહનનો ઉપયોગ કરો.',
                type: 'error',
              });
            } else if (announcement) {
              showPopup({
                titleEn: '📢 Admin Announcement',
                titleGu: '📢 એડમિન મહત્વપૂર્ણ જાહેરાત',
                messageEn: announcement,
                messageGu: ensureGujaratiTranslation(announcement, announcementGu),
                type: 'info',
              });
            }
          }
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel not supported', e);
    }

    return () => {
      if (bc) bc.close();
    };
  }, [showPopup]);

  // Fast polling (1.5s) to catch updates instantly even across different devices/sessions
  useEffect(() => {
    let lastAnnouncementTime = localStorage.getItem(LAST_SHOWN_ANNOUNCEMENT_KEY) || '';
    let lastParkingStatus = localStorage.getItem(LAST_SHOWN_PARKING_KEY) || 'false';
    let isInitialLoad = true;

    const checkRealtimeUpdates = async () => {
      try {
        const settings = await mockDb.getSettings();

        // 1. Check Parking Full status change
        const currentParkingStr = String(settings.parkingFull);
        if (currentParkingStr !== lastParkingStatus) {
          localStorage.setItem(LAST_SHOWN_PARKING_KEY, currentParkingStr);
          lastParkingStatus = currentParkingStr;
          if (settings.parkingFull) {
            showPopup({
              titleEn: '🚨 Vehicle Parking Full',
              titleGu: '🚨 વાહન પાર્કિંગ હાઉસફુલ એલર્ટ',
              messageEn: 'Notice: Event grounds vehicle parking is 100% FULL. No more vehicle entry allowed.',
              messageGu: 'સૂચના: ગરબા ગ્રાઉન્ડનું વાહન પાર્કિંગ ૧૦૦% ફૂલ થઈ ગયું છે. હવે નવા કોઈ વાહનોને પ્રવેશ મળશે નહીં.',
              type: 'error',
            });
          }
        }

        // 2. Check Announcement updates
        if (settings.lastAnnouncement && settings.lastAnnouncementTime) {
          if (settings.lastAnnouncementTime !== lastAnnouncementTime) {
            localStorage.setItem(LAST_SHOWN_ANNOUNCEMENT_KEY, settings.lastAnnouncementTime);
            lastAnnouncementTime = settings.lastAnnouncementTime;

            // Trigger announcement popup
            showPopup({
              titleEn: '📢 Important Event Announcement',
              titleGu: '📢 અગત્યની ઇવેન્ટ જાહેરાત',
              messageEn: settings.lastAnnouncement,
              messageGu: ensureGujaratiTranslation(settings.lastAnnouncement, settings.lastAnnouncementGu),
              type: 'info',
            });
          }
        } else if (isInitialLoad && settings.lastAnnouncement) {
          localStorage.setItem(LAST_SHOWN_ANNOUNCEMENT_KEY, settings.lastAnnouncementTime || 'init');
        }

        isInitialLoad = false;
      } catch (err) {
        console.warn('Real-time check error:', err);
      }
    };

    checkRealtimeUpdates();
    const interval = setInterval(checkRealtimeUpdates, 1500);

    return () => clearInterval(interval);
  }, [showPopup]);

  return (
    <PopupContext.Provider value={{ popup, isOpen, showPopup, hidePopup }}>
      {children}
    </PopupContext.Provider>
  );
};

export const usePopup = () => {
  const context = useContext(PopupContext);
  if (!context) {
    throw new Error('usePopup must be used within a PopupProvider');
  }
  return context;
};
