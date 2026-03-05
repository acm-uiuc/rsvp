import { useCallback, useEffect } from 'react';
import { MainLayout } from '../../components/Layout';
import { useAuth } from '../../components/AuthContext';
import { useProfile } from '../../components/ProfileContext';
import { useNavigate } from 'react-router-dom';
import { RsvpItem } from '../../common/types/rsvp';
import { Event } from '../../common/types/event';
import { config } from '../../config';
import { MyRsvpsView, EnrichedRsvp } from './MyRsvps.view';
import { apiCache, CacheTTL } from '../../common/utils/apiCache';
import { ApiRequestError } from '../../common/utils/apiError';

export function MyRsvpsPage() {
  const { getToken, user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const navigate = useNavigate();

  useEffect(() => {
    if (!profileLoading && !profile) {
      navigate('/profile?firstTime=true', { replace: true });
    }
  }, [profileLoading, profile, navigate]);

  const getMyRsvps = useCallback(async (): Promise<EnrichedRsvp[]> => {
    if (!user) return [];
    
    return apiCache.getOrFetch(
      'rsvps:my',
      async () => {
        const token = await getToken();
        if (!token) throw new Error("Unable to authenticate.");

        const [rsvpRes, eventsRes] = await Promise.all([
          fetch(config.apiBaseUrl + '/api/v1/rsvp/me', {
            headers: { 
              'x-uiuc-token': token, 
              'Content-Type': 'application/json' 
            }
          }),
          fetch(config.apiBaseUrl + '/api/v1/events', {
            cache: 'no-store'
          })
        ]);

        if (!rsvpRes.ok) {
          if (rsvpRes.status === 400) {
            return []; 
          }
          throw new Error('Failed to fetch RSVPs');
        }
        
        const rsvpData: RsvpItem[] = await rsvpRes.json();
        const eventsData: Event[] = eventsRes.ok ? await eventsRes.json() : [];
        
        const eventsMap: Record<string, Event> = {};
        eventsData.forEach(e => { eventsMap[e.id] = e; });
        return rsvpData.map(r => {
          const event = eventsMap[r.eventId];
          
          return {
            eventId: r.eventId,
            title: event?.title || "Unknown Event",
            description: event?.description,
            eventDate: event?.start 
              ? new Date(event.start).toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                })
              : "N/A",
            eventTime: event?.start ? new Date(event.start).toLocaleTimeString() : undefined,
            location: event?.location,
            registeredDate: r.createdAt 
              ? new Date(r.createdAt * 1000).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })
              : "N/A",
            startTime: event?.start,
            endTime: event?.end,
            featured: event?.featured,
          };
        }).sort((a, b) => {
          const dateA = a.startTime ? new Date(a.startTime).getTime() : 0;
          const dateB = b.startTime ? new Date(b.startTime).getTime() : 0;
          return dateB - dateA; 
        });
      },
      CacheTTL.MEDIUM 
    );
  }, [getToken, user]);

  const handleRefresh = useCallback(async () => {
    apiCache.invalidate('rsvps:my');
    return getMyRsvps();
  }, [getMyRsvps]);

  const handleCancel = useCallback(async (eventId: string, turnstileToken: string) => {
    const authToken = await getToken();
    
    const response = await fetch(config.apiBaseUrl + `/api/v1/rsvp/event/${eventId}/attendee/me`, {
      method: 'DELETE',
      headers: {
        'x-uiuc-token': authToken || '',
        'x-turnstile-response': turnstileToken,
      }
    });

    if (!response.ok) {
      const txt = await response.text();
      const requestId = response.headers.get('x-request-id') ?? undefined;

      if (response.status === 404) {
        throw new ApiRequestError('RSVP not found. It may have already been cancelled.', 'Not Found', requestId);
      }

      if (response.status === 403) {
        throw new ApiRequestError('You do not have permission to cancel this RSVP.', 'Permission Denied', requestId);
      }

      throw new ApiRequestError(txt || 'Failed to cancel RSVP', 'Cancellation Failed', requestId);
    }

    apiCache.invalidate('rsvps:my');
  }, [getToken]);

  return (
    <MainLayout>
      <MyRsvpsView 
        getRsvps={getMyRsvps}
        onCancelRsvp={handleCancel}
        navigateEvents={() => navigate('/events')}
        onRefresh={handleRefresh}      
      />
    </MainLayout>
  );
}