# NEX Mission Control

Single-user web app for representing a person's technical projects and their
tasks, technical decisions, documentation, and activity.

## Language

**Project**:
A technical undertaking owned by the user, the anchor everything else hangs off.
_Avoid_: Workspace, portfolio

**Task**:
A unit of work belonging to a project; never orphaned.
_Avoid_: Ticket, issue

**Technical Decision**:
A technical choice made within a project, with its context and rationale; never orphaned.
_Avoid_: ADR (the record format, not the choice itself)

**Documentation**:
Written material belonging to a project that explains it; never orphaned.
_Avoid_: Wiki, note

**Activity**:
A view of what happened in a project, derived from the other entities rather than recorded on its own.
_Avoid_: Log, event
