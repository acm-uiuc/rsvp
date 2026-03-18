import React from "react";
import ReactDOM from "react-dom/client";
import { config } from "./config";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";

import { MsalProvider } from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";
import { AuthProvider } from "./components/AuthContext";
import { EventsProvider } from "./components/EventsContext";
import { ProfileProvider } from "./components/ProfileContext";
import { RsvpsProvider } from "./components/RsvpsContext";
import App from "./App";

const pca = new PublicClientApplication({
  auth: {
    clientId: config.auth.clientId,
    authority: config.auth.authority,
    redirectUri: config.auth.redirectUri,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <MsalProvider instance={pca}>
      <AuthProvider>
        <EventsProvider>
          <ProfileProvider>
            <RsvpsProvider>
              <App />
            </RsvpsProvider>
          </ProfileProvider>
        </EventsProvider>
      </AuthProvider>
    </MsalProvider>
  </React.StrictMode>
);
