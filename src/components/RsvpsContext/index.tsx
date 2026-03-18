import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { config } from '../../config';
import { useAuth } from '../AuthContext';
import { useEvents } from '../EventsContext';
import { Event } from '../../common/types/event';
import { EnrichedRsvp } from '../../common/types/rsvp';
import { ApiError, toApiError } from '../../common/utils/apiError';
import {
  Configuration,
  RSVPApi,
  ResponseError,
  ApiV1RsvpEventEventIdGet200ResponseInner,
} from '@acm-uiuc/core-client';

function buildEnrichedRsvps(
  rawRsvps: ApiV1RsvpEventEventIdGet200ResponseInner[],
  events: Event[]
): EnrichedRsvp[] {
  const eventsMap: Record<string, Event> = {};
  events.forEach(e => { eventsMap[e.id] = e; });

  return rawRsvps.map(r => {
    const event = eventsMap[r.eventId];
    return {
      eventId: r.eventId,
      title: event?.title || 'Unknown Event',
      description: event?.description,
      eventDate: event?.start
        ? new Date(event.start).toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
          })
        : 'N/A',
      eventTime: event?.start ? new Date(event.start).toLocaleTimeString() : undefined,
      location: event?.location,
      registeredDate: r.createdAt
        ? new Date(r.createdAt * 1000).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
          })
        : 'N/A',
      startTime: event?.start,
      endTime: event?.end,
      featured: event?.featured,
    };
  }).sort((a, b) => {
    const dateA = a.startTime ? new Date(a.startTime).getTime() : 0;
    const dateB = b.startTime ? new Date(b.startTime).getTime() : 0;
    return dateB - dateA;
  });
}

interface RsvpsContextValue {
  rsvps: EnrichedRsvp[];
  loading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
}

const RsvpsContext = createContext<RsvpsContextValue>({
  rsvps: [],
  loading: false,
  error: null,
  refetch: async () => {},
});

export function RsvpsProvider({ children }: { children: ReactNode }) {
  const { getToken, isLoggedIn } = useAuth();
  const { events, loading: eventsLoading } = useEvents();

  const [rawRsvps, setRawRsvps] = useState<ApiV1RsvpEventEventIdGet200ResponseInner[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const rsvps = useMemo(() => buildEnrichedRsvps(rawRsvps, events), [rawRsvps, events]);

  const fetchRsvps = useCallback(async () => {
    if (!isLoggedIn) {
      setRawRsvps([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const xUiucToken = await getToken();
      if (!xUiucToken) return;
      const api = new RSVPApi(new Configuration({ basePath: config.apiBaseUrl }));
      const data = await api.apiV1RsvpMeGet({ xUiucToken }).catch(async (err) => {
        if (err instanceof ResponseError && err.response.status === 400) {
          return [] as ApiV1RsvpEventEventIdGet200ResponseInner[];
        }
        throw err;
      });
      setRawRsvps(data);
    } catch (err) {
      setError(toApiError(err));
      setRawRsvps([]);
    } finally {
      setLoading(false);
    }
  }, [getToken, isLoggedIn]);

  useEffect(() => {
    fetchRsvps();
  }, [isLoggedIn]);

  return (
    <RsvpsContext.Provider value={{ rsvps, loading: loading || eventsLoading, error, refetch: fetchRsvps }}>
      {children}
    </RsvpsContext.Provider>
  );
}

export const useRsvps = () => useContext(RsvpsContext);
