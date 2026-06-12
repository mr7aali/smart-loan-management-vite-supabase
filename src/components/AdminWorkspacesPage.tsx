import { FormEvent, useEffect, useState } from "react";
import {
  Download,
  Loader2,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import {
  AdminWorkspaceSummary,
  OrganizationMember,
  OrganizationMemberRole,
} from "../types";
import { downloadCsv } from "../lib/export";

interface AdminWorkspacesPageProps {
  workspaces: AdminWorkspaceSummary[];
  loading: boolean;
  onRefresh: () => void;
  onAddMember: (organizationId: string, email: string) => Promise<void>;
  onRemoveMember: (organizationId: string, memberId: string) => Promise<void>;
  onChangeRole: (
    organizationId: string,
    memberId: string,
    role: OrganizationMemberRole,
  ) => Promise<void>;
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AdminWorkspacesPage({
  workspaces,
  loading,
  onRefresh,
  onAddMember,
  onRemoveMember,
  onChangeRole,
}: AdminWorkspacesPageProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(
    null,
  );
  const [memberEmail, setMemberEmail] = useState("");
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filteredWorkspaces = workspaces.filter((workspace) => {
    const query = searchTerm.toLowerCase();
    return (
      workspace.name.toLowerCase().includes(query) ||
      workspace.ownerEmail.toLowerCase().includes(query) ||
      workspace.ownerName.toLowerCase().includes(query)
    );
  });

  const selectedWorkspace =
    filteredWorkspaces.find((workspace) => workspace.id === selectedWorkspaceId) ||
    filteredWorkspaces[0] ||
    null;

  useEffect(() => {
    if (!selectedWorkspaceId && workspaces[0]) {
      setSelectedWorkspaceId(workspaces[0].id);
    }
  }, [selectedWorkspaceId, workspaces]);

  const handleAddMember = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedWorkspace || !memberEmail.trim()) return;

    setSavingKey("add");
    setError(null);
    try {
      await onAddMember(selectedWorkspace.id, memberEmail.trim());
      setMemberEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add member.");
    } finally {
      setSavingKey(null);
    }
  };

  const handleRemoveMember = async (member: OrganizationMember) => {
    if (!selectedWorkspace) return;
    if (!confirm(`Remove ${member.email || "this member"} from workspace?`)) {
      return;
    }

    setSavingKey(member.id);
    setError(null);
    try {
      await onRemoveMember(selectedWorkspace.id, member.id);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to remove member.",
      );
    } finally {
      setSavingKey(null);
    }
  };

  const handleRoleChange = async (
    member: OrganizationMember,
    role: OrganizationMemberRole,
  ) => {
    if (!selectedWorkspace || member.role === role) return;
    const transferOwner = role === "owner";
    if (
      transferOwner &&
      !confirm(
        `Make ${member.email || "this member"} the workspace owner? The current owner will become a member.`,
      )
    ) {
      return;
    }

    setSavingKey(member.id);
    setError(null);
    try {
      await onChangeRole(selectedWorkspace.id, member.id, role);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role.");
    } finally {
      setSavingKey(null);
    }
  };

  const exportWorkspaceReport = () => {
    downloadCsv(
      `admin-workspaces-${new Date().toISOString().slice(0, 10)}.csv`,
      workspaces.map((workspace) => ({
        workspace_id: workspace.id,
        workspace: workspace.name,
        owner: workspace.ownerEmail,
        members: workspace.memberCount,
        borrowers: workspace.borrowerCount,
        loans: workspace.loanCount,
        pending_approvals: workspace.pendingApprovals,
        created_at: workspace.createdAt || "",
      })),
    );
  };

  const exportMembershipReport = () => {
    downloadCsv(
      `admin-workspace-members-${new Date().toISOString().slice(0, 10)}.csv`,
      workspaces.flatMap((workspace) =>
        workspace.members.map((member) => ({
          workspace_id: workspace.id,
          workspace: workspace.name,
          member_id: member.user_id,
          member_email: member.email || "",
          member_name: member.fullName || "",
          role: member.role,
          joined_at: member.joined_at || member.created_at || "",
        })),
      ),
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 sm:text-3xl">
            Workspace Administration
          </h2>
          <p className="mt-2 text-sm text-gray-500 sm:text-base">
            Manage workspace membership, ownership changes, and export platform
            reports.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={exportWorkspaceReport}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
          >
            <Download className="h-4 w-4" />
            Workspaces CSV
          </button>
          <button
            type="button"
            onClick={exportMembershipReport}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
          >
            <Download className="h-4 w-4" />
            Members CSV
          </button>
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <ShieldCheck className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.2fr]">
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search workspaces"
              className="w-full rounded-lg border border-gray-200 py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="mt-5 space-y-3">
            {loading ? (
              <div className="flex items-center gap-2 rounded-xl border border-gray-100 p-5 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading workspaces...
              </div>
            ) : filteredWorkspaces.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-500">
                No workspaces match your search.
              </div>
            ) : (
              filteredWorkspaces.map((workspace) => (
                <button
                  key={workspace.id}
                  type="button"
                  onClick={() => setSelectedWorkspaceId(workspace.id)}
                  className={`w-full rounded-xl border p-4 text-left transition ${
                    selectedWorkspace?.id === workspace.id
                      ? "border-indigo-200 bg-indigo-50"
                      : "border-gray-100 bg-white hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-800">
                        {workspace.name}
                      </p>
                      <p className="truncate text-sm text-gray-500">
                        {workspace.ownerEmail}
                      </p>
                    </div>
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                      {workspace.memberCount} users
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                      {workspace.borrowerCount} borrowers
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                      {workspace.loanCount} loans
                    </span>
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-700">
                      {workspace.pendingApprovals} pending
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          {!selectedWorkspace ? (
            <div className="rounded-xl border border-dashed border-gray-200 p-10 text-center text-sm text-gray-500">
              Select a workspace to manage.
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    {selectedWorkspace.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Owner: {selectedWorkspace.ownerName} ·{" "}
                    {selectedWorkspace.ownerEmail}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Created {formatDateTime(selectedWorkspace.createdAt)}
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Users className="h-5 w-5" />
                </div>
              </div>

              <form
                onSubmit={(event) => void handleAddMember(event)}
                className="grid gap-3 sm:grid-cols-[1fr_auto]"
              >
                <input
                  type="email"
                  value={memberEmail}
                  onChange={(event) => setMemberEmail(event.target.value)}
                  placeholder="member@example.com"
                  className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={savingKey === "add"}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {savingKey === "add" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  Add Member
                </button>
              </form>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-100">
                {selectedWorkspace.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-800">
                        {member.fullName ||
                          member.email?.split("@")[0] ||
                          "Workspace member"}
                      </p>
                      <p className="truncate text-sm text-gray-500">
                        {member.email}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <select
                        value={member.role}
                        onChange={(event) =>
                          void handleRoleChange(
                            member,
                            event.target.value as OrganizationMemberRole,
                          )
                        }
                        disabled={savingKey === member.id}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm capitalize focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                      >
                        <option value="owner">Owner</option>
                        <option value="admin">Workspace Admin</option>
                        <option value="member">Member</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => void handleRemoveMember(member)}
                        disabled={savingKey === member.id || member.role === "owner"}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label={`Remove ${member.email || "member"}`}
                      >
                        {savingKey === member.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
