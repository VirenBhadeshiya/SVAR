import React from 'react';
import { BookingForm } from '../components/BookingForm';
import { PhoneCall } from 'lucide-react';

const Booking: React.FC = () => {
  return (
    <div className="py-8 px-4 max-w-7xl mx-auto space-y-10 font-sans">
      
      {/* Main Booking Form Wrapper */}
      <div className="max-w-4xl mx-auto">
        <BookingForm />
      </div>

      {/* Help & Support Footer Banner */}
      <div className="max-w-3xl mx-auto bg-white/95 rounded-2xl border border-slate-200 p-6 text-center space-y-2 shadow-md">
        <div className="inline-flex items-center gap-2 text-xs font-bold text-[#731515] uppercase tracking-wider">
          <PhoneCall size={14} /> 24/7 Booking Helpline Support
        </div>
        <p className="text-xs text-slate-600">
          Need assistance with pass booking or registration? Contact support at <strong className="text-slate-900">+91 98765 43210</strong> or email <strong className="text-slate-900">support@svar2026.com</strong>
        </p>
      </div>

    </div>
  );
};

export default Booking;