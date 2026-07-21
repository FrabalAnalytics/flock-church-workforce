# Flock Church Workforce and Attendance Management System

## Presentation and User Overview

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
- Assign user roles and departments.
- View church-wide worker attendance and reports.
- Correct previously submitted worker-attendance records.
- View care and absence alerts.
- Record and correct congregation attendance.
- Create, edit, publish, republish, and permanently delete service programmes.
- Export attendance information to CSV.

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
- Access is controlled by user role and department.
- Database Row-Level Security provides protection beyond the visible interface.
- Profile names, phone numbers, roles, and department assignments are managed only by a Super Admin.
- Users can still reset or change their own passwords through Supabase Auth.

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

Automated WhatsApp delivery has been prepared for future use but is currently paused. No paid Twilio messaging is required for the system's present attendance and dashboard functions.

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
- Super-admin-only permanent deletion with exact-title confirmation.

Deleting a programme also deletes its copied programme items and immediately removes it from Church Leader and Department Head views. The reusable source template remains available.

### 5.10 Data export

Authorised users can export worker-attendance and church-attendance reports as CSV files. These files can be opened in Microsoft Excel, Google Sheets, or similar tools for approved analysis and record keeping.

### 5.11 Database migrations and recovery readiness

The database uses ordered, timestamped migration files in `supabase/migrations`. The readable `supabase/schema.sql` file remains the current-state snapshot, while migrations provide a controlled history of changes for deployment and review.

Backup and recovery procedures, verification scripts, and a backup register template are documented in the repository. Routine backups are intentionally pending until full onboarding, but the process is ready to activate before genuine church-wide data becomes operational.

---

## 6. How the system is used

### Before regular use

1. The Super Admin confirms the list of departments.
2. Worker records are added and assigned to departments.
3. Users register with their email addresses.
4. The Super Admin assigns each approved user a role.
5. Department Heads are assigned to the correct departments.

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
5. Approved changes can be republished; an erroneous programme can be permanently deleted only by the Super Admin after exact-title confirmation.

### Reviewing performance and care needs

1. A leader opens the Overview.
2. The relevant period, service type, or department is selected.
3. KPIs, trend lines, department comparisons, and service logs are reviewed.
4. Care alerts are checked for workers with repeated absences.
5. Appropriate ministry follow-up happens outside or through the authorised workflow.

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
- Super-admin-only attendance correction functions.
- Centrally managed profile identity and contact information.
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

The current system includes authentication, centrally managed user profiles, role administration, departments, a worker directory, service-day scheduling and submission monitoring, worker attendance and corrections, leadership reporting, attendance trends, care alerts, congregation attendance and corrections, a Minister Directory, reusable programme templates, dated published service programmes, privacy information, CSV exports, database migrations, and backup/recovery procedures.

Possible future additions include:

- Validated bulk worker import within the application.
- QR-code access to published service information.
- Approved PDF reports.
- Optional paid WhatsApp care messaging.
- More detailed audit history for corrected records.
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
8. Demonstrate worker, department, user-access, attendance-correction, and service-programme management.
9. Explain privacy, read-only leadership access, role restrictions, duplicate prevention, and migration controls.

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

### Who can change or delete a service programme?

Only a Super Admin can create, edit, publish, republish, or permanently delete a programme. Church Leaders and Department Heads can view published programmes only.

### Is WhatsApp required?

No. The current system works without Twilio or paid WhatsApp messaging. That capability is paused and can be considered later.

### Can reports be downloaded?

Yes. Authorised users can export applicable attendance reports as CSV files.

### Can the system work on a mobile phone?

Yes. The interface and navigation are designed for mobile, tablet, and desktop use.
