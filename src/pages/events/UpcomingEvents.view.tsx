import { useState, useEffect } from 'react';
import { 
  Title, Text, Container, SimpleGrid, Card, Badge, Button, Group, Stack, 
  Loader, Alert, Box, Modal 
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Turnstile } from '@marsidev/react-turnstile';
import { IconAlertCircle, IconTicket } from '@tabler/icons-react';
import { Event } from '../../common/types/event';
import { config } from '../../config';

interface UpcomingEventsViewProps {
  getEvents: () => Promise<Event[]>;
  onRsvp: (event: Event, turnstileToken: string) => Promise<void>;
}

export function UpcomingEventsView({ getEvents, onRsvp }: UpcomingEventsViewProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [opened, { open, close }] = useDisclosure(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [rsvpLoading, setRsvpLoading] = useState(false);

  useEffect(() => {
    getEvents()
      .then(setEvents)
      .catch((err) => {
        console.error(err);
        setError("Could not load events.");
      })
      .finally(() => setLoading(false));
  }, [getEvents]);

  const handleRsvpClick = (event: Event) => {
    setSelectedEvent(event);
    open();
  };

  const handleTurnstileSuccess = async (token: string) => {
    if (!selectedEvent) return;
    setRsvpLoading(true);
    try {
      await onRsvp(selectedEvent, token);
      alert(`Success! You are RSVP'd for ${selectedEvent.title}`);
      close();
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Failed to RSVP");
      close();
    } finally {
      setRsvpLoading(false);
    }
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg" mb="xl">
        <Title order={2}>Upcoming Events</Title>
        <Text c="dimmed">Discover and RSVP to events hosted by ACM @ UIUC.</Text>
      </Stack>

      {error && <Alert icon={<IconAlertCircle />} title="Error" color="red" mb="xl">{error}</Alert>}

      {loading ? (
        <Group justify="center" py="xl"><Loader size="lg" type="dots" /></Group>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
            {events.length === 0 ? <Text c="dimmed">No upcoming events found.</Text> : 
            events.map((event) => (
              <Card key={event.id} shadow="sm" padding="lg" radius="md" withBorder>
                <Stack mt="xs" gap="sm" justify="space-between" h="100%">
                  <Box>
                    <Group justify="space-between" align="start" mb="xs">
                        <Title order={4} lineClamp={2} style={{ flex: 1 }}>{event.title}</Title>
                        {event.featured && <Badge color="orange" variant="light">Featured</Badge>}
                    </Group>
                    {/* ... (Rest of Event Details) ... */}
                    <Text size="sm" c="dimmed" lineClamp={3}>{event.description}</Text>
                  </Box>

                  <Button 
                    variant="light" color="blue" fullWidth radius="md"
                    leftSection={<IconTicket size={16} />}
                    onClick={() => handleRsvpClick(event)}
                  >
                    RSVP
                  </Button>
                </Stack>
              </Card>
            ))}
        </SimpleGrid>
      )}

      <Modal opened={opened} onClose={() => !rsvpLoading && close()} title="Verifying..." centered withCloseButton={false}>
         <Stack align="center" py="md">
            {rsvpLoading ? <Loader size="sm" /> : (
                <Turnstile siteKey={config.turnstileSiteKey} options={{ size: 'flexible' }} onSuccess={handleTurnstileSuccess} />
            )}
            <Text size="xs" c="dimmed">Security Check</Text>
         </Stack>
      </Modal>
    </Container>
  );
}