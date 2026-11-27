'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const CompanyContext = createContext(null);

export function CompanyProvider({ children }) {
  const { user } = useAuth();
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);

  const companies = user?.companies || [];

  useEffect(() => {
    if (companies.length > 0) {
      // Check local storage for preference
      const saved = localStorage.getItem('apex_selected_company_id');
      const found = companies.find((c) => c.id === saved);
      if (found) {
        setSelectedCompanyId(found.id);
      } else {
        setSelectedCompanyId(companies[0].id);
        localStorage.setItem('apex_selected_company_id', companies[0].id);
      }
    } else {
      setSelectedCompanyId(null);
    }
  }, [companies]);

  const handleSelectCompany = (companyId) => {
    setSelectedCompanyId(companyId);
    if (companyId) {
      localStorage.setItem('apex_selected_company_id', companyId);
    }
  };

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId) || companies[0] || null;

  return (
    <CompanyContext.Provider
      value={{
        companies,
        selectedCompany,
        selectedCompanyId: selectedCompany?.id || null,
        setSelectedCompanyId: handleSelectCompany,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
}
