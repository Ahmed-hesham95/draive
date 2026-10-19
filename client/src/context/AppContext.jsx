import { createContext, useContext, useState } from "react";
import api from "../config/api";
import { toast } from "react-hot-toast";

const AppContext = createContext()


const getErrMsg = (err, fallback) => err.response?.data?.error || fallback;

export const AppProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    // Auth Actions Helper
    const authAction = async ( requestFn , successMsg , errorFallback )=>{
        try {
           const {data} = await requestFn();
            setUser(data.user);
            if(successMsg) toast.success(successMsg);
            return true;
        } catch (error) {
            toast.error(getErrMsg(error, errorFallback));
            return false;
        }
    }
    const login = (email, password) => {
        return  authAction(()=> api.post("/api/auth/login", { email, password }), "Welcome back!", "Failed to login. Please check your credentials.");
    }

    const register = (name, email, password) => {
        return  authAction(()=> api.post("/api/auth/register", { name, email, password }), "Account created successfully!", "Failed to create account. Please try again.");
    }

    const logout = async () => {
        try {
            await api.post("/api/auth/logout");
            setUser(null);
            toast.success("Logged out successfully!");
        } catch (error) {
            toast.error("Failed to logout. Please try again.");
        }
    }
    const value = {
        user,
        setUser,
        login,
        register,
        logout
    }
  return <AppContext.Provider value={value}>
    {children}
  </AppContext.Provider>
}

export const useApp = ()=> useContext(AppContext);