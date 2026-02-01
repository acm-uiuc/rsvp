import { useState, useEffect } from 'react';
import {
  Title, Text, Container, Card, Button, Group, Stack,
  Loader, Alert, Box, Modal, Badge, Divider, ActionIcon
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Turnstile } from '@marsidev/react-turnstile';
import {
  IconAlertCircle, IconTicket, IconCalendar, IconClock,
  IconMapPin, IconTrash, IconInfoCircle, IconRefresh
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
      // Call the new refresh function passed from the parent
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

      // Remove from local state
      setRsvps(prev => prev.filter(r => r.eventId !== selectedRsvp.eventId));

      closeCancelModal();

      // Show success message
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

  const isPastEvent = (dateString: string) => {
    return new Date(dateString) < new Date();
  };

  const upcomingRsvps = rsvps.filter(r => r.startTime && !isPastEvent(r.startTime));
  const pastRsvps = rsvps.filter(r => r.startTime && isPastEvent(r.startTime));

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg" mb="xl">
        <Group justify="space-between" align="center">
          <Box>
            <Title order={2}>My RSVPs</Title>
            <Text c="dimmed">View and manage your event registrations</Text>
          </Box>
          <Group gap="xs"> {/* Use gap="xs", "sm", or "md" to control button spacing */}
            <Button variant="light" onClick={navigateEvents} leftSection={<IconTicket size={16} />}>
              Browse Events
            </Button>
            
            {/* Assuming you meant a Refresh button for the second one? */}
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
      ) : rsvps.length === 0 ? (
        <Card shadow="sm" padding="xl" radius="md" withBorder>
          <Stack align="center" gap="md" py="xl">
            <IconTicket size={48} stroke={1.5} color="gray" />
            <Title order={3} c="dimmed">No RSVPs Yet</Title>
            <Text c="dimmed" ta="center">
              You haven't registered for any events yet.
            </Text>
            <Button onClick={navigateEvents} mt="md" leftSection={<IconCalendar size={16} />}>
              Discover Events
            </Button>
          </Stack>
        </Card>
      ) : (
        <Stack gap="xl">
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

      {/* Cancel RSVP Modal */}
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