import {
  Text,
  Paper,
  Group,
  PaperProps,
  Center,
} from "@mantine/core";
import { useSearchParams } from "react-router-dom";

import { AcmLoginButton } from "./AcmLoginButton.js";

import brandImgUrl from "../../assets/banner-blue.png";

export function LoginComponent(props: PaperProps) {
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo") || undefined;

  return (
    <Paper radius="md" p="xl" withBorder {...props}>
      <Center>
        <img
          src={brandImgUrl}
          alt="ACM Logo"
          style={{ height: "5em", marginBottom: "1em" }}
        />
      </Center>

      <Center>
        <Text size="lg" fw={500}>
          Welcome to the ACM@UIUC RSVP Portal
        </Text>
      </Center>

      <Group grow mb="md" mt="md">
        <AcmLoginButton radius="xl" returnTo={returnTo || "/"}>
          Sign in with Illinois NetID
        </AcmLoginButton>
      </Group>
    </Paper>
  );
}
