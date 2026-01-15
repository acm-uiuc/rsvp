import {
  Text,
  Paper,
  Group,
  PaperProps,
  Alert,
  Title,
  ThemeIcon,
  Stack
} from "@mantine/core";
import { IconLock, IconCommand } from "@tabler/icons-react";

import { AcmLoginButton } from "./AcmLoginButton";

export function LoginComponent(props: PaperProps) {

  return (
    <Paper radius="md" p="xl" withBorder {...props}>
      <Stack align="center" gap="md" className="mb-6">
        {/* Placeholder for missing brand image */}
        <ThemeIcon size={64} radius="md" variant="light" color="blue">
            <IconCommand size={40} />
        </ThemeIcon>
        
        <Title order={3} className="text-center">
            ACM @ UIUC
        </Title>

        <Text size="lg" fw={500} className="text-center text-gray-700">
          RSVP to ACM Events
        </Text>
      </Stack>

      <Alert
        title={<Title order={5}>Authorized Users Only</Title>}
        icon={<IconLock />}
        color="blue" 
        className="mb-6"
      >
        <Text size="sm">
          Unauthorized or improper use or access of this system may result in
          disciplinary action, as well as civil and criminal penalties.
        </Text>
      </Alert>

      <Group grow>
        <AcmLoginButton radius="xl">
          Sign in with Illinois NetID
        </AcmLoginButton>
      </Group>
    </Paper>
  );
}