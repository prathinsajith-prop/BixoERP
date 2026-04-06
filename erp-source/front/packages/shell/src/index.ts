export { getIcon, iconMap } from "./components/icons";
export { getServiceUrl, getPortalUrl, SERVICE_PORTS } from "./service-registry";
export { useModuleMenu, type SidebarMenuItem } from "./hooks/use-module-menu";
export { useCurrentUser, hasModuleAccess, type CurrentUser } from "./hooks/use-current-user";
export { useModuleScope } from "./hooks/use-module-scope";

// Layout components
export { ModuleSidebar } from "./components/module-sidebar";
export { TopBar } from "./components/top-bar";
export { AppSelector } from "./components/app-selector";
export { AlertsDropdown } from "./components/alerts-dropdown";
export { AuthGuard } from "./components/auth-guard";
export { ModuleFooter } from "./components/module-footer";
export { ModuleLayout } from "./components/module-layout";
export { ThemeProvider, useTheme } from "./context/theme";
export { PageTitleProvider, useSetPageTitle, usePageTitleState } from "./context/page-title";

// Shared auth store & API helpers
export { useAuthStore } from "./store/auth";
export { authApi } from "./lib/api/auth";
export { filesApi } from "./lib/api/files";
export { notificationsApi } from "./lib/api/notifications";
export { APP_NAME } from "./lib/config";
export { showToast } from "./lib/toast";
