import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Title, Text, Container, SimpleGrid, Card, Badge, Button, Group, Stack, 
  Loader, Alert, Box, Modal, Divider
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Turnstile } from '@marsidev/react-turnstile';
import { 
  IconAlertCircle, IconTicket, IconCalendar, IconClock, 
  IconMapPin, IconRefresh, IconCheck 
} from '@tabler/icons-react';
import { Event } from '../../common/types/event';
import { config } from '../../config';

interface UpcomingEventsViewProps {
  getEvents: () => Promise<Event[]>;
  onRsvp: (event: Event, turnstileToken: string) => Promise<void>;
  onRefresh: () => Promise<Event[]>;
}

export function UpcomingEventsView({ getEvents, onRsvp, onRefresh }: UpcomingEventsViewProps) {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rsvpedEvents, setRsvpedEvents] = useState<Set<string>>(new Set());

  const [opened, { open, close }] = useDisclosure(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [rsvpError, setRsvpError] = useState<string | null>(null);

  useEffect(() => {
    loadEvents();
  }, [getEvents]);

  const loadEvents = async () => {
    try {
      const data = await getEvents();
      setEvents(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Could not load events. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleRsvpClick = (event: Event) => {
    setSelectedEvent(event);
    setRsvpError(null);
    open();
  };

  const handleRefreshClick = async () => {
    setLoading(true);
    try {
      // Call the new refresh function passed from the parent
      const freshData = await onRefresh();
      setEvents(freshData);
    } catch (error) {
      console.error("Refresh failed", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTurnstileSuccess = async (token: string) => {
    if (!selectedEvent) return;
    setRsvpLoading(true);
    setRsvpError(null);
    
    try {
      await onRsvp(selectedEvent, token);
      
      // Add to RSVPed events set
      setRsvpedEvents(prev => new Set(prev).add(selectedEvent.id));
      
      close();
      
    } catch (e: any) {
      console.error(e);
      
      // Handle specific error cases
      if (e.message?.includes('400') || e.message?.toLowerCase().includes('profile')) {
        setRsvpError('profile');
      } else if (e.message?.toLowerCase().includes('full') || e.message?.toLowerCase().includes('capacity')) {
        setRsvpError('Event is at full capacity');
      } else if (e.message?.toLowerCase().includes('already')) {
        setRsvpError('You have already RSVP\'d to this event');
      } else {
        setRsvpError(e.message || 'Failed to RSVP. Please try again.');
      }
    } finally {
      setRsvpLoading(false);
    }
  };

  const handleProfileSetup = () => {
    close();
    navigate('/profile?firstTime=true');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg" mb="xl">
        <Group justify="space-between" align="center">
          <Box>
            <Title order={2}>Upcoming Events</Title>
            <Text c="dimmed">Discover and RSVP to events hosted by ACM @ UIUC.</Text>
          </Box>
          <Group gap="xs"> 
            <Button variant="outline" onClick={handleRefreshClick} leftSection={<IconRefresh size={16} />}>
              Refresh
            </Button>
          </Group>
        </Group>
      </Stack>
      

      {error && (
        <Alert 
          icon={<IconAlertCircle />} 
          title="Error" 
          color="red" 
          mb="xl"
          withCloseButton
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {loading ? (
        <Group justify="center" py="xl">
          <Loader size="lg" type="dots" />
        </Group>
      ) : events.length === 0 ? (
        <Card shadow="sm" padding="xl" radius="md" withBorder>
          <Stack align="center" gap="md" py="xl">
            <IconCalendar size={48} stroke={1.5} color="gray" />
            <Title order={3} c="dimmed">No Upcoming Events</Title>
            <Text c="dimmed" ta="center">
              Check back soon for new events and workshops!
            </Text>
          </Stack>
        </Card>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
          {events.map((event) => {
            const isRsvped = rsvpedEvents.has(event.id);
            
            return (
              <Card key={event.id} shadow="sm" padding="lg" radius="md" withBorder>
                <Stack gap="sm" h="100%">
                  <Box style={{ flex: 1 }}>
                    <Group justify="space-between" align="start" mb="xs">
                      <Title order={4} lineClamp={2} style={{ flex: 1 }}>
                        {event.title}
                      </Title>
                      {event.featured && (
                        <Badge color="orange" variant="light">Featured</Badge>
                      )}
                    </Group>

                    <Text size="sm" c="dimmed" lineClamp={3} mb="md">
                      {event.description}
                    </Text>

                    <Divider my="sm" />

                    <Stack gap="xs">
                      {event.start && (
                        <Group gap="xs">
                          <IconCalendar size={16} stroke={1.5} />
                          <Text size="sm">{formatDate(event.start)}</Text>
                        </Group>
                      )}

                      {event.start && (
                        <Group gap="xs">
                          <IconClock size={16} stroke={1.5} />
                          <Text size="sm">
                            {formatTime(event.start)}
                            {event.end && ` - ${formatTime(event.end)}`}
                          </Text>
                        </Group>
                      )}

                      {event.location && (
                        <Group gap="xs">
                          <IconMapPin size={16} stroke={1.5} />
                          <Text size="sm" lineClamp={1}>{event.location}</Text>
                        </Group>
                      )}
                    </Stack>
                  </Box>

                  <Button 
                    variant={isRsvped ? "light" : "filled"}
                    color={isRsvped ? "green" : "blue"}
                    fullWidth 
                    radius="md"
                    leftSection={isRsvped ? <IconCheck size={16} /> : <IconTicket size={16} />}
                    onClick={() => handleRsvpClick(event)}
                    disabled={isRsvped}
                  >
                    {isRsvped ? "RSVP'd" : "RSVP"}
                  </Button>
                </Stack>
              </Card>
            );
          })}
        </SimpleGrid>
      )}

      {/* RSVP Modal */}
      <Modal 
        opened={opened} 
        onClose={() => !rsvpLoading && close()} 
        title={rsvpError === 'profile' ? "Profile Required" : "Verify RSVP"}
        centered 
        withCloseButton={!rsvpLoading}
      >
        <Stack align="center" py="md">
          {rsvpError === 'profile' ? (
            <>
              <IconAlertCircle size={48} color="orange" />
              <Text ta="center" fw={500}>Complete Your Profile</Text>
              <Text size="sm" c="dimmed" ta="center">
                You need to complete your profile before you can RSVP to events.
                This helps us personalize your experience and accommodate your needs.
              </Text>
              <Group mt="md" style={{ width: '100%' }}>
                <Button variant="subtle" onClick={close} style={{ flex: 1 }}>
                  Cancel
                </Button>
                <Button onClick={handleProfileSetup} style={{ flex: 1 }}>
                  Complete Profile
                </Button>
              </Group>
            </>
          ) : rsvpError ? (
            <>
              <IconAlertCircle size={48} color="red" />
              <Text ta="center" fw={500}>RSVP Failed</Text>
              <Text size="sm" c="dimmed" ta="center">
                {rsvpError}
              </Text>
              <Button onClick={close} fullWidth mt="md">
                Close
              </Button>
            </>
          ) : rsvpLoading ? (
            <>
              <Loader size="lg" />
              <Text size="sm" c="dimmed">Processing your RSVP...</Text>
            </>
          ) : (
            <>
              <Turnstile 
                siteKey={config.turnstileSiteKey} 
                options={{ size: 'flexible' }} 
                onSuccess={handleTurnstileSuccess} 
              />
              <Text size="xs" c="dimmed">Security Check</Text>
            </>
          )}
        </Stack>
      </Modal>
    </Container>
  );
}