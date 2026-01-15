import { useCallback } from 'react';
import { MainLayout } from '../../components/Layout'; 
import { Event } from '../../common/types/event';
import { config } from '../../config'; 
import { useAuth } from '../../components/AuthContext';
import { UpcomingEventsView } from './UpcomingEvents.view';

export function UpcomingEventsPage() {
  const { getToken } = useAuth();

  const getEvents = useCallback(async (): Promise<Event[]> => {
      const response = await fetch(config.apiBaseUrl + '/api/v1/events?upcomingOnly=true');
      if (!response.ok) throw new Error('Failed to fetch events');
      return await response.json();
  }, []);

  const handleRsvp = useCallback(async (event: Event, turnstileToken: string) => {
      const authToken = await getToken();
      
      const response = await fetch(config.apiBaseUrl + `/api/v1/rsvp/event/${event.id}`, {
        method: 'POST',
        headers: {
          'x-uiuc-token': authToken || '',
          'x-turnstile-response': turnstileToken,
        },
      });

      if (!response.ok) {
         const errData = await response.text(); 
         throw new Error(errData);
      }
  }, [getToken]);

  return (
    <MainLayout>
      <UpcomingEventsView 
        getEvents={getEvents}
        onRsvp={handleRsvp}
      />
    </MainLayout>
  );
}