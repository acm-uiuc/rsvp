import { useState, useEffect } from 'react';
import { 
  Title, Text, Container, Card, Badge, Group, Stack, 
  Loader, Alert, ThemeIcon, Button, Modal 
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Turnstile } from '@marsidev/react-turnstile';
import { IconTicket, IconCalendar, IconAlertCircle, IconClock, IconTrash } from '@tabler/icons-react';
import { config } from '../../config';

export interface EnrichedRsvp {
  eventId: string;
  title: string;
  eventDate: string;
  registeredDate: string;
}

interface MyRsvpsViewProps {
  getRsvps: () => Promise<EnrichedRsvp[]>;  
  onCancelRsvp: (eventId: string, token: string) => Promise<void>;
  navigateEvents: () => void;
}

export function MyRsvpsView({ getRsvps, onCancelRsvp, navigateEvents }: MyRsvpsViewProps) {
  const [rsvps, setRsvps] = useState<EnrichedRsvp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [rsvpToDelete, setRsvpToDelete] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadData = () => {
    setLoading(true);
    getRsvps()
      .then(setRsvps)
      .catch((e) => {
        console.error(e);
        setError("Could not load your RSVPs.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [getRsvps]);

  const confirmDelete = (eventId: string) => {
    setRsvpToDelete(eventId);
    openDeleteModal();
  };

  const handleTurnstileSuccess = async (token: string) => {
    if (!rsvpToDelete) return;
    setDeleteLoading(true);
    try {
        await onCancelRsvp(rsvpToDelete, token);
        setRsvps(prev => prev.filter(r => r.eventId !== rsvpToDelete));
        alert("RSVP cancelled successfully.");
        closeDeleteModal();
    } catch (e: any) {
        console.error(e);
        alert(e.message || "Failed to cancel");
        closeDeleteModal();
    } finally {
        setDeleteLoading(false);
    }
  };

  return (
    <Container size="md" py="xl">
        <Stack gap="lg" mb="xl">
          <Title order={2}>My RSVPs</Title>
          <Text c="dimmed">Here are the events you have registered for.</Text>
        </Stack>

        {error && <Alert icon={<IconAlertCircle />} title="Error" color="red" mb="xl">{error}</Alert>}

        {loading ? (
          <Group justify="center" py="xl"><Loader size="lg" type="dots" /></Group>
        ) : (
          <Stack gap="md">
            {rsvps.length === 0 ? (
              <Alert icon={<IconTicket />} color="gray" title="No RSVPs found">
                You haven't RSVP'd to any events yet. Check out the <a href="#" onClick={(e) => { e.preventDefault(); navigateEvents(); }} style={{ color: 'inherit', textDecoration: 'underline' }}>Upcoming Events</a> page!
              </Alert>
            ) : (
              rsvps.map((rsvp, index) => (
                <Card key={`${rsvp.eventId}-${index}`} shadow="sm" padding="lg" radius="md" withBorder>
                    <Group justify="space-between" align="start">
                        <Stack gap={4} style={{ flex: 1 }}>
                            <Title order={4}>{rsvp.title}</Title>
                            <Group gap="xs" c="dimmed">
                                <ThemeIcon size="xs" variant="transparent" color="gray"><IconClock size={14}/></ThemeIcon>
                                <Text size="sm">Registered on {rsvp.registeredDate}</Text>
                            </Group>
                            <Group gap="xs" c="dimmed">
                                <ThemeIcon size="xs" variant="transparent" color="gray"><IconCalendar size={14}/></ThemeIcon>
                                <Text size="sm">Event Date: {rsvp.eventDate}</Text>
                            </Group>
                        </Stack>
                        <Stack align="end" gap="xs">
                            <Badge color="green" size="lg" variant="light" leftSection={<IconTicket size={12}/>}>Confirmed</Badge>
                            <Button variant="subtle" color="red" size="xs" leftSection={<IconTrash size={14} />} onClick={() => confirmDelete(rsvp.eventId)}>
                                Cancel RSVP
                            </Button>
                        </Stack>
                    </Group>
                </Card>
              ))
            )}
          </Stack>
        )}

        {/* Modal Logic */}
        <Modal opened={deleteModalOpened} onClose={() => !deleteLoading && closeDeleteModal()} title="Confirm Cancellation" centered withCloseButton={!deleteLoading}>
           <Stack align="center" py="md">
              <Text size="sm" ta="center" mb="sm">Are you sure you want to cancel this RSVP?</Text>
              {deleteLoading ? <Loader size="sm" color="red" /> : (
                  <Turnstile siteKey={config.turnstileSiteKey} options={{ size: 'flexible' }} onSuccess={handleTurnstileSuccess} />
              )}
           </Stack>
        </Modal>
      </Container>
  );
}