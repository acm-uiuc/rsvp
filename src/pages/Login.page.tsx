import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Center, Alert, Stack } from "@mantine/core";
import { IconAlertCircle, IconAlertTriangle } from "@tabler/icons-react";

import { useAuth } from "../components/AuthContext"; 
import { LoginComponent } from "../components/LoginComponent";

export function LoginPage() {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();
  const [searchParams] = useSearchParams();
  
  const showLogoutMessage = searchParams.get("lc") === "true";
  const showLoginMessage = !showLogoutMessage && searchParams.get("li") === "true";

  useEffect(() => {
    if (isLoggedIn && user) {
        if (!user.name) {
            navigate("/profile?firstTime=true");
        } else {
            navigate("/home");
        }
    }
  }, [isLoggedIn, user, navigate]);

  return (
    <div className="flex flex-col h-screen w-full">
      
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

      <Center className="flex-grow">
        <LoginComponent />
      </Center>
    </div>
  );
}