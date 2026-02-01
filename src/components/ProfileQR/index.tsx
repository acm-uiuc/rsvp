import { useEffect, useState } from 'react';
import { Modal, Stack, Text, Loader, Center, Box, Button } from '@mantine/core';
import QRCode from 'react-qr-code';
import { useAuth } from '../AuthContext'; // Adjust path as needed
import { IconAlertCircle } from '@tabler/icons-react';

interface CheckInModalProps {
  opened: boolean;
  onClose: () => void;
}

export function CheckInModal({ opened, onClose }: CheckInModalProps) {
  const { getToken, user } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (opened) {
      const fetchToken = async () => {
        setLoading(true);
        setError(null);
        try {
          const t = await getToken();
          if (!t) throw new Error("Could not retrieve authentication token.");
          setToken(t);
        } catch (err) {
          console.error(err);
          setError("Failed to generate check-in code. Please try again.");
        } finally {
          setLoading(false);
        }
      };
      fetchToken();
    } else {
      // Security: Clear token when modal closes
      setToken(null);
      setError(null);
    }
  }, [opened, getToken]);

  return (
    <Modal 
      opened={opened} 
      onClose={onClose} 
      title={error ? "Error" : "Event Check-In"} 
      centered
      size="sm"
    >
      <Stack align="center" gap="md" pb="md">
        {loading ? (
          <Center h={200}>
            <Loader size="xl" />
          </Center>
        ) : error ? (
          // ❌ Replaced <Alert> with this Modal Error View
          <>
            <IconAlertCircle size={48} color="red" style={{ alignSelf: 'center' }} />
            <Text ta="center" fw={500}>Generation Failed</Text>
            <Text size="sm" c="dimmed" ta="center">
              {error}
            </Text>
            <Button onClick={onClose} fullWidth mt="md" color="gray" variant="light">
              Close
            </Button>
          </>
        ) : token ? (
          // ✅ Success View
          <>
            <Box p="md" bg="white" style={{ borderRadius: 8 }}>
              <QRCode 
                value={token} 
                size={200} 
                level="L"
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
              />
            </Box>
            <Stack gap={0} align="center">
              <Text fw={700} size="lg">{user?.name || "Guest"}</Text>
              <Text c="dimmed" size="sm" ta="center">
                Show this code to an organizer to check in.
              </Text>
            </Stack>
          </>
        ) : null}
      </Stack>
    </Modal>
  );
}