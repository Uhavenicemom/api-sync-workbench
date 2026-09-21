import {
  Desktop,
  Moon,
  ShieldCheck,
  Sun,
} from "@phosphor-icons/react";
import type { ThemePreference } from "../features/theme";

interface TopBarProps {
  theme: ThemePreference;
  onThemeChange: (theme: ThemePreference) => void;
}

export function TopBar({ theme, onThemeChange }: TopBarProps) {
  const nextTheme: ThemePreference =
    theme === "system" ? "light" : theme === "light" ? "dark" : "system";
  const ThemeIcon = theme === "system" ? Desktop : theme === "light" ? Sun : Moon;

  return (
    <header className="topbar">
      <a className="brand" href="#main-content" aria-label="API Sync Workbench home">
        <span className="brand-mark" aria-hidden="true">
          <ShieldCheck size={22} weight="duotone" />
        </span>
        <span>
          <strong>API Sync</strong>
          <small>Workbench</small>
        </span>
      </a>
      <div className="topbar-actions">
        <span className="local-only-note">Local-first demo</span>
        <button
          className="button button-quiet theme-button"
          onClick={() => onThemeChange(nextTheme)}
          aria-label={`Theme: ${theme}. Change to ${nextTheme}.`}
          title={`Theme: ${theme}`}
        >
          <ThemeIcon aria-hidden="true" size={18} />
          <span>{theme}</span>
        </button>
      </div>
    </header>
  );
}
