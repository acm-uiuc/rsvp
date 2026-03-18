import { 
  Title, 
  Text, 
  Button, 
  Container, 
  Group, 
  rem,
  Stack,
  ThemeIcon
} from '@mantine/core';
import { IconAlertTriangle, IconHome, IconRefresh } from '@tabler/icons-react';
import { useNavigate, useRouteError, isRouteErrorResponse } from 'react-router-dom';

export function ErrorPage() {
  const navigate = useNavigate();
  const error = useRouteError();

  let errorCode = 500;
  let title = "Something went wrong";
  let description = "Our servers could not handle your request. Don't worry, our development team was already notified.";

  if (isRouteErrorResponse(error)) {
    errorCode = error.status;
    
    if (error.status === 404) {
      title = "Nothing to see here";
      description = "Page you are trying to open does not exist. You may have mistyped the address, or the page has been moved to another URL.";
    } else if (error.status === 401) {
        title = "Authentication Required";
        description = "You need to be logged in to access this page.";
    } else if (error.status === 403) {
        title = "Access Denied";
        description = "You do not have permission to view this resource.";
    } else {
        title = error.statusText;
    }
  }

  return (
    <div className="h-screen w-full flex items-center justify-center bg-gray-50">
      <Container size="md">
        <div className="relative">
            {/* Background "500" or "404" Text */}
            <Text 
                c="gray.2" 
                fw={700} 
                style={{ 
                    fontSize: rem(220), 
                    lineHeight: 0.8,
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 0,
                    opacity: 0.4
                }}
                className="select-none pointer-events-none"
            >
                {errorCode}
            </Text>

            {/* Foreground Content */}
            <Stack align="center" gap="md" pos="relative" style={{ zIndex: 1 }}>
                <ThemeIcon size={64} radius="md" color={errorCode === 404 ? "blue" : "red"} variant="light">
                    <IconAlertTriangle size={32} />
                </ThemeIcon>

                <Title ta="center" order={2}>
                    {title}
                </Title>
                
                <Text c="dimmed" size="lg" ta="center" maw={500}>
                    {description}
                </Text>

                <Group justify="center" mt="xl">
                    <Button 
                        variant="subtle" 
                        size="md" 
                        leftSection={<IconRefresh size={18}/>}
                        onClick={() => window.location.reload()}
                    >
                        Refresh Page
                    </Button>
                    <Button 
                        variant="filled" 
                        size="md" 
                        color="blue"
                        leftSection={<IconHome size={18}/>}
                        onClick={() => navigate('/home')}
                    >
                        Take me back home
                    </Button>
                </Group>
            </Stack>
        </div>
      </Container>
    </div>
  );
}