import { getUserGroups } from "@/lib/actions/groups"
import { GroupsClient } from "./groups-client"

export default async function GroupsPage() {
  const groups = await getUserGroups()
  return <GroupsClient initialGroups={groups} />
}
