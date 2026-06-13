import { getUserGroups } from "@/lib/actions/groups"
import { GroupsClient } from "./groups-client"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Groups",
  description: "Manage contact groups for announcements.",
}

export default async function GroupsPage() {
  const groups = await getUserGroups()
  return <GroupsClient initialGroups={groups} />
}
