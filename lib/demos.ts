export type Demo = {
  title: string;
  problem: string;
  proves: string;
  tag: string;
  live?: boolean;
  href?: string;
};

export const demos: Demo[] = [
  {
    title: "API and webhook integration",
    problem:
      "Two systems need to call each other and stay in sync when something changes.",
    proves: "API contracts, webhooks, and a reliable handoff.",
    tag: ".NET",
    live: true,
    href: "/hub/demos/api-webhook",
  },
  {
    title: "Cloud data pipeline",
    problem: "Source data has to land in the cloud and be ready to query.",
    proves: "A repeatable pipeline from source extract to a queryable result.",
    tag: "Python",
  },
  {
    title: "Observability and root cause",
    problem: "Something failed, and the useful question is where and why.",
    proves: "Tracing a symptom to the step that broke.",
    tag: "Observability",
  },
  {
    title: "Identity and access",
    problem: "People need the right access, and only that access.",
    proves: "SSO, provisioning, and least access.",
    tag: "Identity",
  },
  {
    title: "AI integration assistant",
    problem:
      "An integration problem should become a first draft a person can review.",
    proves: "Using AI to draft the integration, with a human check.",
    tag: "Python",
  },
  {
    title: "Cloud architecture",
    problem:
      "A solution is easier to trust when the systems and boundaries are drawn.",
    proves: "Architecture that shows how the pieces fit.",
    tag: "Cloud",
  },
  {
    title: "AI/ML pipeline",
    problem:
      "A model only helps if data in and a result out run the same way each time.",
    proves: "An end-to-end path from prepared data to a scored result.",
    tag: "Python",
  },
  {
    title: "AI SDLC",
    problem: "AI can speed the lifecycle only if a person still owns the outcome.",
    proves: "Design, build, and test with AI assist and human review.",
    tag: "SDLC",
  },
  {
    title: "AI agents",
    problem: "Some work takes several steps, tools, and a stop for a person.",
    proves: "An agent that plans, uses tools, and stays under human control.",
    tag: "Python",
  },
];
