import { useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '../../components/Layout';
import { config } from '../../config';
import { useAuth } from '../../components/AuthContext';
import { MyProfileView } from './MyProfile.view';
import { RsvpProfile } from '../../common/types/rsvp';
import { apiCache, CacheTTL } from '../../common/utils/apiCache';

export function MyProfilePage() {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [searchParams] = useSearchParams();

  const isFirstTime = searchParams.get('firstTime') === 'true';

  const getProfile = useCallback(async (): Promise<RsvpProfile | null> => {
    const authToken = await getToken();
    
    return apiCache.getOrFetch(
      'profile:me',
      async () => {
        const response = await fetch(config.apiBaseUrl + '/api/v1/rsvp/profile/me', {
          headers: {
            'x-uiuc-token': authToken || '',
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            // Profile doesn't exist yet - redirect to first-time setup if not already there
            if (!isFirstTime) {
              navigate("/profile?firstTime=true", { replace: true });
            }
            return null;
          }
          
          if (response.status === 400) {
            // Validation error or incomplete profile
            const errData = await response.text();
            console.error('Profile validation error:', errData);
            if (!isFirstTime) {
              navigate("/profile?firstTime=true", { replace: true });
            }
            return null;
          }
          
          throw new Error('Failed to fetch profile');
        }

        return await response.json();
      },
      CacheTTL.MEDIUM // Cache for 5 minutes
    );
  }, [getToken, navigate, isFirstTime]);

  const updateProfile = useCallback(
    async (profile: Omit<RsvpProfile, 'updatedAt'>, turnstileToken: string) => {
      const authToken = await getToken();

      const response = await fetch(config.apiBaseUrl + '/api/v1/rsvp/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-uiuc-token': authToken || '',
          'x-turnstile-response': turnstileToken,
        },
        body: JSON.stringify(profile),
      });

      if (!response.ok) {
        const errData = await response.text();
        
        // Handle specific error cases
        if (response.status === 400) {
          // Validation error - try to parse and provide helpful message
          try {
            const errorJson = JSON.parse(errData);
            if (errorJson.message) {
              throw new Error(errorJson.message);
            }
          } catch (parseError) {
            // If not JSON, use the text directly
            throw new Error(errData || 'Invalid profile data. Please check your entries.');
          }
        }
        
        if (response.status === 403) {
          throw new Error('You do not have permission to update this profile.');
        }
        
        throw new Error(errData || 'Failed to update profile');
      }

      // Invalidate profile cache after successful update
      apiCache.invalidate('profile:me');
      
      // Also invalidate any profile-related caches
      apiCache.invalidatePattern(/^profile:/);
    },
    [getToken]
  );

  return (
    <MainLayout>
      <MyProfileView
        getProfile={getProfile}
        updateProfile={updateProfile}
        isFirstTime={isFirstTime}
      />
    </MainLayout>
  );
}