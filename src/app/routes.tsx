import { lazy, Suspense, type ComponentType, type ReactNode } from "react";
import { createBrowserRouter, useLocation } from "react-router";
import { Root } from "./components/layouts/Root";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AppErrorBoundary } from "./components/errors/AppErrorBoundary";
import { RouteErrorPage } from "./components/errors/RouteErrorPage";

function lazyPage<T extends ComponentType<object>>(
  importer: () => Promise<Record<string, T>>,
  exportName: string,
) {
  return lazy(async () => {
    const module = await importer();
    const pageComponent = module[exportName];

    if (!pageComponent) {
      throw new Error(`Export de page introuvable: ${exportName}`);
    }

    return { default: pageComponent };
  });
}

const Home = lazyPage(() => import("./pages/Home"), "Home");
const About = lazyPage(() => import("./pages/About"), "About");
const Axes = lazyPage(() => import("./pages/Axes"), "Axes");
const Members = lazyPage(() => import("./pages/Members"), "Members");
const MemberDetail = lazyPage(() => import("./pages/MemberDetail"), "MemberDetail");
const Projects = lazyPage(() => import("./pages/Projects"), "Projects");
const Events = lazyPage(() => import("./pages/Events"), "Events");
const Publications = lazyPage(() => import("./pages/Publications"), "Publications");
const PublicationDetail = lazyPage(() => import("./pages/PublicationDetail"), "PublicationDetail");
const Contact = lazyPage(() => import("./pages/Contact"), "Contact");
const Structure = lazyPage(() => import("./pages/Structure"), "Structure");
const News = lazyPage(() => import("./pages/News"), "News");
const Partners = lazyPage(() => import("./pages/Partners"), "Partners");
const Gallery = lazyPage(() => import("./pages/Gallery"), "Gallery");
const Calls = lazyPage(() => import("./pages/Calls"), "Calls");
const Dashboard = lazyPage(() => import("./pages/Dashboard"), "Dashboard");
const Profile = lazyPage(() => import("./pages/Profile"), "Profile");
const MemberPanel = lazyPage(() => import("./pages/member/MemberPanel"), "MemberPanel");
const Login = lazyPage(() => import("./pages/Login"), "Login");
const Register = lazyPage(() => import("./pages/Register"), "Register");
const ForgotPassword = lazyPage(() => import("./pages/ForgotPassword"), "ForgotPassword");
const ResetPassword = lazyPage(() => import("./pages/ResetPassword"), "ResetPassword");
const OrcidCallback = lazyPage(() => import("./pages/OrcidCallback"), "OrcidCallback");
const OrcidSetup = lazyPage(() => import("./pages/OrcidSetup"), "OrcidSetup");
const Moderation = lazyPage(() => import("./pages/admin/Moderation"), "Moderation");
const AdminPanel = lazyPage(() => import("./pages/admin/AdminPanel"), "AdminPanel");
const ContentManagement = lazyPage(() => import("./pages/admin/ContentManagement"), "ContentManagement");
const AuditLogs = lazyPage(() => import("./pages/admin/AuditLogs"), "AuditLogs");
const NotFound = lazyPage(() => import("./pages/NotFound"), "NotFound");

function PageShell({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <AppErrorBoundary resetKey={location.pathname}>
      <Suspense
        fallback={
          <div className="py-16 text-center text-text-secondary font-serif">
            Chargement de la page...
          </div>
        }
      >
        {children}
      </Suspense>
    </AppErrorBoundary>
  );
}

function page(element: ReactNode) {
  return <PageShell>{element}</PageShell>;
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: page(<Home />) },
      { path: "about", element: page(<About />) },
      { path: "axes", element: page(<Axes />) },
      { path: "members", element: page(<Members />) },
      { path: "members/:memberId", element: page(<MemberDetail />) },
      { path: "projects", element: page(<Projects />) },
      { path: "events", element: page(<Events />) },
      { path: "publications", element: page(<Publications />) },
      { path: "publications/:publicationId", element: page(<PublicationDetail />) },
      { path: "contact", element: page(<Contact />) },
      { path: "structure", element: page(<Structure />) },
      { path: "news", element: page(<News />) },
      { path: "partners", element: page(<Partners />) },
      { path: "gallery", element: page(<Gallery />) },
      { path: "calls", element: page(<Calls />) },
      { path: "login", element: page(<Login />) },
      { path: "register", element: page(<Register />) },
      { path: "forgot-password", element: page(<ForgotPassword />) },
      { path: "reset-password", element: page(<ResetPassword />) },
      { path: "orcid-callback", element: page(<OrcidCallback />) },
      { path: "orcid-setup", element: page(<OrcidSetup />) },
      {
        path: "dashboard",
        element: page(
          <ProtectedRoute allowedRoles={["member", "admin"]}>
            <Dashboard />
          </ProtectedRoute>,
        ),
      },
      {
        path: "profile",
        element: page(
          <ProtectedRoute allowedRoles={["member", "admin"]}>
            <Profile />
          </ProtectedRoute>,
        ),
      },
      {
        path: "member/panel",
        element: page(
          <ProtectedRoute allowedRoles={["member", "admin"]}>
            <MemberPanel />
          </ProtectedRoute>,
        ),
      },
      {
        path: "admin/panel",
        element: page(
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminPanel />
          </ProtectedRoute>,
        ),
      },
      {
        path: "admin/moderation",
        element: page(
          <ProtectedRoute allowedRoles={["admin"]}>
            <Moderation />
          </ProtectedRoute>,
        ),
      },
      {
        path: "admin/content",
        element: page(
          <ProtectedRoute allowedRoles={["admin"]}>
            <ContentManagement />
          </ProtectedRoute>,
        ),
      },
      {
        path: "admin/audit-logs",
        element: page(
          <ProtectedRoute allowedRoles={["admin"]}>
            <AuditLogs />
          </ProtectedRoute>,
        ),
      },
      { path: "*", element: page(<NotFound />) },
    ],
  },
]);
