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
  Anchor,
  Divider,
  Box,
} from '@mantine/core';
import { IconCalendarEvent, IconTicket, IconSettings, IconCalendar, IconClock, IconMapPin } from '@tabler/icons-react';
import { useAuth } from '../components/AuthContext';
import { useProfile } from '../components/ProfileContext';
import { useRsvps } from '../components/RsvpsContext';
import { MainLayout } from '../components/Layout/index';
import FullScreenLoader from '../components/AuthContext/LoadingScreen';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { EnrichedRsvp } from '../common/types/rsvp';

export function HomePage() {
  const { user, isLoggedIn } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { rsvps, loading: rsvpsLoading } = useRsvps();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn && !profileLoading && !profile) {
      navigate('/profile?firstTime=true', { replace: true });
    }
  }, [isLoggedIn, profileLoading, profile, navigate]);

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
  const previewRsvps = [...ongoingRsvps, ...upcomingRsvps].slice(0, 3);
  const totalActive = ongoingRsvps.length + upcomingRsvps.length;

  const actions = [
    { title: 'Upcoming Events', icon: IconCalendarEvent, color: 'blue', desc: 'Browse and RSVP to corporate events', path: '/events' },
    { title: 'My RSVPs', icon: IconTicket, color: 'green', desc: 'View your tickets and status', path: '/my-rsvps' },
    { title: 'Profile', icon: IconSettings, color: 'gray', desc: 'Update your resume and dietary info', path: '/profile' },
  ];

  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  if (profileLoading && isLoggedIn) return <FullScreenLoader />;

  return (
    <MainLayout>
      <Container size="lg" py="xl">
        <Stack gap="xl">
          <div>
            <Title order={2}>Welcome back, {user?.name?.split(' ')[1] || 'Friend'}!</Title>
            <Text c="dimmed">Select an action to get started.</Text>
          </div>

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
                <Group gap={4} align="center">
                  <Text size="sm" c="dimmed">No upcoming RSVPs.</Text>
                  <Anchor size="sm" onClick={() => navigate('/events')} style={{ cursor: 'pointer' }}>
                    Browse events →
                  </Anchor>
                </Group>
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
