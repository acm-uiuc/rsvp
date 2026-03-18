import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { RsvpProfile } from '../../common/types/rsvp';
import { config } from '../../config';
import { useAuth } from '../AuthContext';
import { ApiError, ApiRequestError, toApiError } from '../../common/utils/apiError';
import { Configuration, RSVPApi, GenericApi, ResponseError } from '@acm-uiuc/core-client';

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
      const xUiucToken = await getToken();
      if (!xUiucToken) {
        setProfile(null);
        return;
      }

      const sdkConfig = new Configuration({ basePath: config.apiBaseUrl });

      if (!syncChecked.current) {
        syncChecked.current = true;
        try {
          const genericApi = new GenericApi(sdkConfig);
          const { syncRequired } = await genericApi.apiV1SyncIdentityIsRequiredGet({ xUiucToken });
          if (syncRequired) {
            await genericApi.apiV1SyncIdentityPost({ xUiucToken });
          }
        } catch (syncErr) {
          console.error('Identity sync check failed:', syncErr);
        }
      }

      const rsvpApi = new RSVPApi(sdkConfig);
      try {
        const data = await rsvpApi.apiV1RsvpProfileMeGet({ xUiucToken });
        setProfile(data);
      } catch (err) {
        if (err instanceof ResponseError) {
          const { status, headers } = err.response;
          const requestId = headers.get('x-request-id') ?? undefined;
          if (status === 404 || status === 400) {
            setProfile(null);
            return;
          }
          throw new ApiRequestError(
            `Failed to fetch profile (Status: ${status})`,
            'Failed to Load Profile',
            requestId,
          );
        }
        throw err;
      }
    } catch (err) {
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
