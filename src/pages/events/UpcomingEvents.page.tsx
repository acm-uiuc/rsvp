import { useCallback } from 'react';
import { MainLayout } from '../../components/Layout';
import { Event } from '../../common/types/event';
import { config } from '../../config';
import { useAuth } from '../../components/AuthContext';
import { UpcomingEventsView } from './UpcomingEvents.view';
import { apiCache, CacheTTL } from '../../common/utils/apiCache';
import { ApiRequestError } from '../../common/utils/apiError';

export function UpcomingEventsPage() {
  const { getToken } = useAuth();

  const getEvents = useCallback(async (): Promise<Event[]> => {
    return apiCache.getOrFetch(
      'events:upcoming',
      async () => {
        const response = await fetch(config.apiBaseUrl + '/api/v1/events?rsvpOnly=true', {
          cache: 'no-store'
        });
        if (!response.ok) {
          throw new ApiRequestError(
            'Failed to fetch events',
            'Failed to Load Events',
            response.headers.get('x-request-id') ?? undefined,
          );
        }
        const events: Event[] = await response.json();
        return events.sort((a, b) => 
          new Date(a.start).getTime() - new Date(b.start).getTime()
        );
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
      const requestId = response.headers.get('x-request-id') ?? undefined;

      if (response.status === 400) {
        if (
          errData.toLowerCase().includes('profile') ||
          errData.toLowerCase().includes('complete') ||
          errData.toLowerCase().includes('required')
        ) {
          throw new ApiRequestError('Profile setup is required before RSVPing.', 'Profile Required');
        }
        throw new ApiRequestError(errData || 'Bad request', 'Bad Request', requestId);
      }

      if (response.status === 409) {
        throw new ApiRequestError("You've already RSVP'd to this event.", 'Already Registered');
      }

      if (response.status === 403) {
        throw new ApiRequestError('This event is at full capacity.', 'Event Full');
      }

      throw new ApiRequestError(errData || 'Failed to RSVP', 'Request Failed', requestId);
    }

    apiCache.invalidate('rsvps:my');
    apiCache.invalidate('events:upcoming');
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