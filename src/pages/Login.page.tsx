import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Center, Alert, Stack } from "@mantine/core";
import { IconAlertCircle, IconAlertTriangle } from "@tabler/icons-react";
import LogoBadge from "../components/Logo";
import { useAuth } from "../components/AuthContext";
import { useProfile } from "../components/ProfileContext";
import { LoginComponent } from "../components/LoginComponent";
import FullScreenLoader from "../components/AuthContext/LoadingScreen";

export function LoginPage() {
  const navigate = useNavigate();
  const { profile, loading: profileLoading, error: profileError } = useProfile();

  const { isLoggedIn } = useAuth();
  const [searchParams] = useSearchParams();

  const showLogoutMessage = searchParams.get("lc") === "true";
  const showLoginMessage = !showLogoutMessage && searchParams.get("li") === "true";
  const returnTo = searchParams.get("returnTo");

  useEffect(() => {
    if (isLoggedIn && !profileLoading) {
      if (profileError || !profile) {
        navigate("/profile?firstTime=true", { replace: true });
      } else {
        navigate(returnTo || "/home", { replace: true });
      }
    }
  }, [isLoggedIn, profileLoading, profile, profileError, navigate, returnTo]);

  if (isLoggedIn && profileLoading) {
    return <FullScreenLoader />;
  }

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