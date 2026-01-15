import { MantineProvider } from "@mantine/core";
import { useColorScheme, useLocalStorage } from "@mantine/hooks";
import { Notifications } from "@mantine/notifications";

// import ColorSchemeContext from "./ColorSchemeContext";
import { Router } from "./Router";
// import { UserResolverProvider } from "./components/NameOptionalCard";

export default function App() {
  // const preferredColorScheme = useColorScheme();
  // const [colorScheme, setColorScheme] = useLocalStorage({
  //   key: "acm-manage-color-scheme",
  //   defaultValue: preferredColorScheme,
  // });
  return (
    <MantineProvider>
      <Notifications position="top-right" />
        <Router />
    </MantineProvider>
  );
}