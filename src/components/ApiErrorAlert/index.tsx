import { useState } from 'react';
import { Alert, Anchor, Collapse, Code, Group, Stack, Text } from '@mantine/core';
import { IconAlertCircle, IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import type { ApiError } from '../../common/utils/apiError';

interface ApiErrorAlertProps {
  error: ApiError | null;
  onClose?: () => void;
}

export function ApiErrorAlert({ error, onClose }: ApiErrorAlertProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  if (!error) return null;

  const { title, message, requestId } = error;

  const handleReport = () => {
    const subject = encodeURIComponent('RSVP Platform Error');
    const body = encodeURIComponent(
      [
        `Error: ${title}`,
        `Message: ${message}`,
        requestId ? `Request ID: ${requestId}` : null,
        `URL: ${window.location.href}`,
        `Time: ${new Date().toISOString()}`,
      ]
        .filter(Boolean)
        .join('\n')
    );
    window.open(`mailto:infra@acm.illinois.edu?subject=${subject}&body=${body}`);
  };

  return (
    <Alert
      icon={<IconAlertCircle size={16} />}
      title={title}
      color="red"
      withCloseButton={!!onClose}
      onClose={onClose}
      style={{ width: '100%' }}
    >
      <Stack gap="sm">
        <Text size="sm" style={{ wordBreak: 'break-word' }}>{message}</Text>

        {requestId && (
          <Stack gap={4}>
            <Anchor
              component="button"
              size="xs"
              c="red"
              underline="hover"
              onClick={() => setDetailsOpen((o) => !o)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              {detailsOpen ? <IconChevronUp size={11} /> : <IconChevronDown size={11} />}
              {detailsOpen ? 'Hide details' : 'Show details'}
            </Anchor>
            <Collapse in={detailsOpen}>
              <Group gap="xs" align="center" wrap="nowrap">
                <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>Request ID:</Text>
                <Code style={{ wordBreak: 'break-all', fontSize: '0.7rem' }}>{requestId}</Code>
              </Group>
            </Collapse>
          </Stack>
        )}

        <Anchor
          component="button"
          size="xs"
          c="red"
          underline="hover"
          onClick={handleReport}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
        >
          Report this error
        </Anchor>
      </Stack>
    </Alert>
  );
}
