import {
    BrowserAuthError,
  InteractionRequiredAuthError,
  InteractionStatus,
} from "@azure/msal-browser";
import { useMsal } from "@azure/msal-react";
import { MantineProvider } from "@mantine/core";
import { 
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import FullScreenLoader from "./LoadingScreen";

type AuthUser = {
  email?: string;
  name?: string;
};

interface AuthContextType {
  isLoggedIn: boolean;
  user: AuthUser | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { instance, accounts, inProgress } = useMsal();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (inProgress !== InteractionStatus.None) return;

    instance.handleRedirectPromise().then((result) => {
      const account = result?.account ?? accounts[0];
      if (!account) return;

      instance.setActiveAccount(account);
      setUser({
        email: account.username,
        name: account.name ?? undefined,
      });
      setIsLoggedIn(true);
    });
  }, [instance, accounts, inProgress]);

  const login = useCallback(async () => {
    await instance.loginRedirect({
      scopes: ["openid", "profile", "email"],
    });
  }, [instance]);

  const logout = useCallback(async () => {
    setUser(null);
    setIsLoggedIn(false);
    await instance.logoutRedirect();
  }, [instance]);

  const getToken = useCallback(async () => {
    const account = instance.getActiveAccount();
    if (!account) return null;

    const tokenRequest = {
      account,
      scopes: ["User.Read"], 
      authority: import.meta.env.VITE_AAD_AUTHORITY,
      forceRefresh: false,
    };

    try {
      const res = await instance.acquireTokenSilent(tokenRequest);
      return res.accessToken;
    } catch (err) {
      if (err instanceof InteractionRequiredAuthError) {
        try {
          // ✅ Fallback to Popup (instead of Redirect) to match your snippet
          const res = await instance.acquireTokenPopup(tokenRequest);
          return res.accessToken;
        } catch (popupError) {
          if (
            popupError instanceof BrowserAuthError &&
            popupError.errorCode === "popup_window_error"
          ) {
            alert(
              "Your browser is blocking popups. Please allow popups for this site and try again."
            );
          }
          console.error("MSAL popup token acquisition failed:", popupError);
          return null;
        }
      }
      console.error("MSAL silent token acquisition failed:", err);
      return null;
    }
  }, [instance]);

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        user,
        login,
        logout,
        getToken,
      }}
    >
      {inProgress !== InteractionStatus.None ? (
        <MantineProvider>
          <FullScreenLoader />
        </MantineProvider>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

