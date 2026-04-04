import React from 'react';
import { BookingForm } from '../components/BookingForm';

const Booking: React.FC = () => {
  return (
    <div className="py-20 px-4 bg-viren-50 min-h-screen">
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-viren-950 mb-4">SECURE BOOKING</h1>
        <p className="text-viren-600 font-light">Complete your verification to access the premium event.</p>
      </div>
      <div className="max-w-3xl mx-auto">
        <BookingForm />
      </div>
      <div className="mt-8 text-center max-w-2xl mx-auto">
          <p className="text-gray-500 text-xs">
              For any booking related assistance, please contact our helpline. 
              <br/>Designed & Developed for Gajjar Suthar Gnati.
          </p>
      </div>
    </div>
  );
};

export default Booking;