import React, { useEffect, useState } from 'react';
import { motion } from "framer-motion"
import { Logo } from './Logo';

export const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    // Stage 1: Initial (Outline starts drawing)
    const timer1 = setTimeout(() => setStage(1), 100);
    
    // Stage 2: Fill transition (Matches new animation speed approx 3.5s)
    const timer2 = setTimeout(() => setStage(2), 3200); 
    
    // Stage 3: Complete
    const timer3 = setTimeout(() => {
      onComplete();
    }, 5000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] bg-viren-950 flex items-center justify-center overflow-hidden"
      exit={{ opacity: 0, transition: { duration: 0.8 } }}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-radial from-viren-red/20 to-transparent opacity-0"
        animate={stage >= 2 ? { opacity: 0.3, scale: [0.8, 1.1, 1] } : {}}
        transition={{ duration: 1.5, ease: "easeInOut" }}
      />

      <div className="relative z-10 flex flex-col items-center">
        {/* Increased Size: w-80/h-80 on mobile, w-[500px]/h-[500px] on desktop */}
        <div className="w-80 h-80 md:w-[32rem] md:h-[32rem] relative text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
           <Logo 
             className="w-full h-full drop-shadow-2xl" 
             variant={stage >= 2 ? 'filled' : 'outline'}
             animated={true}
           />
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={stage >= 2 ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="mt-12 text-center"
        >
          <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-6">
            <h1 className="text-6xl md:text-8xl font-serif font-bold text-white tracking-widest drop-shadow-md">SVAR</h1>
            <span className="hidden md:block text-white/20 text-5xl font-light">|</span>
            <div className="flex flex-col items-center md:items-start">
              <p className="text-viren-200 text-[10px] md:text-xs tracking-[0.3em] uppercase font-bold opacity-90">
                Design and Developed by
              </p>
              <p className="text-white text-sm md:text-base tracking-[0.2em] uppercase font-black mt-1">
                VIREN BHADESHIYA
              </p>
            </div>
          </div>
          <div className="h-1 w-0 bg-viren-red mx-auto mt-8 rounded-full shadow-[0_0_15px_rgba(115,21,21,1)]" 
               style={{ width: stage >= 2 ? '80%' : '0%', transition: 'width 1.2s ease-out' }}
          ></div>
          <p className="text-viren-200 text-sm md:text-base tracking-[0.4em] mt-6 uppercase font-bold drop-shadow-sm">
            Shri Vishwakarma Arvachin Rasotsav
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
};