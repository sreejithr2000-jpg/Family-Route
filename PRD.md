# Product Requirements Document — **Family Routes**

**Version:** 1.0 (Draft)
**Author:** Sreejith R.
**Date:** 2026-06-20
**Status:** Ready for review

---

## 1. Overview

**Family Routes** is a private, web-based application that lets an extended Indian
family map out who is related to whom, understand exactly *how* any two members are
related, and use that knowledge for real-life occasions — most importantly, building
smart invite lists for weddings and functions and tracking upcoming birthdays and
anniversaries.

It is an **internal tool** for a small set of related families (e.g., a family and its
in-laws). There is no public sign-up; identity is established by picking your name from
a list when the app loads. From that point on, the entire experience is rendered
**relative to you** — every relationship is labelled the way *you* would address that
person.

### 1.1 Problem statement

Large Indian families lose track of relationships across generations and branches. When
a wedding or function comes up, building the guest list is manual, error-prone, and
politically sensitive ("did we forget Dad's cousin?"). Birthdays and anniversaries of
extended relatives are forgotten. There is no single, trusted place that captures *who
is who* and *how everyone connects*.

### 1.2 Goals

1. Capture every family member and the minimal relationships needed to derive the rest.
2. Automatically compute and display the correct relationship label between any two
   members, with maternal/paternal and elder/younger nuance.
3. Generate sensible invite lists for events based on family circles, event type, and a
   headcount cap.
4. Surface upcoming birthdays and anniversaries (with ages) in one place.
5. Stay simple, fast, secure-enough for trusted internal use, and effectively free to run.

### 1.3 Non-goals (v1)

- Public/multi-family marketplace or open sign-up.
- Real authentication, passwords, or account management.
- Photo uploads / media storage (replaced by auto-generated avatar icons).
- External notifications (email/SMS/WhatsApp reminders).
- Native mobile apps (responsive web only).
- Full regional-language kinship terminology (English with side/seniority detail only).

---

## 2. Target users & personas

| Persona | Description | Primary needs |
|---|---|---|
| **The Organizer** (e.g., a parent planning a wedding) | Mid-tech-comfort adult coordinating an event | Build & export an invite list; see who's in which circle |
| **The Curator** | The relative who enjoys keeping the tree accurate | Add/edit people, fix duplicates, fill in details |
| **The Browser** | Any family member, any age | "How am I related to X?", see upcoming birthdays, explore the tree |

All users share the same capability set (everyone can edit). Personas describe intent,
not permission tiers.

---

## 3. Key product decisions (confirmed)

| Area | Decision |
|---|---|
| Platform | Responsive **web app** (phone + desktop, one codebase) |
| Tenancy | **A few related families**; sub-trees can link via marriage (in-laws) |
| Identity | **No login.** "Who are you?" name-picker → selected person becomes the primary/**ego** node |
| Permissions | **Everyone can edit**, mitigated by an **audit log** + **soft-delete/undo** |
| Relationship labels | **English + maternal/paternal + elder/younger** (e.g., "paternal uncle (elder)") |
| Adding people | Specify **both parents and/or spouse** when known |
| Circles | **Both** — person-relative circles (for invites) **and** named household groups (for browsing) |
| Invite logic | **Family circle + event-type rules + headcount cap** |
| Events | **In-app upcoming list only** (birthdays, anniversaries, ages) |
| Avatars | **Auto-assigned icons by age & gender** (no photo uploads) |
| Budget | **Free / near-zero** (free hosting + free managed DB tiers) |
| Scale target | **Up to ~1,000 people** across the linked families |

---

## 4. Functional requirements

### 4.1 Identity & "ego" selection

- **FR-1.1** On load, show a searchable list of all people; the user selects who they are.
- **FR-1.2** The selected person becomes the **primary/ego node**. All relationship
  labels, circles, and the relationship finder are computed relative to this person.
- **FR-1.3** The user can switch "who am I" at any time (e.g., a shared family laptop).
- **FR-1.4** Selection is remembered on the device (local storage) for convenience.

### 4.2 People & profiles

Each person is a **data record**, independent of whether they ever "use" the app.

- **FR-2.1** Required field: **Name**.
- **FR-2.2** Optional fields:
  - Nickname(s)
  - Date of birth
  - Place (current location)
  - **Native place** (ancestral village/town)
  - **Gotra**
  - Gender (used for avatar + relationship labels)
  - **Contact directory:** phone, email, address (optional, privacy-noted)
  - **Deceased flag** + date of death
- **FR-2.3** **Avatar icon** is auto-assigned from gender + age band (e.g., infant, child,
  teen, adult, elder). No uploads.
- **FR-2.4 (Deceased — blends in):** Deceased members appear in the tree **visually the
  same as everyone else** — no badge, black ribbon, greying-out, or anything that stands
  out at a glance or causes worry. Their deceased status (and date of death) is shown
  only **subtly inside their own profile detail** (e.g., "born … – passed …" / years
  rather than a prominent label). Functionally, they are simply excluded from birthday
  reminders and from invite lists by default.
- **FR-2.5** Profile view shows: name, nickname(s), place, DOB (and current age),
  native place, gotra, contact info, and the **relationship to the current ego node**.

### 4.3 Relationships & the tree

- **FR-3.1** The system stores only **atomic edges**: *parent–child* and *spouse–spouse*.
- **FR-3.2** When adding a person, the user may specify **both parents** and/or a
  **spouse**. The app places them automatically.
- **FR-3.3** All derived relationships (siblings, cousins, uncles/aunts, grandparents,
  in-laws) are **computed by graph traversal**, never stored directly.
- **FR-3.4** Relationship labels include **side** (maternal/paternal) and **seniority**
  (elder/younger) where applicable — e.g., "maternal aunt," "paternal uncle (elder),"
  "younger sister," "brother-in-law."
- **FR-3.5 (Remarriage / 2nd marriage):** A person may have **more than one spouse edge**.
  When adding/editing a spouse, the user can mark the marriage as **current** or
  **former/previous** and optionally note the reason (e.g., widowed, separated). Children
  are linked to their actual parents, so children from different marriages are placed
  correctly. Relationship labels and invite lists account for current vs. former spouses
  (former in-laws can be included/excluded by the host).
- **FR-3.6** **Tree visualization:** an interactive, pannable/zoomable graph centered on
  the ego node, with the ability to re-center on any person. Must remain smooth at
  ~1,000 nodes (render only the relevant neighborhood + lazy expand).

### 4.4 Family circles & household groups

- **FR-4.1 (Relative circles):** For the ego node, compute circles by graph distance —
  e.g., **Circle 1** = parents, siblings, spouse, children; **Circle 2** = grandparents,
  uncles/aunts, nieces/nephews, in-laws; **Circle 3** = cousins, grand-relations; etc.
- **FR-4.2 (Household groups):** Allow named, human-curated groups (e.g., "Ravi Uncle's
  family," "Grandparents' house") for browsing and filtering, visible the same way to
  everyone.
- **FR-4.3** A person can belong to one primary household group; circles are always
  recomputed per ego node.

### 4.5 Smart invite lists

- **FR-5.1** The host selects an **event type** (e.g., Wedding, Reception, Birthday,
  Anniversary, House-warming, Naming ceremony, Funeral/remembrance).
- **FR-5.2** Each event type carries a **default circle scope** (configurable):
  - Wedding → Circles 1–3
  - Reception → Circles 1–4
  - Small birthday → Circle 1
  - …etc.
- **FR-5.3** The host sets a **headcount cap**; the app fills the list from the closest
  circle outward until the cap is reached.
- **FR-5.4** The host can fine-tune: add/remove individuals, include/exclude whole
  households, and toggle "include deceased" (off by default).
- **FR-5.5** Show a **running count** vs. the cap and which circle each invitee came from.
- **FR-5.6 (Export):** Export the final list as text/PDF and as a **WhatsApp-friendly
  shareable message**.

### 4.6 Events (birthdays & anniversaries)

- **FR-6.1** An **Upcoming Events** page lists the next birthdays and wedding
  anniversaries, sorted by soonest.
- **FR-6.2** Each entry shows the person/couple, the date, and the **upcoming age** (or
  number of years married).
- **FR-6.3** Deceased members are quietly excluded from upcoming birthdays; an
  anniversary where a spouse has passed is simply **not surfaced** as an upcoming event
  (omitted silently, with no marker drawing attention to the loss).
- **FR-6.4** In-app only — **no external reminders** in v1.

### 4.7 Utilities

- **FR-7.1 (Relationship finder):** Pick any two people; the app explains the connection
  in natural language relative to the chosen perspective (e.g., "Ravi is your father's
  younger brother — your paternal uncle").
- **FR-7.2 (Duplicate detection):** On add/edit, warn when a likely duplicate exists
  (same/similar name + overlapping parents or spouse) and offer to merge or cancel.
- **FR-7.3 (Search & filter):** Find anyone by name, nickname, place, native place, or
  circle; filter the tree (e.g., "show only father's side," "show one household").
- **FR-7.4 (Total members):** Display total member count and simple stats (e.g., living
  members, number of households).
- **FR-7.5 (Tree PDF export):** Export the family tree itself as a **printable PDF
  poster** — choose a root/ego person and depth, render the layout to a shareable,
  print-friendly file (suitable for large-format printing at family gatherings).

### 4.8 Editing, history & safety

- **FR-8.1** Any user can add/edit/delete people and relationships.
- **FR-8.2** Deletions are **soft-deletes** with an **undo** window.
- **FR-8.3** An **audit log** records who changed what and when (attributed to the
  currently selected ego identity).
- **FR-8.4** Edits are reflected for everyone (shared single source of truth per linked
  family group).

---

## 5. Non-functional requirements

### 5.1 Performance
- **NFR-P1** Tree view interactions (pan/zoom/expand) feel smooth at ~1,000 nodes by
  rendering only the active neighborhood and lazily expanding branches.
- **NFR-P2** Relationship computation between two nodes returns in well under a second
  via bounded graph traversal and caching of the ego node's derived map.
- **NFR-P3** Initial app load is lightweight (people list + ego map), with detail data
  fetched on demand.

### 5.2 Scalability
- **NFR-S1** Data model and queries handle several linked families up to ~1,000 people
  without schema changes; indexed lookups on people and edges.
- **NFR-S2** Sub-trees can be linked via marriage without restructuring existing data.

### 5.3 Security & privacy
- **NFR-Sec1** Trusted internal model: access via a shared private URL; no public
  discovery/index.
- **NFR-Sec2** Contact details (phone/address) are sensitive — stored minimally, shown
  only inside the app, never exported unless the user explicitly includes them.
- **NFR-Sec3** All traffic over HTTPS; database access keys never exposed to the client
  beyond the minimum needed.
- **NFR-Sec4** Audit log + soft-delete provide accountability and recoverability given
  open editing. *(See §9 for the open-edit trade-off.)*

### 5.4 Budget
- **NFR-B1** Run within **free tiers**: static web hosting (e.g., Vercel/Netlify) + a
  free managed Postgres/Firebase tier.
- **NFR-B2** No paid email/SMS services in v1. No media storage (icons are generated).

### 5.5 Usability & accessibility
- **NFR-U1** Works well on a phone browser and a desktop browser (responsive).
- **NFR-U2** Simple, low-friction flows suitable for non-technical and elderly relatives.
- **NFR-U3** Readable typography, large touch targets, and clear relationship language.

---

## 6. Recommended technical approach (proposal)

> Kept deliberately simple and free-tier-friendly. Final stack is an implementation
> decision; this is a recommendation that satisfies the constraints above.

- **Frontend:** React (Vite) responsive SPA.
- **Tree visualization:** a graph/DAG layout library (e.g., React Flow or d3-dag/elkjs)
  with neighborhood-based lazy rendering.
- **Backend/DB:** A free managed Postgres (e.g., Supabase free tier) — relational model
  fits the graph-of-edges well and supports indexed traversal queries. No custom auth
  server needed (identity is a client-side name pick).
- **Hosting:** Vercel/Netlify free tier; HTTPS by default; private/unlisted URL.

### 6.1 Data model (conceptual)

- **person**: `id, name, nicknames[], gender, dob, place, native_place, gotra,
  is_deceased, dob_of_death, contact{phone,email,address}, household_group_id,
  created_by, created_at, is_deleted`
- **relationship_edge**: `id, type ∈ {parent_child, spouse}, from_person_id,
  to_person_id, status ∈ {current, former} (for spouse), created_at`
- **household_group**: `id, name`
- **event_type_rule**: `event_type, default_circle_min, default_circle_max`
- **audit_log**: `id, actor_person_id, action, entity, before, after, timestamp`

### 6.2 Core algorithms

- **Relationship resolver:** BFS/DFS from the ego node over `parent_child` and `spouse`
  edges; map the path signature (e.g., up→up→down = cousin's…) to an English label with
  side (which parent the path goes through) and seniority (compare DOBs of siblings).
- **Circle computation:** graph distance from ego node, grouped into circle bands.
- **Invite generation:** start at the event type's circle range, walk outward from the
  host, accumulate people/households until the headcount cap is met; exclude deceased by
  default.
- **Duplicate detection:** fuzzy name match + shared parent/spouse overlap heuristic.

---

## 7. User flows (high level)

1. **Open app →** "Who are you?" picker → tree renders with you at center.
2. **Add a relative →** enter name + (parents and/or spouse) + optional details →
   duplicate check → appears in tree, relationship auto-labelled.
3. **Find a relationship →** pick person A and B → natural-language explanation.
4. **Plan an event →** choose event type → set headcount cap → review auto-list by circle
   → tweak → export to PDF/WhatsApp text.
5. **Check events →** open Upcoming Events → see next birthdays/anniversaries with ages.

---

## 8. Success metrics

- ≥ 90% of living members have at least name + one parent/spouse edge (tree completeness).
- Relationship finder returns the correct label for a sampled set of known pairs.
- An event invite list is generated and exported in under ~2 minutes by a non-technical
  organizer.
- Duplicate rate stays low (duplicates flagged before save).
- App stays within free tiers at the ~1,000-person scale.

---

## 9. Risks, assumptions & open questions

**Risks / trade-offs**
- **Open editing** (everyone can edit) risks messy/conflicting data. *Mitigation:* audit
  log, soft-delete/undo, duplicate detection. Consider an optional "review queue" later.
- **No real auth** means anyone with the URL can view/edit. Acceptable for a trusted,
  private family link; revisit if scope widens.
- **Remarriage / 2nd marriage** is supported (FR-3.5); the related step/half-sibling
  labels may still read approximately in some edge cases.
- **Relationship-label accuracy** with English+side+seniority can still be ambiguous for
  distant/edge cases.

**Assumptions**
- A shared private URL is an acceptable access mechanism.
- Families are comfortable with contact info living in the app (optional fields).
- ~1,000 people is the realistic ceiling.

**Now in scope (previously open):**
- **Remarriage / 2nd marriage** — supported (FR-3.5).
- **Tree PDF export** — supported (FR-7.5).

**Explicitly out of scope (deferred):**
- Optional "lock" on core records (e.g., elders) despite open editing.
- Regional-language kinship terms (Tamil/Telugu/etc.).

---

## 10. Phasing (suggested)

- **Phase 1 (MVP):** People + profiles (with icons, deceased blended in), parent/spouse
  edges **including remarriage/2nd marriage**, ego selection, tree view, relationship
  finder, search, upcoming events, audit log + undo.
- **Phase 2:** Smart invite lists (event-type rules + cap + export), household groups,
  duplicate detection, **tree PDF export**.
- **Phase 3 (later):** Optional review queue, optional reminders. *(Out of scope:
  regional-language terms, record locking.)*
