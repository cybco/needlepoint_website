import { requireAdmin } from "@/lib/auth-guard";
import { getSiteSettings } from "@/lib/actions/settings.actions";
import SettingsForm from "./settings-form";

export const metadata = {
  title: "Site Settings",
};

const SettingsPage = async () => {
  await requireAdmin();
  const settings = await getSiteSettings();

  return (
    <div className="space-y-6">
      <h1 className="h2-bold">Site Settings</h1>
      <p className="text-muted-foreground">
        Manage global site settings. Changes will regenerate affected pages.
      </p>
      <SettingsForm settings={settings} />
    </div>
  );
};

export default SettingsPage;
