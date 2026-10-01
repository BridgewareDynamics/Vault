import {
  Archive,
  FolderOpen,
  LayoutGrid,
  Map as MapIcon,
  Palette,
  Rocket,
  type LucideIcon,
} from 'lucide-react';

export interface OnboardingPageMeta {
  id: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
}

export const ONBOARDING_PAGES: OnboardingPageMeta[] = [
  {
    id: 'welcome',
    title: 'Welcome',
    subtitle: 'What Vault is and how the pipeline fits together',
    icon: Archive,
  },
  {
    id: 'features',
    title: 'Features',
    subtitle: 'Deep look at each module in the workspace',
    icon: LayoutGrid,
  },
  {
    id: 'maps',
    title: 'Maps',
    subtitle: 'Timelines linked to your case archive',
    icon: MapIcon,
  },
  {
    id: 'capabilities',
    title: 'Use Cases',
    subtitle: 'Who Vault is built for and how they use it',
    icon: FolderOpen,
  },
  {
    id: 'getting-started',
    title: 'Getting Started',
    subtitle: 'Your first run from PDF to audited output',
    icon: Rocket,
  },
  {
    id: 'theme',
    title: 'Theme',
    subtitle: 'Choose how Vault looks during long sessions',
    icon: Palette,
  },
];
