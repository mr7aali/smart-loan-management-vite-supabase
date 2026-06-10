import { FormEvent, useState } from "react";
import { Loader2, Trash2, UserPlus, Users } from "lucide-react";
import {
  OrganizationMember,
  OrganizationWorkspace,
} from "../types";
import {
  SUBSCRIPTION_PLANS_BY_ID,
  SubscriptionPlanId,
} from "../lib/subscription-plans";

interface WorkspaceUsersPageProps {
  workspace?: OrganizationWorkspace | null;
  teamMembers: OrganizationMember[];
  teamLoading?: boolean;
  canManageTeam: boolean;
  currentPlan: SubscriptionPlanId;
  onAddTeamMember: (email: string) => Promise<void>;
  onRemoveTeamMember: (memberId: string) => Promise<void>;
}

export default function WorkspaceUsersPage({
  workspace,
  teamMembers,
  teamLoading = false,
  canManageTeam,
  currentPlan,
  onAddTeamMember,
  onRemoveTeamMember,
}: WorkspaceUsersPageProps) {
  const [memberEmail, setMemberEmail] = useState("");
  const [teamSaving, setTeamSaving] = useState(false);
  const [teamError, setTeamError] = useState<string | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const currentPlanDetails = SUBSCRIPTION_PLANS_BY_ID[currentPlan];
  const maxUsersLabel = currentPlanDetails.maxUsers ?? "Unlimited";
  const hasUnlimitedUsers = currentPlanDetails.maxUsers === null;
  const teamSeatsFull =
    currentPlanDetails.maxUsers !== null &&
    teamMembers.length >= currentPlanDetails.maxUsers;

  const handleTeamSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const email = memberEmail.trim();
    if (!email) return;

    setTeamSaving(true);
    setTeamError(null);
    try {
      await onAddTeamMember(email);
      setMemberEmail("");
    } catch (error) {
      setTeamError(
        error instanceof Error ? error.message : "Failed to add team member.",
      );
    } finally {
      setTeamSaving(false);
    }
  };

  const handleRemoveMember = async (member: OrganizationMember) => {
    if (!confirm(`Remove ${member.email || "this member"} from the workspace?`)) {
      return;
    }

    setRemovingMemberId(member.id);
    setTeamError(null);
    try {
      await onRemoveTeamMember(member.id);
    } catch (error) {
      setTeamError(
        error instanceof Error
          ? error.message
          : "Failed to remove team member.",
      );
    } finally {
      setRemovingMemberId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 sm:text-3xl">
          Workspace User Management
        </h2>
        <p className="mt-2 text-sm text-gray-500 sm:text-base">
          Manage the people who can log in separately and share this loan dataset.
        </p>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50">
              <Users className="h-6 w-6 text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Team Workspace</h3>
            <p className="mt-1 text-sm text-gray-500">
              {workspace?.name || "Shared loan workspace"}
            </p>
          </div>
          <div className="w-fit rounded-lg bg-gray-50 px-4 py-3 text-sm">
            <span className="font-semibold text-gray-800">
              {teamMembers.length}
            </span>
            <span className="text-gray-500"> / {maxUsersLabel} users</span>
          </div>
        </div>

        <form
          onSubmit={(event) => void handleTeamSubmit(event)}
          className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]"
        >
          <input
            type="email"
            value={memberEmail}
            onChange={(event) => setMemberEmail(event.target.value)}
            disabled={!canManageTeam || teamSaving || teamSeatsFull}
            placeholder="member@example.com"
            className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
          />
          <button
            type="submit"
            disabled={!canManageTeam || teamSaving || teamSeatsFull}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {teamSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            Add Member
          </button>
        </form>

        {!canManageTeam && (
          <p className="mt-3 text-sm text-gray-500">
            Only a workspace owner or admin can manage members.
          </p>
        )}
        {teamSeatsFull && canManageTeam && (
          <p className="mt-3 text-sm text-amber-700">
            This plan has reached its user limit. Upgrade to add more members.
          </p>
        )}
        {hasUnlimitedUsers && canManageTeam && (
          <p className="mt-3 text-sm text-emerald-700">
            Enterprise includes unlimited workspace users.
          </p>
        )}
        {teamError && <p className="mt-3 text-sm text-red-600">{teamError}</p>}

        <div className="mt-5 divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-100">
          {teamLoading ? (
            <div className="flex items-center gap-2 p-4 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading members...
            </div>
          ) : (
            teamMembers.map((member) => {
              const isOwner = member.role === "owner";
              const displayName =
                member.fullName || member.email?.split("@")[0] || "Team member";

              return (
                <div
                  key={member.id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-800">
                      {displayName}
                    </p>
                    <p className="truncate text-sm text-gray-500">
                      {member.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium capitalize text-gray-600">
                      {member.role}
                    </span>
                    {canManageTeam && !isOwner && (
                      <button
                        type="button"
                        onClick={() => void handleRemoveMember(member)}
                        disabled={removingMemberId === member.id}
                        aria-label={`Remove ${displayName}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-50 disabled:cursor-wait disabled:opacity-60"
                      >
                        {removingMemberId === member.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
