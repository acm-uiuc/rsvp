import { useEffect, useState } from 'react';
import { 
  Title, 
  Text, 
  Container, 
  Card, 
  Badge, 
  Group, 
  Stack, 
  Loader, 
  Alert,
  ThemeIcon,
  Button
} from '@mantine/core';
import { IconTicket, IconCalendar, IconAlertCircle, IconClock } from '@tabler/icons-react';
import { MainLayout } from '../../components/Layout'; 
import { useAuth } from '../../components/AuthContext';
import { useNavigate } from 'react-router-dom';
import { RsvpItem } from '../../common/types/rsvp';
import { Event } from '../../common/types/event';
import { getBaseUrl } from '../../common/utils';

export function MyRsvpsPage() {
  const { getToken, user } = useAuth();
  const navigate = useNavigate();

  const [rsvps, setRsvps] = useState<RsvpItem[]>([]);
  const [eventsMap, setEventsMap] = useState<Record<string, Event>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await getToken();
        if (!token) {
            throw new Error("Unable to authenticate. Please login again.");
        }

        
        const rsvpRes = await fetch(getBaseUrl() +'/api/v1/rsvp/me', {
            method: 'GET',
            headers: {
                'x-uiuc-token': token,
                'Content-Type': 'application/json'
            }
        });

        if (!rsvpRes.ok) throw new Error('Failed to fetch RSVPs');
        const rsvpData: RsvpItem[] = await rsvpRes.json();
        
        const eventsRes = await fetch(getBaseUrl() + '/api/v1/events'); 
        const eventsData: Event[] = await eventsRes.ok ? await eventsRes.json() : [];
        
        const map: Record<string, Event> = {};
        eventsData.forEach(e => { map[e.id] = e; });
        
        setRsvps(rsvpData);
        setEventsMap(map);

      } catch (err) {
        console.error(err);
        setError("Could not load your RSVPs.");
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchData();
  }, [getToken, user]);

  const formatCreatedDate = (epochSeconds: number) => {
    return new Date(epochSeconds * 1000).toLocaleDateString("en-US", {
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
    });
  };

  // const deleteRsvp = async (eventId: string) => {
  //   if (!window.confirm("Are you sure you want to cancel your RSVP?")) {
  //     await fetch(getBaseUrl() + `/api/v1/rsvp/event/${eventId}`, {
  //       method: 'DELETE',
  //       headers: {
  //         'x-uiuc-token': await getToken() || '',
  //         'Content-Type': 'application/json'
  //       }
  //     });
  //     setRsvps(prev => prev.filter(rsvp => rsvp.eventId !== eventId));
  //   }
  // };

  return (
    <MainLayout>
      <Container size="md" py="xl">
        <Stack gap="lg" mb="xl">
          <Title order={2}>My RSVPs</Title>
          <Text c="dimmed">
            Here are the events you have registered for.
          </Text>
        </Stack>

        {error && (
          <Alert icon={<IconAlertCircle />} title="Error" color="red" mb="xl">
            {error}
          </Alert>
        )}

        {loading ? (
          <Group justify="center" py="xl">
            <Loader size="lg" type="dots" />
          </Group>
        ) : (
          <Stack gap="md">
            {rsvps.length === 0 ? (
              <Alert icon={<IconTicket />} color="gray" title="No RSVPs found">
                You haven't RSVP'd to any events yet. Check out the <a href="/events" onClick={(e) => { e.preventDefault(); navigate('/events'); }} style={{ color: 'inherit', textDecoration: 'underline' }}>Upcoming Events</a> page!
              </Alert>
            ) : (
              rsvps.map((rsvp, index) => {
                const eventDetails = eventsMap[rsvp.eventId];
                
                return (
                  <Card key={`${rsvp.eventId}-${index}`} shadow="sm" padding="lg" radius="md" withBorder>
                    <Group justify="space-between" align="start">
                        <Stack gap={4}>
                            {/* If we found the event details, show Title. Else show ID. */}
                            <Title order={4}>
                                {eventDetails ? eventDetails.title : "Unknown Event"}
                            </Title>
                            
                            <Group gap="xs" c="dimmed">
                                <ThemeIcon size="xs" variant="transparent" color="gray">
                                    <IconClock size={14}/>
                                </ThemeIcon>
                                <Text size="sm">
                                    Registered on {formatCreatedDate(rsvp.createdAt)}
                                </Text>
                            </Group>

                            {eventDetails && (
                                <Group gap="xs" c="dimmed">
                                    <ThemeIcon size="xs" variant="transparent" color="gray">
                                        <IconCalendar size={14}/>
                                    </ThemeIcon>
                                    <Text size="sm">
                                        Event Date: {new Date(eventDetails.start).toLocaleDateString()}
                                    </Text>
                                </Group>
                            )}
                        </Stack>

                        <Stack align="end" gap="xs">
                            <Badge color="green" size="lg" variant="light" leftSection={<IconTicket size={12}/>}>
                                Confirmed
                            </Badge>
                            {rsvp.isPaidMember && (
                                <Badge color="violet" variant="outline" size="sm">
                                    Paid Member
                                </Badge>
                            )}
                        </Stack>
                    </Group>
                  </Card>
                );
              })
            )}
          </Stack>
        )}
      </Container>
    </MainLayout>
  );
}