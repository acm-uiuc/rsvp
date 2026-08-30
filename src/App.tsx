import { MantineProvider } from "@mantine/core";
import { useLocalStorage } from "@mantine/hooks";
import { Notifications } from "@mantine/notifications";
import { Router } from "./Router";

export function useColorScheme() {
  return useLocalStorage<'light' | 'dark'>({
    key: 'rsvp-color-scheme',
    defaultValue: 'light',
  });
}

export default function App() {
  const [colorScheme] = useColorScheme();

  return (
    <MantineProvider forceColorScheme={colorScheme}>
      <Notifications position="top-right" />
      <Router />
    </MantineProvider>
  );
}
