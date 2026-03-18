import { notifications } from '@mantine/notifications';
import { Anchor, Code, Group, Stack, Text } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { toApiError } from './apiError';
import type { ApiError } from './apiError';

export function showApiErrorNotification(err: ApiError | unknown): void {
  const error = (
    err !== null &&
    typeof err === 'object' &&
    'title' in err &&
    'message' in err
  ) ? (err as ApiError) : toApiError(err);

  const handleReport = () => {
    const subject = encodeURIComponent('RSVP Platform Error');
    const body = encodeURIComponent(
      [
        `Error: ${error.title}`,
        `Message: ${error.message}`,
        error.requestId ? `Request ID: ${error.requestId}` : null,
        `URL: ${window.location.href}`,
        `Time: ${new Date().toISOString()}`,
      ]
        .filter(Boolean)
        .join('\n')
    );
    window.open(`mailto:infra@acm.illinois.edu?subject=${subject}&body=${body}`);
  };

  notifications.show({
    title: error.title,
    color: 'red',
    icon: <IconAlertCircle size={16} />,
    autoClose: false,
    message: (
      <Stack gap={4}>
        <Text size="sm" style={{ wordBreak: 'break-word' }}>{error.message}</Text>
        {error.requestId && (
          <Group gap="xs" align="center" wrap="nowrap">
            <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>Request ID:</Text>
            <Code style={{ wordBreak: 'break-all', fontSize: '0.7rem' }}>{error.requestId}</Code>
          </Group>
        )}
        <Anchor size="xs" onClick={handleReport} style={{ cursor: 'pointer' }}>
          Report this error
        </Anchor>
      </Stack>
    ),
  });
}
