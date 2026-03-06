import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Title, Text, Container, Card, Button, Group, Stack,
  Loader, Alert, Modal, TextInput, Select, MultiSelect,
  Badge, ActionIcon, Box, Progress, Tooltip, SimpleGrid,
  Notification
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Turnstile } from '@marsidev/react-turnstile';
import {
  IconEdit, IconCheck, IconX, IconUser,
  IconSchool, IconStar, IconApple, IconAlertCircle
} from '@tabler/icons-react';
import { config } from '../../config';
import { RsvpProfile, COMMON_INTERESTS } from '../../common/types/rsvp';
import { ALL_MAJORS } from '@acm-uiuc/js-shared';
import { ApiErrorAlert } from '../../components/ApiErrorAlert';
import type { ApiError } from '../../common/utils/apiError';

interface MyProfileViewProps {
  profile: RsvpProfile | null;
  loading: boolean;
  error: ApiError | null;
  updateProfile: (profile: Omit<RsvpProfile, 'updatedAt'>, turnstileToken: string) => Promise<void>;
  isFirstTime: boolean;
}

const DIETARY_RESTRICTIONS_OPTIONS = [
  "Vegetarian", "Vegan", "No Beef", "Gluten-Free", "Dairy-Free", "Nut Allergy", "Shellfish Allergy", "Halal", "Kosher", "Lactose Intolerant", "Pescatarian"
];

const GRAD_MONTHS = ["May", "August", "December"];
const DEGREES = ["Bachelor's", "Master's", "PhD", "Other"];

const currentYear = new Date().getFullYear();
const GRAD_YEARS = Array.from({ length: 10 }, (_, i) => (currentYear + i).toString());

export function MyProfileView({ profile, loading, error, updateProfile, isFirstTime }: MyProfileViewProps) {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(isFirstTime);

  const [gradMonth, setGradMonth] = useState<string>('');
  const [gradYear, setGradYear] = useState<string>('');
  const [degree, setDegree] = useState<string>('');
  
  const [intendedMajor, setIntendedMajor] = useState<string>('');
  const [interests, setInterests] = useState<string[]>([]);
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [customInterest, setCustomInterest] = useState('');

  const [errorDismissed, setErrorDismissed] = useState(false);
  const [opened, { open, close }] = useDisclosure(false);
  const [welcomeOpened, { close: closeWelcome }] = useDisclosure(isFirstTime);
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    if (error) setErrorDismissed(false);
  }, [error]);

  useEffect(() => {
    if (profile) {
      setGradMonth(profile.gradMonth);
      setGradYear(profile.gradYear.toString());
      setDegree(profile.expectedDegree);
      setIntendedMajor(profile.intendedMajor);
      setInterests(profile.interests);
      setDietaryRestrictions(profile.dietaryRestrictions);
    }
  }, [profile]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (profile) {
      setGradMonth(profile.gradMonth);
      setGradYear(profile.gradYear.toString());
      setDegree(profile.expectedDegree);
      setIntendedMajor(profile.intendedMajor);
      setInterests(profile.interests);
      setDietaryRestrictions(profile.dietaryRestrictions);
    }
    setIsEditing(false);
  };

  const handleSaveClick = () => {
    if (!gradMonth || !gradYear || !degree) {
      alert('Please fill out your graduation month, year, and degree.');
      return;
    }
    if (!intendedMajor) {
      alert('Please select your major');
      return;
    }
    open();
  };

  const handleAddCustomInterest = () => {
    if (customInterest.trim() && !interests.includes(customInterest.trim())) {
      setInterests([...interests, customInterest.trim()]);
      setCustomInterest('');
    }
  };

  const handleTurnstileSuccess = async (token: string) => {
    setSaveLoading(true);    
    try {
      await updateProfile(
        {
          gradYear: parseInt(gradYear, 10),
          gradMonth: gradMonth,
          expectedDegree: degree,
          intendedMajor,
          interests,
          dietaryRestrictions,
        },
        token
      );

      setIsEditing(false);
      close();
      
      if (isFirstTime) {
        navigate('/home', { replace: true });
      }
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Failed to update profile');
    } finally {
      setSaveLoading(false);
    }
  };

  const getProfileCompletion = () => {
    if (!profile) return 0;
    let completed = 0;
    const total = 4;
    if (profile.gradYear && profile.gradMonth && profile.expectedDegree) completed++;
    if (profile.intendedMajor) completed++;
    if (profile.interests.length > 0) completed++;
    if (profile.dietaryRestrictions.length > 0) completed++;
    return Math.round((completed / total) * 100);
  };

  if (!loading && !isFirstTime && !profile) {
    return (
      <Container size="md" py="xl">
        <Alert 
          icon={<IconAlertCircle size={16} />} 
          title="Profile Not Found" 
          color="red"
          variant="filled"
        >
          We could not locate your profile information. Please contact support or try logging in again.
        </Alert>
        <Group mt="md">
            <Button onClick={() => window.location.reload()}>Reload Page</Button>
        </Group>
      </Container>
    );
  }

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="center">
          <Box>
            <Title order={2}>My Profile</Title>
            <Text c="dimmed" size="sm">Manage your personal information and preferences</Text>
          </Box>
          
          {!isEditing && profile && (
            <Group gap="xs">              
              <Tooltip label="Edit Profile">
                <ActionIcon variant="light" color="blue" size="lg" onClick={handleEditClick} w={36} h={36}>
                  <IconEdit size={20} />
                </ActionIcon>
              </Tooltip>
            </Group>
          )}
        </Group>

        {!isEditing && profile && (
          <Card shadow="sm" padding="md" radius="md" withBorder>
            <Group justify="space-between" mb="xs">
              <Text size="sm" fw={500}>Profile Completion</Text>
              <Text size="sm" c="dimmed">{getProfileCompletion()}%</Text>
            </Group>
            <Progress value={getProfileCompletion()} size="sm" radius="xl" />
          </Card>
        )}

        {!errorDismissed && (
          <ApiErrorAlert error={error} onClose={() => setErrorDismissed(true)} />
        )}

        {loading ? (
          <Group justify="center" py="xl">
            <Loader size="lg" type="dots" />
          </Group>
        ) : (
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Stack gap="md">
              {isEditing ? (
                <>
                  <Box>
                    <Group gap="xs" mb="xs">
                      <IconSchool size={16} />
                      <Text size="sm" fw={500}>Graduation Details <Text span c="red">*</Text></Text>
                    </Group>
                    <SimpleGrid cols={{ base: 1, sm: 3 }}>
                      <Select
                        placeholder="Month"
                        data={GRAD_MONTHS}
                        value={gradMonth}
                        onChange={(value) => setGradMonth(value || '')}
                        required
                      />
                      <Select
                        placeholder="Year"
                        data={GRAD_YEARS}
                        value={gradYear}
                        onChange={(value) => setGradYear(value || '')}
                        required
                      />
                      <Select
                        placeholder="Degree"
                        data={DEGREES}
                        value={degree}
                        onChange={(value) => setDegree(value || '')}
                        required
                      />
                    </SimpleGrid>
                  </Box>

                  <Select
                    label={<Group gap="xs"><IconUser size={16} /><Text size="sm" fw={500}>Major</Text></Group>}
                    placeholder="Select your major"
                    data={ALL_MAJORS}
                    value={intendedMajor}
                    onChange={(value) => setIntendedMajor(value || '')}
                    required
                    withAsterisk
                    searchable
                  />

                  <MultiSelect
                    label={<Group gap="xs"><IconStar size={16} /><Text size="sm" fw={500}>Interests</Text></Group>}
                    placeholder="Select your interests"
                    data={[...COMMON_INTERESTS, ...interests.filter(i => !COMMON_INTERESTS.includes(i))]}
                    value={interests}
                    onChange={setInterests}
                    searchable
                    description="Choose from common interests or add your own below"
                  />

                  <Group gap="xs">
                    <TextInput
                      placeholder="Add custom interest"
                      value={customInterest}
                      onChange={(e) => setCustomInterest(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomInterest(); }}}
                      style={{ flex: 1 }}
                    />
                    <Button onClick={handleAddCustomInterest} variant="light">Add</Button>
                  </Group>

                  <MultiSelect
                    label={<Group gap="xs"><IconApple size={16} /><Text size="sm" fw={500}>Dietary Restrictions</Text></Group>}
                    placeholder="Select any dietary restrictions"
                    data={[...DIETARY_RESTRICTIONS_OPTIONS, ...dietaryRestrictions.filter(d => !DIETARY_RESTRICTIONS_OPTIONS.includes(d))]}
                    value={dietaryRestrictions}
                    onChange={setDietaryRestrictions}
                    searchable
                    description="Help us accommodate you at events"
                  />

                  <Group justify="flex-end" mt="md">
                    {!isFirstTime && (
                      <Button variant="subtle" color="gray" leftSection={<IconX size={16} />} onClick={handleCancelEdit}>
                        Cancel
                      </Button>
                    )}
                    <Button leftSection={<IconCheck size={16} />} onClick={handleSaveClick} disabled={!gradMonth || !gradYear || !degree || !intendedMajor}>
                      {isFirstTime ? 'Complete Setup' : 'Save Changes'}
                    </Button>
                  </Group>
                </>
              ) : (
                <>
                  <Box>
                    <Group gap="xs" mb={4}>
                      <IconSchool size={16} stroke={1.5} />
                      <Text size="sm" c="dimmed">Graduation</Text>
                    </Group>
                    <Badge size="lg" variant="light">
                      {profile?.gradMonth} {profile?.gradYear} — {profile?.expectedDegree}
                    </Badge>
                  </Box>

                  <Box>
                    <Group gap="xs" mb={4}>
                      <IconUser size={16} stroke={1.5} />
                      <Text size="sm" c="dimmed">Major</Text>
                    </Group>
                    <Text fw={500}>{profile?.intendedMajor}</Text>
                  </Box>

                  <Box>
                    <Group gap="xs" mb={8}>
                      <IconStar size={16} stroke={1.5} />
                      <Text size="sm" c="dimmed">Interests</Text>
                    </Group>
                    <Group gap="xs">
                      {profile?.interests.length ? (
                        profile.interests.map((interest) => (
                          <Badge key={interest} variant="dot">{interest}</Badge>
                        ))
                      ) : (
                        <Text size="sm" c="dimmed">No interests added</Text>
                      )}
                    </Group>
                  </Box>

                  <Box>
                    <Group gap="xs" mb={8}>
                      <IconApple size={16} stroke={1.5} />
                      <Text size="sm" c="dimmed">Dietary Restrictions</Text>
                    </Group>
                    <Group gap="xs">
                      {profile?.dietaryRestrictions.length ? (
                        profile.dietaryRestrictions.map((restriction) => (
                          <Badge key={restriction} color="orange" variant="light">{restriction}</Badge>
                        ))
                      ) : (
                        <Text size="sm" c="dimmed">None specified</Text>
                      )}
                    </Group>
                  </Box>

                  {profile?.updatedAt && (
                    <Text size="xs" c="dimmed" mt="md">
                      Last updated: {new Date(profile.updatedAt).toLocaleDateString('en-US', {
                        month: 'long', day: 'numeric', year: 'numeric'
                      })}
                    </Text>
                  )}
                </>
              )}
            </Stack>
          </Card>
        )}
      </Stack>

      <Modal opened={welcomeOpened} onClose={closeWelcome} title="Welcome to ACM @ UIUC!" centered size="md">
        <Stack gap="md">
          <Text>We're excited to have you join our community! To help us provide you with the best experience and personalize event recommendations, we'd like to know a bit more about you.</Text>
          <Text fw={500}>Your profile helps us:</Text>
          <Stack gap="xs" pl="md">
            <Group gap="xs"><IconCheck size={16} color="green" /><Text size="sm">Recommend relevant events and workshops</Text></Group>
            <Group gap="xs"><IconCheck size={16} color="green" /><Text size="sm">Accommodate dietary needs at events</Text></Group>
            <Group gap="xs"><IconCheck size={16} color="green" /><Text size="sm">Connect you with peers in your field</Text></Group>
            <Group gap="xs"><IconCheck size={16} color="green" /><Text size="sm">Tailor content to your interests</Text></Group>
          </Stack>
          <Button fullWidth onClick={closeWelcome} size="md">Get Started</Button>
        </Stack>
      </Modal>

      <Modal opened={opened} onClose={() => !saveLoading && close()} title="Verify Changes" centered withCloseButton={!saveLoading}>
        <Stack align="center" py="md">
          {saveLoading ? (
            <><Loader size="lg" /><Text size="sm" c="dimmed">Saving your profile...</Text></>
          ) : (
            <>
              <Turnstile siteKey={config.turnstileSiteKey} options={{ size: 'flexible' }} onSuccess={handleTurnstileSuccess} />
              <Text size="xs" c="dimmed">Security Check</Text>
            </>
          )}
        </Stack>
      </Modal>
    </Container>
  );
}