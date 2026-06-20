import type { Icon } from "@phosphor-icons/react";
import {
  CurrencyCircleDollarIcon,
  ImageIcon,
  MegaphoneIcon,
} from "@phosphor-icons/react/ssr";

export const ANNOUNCEMENT_TYPE_IDS = [
  "announcement",
  "payment-reminder",
  "media",
] as const;

export type AnnouncementTypeId = (typeof ANNOUNCEMENT_TYPE_IDS)[number];

export type AnnouncementTypeMeta = {
  id: AnnouncementTypeId;
  label: string;
  description: string;
  icon: Icon;
  iconClass: string;
};

export const ANNOUNCEMENT_TYPES: AnnouncementTypeMeta[] = [
  {
    id: "announcement",
    label: "Announcement",
    description: "General updates",
    icon: MegaphoneIcon,
    iconClass: "bg-primary/10 text-primary",
  },
  {
    id: "payment-reminder",
    label: "Payment",
    description: "Fee reminders + links",
    icon: CurrencyCircleDollarIcon,
    iconClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    id: "media",
    label: "Media",
    description: "Photo, video, or file",
    icon: ImageIcon,
    iconClass: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
];

export function getAnnouncementTypeMeta(type: string): AnnouncementTypeMeta {
  const normalizedType = type === "activities" ? "announcement" : type;
  const match = ANNOUNCEMENT_TYPES.find((entry) => entry.id === normalizedType);
  if (match) return match;

  return {
    id: "announcement",
    label: type,
    description: "",
    icon: MegaphoneIcon,
    iconClass: "bg-muted text-muted-foreground",
  };
}
