import { useCallback, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '../../components/Layout';
import { useAuth } from '../../components/AuthContext';
import { useProfile } from '../../components/ProfileContext';
import { MyProfileView } from './MyProfile.view';
import { RsvpProfile } from '../../common/types/rsvp';
import {
  Configuration,
  RSVPApi,
  ResponseError,
  ApiV1RsvpProfilePostRequest,
} from '@acm-uiuc/core-client';
import { config } from '../../config';

export function MyProfilePage() {
  const navigate = useNavigate();
  const { getToken, isLoggedIn } = useAuth();
  const { profile, loading, error, refetch: refetchProfile } = useProfile();
  const [searchParams] = useSearchParams();

  const isFirstTime = searchParams.get('firstTime') === 'true';

  useEffect(() => {
    if (!loading && !profile && !isFirstTime && isLoggedIn) {
      navigate('/profile?firstTime=true', { replace: true });
    }
  }, [loading, profile, isFirstTime, isLoggedIn, navigate]);

  const updateProfile = useCallback(
    async (profileData: Omit<RsvpProfile, 'updatedAt'>, turnstileToken: string) => {
      const xUiucToken = await getToken();
      const api = new RSVPApi(new Configuration({ basePath: config.apiBaseUrl }));

      try {
        const raw = await api.apiV1RsvpProfilePostRaw({
          xUiucToken: xUiucToken || '',
          xTurnstileResponse: turnstileToken,
          apiV1RsvpProfilePostRequest: profileData as ApiV1RsvpProfilePostRequest,
        });
        if (!raw.raw.ok) throw new Error('Unexpected response');
      } catch (err) {
        if (err instanceof ResponseError) {
          const { status } = err.response;
          let errText = '';
          try { errText = await err.response.text(); } catch { /* ignore */ }

          if (status === 400) {
            try {
              const errorJson = JSON.parse(errText);
              if (errorJson.message) throw new Error(errorJson.message);
            } catch (parseError) {
              if (parseError instanceof Error && parseError.message !== errText) throw parseError;
              throw new Error(errText || 'Invalid profile data. Please check your entries.');
            }
          }
          if (status === 403) throw new Error('You do not have permission to update this profile.');
          throw new Error(errText || 'Failed to update profile');
        }
        throw err;
      }

      await refetchProfile();
    },
    [getToken, refetchProfile]
  );

  return (
    <MainLayout>
      <MyProfileView
        profile={profile}
        loading={loading}
        error={error}
        updateProfile={updateProfile}
        isFirstTime={isFirstTime}
      />
    </MainLayout>
  );
}
