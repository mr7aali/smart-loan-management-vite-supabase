import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  Download,
  FileClock,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import {
  AppCurrency,
  DEFAULT_CURRENCY,
  formatCurrency,
  formatDate,
} from "../utils";
import {
  OrganizationMemberRole,
  WorkspaceApprovalItem,
  WorkspaceAuditEvent,
} from "../types";
import { downloadCsv } from "../lib/export";

interface WorkspaceApprovalsPageProps {
  approvals: WorkspaceApprovalItem[];
  auditEvents: WorkspaceAuditEvent[];
  loading: boolean;
  currentUserRole?: OrganizationMemberRole;
  currency?: AppCurrency;
  onRefresh: () => void;
  onReview: (
    entityType: "borrower" | "loan",
    entityId: string,
    status: "approved" | "rejected",
    reason?: string,
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

function actionLabel(action: string) {
  return action
    .replace(/^admin_/, "admin ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function WorkspaceApprovalsPage({
  approvals,
  auditEvents,
  loading,
  currentUserRole,
  currency = DEFAULT_CURRENCY,
  onRefresh,
  onReview,
}: WorkspaceApprovalsPageProps) {
  const [reviewingKey, setReviewingKey] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const canReview = currentUserRole === "owner";
  const pendingApprovals = approvals.filter(
    (approval) => approval.status === "pending",
  );
  const reviewedApprovals = approvals.filter(
    (approval) => approval.status !== "pending",
  );

  const stats = useMemo(
    () => ({
      pending: pendingApprovals.length,
      approved: approvals.filter((approval) => approval.status === "approved")
        .length,
      rejected: approvals.filter((approval) => approval.status === "rejected")
        .length,
      events: auditEvents.length,
    }),
    [approvals, auditEvents.length, pendingApprovals.length],
  );

  const handleReview = async (
    approval: WorkspaceApprovalItem,
    status: "approved" | "rejected",
  ) => {
    const reason =
      status === "rejected"
        ? prompt(`Reason for rejecting ${approval.name}?`)?.trim()
        : undefined;

    if (status === "rejected" && !reason) {
      return;
    }

    const nextReviewingKey = `${approval.type}-${approval.id}`;
    setReviewingKey(nextReviewingKey);
    setActionError(null);
    try {
      await onReview(approval.type, approval.id, status, reason);
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Unable to update this approval. Please try again.",
      );
    } finally {
      setReviewingKey(null);
    }
  };

  const exportApprovalReport = () => {
    downloadCsv(
      `workspace-approval-report-${new Date().toISOString().slice(0, 10)}.csv`,
      approvals.map((approval) => ({
        type: approval.type,
        item: approval.name,
        borrower: approval.borrowerName || "",
        amount: approval.amount ?? "",
        status: approval.status,
        initiated_by: approval.initiatedBy?.email || "",
        initiated_at: approval.initiatedAt || "",
        authorized_by: approval.authorizedBy?.email || "",
        authorized_at: approval.authorizedAt || "",
        rejection_reason: approval.rejectionReason || "",
      })),
    );
  };

  const exportAuditReport = () => {
    downloadCsv(
      `workspace-audit-report-${new Date().toISOString().slice(0, 10)}.csv`,
      auditEvents.map((event) => ({
        action: actionLabel(event.action),
        actor: event.actor?.email || "",
        target: event.target?.email || "",
        entity_type: event.entityType,
        entity_id: event.entityId || "",
        created_at: event.createdAt,
      })),
    );
  };

  const renderApproval = (approval: WorkspaceApprovalItem) => (
    <div
      key={`${approval.type}-${approval.id}`}
      className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase text-slate-600">
              {approval.type}
            </span>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                approval.status === "approved"
                  ? "bg-emerald-100 text-emerald-700"
                  : approval.status === "rejected"
                    ? "bg-rose-100 text-rose-700"
                    : "bg-amber-100 text-amber-700"
              }`}
            >
              {approval.status}
            </span>
          </div>
          <h3 className="mt-2 truncate text-lg font-bold text-gray-800">
            {approval.name}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Initiated by {approval.initiatedBy?.name || "Unknown"} on{" "}
            {formatDateTime(approval.initiatedAt)}
          </p>
          {approval.borrowerName && (
            <p className="mt-1 text-sm text-gray-500">
              Borrower: {approval.borrowerName}
            </p>
          )}
          {approval.amount !== undefined && (
            <p className="mt-1 text-sm font-semibold text-indigo-600">
              {formatCurrency(approval.amount, currency)}
            </p>
          )}
          {approval.authorizedAt && (
            <p className="mt-2 text-sm text-gray-500">
              Authorized by {approval.authorizedBy?.name || "Unknown"} on{" "}
              {formatDateTime(approval.authorizedAt)}
            </p>
          )}
          {approval.rejectionReason && (
            <p className="mt-2 text-sm text-rose-600">
              {approval.rejectionReason}
            </p>
          )}
        </div>

        {approval.status === "pending" && canReview && (
          <div className="grid shrink-0 grid-cols-1 gap-2 sm:grid-cols-2 lg:flex">
            <button
              type="button"
              onClick={() => void handleReview(approval, "approved")}
              disabled={reviewingKey === `${approval.type}-${approval.id}`}
              className="inline-flex min-h-11 touch-manipulation items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 active:bg-emerald-800 disabled:cursor-wait disabled:opacity-60"
            >
              <CheckCircle2 className="h-4 w-4" />
              {reviewingKey === `${approval.type}-${approval.id}`
                ? "Saving..."
                : "Approve"}
            </button>
            <button
              type="button"
              onClick={() => void handleReview(approval, "rejected")}
              disabled={reviewingKey === `${approval.type}-${approval.id}`}
              className="inline-flex min-h-11 touch-manipulation items-center justify-center gap-2 rounded-lg border border-rose-100 px-4 py-2 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50 active:bg-rose-100 disabled:cursor-wait disabled:opacity-60"
            >
              <XCircle className="h-4 w-4" />
              Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 sm:text-3xl">
            Workspace Approvals
          </h2>
          <p className="mt-2 text-sm text-gray-500 sm:text-base">
            Review initiated borrower and loan changes, then export the
            authorization trail.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={exportApprovalReport}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
          >
            <Download className="h-4 w-4" />
            Approval CSV
          </button>
          <button
            type="button"
            onClick={exportAuditReport}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
          >
            <Download className="h-4 w-4" />
            Audit CSV
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Pending", value: stats.pending, icon: Clock3 },
          { label: "Approved", value: stats.approved, icon: CheckCircle2 },
          { label: "Rejected", value: stats.rejected, icon: XCircle },
          { label: "Audit Events", value: stats.events, icon: FileClock },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{item.label}</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {item.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <section className="space-y-3">
        <h3 className="text-lg font-bold text-gray-800">Pending Review</h3>
        {actionError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {actionError}
          </div>
        )}
        {loading ? (
          <div className="rounded-xl border border-gray-100 bg-white p-8 text-center text-sm text-gray-500">
            Loading approvals...
          </div>
        ) : pendingApprovals.length === 0 ? (
          <div className="rounded-xl border border-gray-100 bg-white p-8 text-center text-sm text-gray-500">
            No pending approvals.
          </div>
        ) : (
          pendingApprovals.map(renderApproval)
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-bold text-gray-800">Reviewed Items</h3>
        {reviewedApprovals.length === 0 ? (
          <div className="rounded-xl border border-gray-100 bg-white p-8 text-center text-sm text-gray-500">
            Reviewed approvals will appear here.
          </div>
        ) : (
          reviewedApprovals.slice(0, 12).map(renderApproval)
        )}
      </section>

      <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-bold text-gray-800">Recent Activity</h3>
        <div className="mt-4 divide-y divide-gray-100">
          {auditEvents.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              No activity recorded yet.
            </p>
          ) : (
            auditEvents.slice(0, 20).map((event) => (
              <div
                key={event.id}
                className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-gray-800">
                    {actionLabel(event.action)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {event.actor?.name || "Unknown user"} ·{" "}
                    {event.entityType}
                  </p>
                </div>
                <p className="text-sm text-gray-500">
                  {formatDate(event.createdAt)}
                </p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
