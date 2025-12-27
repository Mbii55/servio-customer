// src/context/BookingContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { BookingFormData } from '../types/booking';

interface BookingContextData {
  bookingData: BookingFormData;
  updateBookingData: (data: Partial<BookingFormData>) => void;
  resetBookingData: () => void;
}

const BookingContext = createContext<BookingContextData>({} as BookingContextData);

const initialBookingData: BookingFormData = {
  serviceId: '',
  scheduledDate: '',
  scheduledTime: '',
  addressId: null,
  selectedAddons: [],
  customerNotes: '',
};

export const BookingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [bookingData, setBookingData] = useState<BookingFormData>(initialBookingData);

  const updateBookingData = (data: Partial<BookingFormData>) => {
    setBookingData((prev) => ({ ...prev, ...data }));
  };

  const resetBookingData = () => {
    setBookingData(initialBookingData);
  };

  return (
    <BookingContext.Provider value={{ bookingData, updateBookingData, resetBookingData }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};