import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Sparkles, PhoneCall, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  textGu: string;
  textEn: string;
  time: string;
}

const KNOWLEDGE_BASE: { keywords: string[]; answerGu: string; answerEn: string }[] = [
  {
    keywords: ['time', 'timing', 'ટાઇમ', 'સમય', 'શરૂ', 'ક્યારે'],
    answerGu: 'ગરબા દરરોજ રાત્રે ૭:૦૦ વાગ્યે શરૂ થાય છે અને ૧૨:૦૦ વાગ્યે પૂર્ણ થાય છે. ગેટ એન્ટ્રી ૬:૦૦ વાગ્યાથી ચાલુ થઈ જાય છે.',
    answerEn: 'Garba starts every night at 7:00 PM and concludes by 12:00 AM. Gate entry opens at 6:00 PM.'
  },
  {
    keywords: ['pass', 'ticket', 'પાસ', 'ટિકિટ', 'બુક', 'કિંમત', 'price'],
    answerGu: 'સિઝન પાસ: પુરુષ ₹૧૫૦૦, મહિલા ₹૫૦૦. તમે વેબસાઇટ પર "Pass" અથવા "Register" બટન પર ક્લિક કરીને બુક કરી શકો છો.',
    answerEn: 'Season Pass: Male ₹1500, Female ₹500. You can book by clicking on "Pass" or "Register" on our website.'
  },
  {
    keywords: ['dress', ' attire', 'પોશાક', 'ડ્રેસ', 'કપડાં', 'ચણિયા ચોળી', 'કુર્તો'],
    answerGu: 'ગરબા ગ્રાઉન્ડમાં ટ્રેડિશનલ ગુજરાતી પોશાક (ચણિયા ચોળી / કુર્તા-પાયજામા) ફરજિયાત છે. વેસ્ટર્ન કપડાંમાં પ્રવેશ મળશે નહીં.',
    answerEn: 'Traditional Gujarati attire (Chaniya Choli / Kurta-Pajama) is mandatory for Garba participants.'
  },
  {
    keywords: ['park', 'parking', 'પાર્કિંગ', 'ગાડી', 'બાઇક', 'કાર'],
    answerGu: 'પીડી માલવિયા ગ્રાઉન્ડ પાસે ટુ-વ્હીલર (₹૫૦) અને ફોર-વ્હીલર (₹૨૦૦) માટે વિશાળ સુરક્ષિત પાર્કિંગ ઉપલબ્ધ છે.',
    answerEn: 'Ample secure parking is available for 2-Wheelers (₹50) and 4-Wheelers (₹200) near PD Malaviya Ground.'
  },
  {
    keywords: ['aadhaar', 'id', 'આધાર', 'ઓળખ', 'કાર્ડ'],
    answerGu: 'ગેટ એન્ટ્રી વખતે તમારું ઓરિજિનલ આધાર કાર્ડ અને ડિજિટલ ઈ-પાસ સાથે રાખવો ફરજિયાત છે.',
    answerEn: 'Carrying your original Aadhaar Card along with your digital E-Pass is mandatory at gate entry.'
  },
  {
    keywords: ['food', 'ખાનપાન', 'જમવાનું', 'ફૂડ', 'સ્ટોલ'],
    answerGu: 'ગ્રાઉન્ડની અંદર પ્રખ્યાત બ્રાન્ડ્સના ફાસ્ટ ફૂડ, મોકટેલ્સ અને ટ્રેડિશનલ ડિજિટલ ફૂડ સ્ટોલ્સ ઉપલબ્ધ છે.',
    answerEn: 'Famous fast food brands, mocktails, and traditional food stalls are available inside the venue.'
  }
];

export const AIChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'bot',
      textGu: 'નમસ્તે! હું SVAR 24/7 AI આસિસ્ટન્ટ છું. ગરબા ટાઇમિંગ, પાસ, ડ્રેસ કોડ કે પાર્કિંગ વિશે તમે મને પૂછી શકો છો.',
      textEn: 'Hello! I am the SVAR 24/7 AI Assistant. Ask me anything about Garba timings, passes, dress code, or parking.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-svar-chatbot', handleOpen);
    return () => window.removeEventListener('open-svar-chatbot', handleOpen);
  }, []);

  const handleSend = (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      textGu: query,
      textEn: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');

    setTimeout(() => {
      const lowerQuery = query.toLowerCase();
      const match = KNOWLEDGE_BASE.find(k => k.keywords.some(kw => lowerQuery.includes(kw)));

      let botGu = 'તમારા પ્રશ્ન બદલ આભાર! વધુ માહિતી માટે તમે અમારા 24/7 સપોર્ટ હેલ્પલાઇન +91 98765 43210 પર સંપર્ક કરી શકો છો.';
      let botEn = 'Thank you for asking! For further details, please contact our 24/7 support helpline at +91 98765 43210.';

      if (match) {
        botGu = match.answerGu;
        botEn = match.answerEn;
      }

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        textGu: botGu,
        textEn: botEn,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMsg]);
    }, 600);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-[#731515] hover:bg-[#8E2121] text-white p-4 rounded-full shadow-2xl flex items-center justify-center border-2 border-amber-300/50 transition-all hover:scale-110 group"
        title="24/7 Gujarati AI Chatbot"
      >
        <Bot size={28} className="animate-bounce" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap text-xs font-bold pl-0 group-hover:pl-2">
          24/7 AI Helpdesk
        </span>
      </button>

      {/* Chat Window Dialog */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-20 right-4 sm:right-6 z-50 w-[92vw] sm:w-[380px] h-[520px] bg-white rounded-2xl shadow-2xl border border-viren-200 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-[#20324C] text-white p-4 flex items-center justify-between border-b-2 border-[#731515]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#731515] rounded-full flex items-center justify-center border border-amber-300">
                  <Bot size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-tight flex items-center gap-1.5">
                    <span>SVAR 24/7 AI Bot</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  </h3>
                  <p className="text-[10px] text-viren-200">ગુજરાતી + English Smart Assistant</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-viren-200 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Messages Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'bot' && (
                    <div className="w-7 h-7 rounded-full bg-[#20324C] text-white flex items-center justify-center text-xs shrink-0 mt-1">
                      <Sparkles size={14} className="text-amber-300" />
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] p-3 rounded-xl text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-[#731515] text-white rounded-tr-none shadow-sm'
                        : 'bg-white text-viren-950 border border-viren-200 rounded-tl-none shadow-sm'
                    }`}
                  >
                    <p className="font-semibold">{msg.textGu}</p>
                    {msg.sender === 'bot' && (
                      <p className="text-[10px] text-viren-600 mt-1 border-t pt-1 italic">{msg.textEn}</p>
                    )}
                    <span className="text-[9px] opacity-70 block text-right mt-1 font-mono">{msg.time}</span>
                  </div>

                  {msg.sender === 'user' && (
                    <div className="w-7 h-7 rounded-full bg-[#731515] text-white flex items-center justify-center text-xs shrink-0 mt-1">
                      <User size={14} />
                    </div>
                  )}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Suggestions */}
            <div className="p-2 bg-white border-t border-viren-100 flex gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
              {['ગરબા ટાઇમિંગ?', 'ડ્રેસ કોડ શા માટે?', 'પાર્કિંગ કિંમત?', 'પાસ કઈ રીતે બુક કરવા?'].map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q)}
                  className="px-2.5 py-1 bg-viren-50 hover:bg-viren-redbg text-[#731515] rounded-full border border-viren-200 whitespace-nowrap text-[10px] font-bold"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-white border-t border-viren-200 flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="અહીં તમારો પ્રશ્ન પૂછો... / Ask here..."
                className="flex-1 text-xs p-2.5 border border-viren-300 rounded-lg focus:outline-none focus:border-[#731515]"
              />
              <button
                onClick={() => handleSend()}
                className="p-2.5 bg-[#731515] hover:bg-[#8E2121] text-white rounded-lg transition-colors"
              >
                <Send size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
