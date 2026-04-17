/**
 * ZAO OS — Hook for loading and saving user app configuration.
 * Reads from Supabase user_app_config table.
 * Falls back to defaults from app manifest if no config exists.
 */

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/db/supabase';
import { getDefaultPinnedApps } from './app-manifest';
import { DEFAULT_SHELL } from './shells';
import type { ShellId, UserAppConfig, WidgetLayoutItem } from './types';

const DEFAULT_CONFIG: Omit<UserAppConfig, 'userId'> = {
  shell: DEFAULT_SHELL,
  pinnedApps: getDefaultPinnedApps().map((app) => app.id),
  startupApps: [],
  widgetLayout: [],
  hiddenApps: [],
};

export function useAppConfig(userId: string | undefined) {
  const [config, setConfig] = useState<UserAppConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    async function loadConfig() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('user_app_config')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        // No config yet — use defaults
        setConfig({ userId: userId!, ...DEFAULT_CONFIG });
      } else {
        setConfig({
          userId: data.user_id,
          shell: data.shell as ShellId,
          pinnedApps: data.pinned_apps ?? DEFAULT_CONFIG.pinnedApps,
          startupApps: data.startup_apps ?? [],
          widgetLayout: (data.widget_layout as WidgetLayoutItem[]) ?? [],
          hiddenApps: data.hidden_apps ?? [],
        });
      }
      setLoading(false);
    }

    loadConfig();
  }, [userId]);

  const saveConfig = useCallback(
    async (updates: Partial<Omit<UserAppConfig, 'userId'>>) => {
      if (!userId || !config) return;

      const newConfig = { ...config, ...updates };
      setConfig(newConfig);

      const supabase = createClient();
      await supabase.from('user_app_config').upsert({
        user_id: userId,
        shell: newConfig.shell,
        pinned_apps: newConfig.pinnedApps,
        startup_apps: newConfig.startupApps,
        widget_layout: newConfig.widgetLayout,
        hidden_apps: newConfig.hiddenApps,
        updated_at: new Date().toISOString(),
      });
    },
    [userId, config],
  );

  const pinApp = useCallback(
    (appId: string) => {
      if (!config) return;
      if (config.pinnedApps.includes(appId)) return;
      saveConfig({ pinnedApps: [...config.pinnedApps, appId] });
    },
    [config, saveConfig],
  );

  const unpinApp = useCallback(
    (appId: string) => {
      if (!config) return;
      saveConfig({ pinnedApps: config.pinnedApps.filter((id) => id !== appId) });
    },
    [config, saveConfig],
  );

  const setShell = useCallback(
    (shell: ShellId) => {
      saveConfig({ shell });
    },
    [saveConfig],
  );

  return {
    config,
    loading,
    saveConfig,
    pinApp,
    unpinApp,
    setShell,
  };
}
