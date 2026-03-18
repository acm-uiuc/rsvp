import { MantineProvider, ColorSchemeScript } from "@mantine/core";
import { useLocalStorage } from "@mantine/hooks";
import { Notifications } from "@mantine/notifications";
import { Router } from "./Router";

export default function App() {
  const [colorScheme] = useLocalStorage<'light' | 'dark'>({
    key: 'rsvp-color-scheme',
    defaultValue: 'light',
  });

  return (
    <MantineProvider forceColorScheme={colorScheme}>
      <ColorSchemeScript forceColorScheme={colorScheme} />
      <Notifications position="top-right" />
      <Router />
    </MantineProvider>
  );
}

export function useColorScheme() {
  return useLocalStorage<'light' | 'dark'>({
    key: 'rsvp-color-scheme',
    defaultValue: 'light',
  });
}