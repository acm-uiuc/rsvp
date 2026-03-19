import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { config } from '../../config';
import { Event } from '../../common/types/event';
import { ApiError, toApiError } from '../../common/utils/apiError';
import { Configuration, EventsApi } from '@acm-uiuc/core-client';

interface EventsContextValue {
  events: Event[];
  loading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
}

const EventsContext = createContext<EventsContextValue>({
  events: [],
  loading: true,
  error: null,
  refetch: async () => {},
});

export function EventsProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const api = new EventsApi(new Configuration({ basePath: config.apiBaseUrl }));
      const data = await api.apiV1EventsGet({ rsvpOnly: true });
      setEvents(data);
    } catch (err) {
      setError(toApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return (
    <EventsContext.Provider value={{ events, loading, error, refetch: fetchEvents }}>
      {children}
    </EventsContext.Provider>
  );
}

export const useEvents = () => useContext(EventsContext);
