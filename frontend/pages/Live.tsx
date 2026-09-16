import React from 'react';
import { Play } from 'lucide-react';
import { Logo } from '../components/Logo';

const Live: React.FC = () => {
  return (
    <div className="py-20 px-4 min-h-screen bg-viren-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <div className="w-16 h-auto mx-auto mb-6 text-viren-950">
            <Logo className="w-full h-full" />
          </div>
          <h1 className="text-4xl font-serif font-bold text-viren-950 mb-4">SVAR 2026 Live Broadcast</h1>
          <p className="text-viren-600 max-w-2xl mx-auto">
            Experience the divine energy of Rasotsav from anywhere in the world. 
            Official live stream from the Rajkot Gurjar Suthar Gnati.
          </p>
        </div>

        {/* Theatre Mode Player */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
          <div className="lg:col-span-3 relative aspect-video w-full bg-viren-950 overflow-hidden border-4 border-viren-200 shadow-2xl">
              <div className="absolute inset-0 flex items-center justify-center">
                   <iframe 
                      width="100%" 
                      height="100%" 
                      src="https://www.youtube.com/embed/videoseries?list=UU&index=1" 
                      title="SVAR Live Stream" 
                      frameBorder="0" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                      allowFullScreen
                      className="w-full h-full"
                   ></iframe>
              </div>
          </div>
          
          {/* Live Chat Simulation */}
          <div className="bg-white border-4 border-viren-200 shadow-2xl flex flex-col h-full min-h-[400px]">
            <div className="bg-viren-950 text-white p-3 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                Live Chat
              </span>
              <span className="text-[10px] text-viren-400">2.4k Watching</span>
            </div>
            <div className="flex-grow p-4 space-y-3 overflow-y-auto bg-viren-50/30 text-sm">
              <div className="flex gap-2">
                <span className="font-bold text-viren-900">Rajesh:</span>
                <span className="text-viren-700">Jai Vishwakarma! 🙏</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-viren-900">Sneha:</span>
                <span className="text-viren-700">Beautiful decorations this year!</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-viren-900">Amit:</span>
                <span className="text-viren-700">Missing Rajkot from USA. Thanks for live stream!</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-viren-900">Priya:</span>
                <span className="text-viren-700">When will the celebrity guest arrive?</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-viren-900">Admin:</span>
                <span className="text-viren-red font-bold">Celebrity guest arriving at 9:30 PM! Stay tuned.</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-viren-900">Karan:</span>
                <span className="text-viren-700">The orchestra is amazing! 🥁</span>
              </div>
            </div>
            <div className="p-3 border-t border-viren-100 bg-white">
              <input 
                type="text" 
                placeholder="Say something..." 
                className="w-full bg-viren-50 border border-viren-200 p-2 text-xs outline-none focus:border-viren-red rounded"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center bg-viren-100 p-6 border border-viren-200 shadow-sm">
            <div className="flex items-center gap-4 mb-4 md:mb-0">
                <div className="w-12 h-12 bg-red-600 flex items-center justify-center text-white">
                    <Play fill="white" />
                </div>
                <div>
                    <h3 className="text-viren-950 font-bold">Official Channel</h3>
                    <p className="text-viren-600 text-sm">@rajkotgurjarsutargnati6138</p>
                </div>
            </div>
            <a 
                href="https://www.youtube.com/@rajkotgurjarsutargnati6138" 
                target="_blank" 
                className="btn-viren-filled px-6 py-3 flex items-center gap-2"
            >
                Subscribe on YouTube
            </a>
        </div>
      </div>
    </div>
  );
};

export default Live;