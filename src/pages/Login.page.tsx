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
          const response = await fetch(config.apiBaseUrl + `/api/v1/rsvp/profile/me`, {
            method: 'DELETE',
            headers: {
              'x-uiuc-token': authToken || '',
            }
          });
          const res = await fetch('https://www.acm.illinois.edu/api/v1/syncIdentity/isRequired', {
            method: 'GET',
            headers: {
              'x-uiuc-token': authToken || '',
            }
          });
          const syncRequired = await res.json();
          if (syncRequired?.syncRequired) {
            await fetch('https://core.acm.illinois.edu/api/v1/syncIdentity', {
              method: 'POST',
              headers: {
                'x-uiuc-token': authToken || '',
              }
            });
          }
          if (response.status === 400 || response.status === 404) {
            navigate("/profile?firstTime=true", { replace: true });
          } else if (response.ok) {
            navigate(returnTo || "/home", { replace: true });
          } else {
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