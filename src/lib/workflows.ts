export type WorkflowId =
  | "assistant"
  | "email"
  | "meeting"
  | "research"
  | "document"
  | "planner"
  | "policy";

export type Workflow = {
  id: WorkflowId;
  label: string;
  blurb: string;
  placeholder: string;
  starters: string[];
  system: string;
};

const BASE_SYSTEM = `You are Cadence, an AI operations assistant embedded in a workplace productivity tool.
You automate routine knowledge work: drafting, summarizing, extracting structure, and planning.
Rules:
- Lead with the finished work product, not preamble. Never say "Sure, here is".
- Use tight markdown: short headings, bullets, tables when comparing.
- Prefer concrete, specific language over corporate filler.
- When key facts are missing, make one clearly-labelled assumption instead of interrogating the user.
- End longer outputs with a short "Next steps" list of 2-3 concrete actions.`;

export const WORKFLOWS: Workflow[] = [
  {
    id: "assistant",
    label: "General assistant",
    blurb: "Anything on your desk right now",
    placeholder: "Describe the task you want off your plate...",
    starters: [
      "Help me prioritize this week's workload",
      "Write a status update for a slipping project",
      "Turn these rough notes into a client-ready recap",
    ],
    system: BASE_SYSTEM,
  },
  {
    id: "email",
    label: "Email & messages",
    blurb: "Draft, reply, reframe tone",
    placeholder: "Paste the thread, or describe the message you need...",
    starters: [
      "Reply declining a meeting without burning the relationship",
      "Chase an invoice that's 30 days overdue, politely",
      "Rewrite this message to be warmer and half the length",
    ],
    system: `${BASE_SYSTEM}
Focus: workplace correspondence. Output a ready-to-send draft with a subject line when relevant.
Offer one alternative tone (e.g. firmer / softer) as a short variant beneath the main draft.`,
  },
  {
    id: "meeting",
    label: "Meetings → actions",
    blurb: "Notes into owners and deadlines",
    placeholder: "Paste meeting notes or a transcript...",
    starters: [
      "Turn these standup notes into action items",
      "Summarize this transcript for someone who missed it",
      "Draft an agenda for a 30-minute project kickoff",
    ],
    system: `${BASE_SYSTEM}
Focus: meetings. Structure output as: **Summary** (3 bullets), **Decisions**, then an **Action items** markdown table with columns Action | Owner | Due. Use "Unassigned" / "TBD" where unknown.`,
  },
  {
    id: "document",
    label: "Documents & data",
    blurb: "Summarize, extract, restructure",
    placeholder: "Paste the document, spec, or raw data...",
    starters: [
      "Summarize this document into an executive brief",
      "Extract every commitment and date from this text",
      "Convert this messy list into a clean table",
    ],
    system: `${BASE_SYSTEM}
Focus: document work. Preserve every factual detail; never invent numbers. Prefer tables for extracted data and flag anything ambiguous in an "Unclear" note.`,
  },
  {
    id: "planner",
    label: "Plans & projects",
    blurb: "Break work into a real schedule",
    placeholder: "Describe the goal, deadline, and who's involved...",
    starters: [
      "Plan a two-week launch with three people",
      "Break this vague goal into weekly milestones",
      "Build a risk list for this project",
    ],
    system: `${BASE_SYSTEM}
Focus: planning. Output a phased plan with milestones, owners, and estimated effort. Include a short risks section with mitigations.`,
  },
  {
    id: "policy",
    label: "Process & SOPs",
    blurb: "Turn tribal knowledge into steps",
    placeholder: "Describe the process you want written down...",
    starters: [
      "Write an onboarding checklist for a new hire",
      "Document our expense approval process",
      "Create a runbook for handling an outage",
    ],
    system: `${BASE_SYSTEM}
Focus: process documentation. Output numbered steps with a clear trigger, owner per step, and an exceptions section.`,
  },
];

export const getWorkflow = (id: string): Workflow =>
  WORKFLOWS.find((w) => w.id === id) ?? (WORKFLOWS[0] as Workflow);
