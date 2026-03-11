export interface Rejection {
  id: string;
  domain: string;
  description: string;
  reasoning: string | null;
  raw_output: string | null;
  constraint_id: string | null;
  created_at: string;
}

export interface Constraint {
  id: string;
  domain: string;
  category: ConstraintCategory;
  title: string;
  rule: string;
  reasoning: string | null;
  rejected_example: string | null;
  accepted_example: string | null;
  tags: string | null; // JSON array stored as text
  severity: Severity;
  status: ConstraintStatus;
  source: string | null;
  times_applied: number;
  last_applied_at: string | null;
  created_at: string;
  updated_at: string;
}

export type ConstraintCategory =
  | "code-quality"
  | "pattern"
  | "business-logic"
  | "framing"
  | "reasoning"
  | "editorial";

export type Severity = "critical" | "important" | "preference";

export type ConstraintStatus = "active" | "superseded" | "deprecated";
