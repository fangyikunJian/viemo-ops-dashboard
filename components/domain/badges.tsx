import { AlertTriangle, CircleDashed, Clock, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import {
  CADENCE_STATUS_TERMS,
  INTERACTION_CHANNEL_TERMS,
  PROJECT_STATUS_TERMS,
  RELATIONSHIP_STATUS_TERMS,
  RELATIONSHIP_TYPE_TERMS,
  TASK_PRIORITY_TERMS,
  TASK_STATUS_TERMS,
  USER_ROLE_TERMS,
  type CadenceStatus,
  type InteractionChannel,
  type ProjectStatus,
  type RelationshipStatus,
  type RelationshipType,
  type TaskPriority,
  type TaskStatus,
  type UserRole,
} from "@/lib/domain/enums";

/**
 * Each badge takes its label, colour and hover definition from the vocabulary
 * in lib/domain/enums.ts, so the taxonomy documented there and the taxonomy the
 * user sees cannot drift apart.
 */

export function RelationshipTypeBadge({ type }: { type: string }) {
  const term = RELATIONSHIP_TYPE_TERMS[type as RelationshipType];
  if (!term) return <Badge>{type}</Badge>;
  return (
    <Badge tone={term.tone} title={term.description}>
      {term.label}
    </Badge>
  );
}

export function RelationshipStatusBadge({ status }: { status: string }) {
  const term = RELATIONSHIP_STATUS_TERMS[status as RelationshipStatus];
  if (!term) return <Badge>{status}</Badge>;
  return (
    <Badge tone={term.tone} title={term.description}>
      {term.label}
    </Badge>
  );
}

export function ProjectStatusBadge({ status }: { status: string }) {
  const term = PROJECT_STATUS_TERMS[status as ProjectStatus];
  if (!term) return <Badge>{status}</Badge>;
  return (
    <Badge tone={term.tone} title={term.description}>
      {term.label}
    </Badge>
  );
}

export function TaskStatusBadge({ status }: { status: string }) {
  const term = TASK_STATUS_TERMS[status as TaskStatus];
  if (!term) return <Badge>{status}</Badge>;
  return (
    <Badge tone={term.tone} title={term.description}>
      {term.label}
    </Badge>
  );
}

export function TaskPriorityBadge({ priority }: { priority: string }) {
  const term = TASK_PRIORITY_TERMS[priority as TaskPriority];
  if (!term) return <Badge>{priority}</Badge>;
  return (
    <Badge tone={term.tone} title={term.description}>
      {term.label}
    </Badge>
  );
}

export function InteractionChannelBadge({ channel }: { channel: string }) {
  const term = INTERACTION_CHANNEL_TERMS[channel as InteractionChannel];
  if (!term) return <Badge>{channel}</Badge>;
  return <Badge tone={term.tone}>{term.label}</Badge>;
}

export function UserRoleBadge({ role }: { role: string }) {
  const term = USER_ROLE_TERMS[role as UserRole];
  if (!term) return <Badge>{role}</Badge>;
  return (
    <Badge tone={term.tone} title={term.description}>
      {term.label}
    </Badge>
  );
}

/**
 * Cadence status uses the reserved status palette rather than the ordinary
 * badge tones, and always carries an icon and a word. Two of the four status
 * colours are below 3:1 on the light surface, so colour alone would not reach
 * every reader.
 */
const CADENCE_STYLE: Record<
  CadenceStatus,
  { className: string; Icon: typeof Clock }
> = {
  OVERDUE: {
    className: "bg-critical-soft text-critical ring-critical/25",
    Icon: AlertTriangle,
  },
  DUE_SOON: {
    className:
      "bg-warning-soft text-amber-800 ring-amber-600/25 dark:text-amber-300 dark:ring-amber-400/25",
    Icon: Clock,
  },
  ON_TRACK: {
    className: "bg-good-soft text-good ring-good/25",
    Icon: Check,
  },
  NOT_TRACKED: {
    className: "bg-sunken text-ink-secondary ring-hairline",
    Icon: CircleDashed,
  },
};

export function CadenceBadge({
  status,
  detail,
}: {
  status: CadenceStatus;
  /** e.g. "17 days over" — appended after the label, not instead of it. */
  detail?: string;
}) {
  const term = CADENCE_STATUS_TERMS[status];
  const { className, Icon } = CADENCE_STYLE[status];

  return (
    <span
      title={term.description}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap",
        className,
      )}
    >
      <Icon className="size-3 shrink-0" aria-hidden="true" />
      {term.label}
      {detail ? (
        <span className="tabular font-normal opacity-80">· {detail}</span>
      ) : null}
    </span>
  );
}

/** Shown on a project that needs someone to act, with the reasons spelled out. */
export function RiskBadge({ reasons }: { reasons: readonly string[] }) {
  if (reasons.length === 0) return null;
  return (
    <span
      title={reasons.join(" · ")}
      className="inline-flex items-center gap-1.5 rounded-md bg-critical-soft px-2 py-0.5 text-xs font-medium text-critical ring-1 ring-critical/25 ring-inset whitespace-nowrap"
    >
      <AlertTriangle className="size-3 shrink-0" aria-hidden="true" />
      At risk
      <span className="font-normal opacity-80">· {reasons[0]}</span>
    </span>
  );
}
