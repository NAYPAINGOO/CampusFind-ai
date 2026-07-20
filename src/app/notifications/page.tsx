import { DashboardShell } from "@/components/dashboard-shell";
import { NotificationsList } from "@/components/notifications-list";

export default function NotificationsPage() {
  return <DashboardShell title="Notifications"><NotificationsList /></DashboardShell>;
}
