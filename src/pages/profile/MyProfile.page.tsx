import { useCallback, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '../../components/Layout';
import { config } from '../../config';
import { useAuth } from '../../components/AuthContext';
import { useProfile } from '../../components/ProfileContext';
import { MyProfileView } from './MyProfile.view';
import { RsvpProfile } from '../../common/types/rsvp';
import { apiCache } from '../../common/utils/apiCache';

export function MyProfilePage() {
  const navigate = useNavigate();
  const { getToken, isLoggedIn } = useAuth();
  const { profile, loading, error, refetch: refetchProfile } = useProfile();
  const [searchParams] = useSearchParams();

  const isFirstTime = searchParams.get('firstTime') === 'true';

  useEffect(() => {
    if (!loading && !profile && !isFirstTime && isLoggedIn) {
      navigate("/profile?firstTime=true", { replace: true });
    }
  }, [loading, profile, isFirstTime, isLoggedIn, navigate]);

  const updateProfile = useCallback(
    async (profileData: Omit<RsvpProfile, 'updatedAt'>, turnstileToken: string) => {
      const authToken = await getToken();

      const response = await fetch(config.apiBaseUrl + '/api/v1/rsvp/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-uiuc-token': authToken || '',
          'x-turnstile-response': turnstileToken,
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const errData = await response.text();
        
        if (response.status === 400) {
          try {
            const errorJson = JSON.parse(errData);
            if (errorJson.message) {
              throw new Error(errorJson.message);
            }
          } catch (parseError) {
            throw new Error(errData || 'Invalid profile data. Please check your entries.');
          }
        }
        
        if (response.status === 403) {
          throw new Error('You do not have permission to update this profile.');
        }
        
        throw new Error(errData || 'Failed to update profile');
      }

      apiCache.invalidate('profile:me');
      apiCache.invalidatePattern(/^profile:/);
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