import { useCallback } from 'react';
import { MainLayout } from '../../components/Layout'; 
import { Event } from '../../common/types/event';
import { config } from '../../config'; 
import { useAuth } from '../../components/AuthContext';
import { UpcomingEventsView } from './UpcomingEvents.view';
import { apiCache, CacheTTL } from '../../common/utils/apiCache';

export function UpcomingEventsPage() {
  const { getToken } = useAuth();

  const getEvents = useCallback(async (): Promise<Event[]> => {
    return apiCache.getOrFetch(
      'events:upcoming',
      async () => {
        const response = await fetch(config.apiBaseUrl + '/api/v1/events?upcomingOnly=true', {
          cache: 'no-store'
        });
        if (!response.ok) throw new Error('Failed to fetch events');
        return await response.json();
      },
      CacheTTL.SHORT 
    );
  }, []);

  const handleRefresh = useCallback(async () => {
    apiCache.invalidate('events:upcoming');
    console.log("events that shld have been erased");
    console.log(apiCache.get('events:upcoming'));
    return getEvents();
  }, [getEvents]);

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
      
      // Handle specific error cases
      if (response.status === 400) {
        // Check if it's a profile error
        if (errData.toLowerCase().includes('profile') || 
            errData.toLowerCase().includes('complete') ||
            errData.toLowerCase().includes('required')) {
          throw new Error('400: Profile required');
        }
        throw new Error(`400: ${errData}`);
      }
      
      if (response.status === 409) {
        throw new Error('You have already RSVP\'d to this event');
      }
      
      if (response.status === 403) {
        throw new Error('Event is at full capacity');
      }
      
      throw new Error(errData || 'Failed to RSVP');
    }

    // Invalidate related caches after successful RSVP
    apiCache.invalidate('rsvps:my');
    apiCache.invalidate('events:upcoming'); // In case RSVP affects event capacity
  }, [getToken]);

  return (
    <MainLayout>
      <UpcomingEventsView 
        getEvents={getEvents}
        onRsvp={handleRsvp}
        onRefresh={handleRefresh}
      />
    </MainLayout>
  );
}