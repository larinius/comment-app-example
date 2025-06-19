import { createContext, useContext, useState, useEffect } from "react";
import { useQuery, useApolloClient } from "@apollo/client";
import { GET_CURRENT_USER } from "../graphql/queries";

type AuthContextType = {
  user: any;
  isLoggedIn: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>(null!);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const client = useApolloClient();
  const [user, setUser] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const { data, refetch } = useQuery(GET_CURRENT_USER, {
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
    skip: !localStorage.getItem("token"),
  });

  useEffect(() => {
    if (data?.currentUser) {
      setUser(data.currentUser);
      setIsLoggedIn(true);
    } else {
      setUser(null);
      setIsLoggedIn(false);
    }
  }, [data]);

  const login = async (token: string) => {
    localStorage.setItem("token", token);
    await client.resetStore();
    await refetch();
  };

  const logout = async () => {
    localStorage.removeItem("token");
    await client.resetStore();
    setUser(null);
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
