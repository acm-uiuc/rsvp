import { Stack, Button, Text } from "@mantine/core";
import { IconCalendarEvent, IconTicket, IconHome } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";

export function Sidebar() {
  const navigate = useNavigate();
  const getVariant = (path: string) => {
    return location.pathname === path ? "light" : "subtle";
  };
  return (
    <Stack gap="xs">
      <Text size="xs" fw={500} c="dimmed" mb="xs">MENU</Text>
      
      <Button 
        variant={getVariant('/home')} 
        justify="start" 
        leftSection={<IconHome size={20}/>}
        onClick={() => navigate('/home')}
      >
        Home
      </Button>

      <Button 
        variant={getVariant('/events')} 
        justify="start" 
        leftSection={<IconCalendarEvent size={20}/>}
        onClick={() => navigate('/events')}
      >
        Upcoming Events
      </Button>
      
      <Button 
        variant={getVariant('/my-rsvps')} 
        justify="start" 
        leftSection={<IconTicket size={20}/>}
        onClick={() => navigate('/my-rsvps')}
      >
        My RSVPs
      </Button>
    </Stack>
  );
}