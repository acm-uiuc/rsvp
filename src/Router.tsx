import React from "react";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
  useLocation,
} from "react-router-dom";
import { useAuth } from "./components/AuthContext";
import AuthCallback from "./components/AuthContext/AuthCallbackHandler.page";

import { UpcomingEventsPage } from "./pages/events/UpcomingEvents.page";
import { ErrorPage } from "./pages/Error.page";
import { HomePage } from "./pages/Home.page";
import { LoginPage } from "./pages/Login.page";
import { LogoutPage } from "./pages/Logout.page";
import { MyRsvpsPage } from "./pages/rsvps/MyRsvps.page";
import { Center } from "@mantine/core";
import FullScreenLoader from "./components/AuthContext/LoadingScreen";

const LoginRedirect: React.FC = () => {
  const location = useLocation();

  const excludedPaths = [
    "/login",
    "/logout",
    "/force_login",
    "/auth/callback",
  ];

  if (excludedPaths.includes(location.pathname)) {
    return <Navigate to="/login" replace />;
  }

  const returnPath = location.pathname + location.search + location.hash;
  const loginUrl = `/login?returnTo=${encodeURIComponent(returnPath)}&li=true`;
  
  return <Navigate to={loginUrl} replace />;
};

const commonRoutes = [
  {
    path: "/force_login",
    element: <LoginPage />,
  },
  {
    path: "/logout",
    element: <LogoutPage />,
  },
  {
    path: "/auth/callback",
    element: <AuthCallback />,
  },
];

const unauthenticatedRouter = createBrowserRouter([
  {
    path: "/",
    errorElement: <ErrorPage />, 
    children: [
      ...commonRoutes,
      {
        path: "/",
        element: <Navigate to="/login" replace />,
      },
      {
        path: "/login",
        element: <LoginPage />,
      },
      {
        path: "*",
        element: <LoginRedirect />,
      },
    ],
  },
]);

const authenticatedRouter = createBrowserRouter([
  {
    path: "/",
    errorElement: <ErrorPage />,
    children: [
      ...commonRoutes,
      {
        path: "/",
        element: <Navigate to="/home" replace />,
      },
      {
        path: "/home",
        element: <HomePage />,
      },
      {
        path: "/events",
        element: <UpcomingEventsPage />,
      },
      {
        path: "/my-rsvps",
        element: <MyRsvpsPage />,
      },
      {
        path: "*",
        element: <Navigate to="/home" replace />,
      },
    ],
  },
]);

export const Router: React.FC = () => {
  const { isLoggedIn, loading } = useAuth();
  if (loading) {
    return (
      <Center h="100vh">
        <FullScreenLoader />
      </Center>
    );
  }
  const router = isLoggedIn ? authenticatedRouter : unauthenticatedRouter;

  return <RouterProvider router={router} />;
};