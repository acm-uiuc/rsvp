import { useEffect, useState } from 'react';

import { 
  Title, 
  Text, 
  Container, 
  SimpleGrid, 
  Card, 
  ThemeIcon, 
  Button, 
  Stack,
  Group,
  Badge,
  Loader,
  Divider,
  Box,
} from '@mantine/core';
import { IconCalendarEvent, IconTicket, IconSettings, IconCalendar, IconClock, IconMapPin } from '@tabler/icons-react';
import { useAuth } from '../components/AuthContext';
import { MainLayout } from '../components/Layout/index';
import { useNavigate } from 'react-router-dom';
import { config } from '../config';
import { RsvpItem } from '../common/types/rsvp';
import { Event } from '../common/types/event';
import { EnrichedRsvp } from './rsvps/MyRsvps.view';
import { apiCache, CacheTTL } from '../common/utils/apiCache';

export function HomePage() {
  const { user, isLoggedIn, getToken } = useAuth();
  const navigate = useNavigate();

  const [rsvps, setRsvps] = useState<EnrichedRsvp[]>([]);
  const [rsvpsLoading, setRsvpsLoading] = useState(false);

  useEffect(() => {
    const checkProfile = async () => {
      if (isLoggedIn && user) {
        const authToken = await getToken();
        try {
          const response = await fetch(config.apiBaseUrl + `/api/v1/rsvp/profile/me`, {
            method: 'GET',
            headers: { 'x-uiuc-token': authToken || '' }
          });
          const res = await fetch(config.apiBaseUrl + '/api/v1/syncIdentity/isRequired', {
            method: 'GET',
            headers: { 'x-uiuc-token': authToken || '' }
          });
          const syncRequired = await res.json();
          if (syncRequired?.syncRequired) {
            await fetch(config.apiBaseUrl + '/api/v1/syncIdentity', {
              method: 'POST',
              headers: { 'x-uiuc-token': authToken || '' }
            });
          }
          if (response.status === 400 || response.status === 404) {
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

  useEffect(() => {
    const loadRsvps = async () => {
      if (!isLoggedIn || !user) return;
      setRsvpsLoading(true);
      try {
        const token = await getToken();
        if (!token) return;

        const enriched = await apiCache.getOrFetch(
          'rsvps:my',
          async () => {
            const [rsvpRes, eventsRes] = await Promise.all([
              fetch(config.apiBaseUrl + '/api/v1/rsvp/me', {
                headers: { 'x-uiuc-token': token, 'Content-Type': 'application/json' }
              }),
              fetch(config.apiBaseUrl + '/api/v1/events', { cache: 'no-store' })
            ]);

            if (!rsvpRes.ok) return [];

            const rsvpData: RsvpItem[] = await rsvpRes.json();
            const eventsData: Event[] = eventsRes.ok ? await eventsRes.json() : [];

            const eventsMap: Record<string, Event> = {};
            eventsData.forEach(e => { eventsMap[e.id] = e; });

            return rsvpData.map(r => {
              const event = eventsMap[r.eventId];
              return {
                eventId: r.eventId,
                title: event?.title || 'Unknown Event',
                description: event?.description,
                eventDate: event?.start
                  ? new Date(event.start).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
                  : 'N/A',
                eventTime: event?.start ? new Date(event.start).toLocaleTimeString() : undefined,
                location: event?.location,
                registeredDate: r.createdAt
                  ? new Date(r.createdAt * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : 'N/A',
                startTime: event?.start,
                endTime: event?.end,
                featured: event?.featured,
              };
            }).sort((a, b) => {
              const dateA = a.startTime ? new Date(a.startTime).getTime() : 0;
              const dateB = b.startTime ? new Date(b.startTime).getTime() : 0;
              return dateB - dateA;
            });
          },
          CacheTTL.MEDIUM
        );

        setRsvps(enriched);
      } catch (err) {
        console.error('Failed to load RSVPs for homepage', err);
      } finally {
        setRsvpsLoading(false);
      }
    };
    loadRsvps();
  }, [isLoggedIn, user, getToken]);

  const isOngoingEvent = (rsvp: EnrichedRsvp): boolean => {
    if (!rsvp.startTime || !rsvp.endTime) return false;
    const now = new Date();
    return new Date(rsvp.startTime) <= now && new Date(rsvp.endTime) >= now;
  };

  const isUpcomingEvent = (rsvp: EnrichedRsvp): boolean => {
    if (!rsvp.startTime) return false;
    return new Date(rsvp.startTime) > new Date();
  };

  const ongoingRsvps = rsvps.filter(r => isOngoingEvent(r));
  const upcomingRsvps = rsvps.filter(r => isUpcomingEvent(r));

  // Combine for homepage preview: ongoing first, then upcoming, capped at 3 total
  const previewRsvps = [...ongoingRsvps, ...upcomingRsvps].slice(0, 3);
  const totalActive = ongoingRsvps.length + upcomingRsvps.length;

  const actions = [
    { title: 'Upcoming Events', icon: IconCalendarEvent, color: 'blue', desc: 'Browse and RSVP to corporate events', path: '/events' },
    { title: 'My RSVPs', icon: IconTicket, color: 'green', desc: 'View your tickets and status', path: '/my-rsvps' },
    { title: 'Profile', icon: IconSettings, color: 'gray', desc: 'Update your resume and dietary info', path: '/profile' },
  ];

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  return (
    <MainLayout>
      <Container size="lg" py="xl">
        <Stack gap="xl">
          {/* Welcome Banner */}
          <div>
            <Title order={2}>Welcome back, {user?.name?.split(' ')[1] || 'Friend'}!</Title>
            <Text c="dimmed">Select an action to get started.</Text>
          </div>

          {/* Quick Actions Grid */}
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
            {actions.map((item) => (
              <Card key={item.title} shadow="sm" padding="lg" radius="md" withBorder>
                <Card.Section inheritPadding py="xs">
                  <Group justify="space-between">
                    <Text fw={500}>{item.title}</Text>
                    <ThemeIcon color={item.color} variant="light">
                      <item.icon size={16} />
                    </ThemeIcon>
                  </Group>
                </Card.Section>
                <Text size="sm" c="dimmed" mt="sm">{item.desc}</Text>
                <Button variant="light" color={item.color} fullWidth mt="md" radius="md" onClick={() => navigate(item.path)}>
                  Open
                </Button>
              </Card>
            ))}
          </SimpleGrid>

          {/* My RSVPs — minimal preview */}
          {isLoggedIn && (
            <Box>
              <Divider mb="lg" />
              <Group justify="space-between" align="center" mb="md">
                <Text fw={500}>My Upcoming RSVPs</Text>
                <Button variant="subtle" size="xs" onClick={() => navigate('/my-rsvps')}>
                  View all
                </Button>
              </Group>

              {rsvpsLoading ? (
                <Group justify="center" py="md">
                  <Loader size="sm" type="dots" />
                </Group>
              ) : previewRsvps.length === 0 ? (
                <Text size="sm" c="dimmed">
                  No upcoming RSVPs.{' '}
                  <Button variant="subtle" size="xs" p={0} onClick={() => navigate('/events')}>
                    Browse events →
                  </Button>
                </Text>
              ) : (
                <Stack gap="xs">
                  {previewRsvps.map((rsvp) => {
                    const ongoing = isOngoingEvent(rsvp);
                    return (
                      <Card
                        key={rsvp.eventId}
                        padding="sm"
                        radius="md"
                        withBorder
                        style={ongoing ? { borderColor: 'var(--mantine-color-teal-4)' } : undefined}
                      >
                        <Group justify="space-between" wrap="nowrap">
                          <Box style={{ flex: 1, minWidth: 0 }}>
                            <Group gap="xs" mb={4}>
                              <Text size="sm" fw={500} lineClamp={1}>{rsvp.title}</Text>
                              {ongoing && <Badge color="teal" variant="filled" size="xs">Live Now</Badge>}
                              {rsvp.featured && !ongoing && <Badge color="orange" variant="light" size="xs">Featured</Badge>}
                            </Group>
                            <Group gap="md">
                              {rsvp.startTime && (
                                <Group gap={4}>
                                  <IconCalendar size={13} stroke={1.5} />
                                  <Text size="xs" c="dimmed">{rsvp.eventDate}</Text>
                                </Group>
                              )}
                              {rsvp.startTime && (
                                <Group gap={4}>
                                  <IconClock size={13} stroke={1.5} />
                                  <Text size="xs" c="dimmed">
                                    {formatTime(rsvp.startTime)}{rsvp.endTime && ` – ${formatTime(rsvp.endTime)}`}
                                  </Text>
                                </Group>
                              )}
                              {rsvp.location && (
                                <Group gap={4}>
                                  <IconMapPin size={13} stroke={1.5} />
                                  <Text size="xs" c="dimmed" lineClamp={1}>{rsvp.location}</Text>
                                </Group>
                              )}
                            </Group>
                          </Box>
                        </Group>
                      </Card>
                    );
                  })}
                  {totalActive > 3 && (
                    <Text size="xs" c="dimmed" ta="center">
                      +{totalActive - 3} more —{' '}
                      <Button variant="subtle" size="xs" p={0} onClick={() => navigate('/my-rsvps')}>
                        view all
                      </Button>
                    </Text>
                  )}
                </Stack>
              )}
            </Box>
          )}
        </Stack>
      </Container>
    </MainLayout>
  );
}