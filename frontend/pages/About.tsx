import React from 'react';
import { motion } from 'framer-motion';
import { StaticImage } from '../components/StaticImage';

const About: React.FC = () => {
  return (
    <div className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-viren-50">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-viren-950 mb-4">Our Heritage</h1>
        <div className="h-1 w-24 bg-viren-red mx-auto"></div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
        <motion.div
           initial={{ opacity: 0, x: -50 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ delay: 0.2, type: 'spring' }}
        >
          <img 
            src="/images/about_us.png"
            alt="Indian Heritage"
            className="shadow-2xl border-4 border-viren-100 grayscale hover:grayscale-0 transition-all duration-500 w-full object-cover aspect-[4/3]"
          />
        </motion.div>
        
        <motion.div
           initial={{ opacity: 0, x: 50 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ delay: 0.4, type: 'spring' }}
           className="space-y-6"
        >
          <h2 className="text-2xl font-bold text-viren-950 font-serif">Legacy of Gajjar Suthar Gnati</h2>
          <p className="text-viren-800 leading-relaxed">
            Since 1958, the Gajjar Suthar community has been a beacon of craftsmanship, culture, and unity in Rajkot. 
            What started as a small gathering has now evolved into SVAR - a grand celebration that honors our roots while embracing the future.
          </p>
          <p className="text-viren-800 leading-relaxed">
            SVAR (Shri Vishwakarma Arvachin Rasotsav) is not just an event; it is an emotion. It represents the collective spirit of thousands of families coming together to celebrate Navratri with devotion and joy.
          </p>
          <div className="grid grid-cols-2 gap-4 mt-8">
             <div className="p-4 bg-viren-100 border border-viren-200 hover:shadow-md transition-shadow">
                <div className="text-3xl font-bold text-viren-950">68</div>
                <div className="text-viren-600 text-sm uppercase tracking-wide">Years of Legacy</div>
             </div>
             <div className="p-4 bg-viren-100 border border-viren-200 hover:shadow-md transition-shadow">
                <div className="text-3xl font-bold text-viren-950">50k+</div>
                <div className="text-viren-600 text-sm uppercase tracking-wide">Community Members</div>
             </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default About;