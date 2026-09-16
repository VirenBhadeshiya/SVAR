import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Download, Printer, CheckCircle, Search, ShieldCheck, QrCode } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { usePopup } from './PopupContext';

interface GSTInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GSTInvoiceModal: React.FC<GSTInvoiceModalProps> = ({ isOpen, onClose }) => {
  const { showPopup } = usePopup();
  const [bookingId, setBookingId] = useState('');
  const [phone, setPhone] = useState('');
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [searching, setSearching] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearching(true);
    
    setTimeout(() => {
      // Generate realistic GST Invoice data
      const id = bookingId.trim() || `SVAR-2026-${Math.floor(100000 + Math.random() * 900000)}`;
      const baseAmount = 1271.19;
      const cgst = 114.41;
      const sgst = 114.41;
      const total = 1500.00;

      setInvoiceData({
        invoiceNo: `INV/2026/${Math.floor(1000 + Math.random() * 9000)}`,
        bookingId: id,
        date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        customerName: 'SVAR Registered Participant',
        phone: phone || '+91 98765 43210',
        passType: 'SEASON PASS (1-9 NORATA)',
        hsnCode: '999692',
        gstin: '24AAACS9988F1Z5',
        baseAmount,
        cgst,
        sgst,
        totalAmount: total,
        status: 'PAID'
      });
      setSearching(false);
    }, 400);
  };

  const handleDownloadPDF = () => {
    if (!invoiceData) return;
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFillColor(32, 50, 76); // #20324C
      doc.rect(0, 0, 210, 35, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('SVAR 2026 - TAX INVOICE', 15, 20);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Shri Vishwakarma Arvachin Rasotsav, Rajkot', 15, 28);
      doc.text(`GSTIN: ${invoiceData.gstin}`, 140, 20);
      doc.text(`Invoice No: ${invoiceData.invoiceNo}`, 140, 28);

      // Bill Details
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Billed To:', 15, 50);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Customer Name: ${invoiceData.customerName}`, 15, 58);
      doc.text(`Phone: ${invoiceData.phone}`, 15, 65);
      doc.text(`Booking ID: ${invoiceData.bookingId}`, 15, 72);
      doc.text(`Invoice Date: ${invoiceData.date}`, 15, 79);

      // Table Header
      doc.setFillColor(241, 245, 249);
      doc.rect(15, 90, 180, 10, 'F');
      doc.setFont('helvetica', 'bold');
      doc.text('Description', 20, 96);
      doc.text('HSN', 90, 96);
      doc.text('Qty', 120, 96);
      doc.text('Amount (INR)', 150, 96);

      // Table Row
      doc.setFont('helvetica', 'normal');
      doc.text(invoiceData.passType, 20, 108);
      doc.text(invoiceData.hsnCode, 90, 108);
      doc.text('1', 120, 108);
      doc.text(`Rs. ${invoiceData.baseAmount.toFixed(2)}`, 150, 108);

      // Calculation Breakdown
      doc.line(15, 118, 195, 118);
      doc.text('Base Price:', 120, 128);
      doc.text(`Rs. ${invoiceData.baseAmount.toFixed(2)}`, 160, 128);

      doc.text('CGST (9%):', 120, 135);
      doc.text(`Rs. ${invoiceData.cgst.toFixed(2)}`, 160, 135);

      doc.text('SGST (9%):', 120, 142);
      doc.text(`Rs. ${invoiceData.sgst.toFixed(2)}`, 160, 142);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Total Paid:', 120, 153);
      doc.text(`Rs. ${invoiceData.totalAmount.toFixed(2)}`, 160, 153);

      // Footer
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 116, 139);
      doc.text('This is a computer generated tax invoice and requires no physical signature.', 15, 180);
      doc.text('Organized by Gajjar Suthar Gnati, Rajkot. Helpline: +91 98765 43210', 15, 186);

      doc.save(`SVAR_Invoice_${invoiceData.bookingId}.pdf`);

      showPopup({
        titleEn: '📄 Invoice Downloaded',
        titleGu: '📄 જીએસટી ઇનવોઇસ ડાઉનલોડ થયું',
        messageEn: `GST Invoice PDF for ${invoiceData.bookingId} downloaded successfully.`,
        messageGu: `બુકિંગ ID ${invoiceData.bookingId} માટે જીએસટી ઇનવોઇસ પીડીએફ ડાઉનલોડ થઈ ગયું છે.`,
        type: 'success'
      });
    } catch (err) {
      console.error('PDF Generation Failed', err);
      showPopup({
        titleEn: '❌ Download Error',
        titleGu: '❌ ડાઉનલોડમાં ભૂલ',
        messageEn: 'Failed to generate PDF. Please try printing instead.',
        messageGu: 'પીડીએફ બનાવવામાં ભૂલ આવી છે.',
        type: 'error'
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="bg-[#18263C] text-white p-5 flex items-center justify-between border-b-4 border-[#731515]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#731515] text-amber-300 flex items-center justify-center font-bold shadow">
                <FileText size={22} />
              </div>
              <div>
                <h3 className="font-bold text-lg font-serif">GST Tax Invoice Portal</h3>
                <p className="text-xs text-slate-300">Instant GST Receipt & Payment Tax Document</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-slate-300 hover:text-white">
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            {/* Search Input */}
            <form onSubmit={handleSearch} className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                Enter Booking ID / Mobile Number
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={bookingId}
                  onChange={(e) => setBookingId(e.target.value)}
                  placeholder="e.g. SVAR-2026-987654 or 9876543210"
                  className="flex-1 text-sm p-3 border border-slate-300 rounded-xl focus:outline-none focus:border-[#731515]"
                />
                <button
                  type="submit"
                  disabled={searching}
                  className="bg-[#731515] hover:bg-[#8E2121] text-white font-bold px-5 py-3 rounded-xl text-xs flex items-center gap-2 shadow"
                >
                  <Search size={16} /> {searching ? 'Searching...' : 'Fetch Invoice'}
                </button>
              </div>
            </form>

            {/* Invoice Display */}
            {invoiceData ? (
              <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 space-y-5 shadow-sm">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1 w-fit mb-1">
                      <CheckCircle size={12} /> {invoiceData.status} TAX INVOICE
                    </span>
                    <h4 className="font-bold text-lg text-slate-900 font-serif">SVAR 2026 E-Pass GST Receipt</h4>
                    <p className="text-xs text-slate-500">GSTIN: {invoiceData.gstin} | HSN: {invoiceData.hsnCode}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-500">Invoice No</p>
                    <p className="font-mono text-sm font-bold text-slate-900">{invoiceData.invoiceNo}</p>
                    <p className="text-xs text-slate-500 mt-1">{invoiceData.date}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl">
                  <div>
                    <span className="text-slate-500 block">Billed To:</span>
                    <span className="font-bold text-slate-900 block text-sm">{invoiceData.customerName}</span>
                    <span className="text-slate-600 block">{invoiceData.phone}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Booking Reference:</span>
                    <span className="font-mono font-bold text-[#731515] block text-sm">{invoiceData.bookingId}</span>
                    <span className="text-slate-600 block">Pass: {invoiceData.passType}</span>
                  </div>
                </div>

                {/* Amount Table */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b text-slate-600 font-medium">
                    <span>Base Ticket Price:</span>
                    <span className="font-mono">₹{invoiceData.baseAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b text-slate-600 font-medium">
                    <span>CGST (9%):</span>
                    <span className="font-mono">₹{invoiceData.cgst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b text-slate-600 font-medium">
                    <span>SGST (9%):</span>
                    <span className="font-mono">₹{invoiceData.sgst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2 text-base font-bold text-slate-900 border-t-2 border-slate-900">
                    <span>Grand Total Paid:</span>
                    <span className="font-mono text-[#731515]">₹{invoiceData.totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={handleDownloadPDF}
                    className="flex-1 bg-[#731515] hover:bg-[#8E2121] text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-transform hover:scale-[1.02]"
                  >
                    <Download size={16} /> Download GST PDF Invoice
                  </button>
                  <button
                    onClick={handlePrint}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-300"
                  >
                    <Printer size={16} /> Print
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 space-y-3 text-slate-500">
                <FileText size={48} className="mx-auto text-slate-300" />
                <p className="text-sm font-medium">Enter your Booking ID or Mobile number above to view & download your GST tax invoice.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
