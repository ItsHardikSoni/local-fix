import React, { createContext, useContext, ReactNode, useState } from 'react';

type UserContextType = {
  district: string;
  setDistrict: (d: string) => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({
  children,
  district: initialDistrict,
}: {
  children: ReactNode;
  district: string;
}) => {
  const [district, setDistrict] = useState(initialDistrict);

  return (
    <UserContext.Provider value={{ district, setDistrict }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return ctx;
};
