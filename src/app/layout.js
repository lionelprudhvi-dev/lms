import React from 'react';
import ThemeRegistry from '@/theme/ThemeRegistry';
import { AuthProvider } from '@/context/AuthContext';
import { CompanyProvider } from '@/context/CompanyContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { ToastProvider } from '@/context/ToastContext';

export const metadata = {
  title: 'Apex Enterprise LMS | Unified Learning & Fee Management',
  description: 'Enterprise Learning Management System with integrated fee collection, attendance geofencing, and certification.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head />
      <body>
        <ThemeRegistry>
          <ToastProvider>
            <AuthProvider>
              <CompanyProvider>
                <NotificationProvider>
                  {children}
                </NotificationProvider>
              </CompanyProvider>
            </AuthProvider>
          </ToastProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
