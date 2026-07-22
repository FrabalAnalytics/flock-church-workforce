# Flock Church Workforce and Attendance Management System

## Presentation and User Overview

Updated for the July 2026 release.

### 1. Executive summary

Flock is a secure, mobile-friendly church workforce and attendance management system. It helps church leadership maintain accurate worker records, record departmental attendance, monitor participation trends, identify workers who may need care or follow-up, and track overall congregation attendance.

The system replaces scattered paper records and disconnected spreadsheets with one central source of information. Each user sees only the information and actions appropriate to their assigned role.

Flock is designed to help the church move from manual record keeping to timely, evidence-based ministry oversight while preserving the dignity and privacy of workers and attendees.

---

## 2. The problem Flock addresses

Church workforce and attendance information is often collected through paper forms, messaging groups, notebooks, or separate spreadsheets. This can lead to:

- Repeated manual work every service day.
- Missing or duplicated attendance records.
- Difficulty comparing departments and service periods.
- Delayed awareness of workers who have been absent repeatedly.
- Limited visibility for church leaders.
- Records that are difficult to retrieve, verify, or export.
- Unnecessary printing and administrative costs.

Flock brings these activities together in one controlled system that can be used from a phone, tablet, or computer.

---

## 3. Main objectives

Flock is intended to:

1. Maintain an accurate register of church workers.
2. Make departmental attendance submission simple and consistent.
3. Give leaders a clear view of workforce participation.
4. Identify repeated absence early enough for pastoral care.
5. Record overall church attendance using aggregate counts.
6. Reduce dependence on paper and manually compiled reports.
7. Protect sensitive information through role-based access.

---

## 4. User roles and responsibilities

### Super Admin

The Super Admin manages the system and has the highest level of access.

The Super Admin can:

- Create and maintain departments.
- Add and update worker records.
- Maintain the Minister Directory.
- Review newly registered users.
- Invite approved leaders directly by email.
- Assign user roles and departments.
- Delete leader or administrator accounts through a protected confirmation flow.
- View church-wide worker attendance and reports.
- Correct previously submitted worker-attendance records.
- View care and absence alerts.
- Record and correct congregation attendance.
- Create, edit, publish, republish, and permanently delete service programmes.
- Export attendance information to CSV.
- Review operational priorities in the Action Centre.
- Maintain church identity and contact settings.
- Review system and integration health.
- Follow the guided workspace setup checklist.
- Download a protected full-data backup.

Only trusted administrators should receive this role.

### Church Leader

Church Leaders have church-wide, read-only oversight of attendance and care information.

Church Leaders can:

- View workforce attendance across departments.
- Use date, department, and service-type filters.
- Review attendance trends and department comparisons.
- View care alerts and repeated absences.
- View overall church attendance and demographic breakdowns.
- View published service programmes.
- Export authorised reports.

Church Leaders cannot change profiles, workers, attendance, care alerts, programmes, departments, ministers, roles, or permissions. Their operational access is read-only.

### Department Head

Department Heads manage attendance for their assigned department.

Department Heads can:

- View the active workers in their department.
- Submit attendance for a service.
- Mark workers as present or absent.
- Review their department's attendance history and reports.
- Review and resolve follow-up information relevant to their department.
- View published service programmes.

Department Heads cannot view or manage workers belonging to other departments. They cannot change their own profile identity or contact information; a Super Admin centrally manages those fields.

### Pending User

Every newly registered account starts as pending. A pending user cannot access operational church records until a Super Admin reviews and assigns the appropriate role.

---

## 5. Core features

### 5.1 Secure authentication and access control

- Users sign in with an email address and password.
- Password recovery is supported through verified email links.
- New accounts remain pending until approved.
- Super Admins can send managed invitation links to approved leaders.
- Access is controlled by user role and department.
- Database Row-Level Security provides protection beyond the visible interface.
- Profile names, phone numbers, roles, and department assignments are managed only by a Super Admin.
- Users can still reset or change their own passwords through Supabase Auth.
- Privileged account deletion requires explicit confirmation and prevents an administrator from deleting their own active account accidentally.

### 5.2 Department management

The Super Admin can create and rename ministry departments. Departments are used to organise workers, assign Department Heads, restrict access, and produce comparative reports.

Current seeded departments include Ushering, Sanctuary, Media, Children, Protocol, Music, Technical, and Enumerator. These can be adjusted by the Super Admin.

### 5.3 Worker directory

The worker directory stores:

- Full name.
- Phone number.
- Sex, recorded as Male or Female when provided.
- Department.
- Worker status.
- Date joined.
- WhatsApp communication preference.

Worker statuses include Active, Inactive, and On Leave. Only active workers are included in a department's expected attendance roster.

The sex field is optional so existing records remain valid. It is centrally managed by a Super Admin and can be used to filter the worker directory without affecting attendance calculations.

Super Admins can also import up to 500 workers from a CSV file. The import
screen validates headings, department names, dates, roster values, sex values,
and WhatsApp consent before submission. It previews errors and repeated file
rows, then revalidates the accepted records inside one database transaction.
Existing workers with the same normalized name and department are skipped, and
every inserted worker is included in the immutable audit history.

### 5.4 Departmental worker attendance

On a service day, a Department Head selects the service type and marks the active workers who are present. The system then:

- Records Present or Absent for every active worker.
- Calculates roster, present, and absent totals.
- Prevents a department from submitting the same service twice.
- Records who submitted the attendance and when.
- Updates the attendance overview and reports.

A Super Admin can correct an already submitted worker-attendance record by changing which workers were Present or Absent. The original service, department, roster, and submitter remain unchanged. The system recalculates the totals, records who made the correction and when, and updates any affected absence-follow-up state.

Supported service types currently include:

- Sunday Service.
- Tuesday Service.
- Special Service.
- Headquarters Service.
- Tarry Night.

#### Service-day control

Super Admins can schedule a service date and choose every department expected
to submit worker attendance. The control centre shows submitted, pending, and
late departments in one place. It also records manual reminder activity and
allows attendance to be closed or reopened with confirmation and an operational
event history. Church Leaders have read-only oversight of the same status.

When a managed service is open, Department Heads can submit only when their
department is expected. Once it is closed, new department submissions are
rejected until a Super Admin reopens attendance. Days that have not been placed
under service-day control continue to use the original attendance workflow.

#### Audit history

Sensitive record changes are written automatically to an immutable audit
history. The history identifies the record type and ID, action, authenticated
actor, timestamp, and before-and-after values. It covers user access,
departments, workers, services, expected departments, worker and congregation
attendance, care follow-ups, ministers, and service programmes. Only Super
Admins can view this history, and application users cannot edit or delete it.

### 5.5 Leadership overview and reporting

The leadership Overview provides:

- Total expected worker records.
- Average attendance per service.
- Number of services logged.
- Overall attendance rate.
- Worker attendance trend line.
- Headcount by department.
- Attendance rate by department.
- Recent service log.
- Attendance rate for each department submission.

Reports can be filtered by:

- Last 7, 30, or 90 days.
- Custom start and end dates.
- Department.
- Service type.

All displayed metrics and charts respond to the active filters. A Clear action removes the selected filters.

### 5.6 Attendance trend analysis

The trend chart helps leaders identify patterns that may be difficult to see in a list of figures. It can show whether workforce participation is improving, declining, or fluctuating over the selected period.

Leaders can use this information to ask better questions, support departments, and respond before a temporary attendance issue becomes a long-term problem.

### 5.7 Absence follow-up and care alerts

Flock monitors consecutive worker absences. It can create escalating follow-up events at defined absence levels, helping leaders recognise workers who may need contact, support, or pastoral attention.

Workers marked On Leave or Inactive are removed from the active care queue without deleting their attendance history.

Automated WhatsApp delivery is optional. When Twilio and the protected dispatcher are configured, approved care-message events can be processed and their queued, sent, delivered, failed, or cancelled states recorded. Workers must have opted in before automated care messages are queued, and a Super Admin can run a controlled test from Settings. Flock's attendance, dashboard, reporting, and manual care workflows continue to work without paid messaging.

### 5.8 Congregation attendance

Overall congregation attendance is recorded separately from individual worker attendance. The system stores aggregate counts only:

- Adult males.
- Adult females.
- Children.
- New members, separated by male and female.
- New converts, separated by male and female.
- Minister for the service.
- Optional service notes.
- Automatically calculated total.

New members and new converts are adult subsets already included in the adult totals; they do not increase the calculated congregation total. Only the Super Admin can record or correct these figures. Church Leaders can view the resulting overview and reports.

The system allows one church-attendance record per calendar date, helping prevent double entry.

The Congregation Attendance overview includes:

- Total attendance.
- Average attendance per recorded service.
- Adult male, adult female, and children totals and percentages.
- Overall attendance trend.
- Attendance mix.
- Comparison by service type.
- Recent service log.
- Date and service filters.
- CSV export.

No names, phone numbers, or personal details of ordinary attendees are collected.

### 5.9 Service programmes

The Super Admin can create a dated service programme from a reusable template. Template rows are copied into the dated programme so later template changes do not rewrite an already planned service.

The programme workflow supports:

- Draft and published states.
- Editing activities, times, responsible people, and notes.
- Adding or removing programme items.
- Validation against invalid or overlapping times before publication.
- Republishing approved updates.
- Read-only viewing by Church Leaders and Department Heads after publication.
- Optional public sharing through a revocable, expiring link and downloadable QR code.
- Super-admin-only permanent deletion with exact-title confirmation.

Deleting a programme also deletes its copied programme items and immediately removes it from Church Leader and Department Head views. The reusable source template remains available.

Public sharing is off by default and can be enabled only by a Super Admin after publication. The public page exposes only the programme title, date, service type, schedule activities, responsible names, durations, and notes. It does not grant anonymous table access or expose account, worker, attendance, care, creator, internal ID, or link-token data. A Super Admin can change the expiry, disable the link immediately, or replace it so that the previous URL and QR code stop working.

### 5.10 Data export

Authorised users can export worker-attendance and church-attendance reports as CSV files for approved analysis in spreadsheet tools. They can also download leadership-ready PDF reports containing the active date and service filters, summary metrics, comparison tables, paginated service logs, generation details, and a confidentiality notice. Row-level security continues to restrict Department Head worker reports to their own department, while congregation PDFs remain available only to Church Leaders and Super Admins.

### 5.11 Database migrations and recovery readiness

The database uses ordered, timestamped migration files in `supabase/migrations`. The readable `supabase/schema.sql` file remains the current-state snapshot, while migrations provide a controlled history of changes for deployment and review.

Backup and recovery procedures, verification scripts, and a backup register template are documented in the repository. Super Admins can also download a protected JSON export of the church's durable application data from Settings. The exported file contains personal and ministry information, including active programme-share secrets, and must be kept only in an encrypted, access-controlled location. This application export supplements, rather than replaces, Supabase platform and database backups.

### 5.12 Action Centre and personal notifications

The Action Centre brings urgent and incomplete operational work into one role-aware view. Depending on the user's permissions, it can show:

- Expected departments with missing attendance submissions.
- Unresolved worker-care follow-ups.
- New accounts awaiting access approval.
- Failed automated message deliveries.

Each user can mark an item as seen, snooze it for 24 hours, or restore it early. Seen and snoozed states are personal to that user and do not change or resolve the underlying attendance, care, access, or delivery record. Completing the actual work removes the related action for everyone who is authorised to see it.

### 5.13 Managed invitations and account administration

A Super Admin can invite a Church Leader, Department Head, or another Super Admin by email. The invitation assigns the intended role and, where required, the department before the recipient completes account setup. This reduces the need to approve and reconfigure an account after self-registration.

Super Admins can also delete leader and administrator accounts when access must be withdrawn. Deletion uses a protected server-side flow with deliberate confirmation. The system prevents unsafe self-deletion of the currently signed-in administrator, while database relationships preserve or safely detach historical operational records according to their defined retention rules.

### 5.14 Church settings and system health

The Super Admin Settings page provides one place to maintain:

- Church name.
- Operating timezone.
- Care-message signature.
- Official contact email and phone number.

The same page reports whether essential integrations are ready without displaying secret values. It checks database readiness, managed invitations, WhatsApp configuration, the public callback URL, deployment information, the latest protected dispatcher run, and recent message-delivery failures. A controlled WhatsApp test is available when messaging is configured.

The current release is a single-church workspace. These settings describe the local church using that deployment; they are not yet separate tenant settings for multiple churches sharing one database.

### 5.15 Guided onboarding

The Getting Started page gives the Super Admin a live setup checklist. Progress is calculated automatically from existing records and covers the church profile, departments, administrator access, active workers, and the first attendance submission. It helps a new church move from an empty deployment to a usable weekly workflow without relying on a separate manual checklist.

---

## 6. How the system is used

### Before regular use

1. The Super Admin opens Getting Started and reviews workspace readiness.
2. Church identity, timezone, message signature, and official contact details are completed in Settings.
3. The Super Admin confirms the list of departments.
4. Worker records are added individually or imported from a validated CSV file and assigned to departments.
5. Approved leaders are invited, or registered accounts are reviewed from Access Management.
6. The Super Admin assigns each approved user a role and assigns every Department Head to the correct department.
7. System health is reviewed and a protected backup is downloaded before genuine operational data is collected.

### On a service day

1. The Super Admin schedules the service and expected departments.
2. Each Department Head signs in on a phone, tablet, or computer.
3. The Department Head opens Log Worker Attendance and selects an assigned open service.
4. Present workers are marked.
5. Attendance is submitted once for that department and service.
6. Leadership monitors submitted, pending, and late departments.
7. The Super Admin closes attendance when reporting is complete.
8. Leadership reports update from the submitted records.

### Recording congregation attendance

1. The Super Admin opens Congregation Attendance.
2. The service date and service type are selected.
3. The minister, adult male, adult female, children, new-member, and new-convert figures are entered.
4. Optional service notes are added and the system calculates the total.
5. The record becomes visible as read-only information to authorised Church Leaders.

### Preparing a service programme

1. The Super Admin creates a dated programme from an active reusable template.
2. Activities, times, responsible people, and notes are reviewed and adjusted.
3. The programme is published after validation.
4. Church Leaders and Department Heads can view the published programme.
5. If public access is required, the Super Admin creates a time-limited link, copies it or downloads its QR code, and can later disable or replace it.
6. Approved changes can be republished; an erroneous programme can be permanently deleted only by the Super Admin after exact-title confirmation.

### Reviewing performance and care needs

1. A leader opens the Action Centre to review current attendance gaps and care priorities.
2. Items already acknowledged can be marked seen; an item can be snoozed for 24 hours without altering the underlying record.
3. The leader opens the Overview and selects the relevant period, service type, or department.
4. KPIs, trend lines, department comparisons, and service logs are reviewed.
5. Care alerts are checked for workers with repeated absences.
6. Appropriate ministry follow-up happens outside or through the authorised workflow.

### Weekly administration and backup

1. The Super Admin reviews Settings and System Health for configuration or delivery warnings.
2. Recent failed message events and the latest dispatcher result are reviewed when WhatsApp automation is enabled.
3. A full church-data JSON backup is downloaded from Settings.
4. The backup is moved to an encrypted, access-controlled location and recorded in the private backup register.
5. The documented database backup and verification procedure is also followed according to the church's retention schedule.

---

## 7. Benefits to the church

### Reduced administrative workload

Attendance totals and rates are calculated automatically. Leaders no longer need to combine several paper forms or spreadsheets before reviewing attendance.

### Faster leadership visibility

Authorised leaders can see current information without waiting for a manually prepared report.

### Better pastoral care

Repeated absence can be recognised earlier, helping the church respond with care rather than allowing workers to quietly disengage.

### More reliable records

Database validation, duplicate prevention, timestamps, and role controls improve record consistency and accountability.

### Lower paper and printing costs

Department Heads submit attendance digitally, reducing paper registers and repeated printing.

### Mobile accessibility

The workspace is designed to work on phones, tablets, and desktop computers. This makes service-day use practical for department leaders.

### Evidence-based planning

Trend lines, category breakdowns, and service comparisons help leadership recognise patterns and plan training, support, scheduling, and ministry resources more effectively.

### Improved privacy

Users receive only the access required for their responsibilities. Overall congregation attendance uses anonymous aggregate counts rather than personal attendee records.

---

## 8. Data protection and responsible use

Flock contains church workforce and attendance information and should be used responsibly.

Key safeguards include:

- Role-based access.
- Department-based restrictions.
- Row-Level Security in the database.
- Pending approval for new accounts.
- Server-side validation for privileged actions.
- Audit fields showing who submitted or updated records.
- Immutable audit events for sensitive operational changes.
- Super-admin-only attendance correction functions.
- Centrally managed profile identity and contact information.
- Protected managed invitations and administrator account deletion.
- Personal notification state isolated to the authenticated user.
- Secret-safe system health checks.
- Super-admin-only full-data export with private, no-store response headers.
- Timestamped database migrations and a documented recovery process.
- Aggregate-only congregation attendance.
- A published privacy notice within the application.

Users should:

- Keep passwords private.
- Sign out on shared devices.
- Avoid exporting data unless necessary.
- Store exported reports securely.
- Report incorrect access or data immediately.
- Use absence information for care and support, not embarrassment or punishment.

Before full organisational rollout, the church should confirm its legal name, privacy contact, data-retention schedule, and internal policy for authorised exports.

---

## 9. Recommended rollout approach

### Phase 1: Preparation

- Confirm departments and approved system administrators.
- Clean and import the initial worker-directory data.
- Review privacy and data-retention responsibilities.
- Confirm which leaders require access.

### Phase 2: Pilot

- Select two or three departments.
- Train their Department Heads.
- Run the digital process alongside the current method for a short period.
- Compare results and correct workflow issues.

### Phase 3: Church-wide launch

- Assign all approved Department Heads.
- Provide a short mobile-use guide.
- Establish a service-day submission deadline.
- Nominate a person responsible for support and data quality.

### Phase 4: Review

- Review adoption after the first month.
- Check missing submissions and duplicate worker records.
- Gather feedback from Department Heads and Church Leaders.
- Adjust training and processes where necessary.

---

## 10. Current scope and future opportunities

The current system includes authentication and password recovery, managed invitations, centrally managed user profiles, protected account deletion, role administration, immutable audit history, church settings and system health, guided onboarding, a role-aware Action Centre with personal seen and snooze controls, departments, a worker directory with validated CSV import, resilient attendance drafts, service-day scheduling and submission monitoring, worker attendance and corrections, leadership reporting, attendance trends, care alerts, optional WhatsApp delivery monitoring, congregation attendance and corrections, a Minister Directory, reusable programme templates, dated published service programmes, revocable QR-code programme sharing, privacy information, CSV and leadership-ready PDF reports, protected JSON data export, database migrations, and documented backup/recovery procedures.

Possible future additions include:

- Tenant isolation and church switching for a multi-church edition.
- Offline-friendly service-day workflows.

These are future opportunities and should be introduced only after the core attendance process is stable and adopted.

---

## 11. Suggested leadership presentation

### Opening statement

> Flock gives us one secure and accessible place to manage our workforce records, collect attendance, identify participation patterns, and support workers who may need care. It reduces manual reporting while giving each leader only the access needed for their responsibility.

### Demonstration sequence

1. Sign in as a Department Head.
2. Show the department roster and attendance submission process.
3. Sign in as a Church Leader.
4. Demonstrate filters, KPIs, trend lines, and department comparisons.
5. Show care alerts and explain their pastoral purpose.
6. Show the Congregation Attendance overview.
7. Sign in as a Super Admin.
8. Demonstrate the Action Centre, Getting Started checklist, Settings, and system-health indicators.
9. Demonstrate worker import, department management, managed invitations, user access, attendance correction, and service-programme management.
10. Show the protected backup download and explain secure storage and recovery responsibilities.
11. Explain privacy, read-only leadership access, role restrictions, duplicate prevention, personal notification states, audit history, and migration controls.

### Closing statement

> The purpose of Flock is not simply to count people. It is to improve stewardship, reduce avoidable administrative work, give leaders timely information, and help the church care for its workers more intentionally.

---

## 12. Frequently asked questions

### Does every church worker need an account?

No. Accounts are required for authorised system users such as Super Admins, Church Leaders, and Department Heads. Workers can exist in the worker directory without having login accounts.

### Can a Department Head see another department's workers?

No. Department access is restricted to the department assigned to that user.

### Can attendance be submitted twice?

Departmental worker attendance is limited to one submission per department and service. Congregation attendance is limited to one record per calendar date.

### Can a submitted attendance record be corrected?

Yes. Only a Super Admin can correct submitted worker attendance or congregation attendance. Worker corrections preserve the original service, department, roster, and submitter while recording the correction administrator and time.

### Can Church Leaders change congregation attendance or other operational records?

No. Church Leaders have read-only operational access. Only a Super Admin can submit or correct congregation attendance and manage system records.

### Does the system collect personal details for every church attendee?

No. Congregation attendance consists only of aggregate adult male, adult female, children, new-member, and new-convert counts.

### Who can change a user's name, phone number, role, or department?

Only a Super Admin. Church Leaders and Department Heads cannot change their own profile identity or contact information, although every user can still change or reset their own password through Supabase Auth.

### Can a Super Admin invite or remove another leader?

Yes. A Super Admin can send an approved invitation with the intended role and department. A Super Admin can also delete a Church Leader, Department Head, or another Super Admin through the protected confirmation flow. The currently signed-in Super Admin cannot delete their own active account through that workflow.

### What does marking or snoozing an Action Centre item do?

Marking an item as seen records a personal acknowledgement. Snoozing hides it from that user's active list for 24 hours, and it can be restored sooner. Neither action resolves or edits the underlying ministry record. Completing the attendance, access, care, or delivery task is what removes the operational issue.

### Who can change or delete a service programme?

Only a Super Admin can create, edit, publish, republish, or permanently delete a programme. Church Leaders and Department Heads can view published programmes only.

### Is WhatsApp required?

No. The system works without Twilio or paid WhatsApp messaging. When the church chooses to enable it, Settings shows configuration health, a controlled test is available, and delivery outcomes are recorded for review.

### Can reports be downloaded?

Yes. Authorised users can export applicable attendance reports as CSV files.

### Can the church's complete application data be backed up?

Yes. A Super Admin can download a protected JSON export from Settings. It contains sensitive church and personal information and must be stored securely. The repository also contains a database backup, verification, retention, and recovery runbook. The application export does not replace Supabase platform backups, particularly for Auth users and sessions.

### Is this version ready for several churches in one deployment?

Not yet. The current release is a single-church workspace. A separate deployment can be configured for each pilot church, but true multi-tenancy requires tenant identifiers, tenant-aware access policies, isolated settings, and migration of existing data before churches safely share one database.

### Can the system work on a mobile phone?

Yes. The interface and navigation are designed for mobile, tablet, and desktop use.
