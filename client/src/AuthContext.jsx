import { createContext, useState, useContext, useEffect } from "react";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchUserData(token);
    } else {
      setLoading(false);
    }
  }, []);

  // In fetchUserData function, add better error handling:
  const fetchUserData = async (token) => {
    try {
      console.log(
        "🔍 Fetching user data with token:",
        token ? "Token exists" : "No token"
      );
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("🔍 Auth response status:", response.status);

      if (response.ok) {
        const userData = await response.json();
        console.log("✅ User data fetched:", userData);
        setUser(userData);
      } else {
        console.error("❌ Auth failed, status:", response.status);
        localStorage.removeItem("token");
      }
    } catch (error) {
      console.error("❌ Error fetching user data:", error);
      console.error("❌ Error details:", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Function that Login component is calling
  const setAuthData = (token, userData) => {
    localStorage.setItem("token", token);
    setUser(userData);
  };

  const login = (token, userData) => {
    localStorage.setItem("token", token);
    setUser(userData);
  };

  const logout = () => {
    // Call backend logout endpoint
    fetch(`${import.meta.env.VITE_API_URL}}/logout`, {
      method: "POST",
      credentials: "include",
    }).catch(console.error);

    localStorage.removeItem("token");
    setUser(null);
  };

  const updateUser = (updatedData) => {
    setUser((prev) => ({ ...prev, ...updatedData }));
  };

  const value = {
    user,
    login,
    logout,
    setAuthData,
    updateUser,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
