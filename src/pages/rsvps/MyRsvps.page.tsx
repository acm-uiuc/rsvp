import { useCallback, useEffect } from 'react';
import { MainLayout } from '../../components/Layout';
import { useAuth } from '../../components/AuthContext';
import { useProfile } from '../../components/ProfileContext';
import { useRsvps } from '../../components/RsvpsContext';
import { useNavigate } from 'react-router-dom';
import { MyRsvpsView } from './MyRsvps.view';
import { ApiRequestError, parseBodyText } from '../../common/utils/apiError';
import { showApiErrorNotification } from '../../common/utils/notifyError';
import { Configuration, RSVPApi, ResponseError } from '@acm-uiuc/core-client';
import { config } from '../../config';

export function MyRsvpsPage() {
  const { getToken } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { rsvps, loading, error: rsvpsError, refetch: refetchRsvps } = useRsvps();
  const navigate = useNavigate();

  useEffect(() => {
    if (rsvpsError) showApiErrorNotification(rsvpsError);
  }, [rsvpsError]);

  useEffect(() => {
    if (!profileLoading && !profile) {
      navigate('/profile?firstTime=true', { replace: true });
    }
  }, [profileLoading, profile, navigate]);

  const handleCancel = useCallback(async (eventId: string, turnstileToken: string) => {
    const xUiucToken = await getToken();
    const api = new RSVPApi(new Configuration({ basePath: config.apiBaseUrl }));

    try {
      const raw = await api.apiV1RsvpEventEventIdAttendeeMeDeleteRaw({
        eventId,
        xUiucToken: xUiucToken || '',
        xTurnstileResponse: turnstileToken,
      });
      // response body may be empty; don't parse it
      if (!raw.raw.ok) throw new Error('Unexpected response');
      await refetchRsvps();
    } catch (err) {
      if (err instanceof ResponseError) {
        const { status, headers } = err.response;
        const requestId = headers.get('x-request-id') ?? undefined;
        let text = '';
        try { text = await err.response.text(); } catch { /* ignore */ }
        const message = parseBodyText(text);

        if (status === 404) throw new ApiRequestError('RSVP not found. It may have already been cancelled.', 'Not Found');
        if (status === 403) throw new ApiRequestError('You do not have permission to cancel this RSVP.', 'Permission Denied');
        throw new ApiRequestError(message || 'Failed to cancel RSVP', 'Cancellation Failed', requestId);
      }
      throw err;
    }
  }, [getToken, refetchRsvps]);

  return (
    <MainLayout>
      <MyRsvpsView
        rsvps={rsvps}
        loading={loading}
        onCancelRsvp={handleCancel}
        navigateEvents={() => navigate('/events')}
        onRefresh={refetchRsvps}
      />
    </MainLayout>
  );
}
