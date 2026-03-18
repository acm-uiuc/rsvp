import { useCallback, useEffect, useMemo } from 'react';
import { MainLayout } from '../../components/Layout';
import { Event } from '../../common/types/event';
import { config } from '../../config';
import { useAuth } from '../../components/AuthContext';
import { useEvents } from '../../components/EventsContext';
import { useRsvps } from '../../components/RsvpsContext';
import { UpcomingEventsView } from './UpcomingEvents.view';
import { ApiRequestError, parseBodyText } from '../../common/utils/apiError';
import { showApiErrorNotification } from '../../common/utils/notifyError';
import { Configuration, RSVPApi, ResponseError } from '@acm-uiuc/core-client';

export function UpcomingEventsPage() {
  const { getToken } = useAuth();
  const { events, loading, error: eventsError, refetch: refetchEvents } = useEvents();
  const { rsvps, refetch: refetchRsvps } = useRsvps();

  useEffect(() => {
    if (eventsError) showApiErrorNotification(eventsError);
  }, [eventsError]);

  const rsvpedEventIds = useMemo(() => new Set(rsvps.map(r => r.eventId)), [rsvps]);

  const rsvpEvents = useMemo(() =>
    events
      .filter(e => e.rsvpEnabled)
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()),
    [events]
  );

  const handleRsvp = useCallback(async (event: Event, turnstileToken: string) => {
    const xUiucToken = await getToken();
    const api = new RSVPApi(new Configuration({ basePath: config.apiBaseUrl }));

    try {
      const raw = await api.apiV1RsvpEventEventIdPostRaw({
        eventId: event.id,
        xUiucToken: xUiucToken || '',
        xTurnstileResponse: turnstileToken,
      });
      // 201 response body may be empty; don't parse it
      if (!raw.raw.ok) throw new Error('Unexpected response');
      await refetchRsvps();
    } catch (err) {
      if (err instanceof ResponseError) {
        const { status, headers } = err.response;
        const requestId = headers.get('x-request-id') ?? undefined;
        let text = '';
        try { text = await err.response.text(); } catch { /* ignore */ }
        const message = parseBodyText(text);

        if (text.includes('is not a valid URL')) {
          throw new ApiRequestError('RSVP registration has not been enabled yet.', 'Registration Unavailable', requestId);
        }
        if (status === 400) {
          if (
            text.toLowerCase().includes('profile') ||
            text.toLowerCase().includes('complete') ||
            text.toLowerCase().includes('required')
          ) {
            throw new ApiRequestError('Profile setup is required before RSVPing.', 'Profile Required');
          }
          throw new ApiRequestError(message || 'Bad request', 'Bad Request', requestId);
        }
        if (status === 409) throw new ApiRequestError("You've already RSVP'd to this event.", 'Already Registered');
        if (status === 403) throw new ApiRequestError('This event is at full capacity.', 'Event Full');
        throw new ApiRequestError(message || 'Failed to RSVP', 'Request Failed', requestId);
      }
      throw err;
    }
  }, [getToken, refetchRsvps]);

  return (
    <MainLayout>
      <UpcomingEventsView
        events={rsvpEvents}
        rsvpedEventIds={rsvpedEventIds}
        loading={loading}
        onRsvp={handleRsvp}
        onRefresh={refetchEvents}
      />
    </MainLayout>
  );
}
