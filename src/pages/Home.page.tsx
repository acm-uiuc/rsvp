import { useEffect } from 'react';
import { 
  Title, 
  Text, 
  Container, 
  SimpleGrid, 
  Card, 
  ThemeIcon, 
  Button, 
  Stack,
  Group
} from '@mantine/core';
import { IconCalendarEvent, IconTicket, IconSettings } from '@tabler/icons-react';
import { useAuth } from '../components/AuthContext';
import { MainLayout } from '../components/Layout/index';
import { useNavigate } from 'react-router-dom';
import { config } from '../config';

export function HomePage() {
  const { user, isLoggedIn, getToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
      const checkProfile = async () => {
        if (isLoggedIn && user) {
          const authToken = await getToken();
          try {
            const response = await fetch(config.apiBaseUrl + `/api/v1/rsvp/profile/me`, {
              method: 'DELETE',
              headers: {
                'x-uiuc-token': authToken || '',
              }
            });
            const res = await fetch('https://www.acm.illinois.edu/api/v1/syncIdentity/isRequired', {
              method: 'GET',
              headers: {
                'x-uiuc-token': authToken || '',
              }
            });
            const syncRequired = await res.json();
            console.log(syncRequired);
            if (syncRequired?.syncRequired) {
              const syncRes = await fetch('https://core.acm.illinois.edu/api/v1/syncIdentity', {
                method: 'POST',
                headers: {
                  'x-uiuc-token': authToken || '',
                }
              });
              console.log(syncRes);
            }
            if (response.status === 400 || response.status === 404) {
              navigate("/profile?firstTime=true", { replace: true });
            } else {
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

  const actions = [
    { title: 'Upcoming Events', icon: IconCalendarEvent, color: 'blue', desc: 'Browse and RSVP to corporate events', path: '/events' },
    { title: 'My RSVPs', icon: IconTicket, color: 'green', desc: 'View your tickets and status', path: '/my-rsvps' },
    { title: 'Profile', icon: IconSettings, color: 'gray', desc: 'Update your resume and dietary info', path: '/profile' },
  ];

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
                
                <Text size="sm" c="dimmed" mt="sm">
                  {item.desc}
                </Text>

                <Button variant="light" color={item.color} fullWidth mt="md" radius="md" onClick={() => navigate(item.path)}>
                  Open
                </Button>
              </Card>
            ))}
          </SimpleGrid>
        </Stack>
      </Container>
    </MainLayout>
  );
}