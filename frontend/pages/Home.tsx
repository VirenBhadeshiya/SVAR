import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Music, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { StaticImage } from '../components/StaticImage';

const Home: React.FC = () => {
  return (
    <div className="relative overflow-hidden w-full">
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center justify-center">

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center"
          >
            <div className="w-48 md:w-64 h-auto mb-8 animate-float text-viren-950">
              <Logo className="w-full h-full" />
            </div>

            <h2 className="text-white tracking-[0.2em] text-sm md:text-lg uppercase mb-4 font-semibold font-serif animate-shutter">
              Shri Vishwakarma Arvachin Rasotsav
            </h2>
            <h1 className="text-5xl md:text-8xl font-serif font-bold text-viren-950 mb-6 drop-shadow-sm lining-nums">
              SVAR 2026
            </h1>
            <p className="text-white text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed drop-shadow-md">
              Experience the grandeur of tradition meeting luxury. Join us for a night of rhythm, devotion, and celebration in the heart of Rajkot.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/booking"
                className="btn-viren-filled px-8 py-4 text-lg shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                Book Your Pass <ChevronRight size={20} />
              </Link>
              <Link
                to="/about"
                className="btn-viren-white px-8 py-4 text-lg"
              >
                Learn More
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Info Cards */}
      <section className="py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={{ y: -10 }}
              className="p-8 border border-viren-200 bg-white text-center group hover:border-viren-red transition-all shadow-md rounded-xl"
            >
              <div className="w-14 h-14 mx-auto mb-6 flex items-center justify-center bg-viren-redbg text-viren-red rounded-lg group-hover:bg-viren-red group-hover:text-white transition-colors">
                <Calendar size={28} />
              </div>
              <h3 className="text-xl font-semibold text-viren-950 mb-2 font-serif">October 2026</h3>
              <p className="text-viren-600">Mark your calendars for the most awaited cultural gathering of the year.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ y: -10 }}
              className="p-8 border border-viren-200 bg-white text-center group hover:border-viren-red transition-all shadow-md rounded-xl"
            >
              <div className="w-14 h-14 mx-auto mb-6 flex items-center justify-center bg-viren-redbg text-viren-red rounded-lg group-hover:bg-viren-red group-hover:text-white transition-colors">
                <MapPin size={28} />
              </div>
              <h3 className="text-xl font-semibold text-viren-950 mb-2 font-serif">PD Malaviya Ground</h3>
              <p className="text-viren-600">Gondal Road, Opp. PD Malaviya College, Sardar Nagar, Rajkot.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ y: -10 }}
              className="p-8 border border-viren-200 bg-white text-center group hover:border-viren-red transition-all shadow-md rounded-xl"
            >
              <div className="w-14 h-14 mx-auto mb-6 flex items-center justify-center bg-viren-redbg text-viren-red rounded-lg group-hover:bg-viren-red group-hover:text-white transition-colors">
                <Music size={28} />
              </div>
              <h3 className="text-xl font-semibold text-viren-950 mb-2 font-serif">Live Orchestra</h3>
              <p className="text-viren-600">Featuring top artists and traditional beats to keep you dancing all night.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* News & Announcements */}
      <section className="py-20 bg-viren-950 text-white overflow-hidden relative">
        <div className="absolute inset-0 opacity-5">
          <StaticImage
            alt="News Background"
            className="w-full h-full object-cover"
            aspectRatio="16:9"
          />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <h2 className="text-viren-red tracking-widest text-sm uppercase font-bold mb-2">Latest Updates</h2>
              <h3 className="text-4xl md:text-5xl font-serif font-bold">News & Announcements</h3>
            </div>
            <Link to="/services" className="text-viren-200 hover:text-white transition-colors flex items-center gap-2 font-bold uppercase tracking-widest text-xs">
              View All Services <ChevronRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="bg-viren-900/50 border border-viren-800 p-8 rounded-2xl hover:bg-viren-900 transition-colors group"
            >
              <span className="inline-block px-3 py-1 bg-viren-red text-[10px] font-bold uppercase tracking-widest mb-4">New Feature</span>
              <h4 className="text-2xl font-serif font-bold mb-4 group-hover:text-white transition-colors">Digital Pass System Launched</h4>
              <p className="text-viren-300 mb-6 leading-relaxed">
                We are excited to announce our new Digital Pass system. No more physical tickets! Simply register, pay, and get your QR-coded pass on your profile.
              </p>
              <Link to="/booking" className="flex items-center gap-2 text-white font-bold text-sm hover:underline">
                Register Now <ChevronRight size={16} />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="bg-viren-900/50 border border-viren-800 p-8 rounded-2xl hover:bg-viren-900 transition-colors group"
            >
              <span className="inline-block px-3 py-1 bg-viren-red text-[10px] font-bold uppercase tracking-widest mb-4">Event Update</span>
              <h4 className="text-2xl font-serif font-bold mb-4 group-hover:text-white transition-colors">Sponsorship Tiers Announced</h4>
              <p className="text-viren-300 mb-6 leading-relaxed">
                Join us as a partner for SVAR 2026. We have announced three exclusive sponsorship tiers with premium branding opportunities.
              </p>
              <Link to="/sponsors" className="flex items-center gap-2 text-white font-bold text-sm hover:underline">
                View Tiers <ChevronRight size={16} />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;