import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { SplashScreen } from './components/SplashScreen';
import { AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Logo } from './components/Logo';

// Static Imports to prevent dynamic import errors in this environment
import Home from './pages/Home';
import About from './pages/About';
import Gallery from './pages/Gallery';
import Services from './pages/Services';
import Live from './pages/Live';
import Booking from './pages/Booking';
import Admin from './pages/Admin';
import Profile from './pages/Profile';
import Sponsorship from './pages/Sponsorship';
import Contact from './pages/Contact';
import Login from './pages/Login';

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  
  return null;
};

// Loading Fallback Component
const PageLoader = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center">
    <div className="w-16 h-16 text-viren-200 animate-pulse mb-4">
        <Logo variant="outline" />
    </div>
    <Loader2 className="w-8 h-8 text-viren-950 animate-spin" />
  </div>
);

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // App initialization logic
    const handleRejection = (event: PromiseRejectionEvent) => {
      if (event.reason && event.reason.message && event.reason.message.includes('WebSocket closed without opened')) {
        event.preventDefault();
        console.debug('Suppressed benign WebSocket rejection');
      } else {
        console.error('Unhandled Promise Rejection caught globally:', event.reason);
        // We prevent default so it doesn't trigger unhandled native browser exceptions that might freeze the app
        event.preventDefault();
      }
    };

    const handleError = (event: ErrorEvent) => {
      console.error('Unhandled Error caught globally:', event.error);
      event.preventDefault();
    };

    window.addEventListener('unhandledrejection', handleRejection);
    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('unhandledrejection', handleRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  return (
    <>
      <AnimatePresence>
        {isLoading && <SplashScreen onComplete={() => setIsLoading(false)} />}
      </AnimatePresence>
      
      {!isLoading && (
        <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ScrollToTop />
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/services" element={<Services />} />
              <Route path="/live" element={<Live />} />
              <Route path="/booking" element={<Booking />} />
              <Route path="/login" element={<Login />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/pass" element={<Profile />} />
              <Route path="/sponsors" element={<Sponsorship />} />
              <Route path="/contact" element={<Contact />} />
            </Routes>
          </Layout>
        </HashRouter>
      )}
    </>
  );
};

export default App;
