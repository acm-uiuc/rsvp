import { useState, useEffect, useMemo } from 'react';
import {
  Title, Text, Container, Card, Button, Group, Stack,
  Loader, Alert, Box, Modal, Badge, Divider, ActionIcon, TextInput
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Turnstile } from '@marsidev/react-turnstile';
import {
  IconAlertCircle, IconTicket, IconCalendar, IconClock,
  IconMapPin, IconTrash, IconInfoCircle, IconRefresh, IconSearch
} from '@tabler/icons-react';
import { config } from '../../config';

export interface EnrichedRsvp {
  eventId: string;
  title: string;
  description?: string;
  eventDate: string;
  eventTime?: string;
  location?: string;
  registeredDate: string;
  startTime?: string;
  endTime?: string;
  featured?: boolean;
}

interface MyRsvpsViewProps {
  getRsvps: () => Promise<EnrichedRsvp[]>;
  onCancelRsvp: (eventId: string, turnstileToken: string) => Promise<void>;
  navigateEvents: () => void;
  onRefresh: () => Promise<EnrichedRsvp[]>;
}

export function MyRsvpsView({ getRsvps, onCancelRsvp, navigateEvents, onRefresh }: MyRsvpsViewProps) {
  const [rsvps, setRsvps] = useState<EnrichedRsvp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [cancelModalOpened, { open: openCancelModal, close: closeCancelModal }] = useDisclosure(false);
  const [selectedRsvp, setSelectedRsvp] = useState<EnrichedRsvp | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => {
    loadRsvps();
  }, [getRsvps]);

  const loadRsvps = async () => {
    try {
      const data = await getRsvps();
      setRsvps(data);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Could not load your RSVPs. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshClick = async () => {
    setLoading(true);
    try {
      const freshData = await onRefresh();
      setRsvps(freshData);
    } catch (error) {
      console.error("Refresh failed", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = (rsvp: EnrichedRsvp) => {
    setSelectedRsvp(rsvp);
    setCancelError(null);
    openCancelModal();
  };

  const handleTurnstileSuccess = async (token: string) => {
    if (!selectedRsvp) return;
    setCancelLoading(true);
    setCancelError(null);

    try {
      await onCancelRsvp(selectedRsvp.eventId, token);

      setRsvps(prev => prev.filter(r => r.eventId !== selectedRsvp.eventId));

      closeCancelModal();

      setTimeout(() => {
        alert(`Successfully cancelled RSVP for ${selectedRsvp.title}`);
      }, 100);

    } catch (e: any) {
      console.error(e);
      setCancelError(e.message || 'Failed to cancel RSVP. Please try again.');
    } finally {
      setCancelLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const isPastEvent = (rsvp: EnrichedRsvp): boolean => {
    // If there's an end time, the event is only past once it has ended
    if (rsvp.endTime) return new Date(rsvp.endTime) < new Date();
    // If no end time, fall back to start time
    if (rsvp.startTime) return new Date(rsvp.startTime) < new Date();
    return false;
  };

  const isOngoingEvent = (rsvp: EnrichedRsvp): boolean => {
    if (!rsvp.startTime || !rsvp.endTime) return false;
    const now = new Date();
    return new Date(rsvp.startTime) <= now && new Date(rsvp.endTime) >= now;
  };

  const isUpcomingEvent = (rsvp: EnrichedRsvp): boolean => {
    if (!rsvp.startTime) return false;
    return new Date(rsvp.startTime) > new Date();
  };

  const filteredRsvps = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rsvps;
    return rsvps.filter(r =>
      r.title?.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q) ||
      r.location?.toLowerCase().includes(q) ||
      r.eventDate?.toLowerCase().includes(q)
    );
  }, [rsvps, search]);

  const ongoingRsvps = filteredRsvps.filter(r => isOngoingEvent(r));
  const upcomingRsvps = filteredRsvps.filter(r => isUpcomingEvent(r));
  const pastRsvps = filteredRsvps.filter(r => isPastEvent(r) && !isOngoingEvent(r));

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg" mb="xl">
        <Group justify="space-between" align="center">
          <Box>
            <Title order={2}>My RSVPs</Title>
            <Text c="dimmed">View and manage your event registrations</Text>
          </Box>
          <Group gap="xs"> 
            <Button variant="light" onClick={navigateEvents} leftSection={<IconTicket size={16} />}>
              Browse Events
            </Button>
            
            <Button variant="outline" onClick={handleRefreshClick} leftSection={<IconRefresh size={16} />}>
              Refresh
            </Button>
          </Group>
        </Group>

        <TextInput
          placeholder="Search by name, location, or date..."
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          radius="md"
        />
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
      ) : rsvps.length === 0 || (search && filteredRsvps.length === 0) ? (
        <Card shadow="sm" padding="xl" radius="md" withBorder>
          <Stack align="center" gap="md" py="xl">
            <IconTicket size={48} stroke={1.5} color="gray" />
            <Title order={3} c="dimmed">
              {search ? 'No matching RSVPs' : 'No RSVPs Yet'}
            </Title>
            <Text c="dimmed" ta="center">
              {search ? `No RSVPs found for "${search}".` : "You haven't registered for any events yet."}
            </Text>
            {search ? (
              <Button variant="subtle" onClick={() => setSearch('')}>Clear search</Button>
            ) : (
              <Button onClick={navigateEvents} mt="md" leftSection={<IconCalendar size={16} />}>
                Discover Events
              </Button>
            )}
          </Stack>
        </Card>
      ) : (
        <Stack gap="xl">

          {/* Ongoing Events */}
          {ongoingRsvps.length > 0 && (
            <Box>
              <Group mb="md">
                <IconClock size={20} stroke={1.5} color="var(--mantine-color-teal-6)" />
                <Title order={3}>Happening Now ({ongoingRsvps.length})</Title>
              </Group>
              <Stack gap="md">
                {ongoingRsvps.map((rsvp) => (
                  <Card key={rsvp.eventId} shadow="sm" padding="lg" radius="md" withBorder
                    style={{ borderColor: 'var(--mantine-color-teal-4)' }}
                  >
                    <Group justify="space-between" align="start" wrap="nowrap">
                      <Box style={{ flex: 1 }}>
                        <Group mb="xs" gap="xs">
                          <Title order={4}>{rsvp.title}</Title>
                          <Badge color="teal" variant="filled" size="sm">Live Now</Badge>
                          {rsvp.featured && (
                            <Badge color="orange" variant="light" size="sm">Featured</Badge>
                          )}
                        </Group>

                        {rsvp.description && (
                          <Text size="sm" c="dimmed" mb="sm" lineClamp={2}>
                            {rsvp.description}
                          </Text>
                        )}

                        <Stack gap="xs" mt="sm">
                          <Group gap="xs">
                            <IconCalendar size={16} stroke={1.5} />
                            <Text size="sm">{rsvp.eventDate}</Text>
                          </Group>

                          {rsvp.startTime && (
                            <Group gap="xs">
                              <IconClock size={16} stroke={1.5} />
                              <Text size="sm">
                                {formatTime(rsvp.startTime)}
                                {rsvp.endTime && ` - ${formatTime(rsvp.endTime)}`}
                              </Text>
                            </Group>
                          )}

                          {rsvp.location && (
                            <Group gap="xs">
                              <IconMapPin size={16} stroke={1.5} />
                              <Text size="sm" lineClamp={1}>{rsvp.location}</Text>
                            </Group>
                          )}

                          <Divider my="xs" />

                          <Group gap="xs">
                            <IconInfoCircle size={14} stroke={1.5} />
                            <Text size="xs" c="dimmed">
                              Registered on {rsvp.registeredDate}
                            </Text>
                          </Group>
                        </Stack>
                      </Box>
                    </Group>
                  </Card>
                ))}
              </Stack>
            </Box>
          )}

          {/* Upcoming Events */}
          {upcomingRsvps.length > 0 && (
            <Box>
              <Group mb="md">
                <IconCalendar size={20} stroke={1.5} />
                <Title order={3}>Upcoming Events ({upcomingRsvps.length})</Title>
              </Group>
              <Stack gap="md">
                {upcomingRsvps.map((rsvp) => (
                  <Card key={rsvp.eventId} shadow="sm" padding="lg" radius="md" withBorder>
                    <Group justify="space-between" align="start" wrap="nowrap">
                      <Box style={{ flex: 1 }}>
                        <Group mb="xs" gap="xs">
                          <Title order={4}>{rsvp.title}</Title>
                          {rsvp.featured && (
                            <Badge color="orange" variant="light" size="sm">Featured</Badge>
                          )}
                        </Group>

                        {rsvp.description && (
                          <Text size="sm" c="dimmed" mb="sm" lineClamp={2}>
                            {rsvp.description}
                          </Text>
                        )}

                        <Stack gap="xs" mt="sm">
                          <Group gap="xs">
                            <IconCalendar size={16} stroke={1.5} />
                            <Text size="sm">{rsvp.eventDate}</Text>
                          </Group>

                          {rsvp.startTime && (
                            <Group gap="xs">
                              <IconClock size={16} stroke={1.5} />
                              <Text size="sm">
                                {formatTime(rsvp.startTime)}
                                {rsvp.endTime && ` - ${formatTime(rsvp.endTime)}`}
                              </Text>
                            </Group>
                          )}

                          {rsvp.location && (
                            <Group gap="xs">
                              <IconMapPin size={16} stroke={1.5} />
                              <Text size="sm" lineClamp={1}>{rsvp.location}</Text>
                            </Group>
                          )}

                          <Divider my="xs" />

                          <Group gap="xs">
                            <IconInfoCircle size={14} stroke={1.5} />
                            <Text size="xs" c="dimmed">
                              Registered on {rsvp.registeredDate}
                            </Text>
                          </Group>
                        </Stack>
                      </Box>

                      <ActionIcon
                        color="red"
                        variant="subtle"
                        size="lg"
                        onClick={() => handleCancelClick(rsvp)}
                        title="Cancel RSVP"
                      >
                        <IconTrash size={20} />
                      </ActionIcon>
                    </Group>
                  </Card>
                ))}
              </Stack>
            </Box>
          )}

          {/* Past Events */}
          {pastRsvps.length > 0 && (
            <Box>
              <Group mb="md">
                <IconClock size={20} stroke={1.5} />
                <Title order={3}>Past Events ({pastRsvps.length})</Title>
              </Group>
              <Stack gap="md">
                {pastRsvps.map((rsvp) => (
                  <Card key={rsvp.eventId} shadow="sm" padding="lg" radius="md" withBorder opacity={0.7}>
                    <Box>
                      <Group mb="xs" gap="xs">
                        <Title order={4} c="dimmed">{rsvp.title}</Title>
                        <Badge color="gray" variant="light" size="sm">Past</Badge>
                      </Group>

                      {rsvp.description && (
                        <Text size="sm" c="dimmed" mb="sm" lineClamp={2}>
                          {rsvp.description}
                        </Text>
                      )}

                      <Stack gap="xs" mt="sm">
                        <Group gap="xs">
                          <IconCalendar size={16} stroke={1.5} />
                          <Text size="sm" c="dimmed">{rsvp.eventDate}</Text>
                        </Group>

                        {rsvp.startTime && (
                          <Group gap="xs">
                            <IconClock size={16} stroke={1.5} />
                            <Text size="sm" c="dimmed">
                              {formatTime(rsvp.startTime)}
                              {rsvp.endTime && ` - ${formatTime(rsvp.endTime)}`}
                            </Text>
                          </Group>
                        )}

                        {rsvp.location && (
                          <Group gap="xs">
                            <IconMapPin size={16} stroke={1.5} />
                            <Text size="sm" c="dimmed" lineClamp={1}>{rsvp.location}</Text>
                          </Group>
                        )}
                      </Stack>
                    </Box>
                  </Card>
                ))}
              </Stack>
            </Box>
          )}

        </Stack>
      )}

      <Modal
        opened={cancelModalOpened}
        onClose={() => !cancelLoading && closeCancelModal()}
        title="Cancel RSVP"
        centered
        withCloseButton={!cancelLoading}
      >
        <Stack py="md">
          {cancelError ? (
            <>
              <IconAlertCircle size={48} color="red" style={{ alignSelf: 'center' }} />
              <Text ta="center" fw={500}>Cancellation Failed</Text>
              <Text size="sm" c="dimmed" ta="center">
                {cancelError}
              </Text>
              <Button onClick={closeCancelModal} fullWidth mt="md">
                Close
              </Button>
            </>
          ) : cancelLoading ? (
            <Stack align="center" gap="md">
              <Loader size="lg" />
              <Text size="sm" c="dimmed">Cancelling your RSVP...</Text>
            </Stack>
          ) : (
            <>
              <Alert icon={<IconInfoCircle />} color="blue" mb="md">
                Are you sure you want to cancel your RSVP for <strong>{selectedRsvp?.title}</strong>?
              </Alert>
              <Text size="sm" c="dimmed" ta="center" mb="md">
                This action cannot be undone. You'll need to RSVP again if you change your mind.
              </Text>
              <Stack align="center">
                <Turnstile
                  siteKey={config.turnstileSiteKey}
                  options={{ size: 'flexible' }}
                  onSuccess={handleTurnstileSuccess}
                />
                <Text size="xs" c="dimmed">Security Check</Text>
              </Stack>
            </>
          )}
        </Stack>
      </Modal>
    </Container>
  );
}