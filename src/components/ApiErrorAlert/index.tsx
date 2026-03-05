import { useState } from 'react';
import { Alert, Button, Collapse, Code, Group, Stack, Text } from '@mantine/core';
import { IconAlertCircle, IconChevronDown, IconChevronUp, IconMail } from '@tabler/icons-react';
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
    >
      <Stack gap="xs">
        <Text size="sm">{message}</Text>

        {requestId && (
          <>
            <Button
              variant="subtle"
              color="red"
              size="xs"
              p={0}
              h="auto"
              rightSection={detailsOpen ? <IconChevronUp size={12} /> : <IconChevronDown size={12} />}
              onClick={() => setDetailsOpen((o) => !o)}
              style={{ alignSelf: 'flex-start' }}
            >
              {detailsOpen ? 'Hide details' : 'Show details'}
            </Button>
            <Collapse in={detailsOpen}>
              <Group gap="xs" align="center">
                <Text size="xs" c="dimmed">Request ID:</Text>
                <Code>{requestId}</Code>
              </Group>
            </Collapse>
          </>
        )}

        <Button
          variant="subtle"
          color="red"
          size="xs"
          p={0}
          h="auto"
          leftSection={<IconMail size={12} />}
          onClick={handleReport}
          style={{ alignSelf: 'flex-start' }}
        >
          Report Error
        </Button>
      </Stack>
    </Alert>
  );
}
