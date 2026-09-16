import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Car, MapPin, QrCode, CheckCircle2, ShieldCheck, ArrowUpRight, Sparkles, Navigation } from 'lucide-react';
import { usePopup } from './PopupContext';
import { mockDb } from '../services/mockDb';

interface ParkingBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ParkingBookingModal: React.FC<ParkingBookingModalProps> = ({ isOpen, onClose }) => {
  const { showPopup } = usePopup();
  const [vehicleType, setVehicleType] = useState<'TWO_WHEELER' | 'FOUR_WHEELER'>('FOUR_WHEELER');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [nightDate, setNightDate] = useState('Night 4 (18 Oct 2026)');
  const [bookedPass, setBookedPass] = useState<any>(null);

  const handleBookParking = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = vehicleType === 'TWO_WHEELER' ? 50 : 200;
    const passId = `PRK-2026-${Math.floor(100000 + Math.random() * 900000)}`;

    const pass = {
      id: passId,
      vehicleType,
      vehicleNumber: vehicleNumber.toUpperCase() || 'GJ-03-AB-1234',
      date: nightDate,
      price,
      slot: `ZONE-${vehicleType === 'TWO_WHEELER' ? 'A' : 'B'}-${Math.floor(10 + Math.random() * 90)}`,
      time: '6:00 PM to 1:00 AM'
    };

    setBookedPass(pass);

    showPopup({
      titleEn: '🚗 Parking Slot Reserved!',
      titleGu: '🚗 પાર્કિંગ સ્લોટ સફળતાપૂર્વક બુક થયો!',
      messageEn: `Parking Pass ${passId} generated for ${pass.vehicleNumber} (${pass.slot}).`,
      messageGu: `વાહન નંબર ${pass.vehicleNumber} માટે પાર્કિંગ સ્લોટ ${pass.slot} બુક થઈ ગયો છે.`,
      type: 'success'
    });
  };

  const handleOpenGPS = () => {
    window.open('https://www.google.com/maps/dir/?api=1&destination=22.2686535,70.7998793', '_blank');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="bg-[#18263C] text-white p-5 flex items-center justify-between border-b-4 border-amber-500">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow">
                <Car size={22} />
              </div>
              <div>
                <h3 className="font-bold text-lg font-serif">Advance Parking Booking & GPS</h3>
                <p className="text-xs text-amber-200">Reserved Slot & Turn-by-Turn Navigation</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-slate-300 hover:text-white">
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-5 overflow-y-auto flex-1">
            {bookedPass ? (
              <div className="bg-slate-50 border-2 border-amber-400 rounded-2xl p-6 space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={28} />
                </div>
                <h4 className="font-bold text-lg text-slate-900 font-serif">Parking Pass Confirmed</h4>
                <p className="text-xs text-slate-600 font-mono font-bold text-[#731515]">{bookedPass.id}</p>

                <div className="bg-white p-4 rounded-xl border border-slate-200 text-left space-y-2 text-xs">
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-slate-500">Vehicle Type:</span>
                    <span className="font-bold text-slate-900">{bookedPass.vehicleType === 'TWO_WHEELER' ? '2-Wheeler (બાઈક)' : '4-Wheeler (કાર)'}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-slate-500">Vehicle Number:</span>
                    <span className="font-mono font-bold text-slate-900">{bookedPass.vehicleNumber}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-slate-500">Assigned Slot:</span>
                    <span className="font-bold text-amber-700">{bookedPass.slot}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 pt-1">
                    <span>Parking Fee Paid:</span>
                    <span className="text-[#731515]">₹{bookedPass.price}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={handleOpenGPS}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow"
                  >
                    <Navigation size={16} /> Open GPS Turn-by-Turn Navigation
                  </button>
                  <button
                    onClick={() => setBookedPass(null)}
                    className="text-xs text-slate-500 underline pt-1"
                  >
                    Book another vehicle slot
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleBookParking} className="space-y-4">
                {/* Capacity Status */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
                    <span className="text-emerald-800 font-bold block">🛵 2-Wheeler Slots</span>
                    <span className="text-emerald-600 text-[11px]">840 / 1000 Available</span>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl">
                    <span className="text-amber-800 font-bold block">🚗 4-Wheeler Slots</span>
                    <span className="text-amber-600 text-[11px]">320 / 500 Available</span>
                  </div>
                </div>

                {/* Vehicle Type Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                    Select Vehicle Type (વાહન પ્રકાર)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setVehicleType('TWO_WHEELER')}
                      className={`p-3.5 rounded-xl border-2 text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                        vehicleType === 'TWO_WHEELER'
                          ? 'border-[#731515] bg-red-50 text-[#731515]'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      🛵 2-Wheeler (₹50)
                    </button>
                    <button
                      type="button"
                      onClick={() => setVehicleType('FOUR_WHEELER')}
                      className={`p-3.5 rounded-xl border-2 text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                        vehicleType === 'FOUR_WHEELER'
                          ? 'border-[#731515] bg-red-50 text-[#731515]'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      🚗 4-Wheeler (₹200)
                    </button>
                  </div>
                </div>

                {/* Vehicle Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                    Vehicle Registration Number (વાહન નંબર)
                  </label>
                  <input
                    type="text"
                    required
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    placeholder="e.g. GJ 03 AB 1234"
                    className="w-full text-sm p-3 border border-slate-300 rounded-xl focus:outline-none focus:border-[#731515] font-mono uppercase"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                    Garba Night Date
                  </label>
                  <select
                    value={nightDate}
                    onChange={(e) => setNightDate(e.target.value)}
                    className="w-full text-sm p-3 border border-slate-300 rounded-xl focus:outline-none focus:border-[#731515]"
                  >
                    <option value="Night 1 (15 Oct 2026)">Night 1 (15 Oct 2026)</option>
                    <option value="Night 2 (16 Oct 2026)">Night 2 (16 Oct 2026)</option>
                    <option value="Night 3 (17 Oct 2026)">Night 3 (17 Oct 2026)</option>
                    <option value="Night 4 (18 Oct 2026)">Night 4 (18 Oct 2026)</option>
                    <option value="Night 5 (19 Oct 2026)">Night 5 (19 Oct 2026)</option>
                    <option value="Night 6 (20 Oct 2026)">Night 6 (20 Oct 2026)</option>
                    <option value="Night 7 (21 Oct 2026)">Night 7 (21 Oct 2026)</option>
                    <option value="Night 8 (22 Oct 2026)">Night 8 (22 Oct 2026)</option>
                    <option value="Night 9 (23 Oct 2026)">Night 9 (23 Oct 2026)</option>
                  </select>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="submit"
                    className="w-full bg-[#731515] hover:bg-[#8E2121] text-white font-bold py-3.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg"
                  >
                    Reserve Parking Slot (₹{vehicleType === 'TWO_WHEELER' ? 50 : 200})
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenGPS}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-300"
                  >
                    <Navigation size={14} /> Open Venue Map & Directions
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
