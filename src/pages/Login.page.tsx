import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Center, Alert, Stack } from "@mantine/core";
import { IconAlertCircle, IconAlertTriangle } from "@tabler/icons-react";
import LogoBadge from "../components/Logo";
import { config } from "../config";
import { useAuth } from "../components/AuthContext"; 
import { LoginComponent } from "../components/LoginComponent";

export function LoginPage() {
  const navigate = useNavigate();
  const { isLoggedIn, user, getToken } = useAuth();
  const [searchParams] = useSearchParams();
  
  const showLogoutMessage = searchParams.get("lc") === "true";
  const showLoginMessage = !showLogoutMessage && searchParams.get("li") === "true";
  const returnTo = searchParams.get("returnTo");

  useEffect(() => {
    const checkProfile = async () => {
      if (isLoggedIn && user) {
        const authToken = await getToken();
        try {
          console.log("Checking");
          const response = await fetch(config.apiBaseUrl + `/api/v1/rsvp/profile/me`, {
            method: 'DELETE',
            headers: {
              'x-uiuc-token': authToken || '',
            }
          });
          console.log(response.status);
          if (response.status === 400 || response.status === 404) {
            navigate("/profile?firstTime=true", { replace: true });
          } else if (response.ok) {
            // Profile exists, redirect to returnTo or home
            navigate(returnTo || "/home", { replace: true });
          } else {
            // Other errors, send to profile setup to be safe
            navigate("/profile?firstTime=true", { replace: true });
          }
        } catch (error) {
          console.error("Error checking profile:", error);
          navigate("/profile?firstTime=true");
        }
      }
    };
    
    checkProfile();
  }, [isLoggedIn, user, navigate, getToken]);

  return (
    <div style={{ display: "flex", flexFlow: "column", height: "100vh" }}>
      <LogoBadge size="1em" linkTo="/" showText={true} />
      <Stack gap="xs" className="p-4 max-w-md mx-auto w-full">
        {showLogoutMessage && (
          <Alert icon={<IconAlertCircle />} title="Logged Out" color="blue">
            You have successfully logged out.
          </Alert>
        )}
        
        {showLoginMessage && (
          <Alert icon={<IconAlertTriangle />} title="Auth Required" color="orange">
            You must log in to view this page.
          </Alert>
        )}
      </Stack>

      <Center style={{ flexGrow: 1 }}>
        <LoginComponent />
      </Center>
    </div>
  );
}