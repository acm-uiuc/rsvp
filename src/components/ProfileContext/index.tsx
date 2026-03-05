import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { RsvpProfile } from '../../common/types/rsvp';
import { config } from '../../config';
import { useAuth } from '../../components/AuthContext';
import { apiCache, CacheTTL } from '../../common/utils/apiCache';
import { ApiError, ApiRequestError, toApiError } from '../../common/utils/apiError';

interface ProfileContextValue {
  profile: RsvpProfile | null;
  loading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue>({
  profile: null,
  loading: true,
  error: null,
  refetch: async () => {},
});

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { getToken } = useAuth();
  const [profile, setProfile] = useState<RsvpProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const syncChecked = useRef(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const authToken = await getToken();

      if (!authToken) {
        setProfile(null);
        return;
        }

      if (!syncChecked.current && authToken) {
        syncChecked.current = true;
        try {
          const syncRes = await fetch(config.apiBaseUrl + '/api/v1/syncIdentity/isRequired', {
            headers: { 'x-uiuc-token': authToken },
          });
          const { syncRequired } = await syncRes.json();
          if (syncRequired) {
            await fetch(config.apiBaseUrl + '/api/v1/syncIdentity', {
              method: 'POST',
              headers: { 'x-uiuc-token': authToken },
            });
            apiCache.invalidate('profile:me');
          }
        } catch (syncErr) {
          console.error('Identity sync check failed:', syncErr);
        }
      }

      const data = await apiCache.getOrFetch(
        'profile:me',
        async () => {
          const response = await fetch(config.apiBaseUrl + '/api/v1/rsvp/profile/me', {
            headers: { 'x-uiuc-token': authToken || '' },
          });
          
          if (response.status === 404) {
            return null;
          }

          const requestId = response.headers.get('x-request-id') ?? undefined;

          if (response.status === 400) {
            const errData = await response.text();
            throw new ApiRequestError(`Profile validation error: ${errData}`, 'Validation Error', requestId);
          }

          if (!response.ok) {
            throw new ApiRequestError(
              `Failed to fetch profile (Status: ${response.status})`,
              'Failed to Load Profile',
              requestId,
            );
          }
          
          return await response.json();
        },
        CacheTTL.MEDIUM
      );
      
      setProfile(data);
    } catch (err: unknown) {
      setProfile(null);
      setError(toApiError(err));
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <ProfileContext.Provider value={{ profile, loading, error, refetch: fetchProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export const useProfile = () => useContext(ProfileContext);