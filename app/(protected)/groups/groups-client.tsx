"use client";

import { useState, useCallback, useEffect } from "react";
import { Plus, Users, Pencil, Trash2, Phone, UserPlus } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-layout";
import { EmptyState } from "@/components/empty-state";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  ContactDraftList,
  createEmptyContactDraft,
  getValidContactDrafts,
  type ContactDraft,
} from "@/components/contact-draft-list";
import { WizardStep, WizardStepBadge } from "@/components/wizard-step";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trackAuthEvent } from "@/lib/analytics/track-event-client";
import {
  GROUPS_FLOW_STEP,
  PAGE_VIEW,
  PRODUCT_PAGES,
} from "@/lib/services/product-analytics-events";
import {
  getGroupWithContacts,
  createGroup,
  updateGroup,
  deleteGroup,
  addContact,
  deleteContact,
} from "@/lib/actions/groups";

type GroupSummary = {
  id: string;
  name: string;
  description: string | null;
  contactCount: number;
  createdAt: string;
};

type Contact = {
  id: string;
  name: string;
  phoneNumber: string;
  fatherName: string | null;
  fatherPhoneNumber: string | null;
  motherName: string | null;
  motherPhoneNumber: string | null;
  notes: string | null;
};

export function GroupsClient({ initialGroups }: { initialGroups: GroupSummary[] }) {
  const [groups, _setGroups] = useState<GroupSummary[]>(initialGroups);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [groupContacts, setGroupContacts] = useState<Contact[]>([]);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createContacts, setCreateContacts] = useState<ContactDraft[]>([]);

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editId, setEditId] = useState("");
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const [showAddContactDialog, setShowAddContactDialog] = useState(false);
  const [addContactName, setAddContactName] = useState("");
  const [addFatherName, setAddFatherName] = useState("");
  const [addFatherPhone, setAddFatherPhone] = useState("");
  const [addMotherName, setAddMotherName] = useState("");
  const [addMotherPhone, setAddMotherPhone] = useState("");
  const [addContactNotes, setAddContactNotes] = useState("");

  const [busy, setBusy] = useState(false);
  const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null);
  const [deleteContactId, setDeleteContactId] = useState<string | null>(null);

  useEffect(() => {
    trackAuthEvent(PAGE_VIEW, { page: PRODUCT_PAGES.groups });
  }, []);

  const loadGroupContacts = useCallback(async (groupId: string) => {
    try {
      const data = await getGroupWithContacts(groupId);
      setGroupContacts(data.contacts);
      trackAuthEvent(GROUPS_FLOW_STEP, { step: "group_opened", groupId });
    } catch {}
  }, []);

  function toggleGroup(groupId: string) {
    if (selectedGroup === groupId) {
      setSelectedGroup(null);
      setGroupContacts([]);
    } else {
      setSelectedGroup(groupId);
      loadGroupContacts(groupId);
    }
  }

  function resetCreateForm() {
    setCreateName("");
    setCreateDescription("");
    setCreateContacts([]);
  }

  function openCreateDialog() {
    resetCreateForm();
    setShowCreateDialog(true);
    trackAuthEvent(GROUPS_FLOW_STEP, { step: "create_opened" });
  }

  function updateCreateContact(
    index: number,
    field: keyof ContactDraft,
    value: string,
  ) {
    setCreateContacts((prev) =>
      prev.map((contact, i) =>
        i === index ? { ...contact, [field]: value } : contact,
      ),
    );
  }

  async function handleCreateGroup() {
    setBusy(true);
    try {
      const validContacts = getValidContactDrafts(createContacts);
      const fd = new FormData();
      fd.set("name", createName);
      fd.set("description", createDescription);
      if (validContacts.length > 0) {
        fd.set("contacts", JSON.stringify(validContacts));
      }
      await createGroup(fd);
      trackAuthEvent(GROUPS_FLOW_STEP, {
        step: "group_created",
        contactCount: validContacts.length,
      });
      setShowCreateDialog(false);
      resetCreateForm();
      window.location.reload();
    } catch {}
    setBusy(false);
  }

  function openEditDialog(group: GroupSummary) {
    setEditId(group.id);
    setEditName(group.name);
    setEditDescription(group.description || "");
    setShowEditDialog(true);
  }

  async function handleEditGroup() {
    setBusy(true);
    try {
      const fd = new FormData();
      fd.set("id", editId);
      fd.set("name", editName);
      fd.set("description", editDescription);
      await updateGroup(fd);
      setShowEditDialog(false);
      window.location.reload();
    } catch {}
    setBusy(false);
  }

  async function handleDeleteGroup(groupId: string) {
    try {
      await deleteGroup(groupId);
      if (selectedGroup === groupId) {
        setSelectedGroup(null);
        setGroupContacts([]);
      }
      window.location.reload();
    } catch {}
  }

  async function handleDeleteContact(contactId: string) {
    try {
      await deleteContact(contactId);
      if (selectedGroup) {
        window.location.reload();
      }
    } catch {}
  }

  async function confirmDeleteGroup() {
    if (!deleteGroupId) return;
    setBusy(true);
    try {
      await handleDeleteGroup(deleteGroupId);
      setDeleteGroupId(null);
    } finally {
      setBusy(false);
    }
  }

  async function confirmDeleteContact() {
    if (!deleteContactId) return;
    setBusy(true);
    try {
      await handleDeleteContact(deleteContactId);
      setDeleteContactId(null);
    } finally {
      setBusy(false);
    }
  }

  async function handleAddContact() {
    if (!selectedGroup) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.set("groupId", selectedGroup);
      fd.set("name", addContactName);
      fd.set("fatherName", addFatherName);
      fd.set("fatherPhoneNumber", addFatherPhone);
      fd.set("motherName", addMotherName);
      fd.set("motherPhoneNumber", addMotherPhone);
      fd.set("notes", addContactNotes);
      await addContact(fd);
      setShowAddContactDialog(false);
      setAddContactName("");
      setAddFatherName("");
      setAddFatherPhone("");
      setAddMotherName("");
      setAddMotherPhone("");
      setAddContactNotes("");
      window.location.reload();
    } catch {}
    setBusy(false);
  }

  const validCreateContacts = getValidContactDrafts(createContacts);

  return (
    <PageShell className="space-y-8">
      <PageHeader
        title="Groups"
        description="Manage contact groups for sending announcements."
        actions={
          <Button onClick={openCreateDialog}>
            <Plus /> New group
          </Button>
        }
      />

      <div className="divide-y border-t border-border">
        {groups.map((group) => (
          <div
            key={group.id}
            className={selectedGroup === group.id ? "bg-muted/20" : undefined}
          >
            <div
              className="flex cursor-pointer items-center justify-between gap-4 py-4"
              onClick={() => toggleGroup(group.id)}
            >
              <div className="flex min-w-0 items-center gap-3">
                <Users className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="font-medium">{group.name}</p>
                  {group.description ? (
                    <p className="text-xs text-muted-foreground">{group.description}</p>
                  ) : null}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant="secondary">{group.contactCount} contacts</Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditDialog(group);
                  }}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteGroupId(group.id);
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
            {selectedGroup === group.id ? (
              <div className="space-y-3 border-t border-border pb-5 pl-7">
                <div className="flex items-center justify-between pt-4">
                  <h3 className="text-sm font-medium">Contacts</h3>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => setShowAddContactDialog(true)}
                  >
                    <UserPlus /> Add contact
                  </Button>
                </div>
                {groupContacts.length === 0 ? (
                  <p className="py-2 text-sm text-muted-foreground">No contacts yet.</p>
                ) : (
                  <div className="divide-y divide-border">
                    {groupContacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="flex items-center justify-between py-2.5"
                      >
                        <div className="flex items-center gap-3">
                          <Phone className="size-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{contact.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {`Father: ${contact.fatherName || "-"}, father's contact: ${
                                contact.fatherPhoneNumber || "-"
                              }, mother: ${contact.motherName || "-"}, mother's contact: ${
                                contact.motherPhoneNumber || "-"
                              }`}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteContactId(contact.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        ))}
        {groups.length === 0 ? (
          <EmptyState
            icon={<Users className="size-12" />}
            title="No groups yet"
            description="Create one to organize contacts for announcements."
          />
        ) : null}
      </div>

      <Dialog
        open={showCreateDialog}
        onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) resetCreateForm();
        }}
      >
        <DialogContent className="flex max-h-[min(90vh,720px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
          <DialogHeader className="border-b border-border/60 px-6 py-5">
            <DialogTitle>Create group</DialogTitle>
            <DialogDescription>
              Name the group and optionally add parents now — you can always add more later.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
            <WizardStep
              step={1}
              title="Group details"
              description="How this group appears when sending announcements."
            >
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground" htmlFor="createName">
                    Group name
                  </label>
                  <Input
                    id="createName"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="e.g. Nursery A parents"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground" htmlFor="createDesc">
                    Description (optional)
                  </label>
                  <Input
                    id="createDesc"
                    value={createDescription}
                    onChange={(e) => setCreateDescription(e.target.value)}
                    placeholder="Short note for your team"
                  />
                </div>
              </div>
            </WizardStep>

            <WizardStep
              step={2}
              title="Contacts"
              description="Add parents now, or leave empty and add them after creating the group."
              badge={
                validCreateContacts.length > 0 ? (
                  <WizardStepBadge>
                    {validCreateContacts.length} ready
                  </WizardStepBadge>
                ) : undefined
              }
            >
              <ContactDraftList
                contacts={createContacts}
                onChange={updateCreateContact}
                onAdd={() =>
                  setCreateContacts((prev) => [...prev, createEmptyContactDraft()])
                }
                onRemove={(index) =>
                  setCreateContacts((prev) => prev.filter((_, i) => i !== index))
                }
              />
            </WizardStep>
          </div>

          <DialogFooter className="border-t border-border/60 px-6 py-4">
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateGroup}
              disabled={busy || !createName.trim()}
            >
              {validCreateContacts.length > 0
                ? `Create group · ${validCreateContacts.length} contact${
                    validCreateContacts.length === 1 ? "" : "s"
                  }`
                : "Create group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
            <DialogDescription>
              Update the group name or description.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="editName">
                Group Name
              </label>
              <Input
                id="editName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="editDesc">
                Description (optional)
              </label>
              <Input
                id="editDesc"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleEditGroup} disabled={busy || !editName.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showAddContactDialog}
        onOpenChange={setShowAddContactDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Contact</DialogTitle>
            <DialogDescription>
              {selectedGroup
                ? `Add a contact to ${
                    groups.find((g) => g.id === selectedGroup)?.name
                  }.`
                : "Add a contact to this group."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="addName">
                Kid name
              </label>
              <Input
                id="addName"
                value={addContactName}
                onChange={(e) => setAddContactName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="addPhone">
                Father name
              </label>
              <Input
                id="addFatherName"
                value={addFatherName}
                onChange={(e) => setAddFatherName(e.target.value)}
                placeholder="Father full name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="addFatherPhone">
                Father contact
              </label>
              <Input
                id="addFatherPhone"
                value={addFatherPhone}
                onChange={(e) => setAddFatherPhone(e.target.value)}
                placeholder="+919876543210"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="addMotherName">
                Mother name
              </label>
              <Input
                id="addMotherName"
                value={addMotherName}
                onChange={(e) => setAddMotherName(e.target.value)}
                placeholder="Mother full name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="addMotherPhone">
                Mother contact
              </label>
              <Input
                id="addMotherPhone"
                value={addMotherPhone}
                onChange={(e) => setAddMotherPhone(e.target.value)}
                placeholder="+919876543210"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="addNotes">
                Notes (optional)
              </label>
              <Input
                id="addNotes"
                value={addContactNotes}
                onChange={(e) => setAddContactNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddContactDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddContact}
              disabled={
                busy ||
                !addContactName.trim() ||
                (!addFatherPhone.trim() && !addMotherPhone.trim())
              }
            >
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteGroupId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteGroupId(null);
        }}
        title="Delete group?"
        description="This will permanently delete the group and all of its contacts."
        confirmLabel="Delete group"
        destructive
        busy={busy}
        onConfirm={confirmDeleteGroup}
      />

      <ConfirmDialog
        open={deleteContactId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteContactId(null);
        }}
        title="Remove contact?"
        description="This contact will be removed from the group."
        confirmLabel="Remove"
        destructive
        busy={busy}
        onConfirm={confirmDeleteContact}
      />
    </PageShell>
  );
}
