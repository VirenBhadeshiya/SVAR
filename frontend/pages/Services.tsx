import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Utensils, Wifi, Car, Shield, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { mockDb } from '../services/mockDb';

const Services: React.FC = () => {
  const [feedbackName, setFeedbackName] = useState('');
  const [feedbackSuggestion, setFeedbackSuggestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackSuggestion.trim()) return;
    
    setIsSubmitting(true);
    setStatus('idle');
    try {
      await mockDb.saveFeedback({
        name: feedbackName || 'Anonymous',
        suggestion: feedbackSuggestion
      });
      setStatus('success');
      setFeedbackName('');
      setFeedbackSuggestion('');
      setTimeout(() => setStatus('idle'), 5000);
    } catch (err) {
      console.error("Feedback failed", err);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const services = [
    {
      icon: <Utensils size={32} />,
      title: "Gourmet Culinary Experience",
      desc: "Indulge in an exquisite selection of premium vegetarian cuisine at our grand food pavilion, meticulously designed for unparalleled hygiene and a delightful dining experience."
    },
    {
      icon: <Wifi size={32} />,
      title: "Venue-Wide High-Speed Connectivity",
      desc: "Stay effortlessly connected and share your magical Navratri moments instantly with our complimentary, uninterrupted high-speed Wi-Fi network."
    },
    {
      icon: <Car size={32} />,
      title: "Executive Valet & Parking Infrastructure",
      desc: "Experience seamless arrivals with our comprehensive parking management, featuring organized zones for over 2,000 vehicles and an exclusive VIP valet service."
    },
    {
      icon: <Shield size={32} />,
      title: "Uncompromising Security Protocol",
      desc: "Your absolute safety is our priority. The venue is meticulously fortified with an elite bouncer team and 360-degree night-vision CCTV surveillance for complete peace of mind."
    },
    {
      icon: <div className="text-xl font-bold">1L</div>,
      title: "1,00,000 Watt Acoustic Engineering",
      desc: "Immerse yourself in a state-of-the-art 1,00,000-Watt line array sound system, precision-engineered to deliver a thunderous, crystal-clear traditional audio experience."
    },
    {
      icon: <div className="text-xl font-bold">1.4L</div>,
      title: "1,40,000 Sq. Ft. Grand Arena",
      desc: "Dance freely under the stars in our expansive 1,40,000 square foot premium ground, masterfully leveled and designed to ensure maximum spatial comfort and grandeur."
    },
    {
      icon: <div className="text-xl font-bold">1500+</div>,
      title: "Massive Performer Capacity",
      desc: "Our sweeping central Garba arena is expertly orchestrated to comfortably accommodate over 1,500 concurrent performers without ever compromising on elegance or safety."
    },
    {
      icon: <div className="text-xl font-bold">LED</div>,
      title: "Cinematic LED Displays",
      desc: "Witness every vibrant moment of the celebration through strategically placed, colossal high-definition LED screens, guaranteeing perfect visibility from absolutely any vantage point."
    },
    {
      icon: <CheckCircle size={32} />,
      title: "Complimentary Community Access",
      desc: "Honoring our deep-rooted heritage, we proudly extend complimentary premium spectator passes exclusively for our esteemed Gajjar Suthar community members."
    }
  ];

  return (
    <div className="py-20 px-4 max-w-7xl mx-auto bg-viren-50">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-viren-950 mb-4">Event Services</h1>
        <p className="text-viren-600 max-w-2xl mx-auto">We go the extra mile to ensure your experience at SVAR 2026 is nothing short of exceptional.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {services.map((s, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="flex gap-6 p-6 bg-white border border-viren-200 hover:border-viren-red hover:shadow-lg transition-all rounded-lg"
          >
            <div className="flex-shrink-0 w-16 h-16 bg-viren-redbg flex items-center justify-center text-viren-red border border-viren-200 rounded-lg">
              {s.icon}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-viren-950 mb-2 font-serif">{s.title}</h3>
              <p className="text-viren-600 leading-relaxed">{s.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Feedback Section */}
      <div className="mt-24 bg-viren-950 text-white p-8 md:p-16 rounded-2xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-viren-red opacity-10 blur-3xl rounded-full -mr-32 -mt-32"></div>
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">Help us improve SVAR</h2>
            <p className="text-viren-200 mb-8 leading-relaxed">
              Your feedback is invaluable to us. Whether it's a suggestion for a new feature or a compliment for our team, we'd love to hear from you.
            </p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-viren-800 rounded-full flex items-center justify-center">
                <Shield className="text-viren-red" size={24} />
              </div>
              <div>
                <p className="text-sm font-bold">Secure & Anonymous</p>
                <p className="text-xs text-viren-400">Your data is protected by SVAR Digital Fortress</p>
              </div>
            </div>
            {status === 'success' && (
              <div className="mt-4 p-3 bg-green-900/50 border border-green-500 text-green-200 rounded-lg flex items-center gap-2 animate-fade-in">
                <CheckCircle size={18} />
                <p className="text-sm font-bold">Message sent to admin panel!</p>
              </div>
            )}
            {status === 'error' && (
              <div className="mt-4 p-3 bg-red-900/50 border border-red-500 text-red-200 rounded-lg flex items-center gap-2 animate-fade-in">
                <XCircle size={18} />
                <p className="text-sm font-bold">Message not sent. Please try again.</p>
              </div>
            )}
          </div>
          <form className="space-y-4" onSubmit={handleFeedbackSubmit}>
            <input 
              type="text" 
              placeholder="Your Name (Optional)" 
              value={feedbackName}
              onChange={(e) => setFeedbackName(e.target.value)}
              className="w-full bg-viren-900 border border-viren-800 p-4 outline-none focus:border-viren-red transition-colors rounded-xl text-white"
            />
            <textarea 
              placeholder="Your Suggestions or Feedback..." 
              value={feedbackSuggestion}
              onChange={(e) => setFeedbackSuggestion(e.target.value)}
              required
              className="w-full bg-viren-900 border border-viren-800 p-4 outline-none focus:border-viren-red transition-colors h-32 resize-none rounded-xl text-white"
            ></textarea>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="btn-viren-filled w-full py-4 text-lg flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 className="animate-spin" /> : status === 'success' ? 'Feedback Sent!' : 'Send Feedback'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Services;