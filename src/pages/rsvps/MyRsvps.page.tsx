import { useCallback } from 'react';
import { MainLayout } from '../../components/Layout'; 
import { useAuth } from '../../components/AuthContext';
import { useNavigate } from 'react-router-dom';
import { RsvpItem } from '../../common/types/rsvp';
import { Event } from '../../common/types/event';
import { config } from '../../config';
import { MyRsvpsView, EnrichedRsvp } from './MyRsvps.view';

export function MyRsvpsPage() {
  const { getToken, user } = useAuth();
  const navigate = useNavigate();

  const getMyRsvps = useCallback(async (): Promise<EnrichedRsvp[]> => {
      if (!user) return [];
      
      const token = await getToken();
      if (!token) throw new Error("Unable to authenticate.");

      const [rsvpRes, eventsRes] = await Promise.all([
          fetch(config.apiBaseUrl +'/api/v1/rsvp/me', {
              headers: { 'x-uiuc-token': token, 'Content-Type': 'application/json' }
          }),
          fetch(config.apiBaseUrl + '/api/v1/events')
      ]);

      if (!rsvpRes.ok) throw new Error('Failed to fetch RSVPs');
      
      const rsvpData: RsvpItem[] = await rsvpRes.json();
      const eventsData: Event[] = await eventsRes.ok ? await eventsRes.json() : [];
      
      const eventsMap: Record<string, Event> = {};
      eventsData.forEach(e => { eventsMap[e.id] = e; });

      return rsvpData.map(r => ({
          eventId: r.eventId,
          title: eventsMap[r.eventId]?.title || "Unknown Event",
          eventDate: eventsMap[r.eventId] ? new Date(eventsMap[r.eventId].start).toLocaleDateString() : "N/A",
          registeredDate: rsvpData.find(item => item.eventId === r.eventId)?.createdAt ? new Date(rsvpData.find(item => item.eventId === r.eventId)!.createdAt * 1000).toLocaleDateString() : "N/A",
      }));
  }, [getToken, user]);

  const handleCancel = useCallback(async (eventId: string, token: string) => {
      const authToken = await getToken();
      const response = await fetch(config.apiBaseUrl + `/api/v1/rsvp/event/${eventId}/attendee/me`, {
          method: 'DELETE',
          headers: {
              'x-uiuc-token': authToken || '',
              'x-turnstile-response': token,
          }
      });

      if (!response.ok) {
          const txt = await response.text();
          throw new Error(txt);
      }
  }, [getToken]);

  return (
    <MainLayout>
      <MyRsvpsView 
        getRsvps={getMyRsvps}
        onCancelRsvp={handleCancel}
        navigateEvents={() => navigate('/events')}
      />
    </MainLayout>
  );
}