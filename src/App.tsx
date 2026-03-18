import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { Router } from "./Router";

export default function App() {
  return (
    <MantineProvider>
      <Notifications position="top-right" />
        <Router />
    </MantineProvider>
  );
}