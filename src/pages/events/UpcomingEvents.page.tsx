import { useEffect, useState } from 'react';
import { 
  Title, Text, Container, SimpleGrid, Card, Badge, Button, Group, Stack, 
  Loader, Alert, ThemeIcon, Anchor, Box, Modal 
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Turnstile } from '@marsidev/react-turnstile';
import { IconCalendar, IconMapPin, IconAlertCircle, IconTicket, IconUser } from '@tabler/icons-react';

import { MainLayout } from '../../components/Layout'; 
import { Event } from '../../common/types/event';
import { getBaseUrl, getTurnstileKey } from '../../common/utils';
import { useAuth } from '../../components/AuthContext';

export function UpcomingEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal & RSVP State
  const [opened, { open, close }] = useDisclosure(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [rsvpLoading, setRsvpLoading] = useState(false);

  const { getToken } = useAuth();

  // 1. Fetch Events (Your existing code)
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch(getBaseUrl() + '/api/v1/events?upcomingOnly=true');
        if (!response.ok) throw new Error('Failed to fetch events');
        const data = await response.json();
        setEvents(data);
      } catch (err) {
        console.error(err);
        setError("Could not load events.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // 2. Open the Modal when "RSVP" is clicked
  const handleRsvpStart = (event: Event) => {
    setSelectedEvent(event);
    open();
  };

  // 3. Triggered automatically when Turnstile verifies
  const handleTurnstileSuccess = async (turnstileToken: string) => {
    if (!selectedEvent) return;
    
    setRsvpLoading(true);

    try {
      const authToken = await getToken();
      
      console.log("--- DEBUG START ---");
      console.log("Turnstile:", turnstileToken);
      console.log("authToken:", authToken);


      const base = getBaseUrl().replace(/\/$/, ""); 
      const url = `${base}/api/v1/rsvp/event/${selectedEvent.id}`;
      console.log("Target URL:", url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'x-uiuc-token': authToken || '',
          'x-turnstile-response': turnstileToken,
        },
      });

      console.log("Response Status:", response.status);

      if (!response.ok) {
         const errText = await response.text(); 
         
         alert(`Server Failed (${response.status}):\n${errText}`);
         throw new Error(errText);
      }

      alert(`Success! You are RSVP'd for ${selectedEvent.title}`);
      close(); 

    } catch (err) {
      console.error("Catch Block Error:", err);
    } finally {
      console.log("--- DEBUG END ---");
      setRsvpLoading(false);
      close(); 
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Date TBA";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";

    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    }).format(date);
  };

  return (
    <MainLayout>
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
            {events.length === 0 ? (
              <Text c="dimmed">No upcoming events found.</Text>
            ) : (
              events.map((event) => (
                <Card key={event.id} shadow="sm" padding="lg" radius="md" withBorder>
                  <Stack mt="xs" gap="sm" justify="space-between" h="100%">
                    <Box>
                        {/* Event Details (Same as before) */}
                        <Group justify="space-between" align="start" mb="xs">
                            <Title order={4} lineClamp={2} style={{ flex: 1 }}>{event.title}</Title>
                            {event.featured && <Badge color="orange" variant="light">Featured</Badge>}
                        </Group>

                        <Group gap="xs" mb={4}>
                            <ThemeIcon size="xs" variant="transparent" color="gray"><IconUser /></ThemeIcon>
                            <Text size="sm" c="dimmed" fw={500}>{event.host}</Text>
                        </Group>

                        <Group gap="xs" mb={4}>
                            <ThemeIcon size="xs" variant="transparent" color="gray"><IconCalendar /></ThemeIcon>
                            <Text size="sm" c="dimmed">{formatDate(event.start)}</Text>
                        </Group>

                        <Group gap="xs" mb="md">
                            <ThemeIcon size="xs" variant="transparent" color="gray"><IconMapPin /></ThemeIcon>
                            {event.locationLink ? (
                                <Anchor href={event.locationLink} target="_blank" size="sm" underline="hover">
                                    {event.location}
                                </Anchor>
                            ) : (
                                <Text size="sm" c="dimmed" lineClamp={1}>{event.location}</Text>
                            )}
                        </Group>

                        <Text size="sm" c="dimmed" lineClamp={3}>{event.description}</Text>
                    </Box>

                    {/* ✅ Button now opens Modal instead of calling API directly */}
                    <Button 
                        variant="light" color="blue" fullWidth radius="md"
                        leftSection={<IconTicket size={16} />}
                        onClick={() => handleRsvpStart(event)}
                    >
                        RSVP
                    </Button>
                  </Stack>
                </Card>
              ))
            )}
          </SimpleGrid>
        )}

        {/* ✅ Turnstile Modal */}
        <Modal 
            opened={opened} 
            onClose={() => !rsvpLoading && close()} 
            title="Verifying..." 
            centered
            withCloseButton={false}
        >
           <Stack align="center" py="md">
              {rsvpLoading ? (
                  <Loader size="sm" /> 
              ) : (
                  <Turnstile 
                    siteKey={getTurnstileKey()}
                    options={{ size: 'flexible' }}
                    onSuccess={handleTurnstileSuccess} 
                  />
              )}
              <Text size="xs" c="dimmed">Security Check</Text>
           </Stack>
        </Modal>

      </Container>
    </MainLayout>
  );
}