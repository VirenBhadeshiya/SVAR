import React, { useState } from 'react';
import { Mail, Phone, MapPin, Loader2, CheckCircle } from 'lucide-react';
import { Logo } from '../components/Logo';
import { mockDb } from '../services/mockDb';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.message) return;

    setIsSubmitting(true);
    try {
      await mockDb.saveInquiry(formData);
      setSubmitted(true);
      setFormData({ name: '', phone: '', email: '', message: '' });
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err) {
      console.error("Inquiry failed", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-20 px-4 max-w-7xl mx-auto bg-viren-50">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div>
          <div className="h-16 w-auto mb-8 text-viren-950">
             <Logo className="h-full w-auto" />
          </div>
          <h1 className="text-4xl font-serif font-bold text-viren-950 mb-6">Get in Touch</h1>
          <p className="text-viren-800 mb-8 leading-relaxed">
            Have questions about bookings, sponsorship, or the event schedule? 
            Our dedicated support team is here to assist you 24/7.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white flex items-center justify-center text-viren-red border border-viren-200 rounded-full shadow-sm">
                <MapPin />
              </div>
              <div>
                <h3 className="text-viren-950 font-bold mb-1">Event Venue</h3>
                <p className="text-viren-600 text-sm">
                  Shri Vishwakarma Arvachin Rasostav Ground,<br />
                  Gondal Rd, Opp. PD Malaviya College,<br />
                  Sardar Nagar, Rajkot, Gujarat 360004
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white flex items-center justify-center text-viren-red border border-viren-200 rounded-full shadow-sm">
                <Phone />
              </div>
              <div>
                <h3 className="text-viren-950 font-bold mb-1">Phone Support</h3>
                <p className="text-viren-600 text-sm">
                  +91 98765 43210 (General)<br />
                  +91 98765 12345 (Emergency)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white flex items-center justify-center text-viren-red border border-viren-200 rounded-full shadow-sm">
                <Mail />
              </div>
              <div>
                <h3 className="text-viren-950 font-bold mb-1">Email</h3>
                <p className="text-viren-600 text-sm">
                  info@svar2026.com<br />
                  support@svar2026.com
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
            <div className="bg-white p-8 border border-viren-200 shadow-xl animate-liquid-up rounded-none">
            <h2 className="text-xl font-bold text-viren-950 mb-6 font-serif">Send Message</h2>
            <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4">
                    <input 
                      type="text" 
                      placeholder="Name" 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="bg-viren-50 border border-viren-200 p-3 text-viren-950 focus:border-viren-red outline-none rounded-none" 
                    />
                    <input 
                      type="text" 
                      placeholder="Phone" 
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="bg-viren-50 border border-viren-200 p-3 text-viren-950 focus:border-viren-red outline-none rounded-none" 
                    />
                </div>
                <input 
                  type="email" 
                  placeholder="Email Address" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-viren-50 border border-viren-200 p-3 text-viren-950 focus:border-viren-red outline-none rounded-none" 
                />
                <textarea 
                  placeholder="Your Message" 
                  rows={4} 
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  className="w-full bg-viren-50 border border-viren-200 p-3 text-viren-950 focus:border-viren-red outline-none rounded-none"
                ></textarea>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-viren-filled w-full py-3 flex items-center justify-center gap-2"
                >
                    {isSubmitting ? <Loader2 className="animate-spin" /> : submitted ? <><CheckCircle size={18} /> Inquiry Sent</> : 'Send Inquiry'}
                </button>
            </form>
            </div>
            
            {/* Embedded Google Map */}
            <div className="overflow-hidden border border-viren-200 h-80 shadow-lg rounded-none">
                <iframe 
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.5436758213214!2d70.7998793!3d22.2686535!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3959cb2d67602a6f%3A0xd24e8efe45fce46!2sShri%20Vishvakarma%20Arvachin%20Rasostav%20Ground!5e1!3m2!1sen!2sin!4v1768970801955!5m2!1sen!2sin" 
                    width="100%" 
                    height="100%" 
                    style={{border:0}} 
                    allowFullScreen={true} 
                    loading="lazy" 
                    referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;