import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Link, useLocation } from 'react-router-dom';
import { Menu, X, ShieldCheck, LogIn, UserPlus, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from './Logo';
import { mockDb } from '../services/mockDb';

const MarqueeAnnouncement: React.FC = () => {
  const [announcement, setAnnouncement] = useState<string | null>(null);

  useEffect(() => {
    const checkAnnouncement = async () => {
      const settings = await mockDb.getSettings();
      setAnnouncement(settings.lastAnnouncement || null);
    };
    checkAnnouncement();
    const interval = setInterval(checkAnnouncement, 10000); // Check every 10s for faster updates
    return () => clearInterval(interval);
  }, []);

  if (!announcement) return null;

  return (
    <div className="bg-viren-red text-white py-1.5 overflow-hidden relative z-[60] border-b border-white/10 shadow-inner">
      <div className="flex whitespace-nowrap animate-marquee items-center">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 font-bold text-[10px] md:text-xs uppercase tracking-[0.2em]">
            <Bell size={14} className="text-white/80" />
            <span>{announcement}</span>
            <span className="text-white/30 ml-4">•</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const links = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Services', path: '/services' },
    { name: 'Gallery', path: '/gallery' },
    { name: 'Live', path: '/live' },
    { name: 'Pass', path: '/pass' },
    { name: 'Sponsors', path: '/sponsors' },
    { name: 'Contact', path: '/contact' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-viren-950 text-white shadow-md border-b border-viren-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center gap-3 group">
             <div className="h-10 w-auto transition-transform group-hover:scale-105 text-white">
                <Logo className="h-full w-auto" />
             </div>
          </Link>
          
          <div className="hidden lg:block">
            <div className="ml-10 flex items-center space-x-4">
              {links.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`px-3 py-2 text-sm font-medium transition-all duration-300 relative overflow-hidden group ${
                    isActive(link.path)
                      ? 'text-white font-bold after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-viren-red'
                      : 'text-viren-200 hover:text-white'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              
              <div className="h-5 w-px bg-viren-800 mx-2"></div>

              <Link 
                to="/login" 
                className="group relative px-4 py-2 rounded-none overflow-hidden border border-viren-700 hover:border-viren-500 transition-colors"
              >
                <div className="absolute inset-0 w-0 bg-viren-800 transition-all duration-[250ms] ease-out group-hover:w-full opacity-50"></div>
                <div className="relative flex items-center gap-2 text-viren-100 group-hover:text-white text-sm font-medium">
                  <LogIn size={16} />
                  <span>Sign in</span>
                </div>
              </Link>

              <Link 
                to="/booking" 
                className="btn-viren-filled text-xs py-2 px-5 shadow-md hover:shadow-lg border border-viren-red/50 flex items-center gap-2"
              >
                <UserPlus size={16} />
                <span>Register</span>
              </Link>
              
              <Link to="/admin" className="text-viren-200 hover:text-white transition-colors ml-2" title="Admin">
                <ShieldCheck size={20} />
              </Link>
            </div>
          </div>

          <div className="-mr-2 flex lg:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-none text-white hover:bg-viren-900 focus:outline-none"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-viren-950 border-b border-viren-900 overflow-hidden shadow-lg"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {links.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`block px-3 py-2 text-base font-medium rounded-none ${
                    isActive(link.path)
                      ? 'text-white bg-viren-900 font-bold'
                      : 'text-viren-200 hover:text-white hover:bg-viren-900'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
               <Link 
                 to="/login" 
                 onClick={() => setIsOpen(false)} 
                 className="flex items-center gap-2 px-3 py-2 text-viren-200 hover:text-white hover:bg-viren-900 rounded-none mt-2"
               >
                 <LogIn size={18} />
                 Sign in
               </Link>
               <Link 
                 to="/booking" 
                 onClick={() => setIsOpen(false)} 
                 className="flex items-center justify-center gap-2 px-3 py-2 text-white font-bold bg-viren-red mt-2 rounded-none text-center"
               >
                 <UserPlus size={18} />
                 Register
               </Link>
              <Link to="/admin" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-viren-200 mt-2 text-center text-sm">Admin Portal</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Footer: React.FC = () => (
  <footer className="bg-viren-950 border-t border-viren-900 py-12 mt-auto text-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="col-span-1 md:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-auto text-white">
                <Logo className="h-full w-auto" />
            </div>
          </div>
          <p className="text-viren-200 text-sm leading-relaxed max-w-sm">
            Shri Vishwakarma Arvachin Rasotsav. A legacy of culture, devotion, and community unity since 1958. 
            Organized by the Gajjar Suthar Gnati, Rajkot.
          </p>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Venue</h3>
          <p className="text-viren-200 text-sm">
            Shri Vishwakarma Arvachin Rasostav Ground,<br/>
            Gondal Rd, Opp. PD Malaviya College,<br/>
            Sardar Nagar, Rajkot, Gujarat 360004
          </p>
          <a href="https://maps.google.com" target="_blank" className="text-viren-redlight text-xs mt-2 inline-block hover:underline">View on Map</a>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Links</h3>
          <ul className="space-y-2 text-sm text-viren-200">
            <li><Link to="/login" className="hover:text-viren-redlight transition-colors">Login</Link></li>
            <li><Link to="/gallery" className="hover:text-viren-redlight transition-colors">Gallery</Link></li>
            <li><Link to="/pass" className="hover:text-viren-redlight transition-colors">Digital Pass</Link></li>
            <li><Link to="/sponsors" className="hover:text-viren-redlight transition-colors">Sponsorship</Link></li>
            <li><Link to="/live" className="hover:text-viren-redlight transition-colors">Live Stream</Link></li>
            <li><Link to="/contact" className="hover:text-viren-redlight transition-colors">Contact Us</Link></li>
          </ul>
        </div>
      </div>
      <div className="mt-8 border-t border-viren-900 pt-8 text-center flex flex-col md:flex-row justify-between items-center">
        <p className="text-viren-200 text-xs">© 2026 SVAR Events. All rights reserved.</p>
        <p className="text-viren-200 text-xs mt-2 md:mt-0 flex items-center gap-1">
          Secured by <ShieldCheck size={12} className="text-viren-red" /> SVAR Digital Fortress
        </p>
      </div>
    </div>
  </footer>
);

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col text-viren-950 font-sans selection:bg-viren-red selection:text-white relative">
      <div className="fixed inset-0 z-[-1]">
        <img 
          src="/images/gallery/ai_img_8.png"
          alt="Event Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-white/30 backdrop-blur-sm"></div>
      </div>
      <MarqueeAnnouncement />
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
};