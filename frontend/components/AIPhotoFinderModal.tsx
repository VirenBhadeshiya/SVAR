import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Search, Sparkles, CheckCircle, X, Loader2, Image as ImageIcon, Download } from 'lucide-react';
import { compressImage } from '../utils/imageProcessor';

const MOCK_FOUND_PHOTOS = [
  '/images/gallery/ai_img_1.png',
  '/images/gallery/ai_img_2.png',
  '/images/gallery/ai_img_3.png',
  '/images/gallery/ai_img_4.png'
];

export const AIPhotoFinderModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [selfie, setSelfie] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [photos, setPhotos] = useState<string[] | null>(null);

  const handleSelfieUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file);
        setSelfie(compressed);
      } catch (err) {
        console.error("Selfie compress error", err);
      }
    }
  };

  const handleSearch = () => {
    if (!selfie) return;
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      setPhotos(MOCK_FOUND_PHOTOS);
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-viren-200"
        >
          {/* Header */}
          <div className="bg-[#20324C] text-white p-5 flex justify-between items-center border-b-4 border-[#731515]">
            <div className="flex items-center gap-3">
              <Sparkles className="text-amber-400 animate-pulse" size={24} />
              <div>
                <h3 className="font-bold text-lg font-serif">AI Garba Photo Finder (એઆઈ ફોટો ફાઈન્ડર)</h3>
                <p className="text-xs text-viren-200">Upload your selfie to automatically find all your event photos</p>
              </div>
            </div>
            <button onClick={onClose} className="text-viren-200 hover:text-white"><X size={22} /></button>
          </div>

          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            {!photos ? (
              <div className="space-y-6 text-center">
                <div className="p-6 border-2 border-dashed border-viren-300 rounded-2xl bg-viren-50/50 space-y-4">
                  {selfie ? (
                    <img src={selfie} alt="Selfie Preview" className="w-36 h-36 object-cover rounded-full mx-auto border-4 border-[#731515] shadow-md" />
                  ) : (
                    <div className="w-24 h-24 bg-viren-200/50 text-viren-600 rounded-full flex items-center justify-center mx-auto">
                      <Camera size={40} />
                    </div>
                  )}

                  <div>
                    <h4 className="font-bold text-sm text-viren-950">Upload Your Selfie</h4>
                    <p className="text-xs text-viren-600 mt-1">Our AI face recognition engine will match your face across 5,000+ HD photos.</p>
                  </div>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSelfieUpload}
                    className="text-xs text-viren-800 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-[#731515] file:text-white hover:file:bg-[#8E2121]"
                  />
                </div>

                <button
                  onClick={handleSearch}
                  disabled={!selfie || isSearching}
                  className="btn-viren-filled w-full py-3.5 rounded-xl text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSearching ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                  <span>{isSearching ? "Searching Photo Archives..." : "Find My Garba Photos"}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                  <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold">
                    <CheckCircle size={18} className="text-emerald-600" />
                    <span>Matched {photos.length} High-Res Photos Found!</span>
                  </div>
                  <button onClick={() => setPhotos(null)} className="text-xs text-[#731515] font-bold underline">Search Again</button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {photos.map((url, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden shadow-md border border-viren-200">
                      <img src={url} alt={`Found ${idx}`} className="w-full h-40 object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <a
                          href={url}
                          download={`svar_photo_${idx + 1}.png`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 bg-white text-viren-950 rounded-full font-bold text-xs flex items-center gap-1 shadow-lg"
                        >
                          <Download size={14} /> Download HD
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
