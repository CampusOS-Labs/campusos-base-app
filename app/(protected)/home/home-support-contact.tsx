import { WhatsappLogoIcon } from "@phosphor-icons/react/ssr"

import { PageSection } from "@/components/page-layout"
import { cn } from "@/lib/utils"

const WHATSAPP_GROUP_HREF = "https://chat.whatsapp.com/ImWkA2PwJF5DF55ZEPQ8gj"
const WHATSAPP_DIRECT_HREF = "https://wa.me/15137997001"
const PHONE_HREF = "tel:+917385795779"

export function HomeSupportContact() {
  return (
    <PageSection
      title="Need help?"
      description="CampusOS support is here if something isn’t working."
    >
      <div
        className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-xs ring-1 ring-foreground/[0.04]"
      >
        <a
          href={WHATSAPP_GROUP_HREF}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "group ui-press flex items-center gap-3 px-4 py-3.5 transition-[background-color] duration-150 ease-out",
            "hover:bg-muted/30",
          )}
        >
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-700 transition-transform duration-150 ease-out dark:text-emerald-400",
              "group-hover:scale-[1.03]",
            )}
          >
            <WhatsappLogoIcon className="size-4" weight="duotone" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium leading-snug">WhatsApp support</span>
            <span className="block text-xs text-muted-foreground">
              {"Join Amaan <> Kidzee Vadgaon Sheri"}
            </span>
          </span>
        </a>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border/80 px-4 py-2.5 text-xs text-muted-foreground">
          <span>Or reach us directly:</span>
          <a
            href={WHATSAPP_DIRECT_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="ui-press font-medium tabular-nums text-foreground transition-colors duration-150 ease-out hover:text-primary"
          >
            +1 (513) 799-7001
          </a>
          <span aria-hidden="true">·</span>
          <a
            href={PHONE_HREF}
            className="ui-press font-medium tabular-nums text-foreground transition-colors duration-150 ease-out hover:text-primary"
          >
            +91 73857 95779
          </a>
        </div>
      </div>
    </PageSection>
  )
}
