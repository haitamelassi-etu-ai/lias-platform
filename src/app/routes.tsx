import { createBrowserRouter } from "react-router";
import { Root } from "./components/layouts/Root";
import { Home } from "./pages/Home";
import { Axes } from "./pages/Axes";
import { Members } from "./pages/Members";
import { Projects } from "./pages/Projects";
import { Events } from "./pages/Events";
import { Publications } from "./pages/Publications";
import { Dashboard } from "./pages/Dashboard";
import { Profile } from "./pages/Profile";
import { MemberPanel } from "./pages/member/MemberPanel";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Moderation } from "./pages/admin/Moderation";
import { AdminPanel } from "./pages/admin/AdminPanel";
import { ContentManagement } from "./pages/admin/ContentManagement";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { NotFound } from "./pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: "axes", Component: Axes },
      { path: "members", Component: Members },
      { path: "projects", Component: Projects },
      { path: "events", Component: Events },
      { path: "publications", Component: Publications },
      { path: "login", Component: Login },
      { path: "register", Component: Register },
      {
        path: "dashboard",
        element: (
          <ProtectedRoute allowedRoles={["member", "admin"]}>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "profile",
        element: (
          <ProtectedRoute allowedRoles={["member", "admin"]}>
            <Profile />
          </ProtectedRoute>
        ),
      },
      {
        path: "member/panel",
        element: (
          <ProtectedRoute allowedRoles={["member", "admin"]}>
            <MemberPanel />
          </ProtectedRoute>
        ),
      },
      {
        path: "admin/panel",
        element: (
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminPanel />
          </ProtectedRoute>
        ),
      },
      {
        path: "admin/moderation",
        element: (
          <ProtectedRoute allowedRoles={["admin"]}>
            <Moderation />
          </ProtectedRoute>
        ),
      },
      {
        path: "admin/content",
        element: (
          <ProtectedRoute allowedRoles={["admin"]}>
            <ContentManagement />
          </ProtectedRoute>
        ),
      },
      { path: "*", Component: NotFound },
    ],
  },
]);
