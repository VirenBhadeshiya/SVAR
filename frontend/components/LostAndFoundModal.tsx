import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, PlusCircle, AlertTriangle, CheckCircle, Image as ImageIcon, X, Loader2, Phone, MapPin } from 'lucide-react';
import { compressImage } from '../utils/imageProcessor';

interface LostItem {
  id: string;
  type: 'LOST' | 'FOUND';
  title: string;
  category: 'CHILD' | 'BELONGING' | 'WALLET' | 'OTHER';
  location: string;
  description: string;
  phone: string;
  imageUrl?: string;
  timestamp: string;
  status: 'OPEN' | 'RESOLVED';
}

const INITIAL_ITEMS: LostItem[] = [
  {
    id: 'LF-101',
    type: 'LOST',
    title: 'Black Leather Wallet with Aadhaar Card',
    category: 'WALLET',
    location: 'Gate 2 Food Zone',
    description: 'Contains Aadhaar card belonging to Rajesh Gajjar and car keys.',
    phone: '9876543210',
    timestamp: '10 minutes ago',
    status: 'OPEN'
  },
  {
    id: 'LF-102',
    type: 'FOUND',
    title: 'Keys with Golden Traditional Keychain',
    category: 'BELONGING',
    location: 'VIP Viewer Section Desk',
    description: 'Found near VIP Stage row B seat 12.',
    phone: '9988776655',
    timestamp: '25 minutes ago',
    status: 'OPEN'
  }
];

export const LostAndFoundModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [items, setItems] = useState<LostItem[]>(INITIAL_ITEMS);
  const [activeTab, setActiveTab] = useState<'VIEW' | 'REPORT'>('VIEW');
  const [filterType, setFilterType] = useState<'ALL' | 'LOST' | 'FOUND'>('ALL');

  // New Report Form
  const [reportType, setReportType] = useState<'LOST' | 'FOUND'>('LOST');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'CHILD' | 'BELONGING' | 'WALLET' | 'OTHER'>('BELONGING');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file);
        setImage(compressed);
      } catch (err) {
        console.error("Image upload error", err);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !location || !phone) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const newItem: LostItem = {
        id: `LF-${Date.now().toString().slice(-4)}`,
        type: reportType,
        title,
        category,
        location,
        description,
        phone,
        imageUrl: image || undefined,
        timestamp: 'Just now',
        status: 'OPEN'
      };

      setItems(prev => [newItem, ...prev]);
      setIsSubmitting(false);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setActiveTab('VIEW');
        setTitle('');
        setLocation('');
        setDescription('');
        setPhone('');
        setImage(null);
      }, 1500);
    }, 600);
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
              <Search className="text-amber-400" size={24} />
              <div>
                <h3 className="font-bold text-lg font-serif">Lost & Found Portal (ખોવાયેલ / મળેલ વસ્તુ)</h3>
                <p className="text-xs text-viren-200">Live reporting for lost items or children on ground</p>
              </div>
            </div>
            <button onClick={onClose} className="text-viren-200 hover:text-white"><X size={22} /></button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b bg-viren-50">
            <button
              onClick={() => setActiveTab('VIEW')}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${
                activeTab === 'VIEW' ? 'bg-white text-[#731515] border-b-2 border-[#731515]' : 'text-viren-600 hover:text-viren-950'
              }`}
            >
              Browse Reported Items ({items.length})
            </button>
            <button
              onClick={() => setActiveTab('REPORT')}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'REPORT' ? 'bg-white text-[#731515] border-b-2 border-[#731515]' : 'text-viren-600 hover:text-viren-950'
              }`}
            >
              <PlusCircle size={16} /> Report Item / Person
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            {activeTab === 'VIEW' ? (
              <>
                {/* Filter Pills */}
                <div className="flex gap-2">
                  {(['ALL', 'LOST', 'FOUND'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setFilterType(type)}
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        filterType === type ? 'bg-[#731515] text-white' : 'bg-viren-100 text-viren-800'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {/* Items List */}
                <div className="space-y-4">
                  {items
                    .filter(i => filterType === 'ALL' || i.type === filterType)
                    .map(item => (
                      <div
                        key={item.id}
                        className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between gap-4 ${
                          item.type === 'LOST' ? 'bg-red-50/60 border-red-200' : 'bg-emerald-50/60 border-emerald-200'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                item.type === 'LOST' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
                              }`}
                            >
                              {item.type}
                            </span>
                            <span className="text-xs font-mono font-bold text-viren-600">{item.id}</span>
                            <span className="text-[10px] text-viren-400">• {item.timestamp}</span>
                          </div>
                          <h4 className="font-bold text-sm text-viren-950">{item.title}</h4>
                          <p className="text-xs text-viren-600 flex items-center gap-1">
                            <MapPin size={14} className="text-viren-red" /> {item.location}
                          </p>
                          {item.description && <p className="text-xs text-viren-800 mt-1">{item.description}</p>}
                        </div>

                        <div className="flex flex-col sm:items-end justify-between">
                          <a
                            href={`tel:${item.phone}`}
                            className="btn-viren-filled py-1.5 px-3 text-xs flex items-center gap-1.5 font-bold"
                          >
                            <Phone size={14} /> Call Contact ({item.phone})
                          </a>
                        </div>
                      </div>
                    ))}
                </div>
              </>
            ) : (
              /* REPORT FORM */
              <form onSubmit={handleSubmit} className="space-y-4">
                {submitted ? (
                  <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
                    <CheckCircle size={36} className="text-emerald-600 mx-auto animate-bounce" />
                    <h4 className="font-bold text-lg text-emerald-950">Report Logged Successfully!</h4>
                    <p className="text-xs text-emerald-800">Our ground security team has been notified.</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-viren-800 mb-1">Report Type</label>
                        <select
                          value={reportType}
                          onChange={e => setReportType(e.target.value as any)}
                          className="w-full p-2.5 border rounded-md text-xs font-bold"
                        >
                          <option value="LOST">Lost (ખોવાયેલ)</option>
                          <option value="FOUND">Found (મળેલ)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-viren-800 mb-1">Category</label>
                        <select
                          value={category}
                          onChange={e => setCategory(e.target.value as any)}
                          className="w-full p-2.5 border rounded-md text-xs font-bold"
                        >
                          <option value="BELONGING">Personal Belonging</option>
                          <option value="WALLET">Wallet / ID Card</option>
                          <option value="CHILD">Lost Child Alert</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-viren-800 mb-1">Item Title / Person Name</label>
                      <input
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="e.g. Red Purse with keys / Child Master Aarav"
                        className="w-full p-2.5 border rounded-md text-xs"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-viren-800 mb-1">Last Known Location at Ground</label>
                      <input
                        type="text"
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                        placeholder="e.g. Near Gate 1 Food Stall 4"
                        className="w-full p-2.5 border rounded-md text-xs"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-viren-800 mb-1">Contact Phone Number</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="10-digit mobile number"
                        className="w-full p-2.5 border rounded-md text-xs font-mono"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-viren-800 mb-1">Description & Identifiers</label>
                      <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Provide details to identify item or person..."
                        className="w-full p-2.5 border rounded-md text-xs h-20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-viren-800 mb-1">Attach Photo (Optional)</label>
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="text-xs" />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn-viren-filled w-full py-3 rounded-md text-xs font-bold uppercase tracking-wider flex justify-center items-center gap-2"
                    >
                      {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <span>Submit Lost & Found Log</span>}
                    </button>
                  </>
                )}
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
