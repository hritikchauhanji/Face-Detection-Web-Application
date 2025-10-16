import React, { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const token = localStorage.getItem("accessToken");
      return token ? jwtDecode(token) : null;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) setUser(jwtDecode(token));
  }, []);

  const setAuthUser = (token) => {
    if (token) {
      localStorage.setItem("accessToken", token);
      setUser(jwtDecode(token));
    } else {
      localStorage.removeItem("accessToken");
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setAuthUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
