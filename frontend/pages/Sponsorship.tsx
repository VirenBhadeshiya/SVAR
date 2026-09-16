import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Logo } from '../components/Logo';
import { StaticImage } from '../components/StaticImage';
import { mockDb } from '../services/mockDb';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const Sponsorship: React.FC = () => {
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    tier: 'Royal Title Sponsor',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const tiers = [
    { name: "Royal Title Sponsor", price: "₹5,00,000", color: "from-viren-950 to-viren-red", benefits: ["Main Stage Branding", "VIP Seating (10)", "Digital Ad Slot", "Social Media Shoutout"] },
    { name: "Platinum Partner", price: "₹2,50,000", color: "from-viren-red to-viren-800", benefits: ["Gate Branding", "VIP Seating (5)", "Logo on Tickets", "Website Feature"] },
    { name: "Gold Associate", price: "₹1,00,000", color: "from-viren-800 to-viren-600", benefits: ["Food Court Branding", "VIP Seating (2)", "Banner Ad"] },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus('idle');
    
    try {
      await mockDb.saveInquiry({
        name: `${formData.companyName} (${formData.contactPerson})`,
        phone: formData.phone,
        email: formData.email,
        message: `Tier: ${formData.tier}\n\n${formData.message}`
      });
      setStatus('success');
      setFormData({
        companyName: '',
        contactPerson: '',
        email: '',
        phone: '',
        tier: 'Royal Title Sponsor',
        message: ''
      });
      setTimeout(() => setStatus('idle'), 5000);
    } catch (err) {
      console.error("Inquiry failed", err);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-20 px-4 max-w-7xl mx-auto bg-viren-50">
      <div className="text-center mb-16">
        <div className="w-16 h-16 mx-auto mb-6 text-viren-950">
            <Logo className="w-full h-full" />
        </div>
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-viren-950 mb-4">Sponsorship Opportunities</h1>
        <p className="text-viren-600 max-w-2xl mx-auto">
          Partner with SVAR 2026 and showcase your brand to a community of over 50,000 individuals. 
          Experience brand visibility like never before.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {tiers.map((tier, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.2 }}
            className="relative bg-white border border-viren-200 p-8 overflow-hidden group hover:border-viren-red transition-all shadow-sm hover:shadow-lg rounded-lg"
          >
            <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${tier.color}`}></div>
            <h3 className="text-2xl font-bold text-viren-950 mb-2 font-serif">{tier.name}</h3>
            <p className={`text-xl font-bold bg-gradient-to-r ${tier.color} bg-clip-text text-transparent mb-6`}>{tier.price}</p>
            
            <ul className="space-y-3 mb-8">
              {tier.benefits.map((b, i) => (
                <li key={i} className="flex items-center text-viren-800 text-sm">
                  <span className="w-2 h-2 bg-viren-red mr-2 rounded-full"></span>
                  {b}
                </li>
              ))}
            </ul>

            <button 
                onClick={() => {
                  const form = document.getElementById('inquiry-form');
                  form?.scrollIntoView({ behavior: 'smooth' });
                  setFormData(prev => ({ ...prev, tier: tier.name }));
                }}
                className="btn-viren w-full py-3 hover:bg-viren-red hover:text-white hover:border-viren-red text-center block"
            >
              Inquire Now
            </button>
          </motion.div>
        ))}
      </div>

      {/* Inquiry Form */}
      <div id="inquiry-form" className="mt-20 max-w-3xl mx-auto bg-white border border-viren-200 p-8 md:p-12 shadow-xl rounded-lg">
        <h2 className="text-3xl font-serif font-bold text-viren-950 mb-6 text-center">Partnership Inquiry</h2>
        
        {status === 'success' && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-3 animate-fade-in">
            <CheckCircle size={20} />
            <p className="font-bold">Message sent to admin panel!</p>
          </div>
        )}

        {status === 'error' && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-3 animate-fade-in">
            <XCircle size={20} />
            <p className="font-bold">Message not sent. Please try again.</p>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-viren-600 uppercase mb-2">Company Name</label>
              <input 
                type="text" 
                required 
                value={formData.companyName}
                onChange={e => setFormData({...formData, companyName: e.target.value})}
                className="w-full bg-viren-50 border border-viren-200 p-3 outline-none focus:border-viren-red transition-colors rounded-md" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-viren-600 uppercase mb-2">Contact Person</label>
              <input 
                type="text" 
                required 
                value={formData.contactPerson}
                onChange={e => setFormData({...formData, contactPerson: e.target.value})}
                className="w-full bg-viren-50 border border-viren-200 p-3 outline-none focus:border-viren-red transition-colors rounded-md" 
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-viren-600 uppercase mb-2">Email Address</label>
              <input 
                type="email" 
                required 
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full bg-viren-50 border border-viren-200 p-3 outline-none focus:border-viren-red transition-colors rounded-md" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-viren-600 uppercase mb-2">Phone Number</label>
              <input 
                type="tel" 
                required 
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                className="w-full bg-viren-50 border border-viren-200 p-3 outline-none focus:border-viren-red transition-colors rounded-md" 
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
                <label className="block text-xs font-bold text-viren-600 uppercase mb-2">Interested Tier</label>
                <select 
                value={formData.tier}
                onChange={e => setFormData({...formData, tier: e.target.value})}
                className="w-full bg-viren-50 border border-viren-200 p-3 outline-none focus:border-viren-red transition-colors rounded-md"
                >
                <option>Royal Title Sponsor</option>
                <option>Platinum Partner</option>
                <option>Gold Associate</option>
                <option>Other / Custom</option>
                </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-viren-600 uppercase mb-2">Message / Requirements</label>
            <textarea 
              value={formData.message}
              onChange={e => setFormData({...formData, message: e.target.value})}
              className="w-full bg-viren-50 border border-viren-200 p-3 outline-none focus:border-viren-red transition-colors h-32 resize-none rounded-md"
            ></textarea>
          </div>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="btn-viren-filled w-full py-4 text-lg flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : 'Submit Inquiry'}
          </button>
        </form>
      </div>

      <div className="mt-20 text-center bg-white p-10 border border-viren-200 shadow-sm rounded-lg relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-5">
          <StaticImage 
            alt="Sponsorship Background"
            className="w-full h-full object-cover"
            aspectRatio="16:9"
          />
        </div>
        <div className="relative z-10">
          <h2 className="text-2xl font-bold text-viren-950 mb-4 font-serif">Why Sponsor SVAR?</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-8">
              <div>
                  <div className="text-3xl font-bold text-viren-red mb-1">100k+</div>
                  <div className="text-viren-600 text-xs uppercase">Footfall</div>
              </div>
              <div>
                  <div className="text-3xl font-bold text-viren-red mb-1">50k+</div>
                  <div className="text-viren-600 text-xs uppercase">Digital Reach</div>
              </div>
              <div>
                  <div className="text-3xl font-bold text-viren-red mb-1">9 Days</div>
                  <div className="text-viren-600 text-xs uppercase">Of Celebration</div>
              </div>
              <div>
                  <div className="text-3xl font-bold text-viren-red mb-1">Elite</div>
                  <div className="text-viren-600 text-xs uppercase">Audience Profile</div>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sponsorship;