import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StaticImage } from '../components/StaticImage';
import { Camera, Heart, Share2 } from 'lucide-react';

const Gallery: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const categories = ['All', 'Dance', 'Devotion', 'Celebrities', 'Crowd'];
  
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetch('/data/gallery.json')
      .then(res => res.json())
      .then(data => {
        setImages(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load gallery data", err);
        setLoading(false);
      });
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 100 } },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
  };

  const filteredImages = activeCategory === 'All' 
    ? images 
    : images.filter(img => img.category === activeCategory);

  return (
    <div className="bg-viren-50 min-h-screen pb-20">
      {/* Header */}
      <section className="bg-viren-950 py-20 text-center px-4">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-6xl font-serif font-bold text-white mb-4"
        >
          Event Gallery
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-viren-200 max-w-2xl mx-auto"
        >
          Relive the magical moments of SVAR through our lens. From vibrant dances to spiritual devotion.
        </motion.p>
      </section>

      {/* Filter */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="bg-white p-4 shadow-xl flex flex-wrap justify-center gap-4 border border-viren-100">
          {categories.map((cat) => (
            <button 
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2 text-sm font-bold uppercase tracking-widest transition-all ${
                activeCategory === cat ? 'bg-viren-950 text-white' : 'text-viren-600 hover:text-viren-950'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <motion.div 
          layout
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {loading ? (
            <div className="col-span-full py-20 text-center">
              <p className="text-viren-600 font-serif animate-pulse">Gathering memories...</p>
            </div>
          ) : (
            <AnimatePresence mode='popLayout'>
            {filteredImages.map((img, idx) => (
              <motion.div
                key={img.id || img.title}
                layout
                variants={itemVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                whileHover={{ y: -10, scale: 1.02 }}
                className="group relative bg-white border border-viren-200 overflow-hidden shadow-lg rounded-xl"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img 
                    src={img.src}
                    alt={img.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                </div>
                
                <div className="absolute inset-0 bg-gradient-to-t from-viren-950 via-viren-950/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                  <h3 className="text-white font-serif text-xl mb-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">{img.title}</h3>
                  <div className="flex items-center gap-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                    <button className="text-white/80 hover:text-viren-red hover:scale-110 transition-all">
                      <Heart size={18} />
                    </button>
                    <button className="text-white/80 hover:text-white hover:scale-110 transition-all">
                      <Share2 size={18} />
                    </button>
                    <button className="text-white/80 hover:text-white hover:scale-110 transition-all ml-auto">
                      <Camera size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
            </AnimatePresence>
          )}
        </motion.div>
        
        {filteredImages.length === 0 && (
          <div className="text-center py-20">
            <p className="text-viren-400 font-serif italic">No memories found in this category yet...</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Gallery;
