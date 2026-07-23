param(
  [string]$OutputDirectory = (Join-Path $PSScriptRoot "..\docs\commercial")
)

$ErrorActionPreference = "Stop"
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Escape-Xml([string]$Value) {
  if ($null -eq $Value) { return "" }
  return [System.Security.SecurityElement]::Escape($Value)
}

function New-Paragraph([string]$Text, [string]$Style = "Normal", [bool]$Bold = $false, [string]$Align = "left") {
  $escaped = Escape-Xml $Text
  $boldXml = if ($Bold) { "<w:b/>" } else { "" }
  return "<w:p><w:pPr><w:pStyle w:val=`"$Style`"/><w:jc w:val=`"$Align`"/></w:pPr><w:r><w:rPr>$boldXml</w:rPr><w:t xml:space=`"preserve`">$escaped</w:t></w:r></w:p>"
}

function New-Bullet([string]$Text) {
  return New-Paragraph "• $Text" "BodyText"
}

function New-PageBreak {
  return "<w:p><w:r><w:br w:type=`"page`"/></w:r></w:p>"
}

function New-Table([object[]]$Rows, [int[]]$Widths = @()) {
  if (-not $Rows -or $Rows.Count -eq 0) { return "" }
  $columnCount = $Rows[0].Count
  if ($Widths.Count -ne $columnCount) {
    $defaultWidth = [math]::Floor(9300 / $columnCount)
    $Widths = @(1..$columnCount | ForEach-Object { $defaultWidth })
  }

  $xml = "<w:tbl><w:tblPr><w:tblW w:w=`"9300`" w:type=`"dxa`"/><w:tblLayout w:type=`"fixed`"/><w:tblBorders><w:top w:val=`"single`" w:sz=`"4`" w:color=`"CBD5E1`"/><w:left w:val=`"single`" w:sz=`"4`" w:color=`"CBD5E1`"/><w:bottom w:val=`"single`" w:sz=`"4`" w:color=`"CBD5E1`"/><w:right w:val=`"single`" w:sz=`"4`" w:color=`"CBD5E1`"/><w:insideH w:val=`"single`" w:sz=`"4`" w:color=`"E2E8F0`"/><w:insideV w:val=`"single`" w:sz=`"4`" w:color=`"E2E8F0`"/></w:tblBorders></w:tblPr><w:tblGrid>"
  foreach ($width in $Widths) { $xml += "<w:gridCol w:w=`"$width`"/>" }
  $xml += "</w:tblGrid>"

  for ($rowIndex = 0; $rowIndex -lt $Rows.Count; $rowIndex++) {
    $xml += "<w:tr>"
    for ($columnIndex = 0; $columnIndex -lt $columnCount; $columnIndex++) {
      $value = Escape-Xml ([string]$Rows[$rowIndex][$columnIndex])
      $shade = if ($rowIndex -eq 0) { "<w:shd w:val=`"clear`" w:fill=`"EAF0FF`"/>" } else { "" }
      $bold = if ($rowIndex -eq 0) { "<w:b/>" } else { "" }
      $xml += "<w:tc><w:tcPr><w:tcW w:w=`"$($Widths[$columnIndex])`" w:type=`"dxa`"/>$shade<w:tcMar><w:top w:w=`"90`" w:type=`"dxa`"/><w:left w:w=`"100`" w:type=`"dxa`"/><w:bottom w:w=`"90`" w:type=`"dxa`"/><w:right w:w=`"100`" w:type=`"dxa`"/></w:tcMar></w:tcPr><w:p><w:r><w:rPr>$bold<w:sz w:val=`"18`"/></w:rPr><w:t xml:space=`"preserve`">$value</w:t></w:r></w:p></w:tc>"
    }
    $xml += "</w:tr>"
  }
  return "$xml</w:tbl><w:p/>"
}

function Get-StylesXml {
  return @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Aptos" w:hAnsi="Aptos"/><w:sz w:val="21"/><w:color w:val="26334D"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>
  <w:style w:type="paragraph" w:styleId="BodyText"><w:name w:val="Body Text"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="90" w:line="276" w:lineRule="auto"/></w:pPr></w:style>
  <w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="120" w:after="220"/><w:jc w:val="center"/></w:pPr><w:rPr><w:b/><w:color w:val="173B8F"/><w:sz w:val="38"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="180"/><w:jc w:val="center"/></w:pPr><w:rPr><w:color w:val="64748B"/><w:sz w:val="23"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="260" w:after="120"/></w:pPr><w:rPr><w:b/><w:color w:val="173B8F"/><w:sz w:val="29"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="200" w:after="90"/></w:pPr><w:rPr><w:b/><w:color w:val="334E8C"/><w:sz w:val="24"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Callout"><w:name w:val="Callout"/><w:basedOn w:val="Normal"/><w:pPr><w:shd w:val="clear" w:fill="EEF3FF"/><w:spacing w:before="100" w:after="160"/><w:ind w:left="180" w:right="180"/></w:pPr><w:rPr><w:b/><w:color w:val="173B8F"/></w:rPr></w:style>
</w:styles>
'@
}

function Add-Section([System.Collections.Generic.List[string]]$Body, [string]$Heading, [string[]]$Paragraphs) {
  $Body.Add((New-Paragraph $Heading "Heading1"))
  foreach ($paragraph in $Paragraphs) { $Body.Add((New-Paragraph $paragraph "BodyText")) }
}

function New-CommercialDocument([bool]$WithWhatsApp, [string]$OutputPath) {
  $body = New-Object 'System.Collections.Generic.List[string]'
  $variant = if ($WithWhatsApp) { "WITH WHATSAPP AUTOMATION" } else { "WITHOUT WHATSAPP AUTOMATION" }
  $subtitle = if ($WithWhatsApp) { "Scalability, commercialization, cost and break-even model for a metered messaging product" } else { "Scalability, commercialization, cost and break-even model for the core platform" }

  $body.Add((New-Paragraph "FLOCK COMMERCIAL VIABILITY ANALYSIS" "Title"))
  $body.Add((New-Paragraph $variant "Subtitle"))
  $body.Add((New-Paragraph $subtitle "Subtitle"))
  $body.Add((New-Paragraph "Prepared 22 July 2026 | Planning currency: Nigerian naira (₦) | Reference currency: US dollar (USD)" "BodyText" $false "center"))
  $body.Add((New-Paragraph "Decision document - figures are planning estimates, not supplier quotations or financial advice." "Callout"))

  $body.Add((New-Paragraph "Executive decision summary" "Heading1"))
  if ($WithWhatsApp) {
    $body.Add((New-Paragraph "Recommended commercial offer: ₦120,000 per church per month for the Standard plan, including 1,000 outbound WhatsApp messages, plus a ₦200,000 implementation fee. Charge ₦60 for every message above the allowance. At the planning assumptions in this document, the Standard plan contributes approximately ₦50,000 per church per month before fixed company overhead." "BodyText"))
    $body.Add((New-Paragraph "Estimated monthly operating break-even: about 16 Standard churches. A safer cash target is 20 paying churches, which provides approximately ₦200,000 monthly operating surplus before tax and recovery of commercialization investment." "Callout"))
    $body.Add((New-Bullet "Do not advertise unlimited WhatsApp. Twilio charges per message and passes through Meta template charges."))
    $body.Add((New-Bullet "Maintain explicit opt-in, opt-out, template approval, delivery monitoring, and a prepaid message reserve."))
    $body.Add((New-Bullet "WhatsApp increases customer value and revenue, but also adds variable-cost, compliance, delivery, and foreign-exchange risk."))
  } else {
    $body.Add((New-Paragraph "Recommended commercial offer: ₦60,000 per church per month for the Standard core platform, plus a ₦150,000 implementation fee. This includes attendance, First Timers, membership training, programmes and QR sharing, Action Centre, dashboards, reports, backups, and role-based access - but excludes automated WhatsApp delivery." "BodyText"))
    $body.Add((New-Paragraph "Estimated monthly operating break-even: about 22 Standard churches. A safer cash target is 25 paying churches, which provides approximately ₦112,500 monthly operating surplus before tax and recovery of commercialization investment." "Callout"))
    $body.Add((New-Bullet "This is the simpler launch model: fewer external dependencies, lower support risk, and more predictable cost."))
    $body.Add((New-Bullet "Care alerts and First Timers follow-ups remain fully usable; coordinators contact people manually and record outcomes in Flock."))
    $body.Add((New-Bullet "WhatsApp can later be sold as a separately metered add-on after the core workflow is proven."))
  }

  Add-Section $body "1. Scope and financial assumptions" @(
    "This model covers production infrastructure, commercialization hardening, customer onboarding, support, pricing, unit economics, and break-even. It does not assign a historical cost to the software already built. A replacement build of similar scope could be materially more expensive, but sunk development effort is not treated as new cash required.",
    "Planning exchange rate: ₦1,600 per USD. This is deliberately rounded and should be updated monthly using the Central Bank of Nigeria NFEM reference and the actual card settlement rate. A 10% foreign-exchange reserve is included in operating estimates where appropriate.",
    "Payment-processing allowance: 2.5% of subscription revenue. Taxes, withholding, VAT treatment, incorporation costs, and payroll obligations must be confirmed with a Nigerian accountant before launch.",
    "Commercial model: managed business-to-business subscription sold to one church or branch workspace. Prices are recommendations based on cost coverage and risk; customer interviews must still validate willingness to pay."
  )
  $body.Add((New-Table @(
    @("Assumption", "Planning value", "Why it matters"),
    @("USD/NGN", "₦1,600 = US$1", "Cloud and messaging invoices are USD-denominated"),
    @("Annual prepayment", "10 months for 12 months", "Improves cash flow while giving a 16.7% discount"),
    @("Payment fee", "2.5%", "Conservative blended allowance; replace with actual provider rate"),
    @("Commercialization horizon", "12 months", "Used for operating and payback scenarios"),
    @("Support level", "Business-hours managed support", "No 24/7 SLA is included in listed prices")
  ) @(1900, 2100, 5300)))

  Add-Section $body "2. Current architecture and safe scalability" @(
    "Flock is currently a single-church workspace. It does not yet have tenant identifiers and tenant-aware row-level security that would safely place unrelated churches in one shared database. The safe short-term commercial model is therefore a dedicated Supabase project and configured deployment per church, managed from a standard release process.",
    "Dedicated projects provide strong operational isolation, but provisioning, migration, backup verification, environment configuration, and incident response grow with every church. Automation is required before the portfolio becomes large.",
    "A multi-tenant redesign should not be rushed. It requires tenant IDs on every durable table, tenant-scoped authorization helpers and policies, tenant-aware storage and scheduled jobs, migration of existing data, cross-tenant security tests, billing boundaries, and tenant-specific settings."
  )
  $body.Add((New-Table @(
    @("Scale stage", "Recommended operating model", "Primary work required", "Commercial implication"),
    @("1-10 churches", "Dedicated pilot deployments", "Manual provisioning checklist, backups, UAT, support runbook", "Validate outcomes and willingness to pay"),
    @("11-30 churches", "Automated dedicated fleet", "Deployment templates, migration dashboard, health alerts, standard contracts", "Protect support margin and reduce setup time"),
    @("31-75 churches", "Decide on tenant platform", "Fund tenant isolation, billing, observability, security testing", "Unit infrastructure cost can fall after migration"),
    @("75+ churches", "Multi-tenant SaaS plus isolated enterprise option", "Regional reliability, support team, DR exercises, stronger governance", "Higher gross margin; enterprise premium for dedicated isolation")
  ) @(1300, 2300, 3200, 2500)))
  $body.Add((New-Paragraph "Important costing choice" "Heading2"))
  $body.Add((New-Paragraph "The unit-cost tables assume additional Supabase projects inside a centrally managed paid organization, using the published starting price of US$10 for an additional Micro project after the first included project. If each customer requires its own separately billed Supabase organization, budget US$25 instead; at this exchange rate that adds about ₦24,000 per church per month and should trigger a ₦30,000-₦40,000 dedicated-hosting surcharge." "BodyText"))

  $body.Add((New-Paragraph "3. One-time commercialization budget" "Heading1"))
  $capexRows = @(
    @("Workstream", "Budget", "Deliverable"),
    @("Security and privacy review", "₦750,000", "Threat review, RLS verification, privacy and retention controls"),
    @("Billing and customer onboarding", "₦600,000", "Contracts, invoicing workflow, provisioning and handover"),
    @("Production UAT and accessibility", "₦350,000", "Role-based test scripts, mobile testing, defect closure"),
    @("Monitoring, backup and recovery", "₦250,000", "Alerts, restore exercise, incident and release runbooks"),
    @("Legal, privacy and commercial documents", "₦400,000", "Terms, DPA/privacy review, service description"),
    @("Launch material and pilot acquisition", "₦250,000", "Demo, training material, pilot outreach"),
    @("20% contingency", "₦520,000", "Unknowns, supplier and FX movement")
  )
  if ($WithWhatsApp) {
    $capexRows += @(@("WhatsApp production readiness", "₦880,000", "Meta business setup, templates, consent audit, queue/load tests, delivery support"))
    $capexTotal = "₦4,000,000"
  } else {
    $capexTotal = "₦3,120,000"
  }
  $capexRows += @(@("Total planning budget", $capexTotal, "Release gate before broad commercialization"))
  $body.Add((New-Table $capexRows @(2800, 1700, 4800)))
  $body.Add((New-Paragraph "These are management budgets, not vendor quotes. Work already completed can reduce the actual cash requirement. Do not remove the security, legal, restore-testing, or contingency lines merely because the application builds successfully." "BodyText"))

  $body.Add((New-Paragraph "4. Monthly operating cost" "Heading1"))
  if ($WithWhatsApp) {
    $body.Add((New-Table @(
      @("Fixed monthly cost", "Planning amount", "Basis"),
      @("Vercel Pro and shared web usage", "₦40,000", "US$20 developer plan plus modest usage reserve"),
      @("Supabase Pro base organization", "₦40,000", "Published US$25 starting price"),
      @("Email, monitoring and domain allocation", "₦30,000", "Transactional email, uptime/error monitoring, DNS"),
      @("WhatsApp operations reserve", "₦30,000", "Template administration, delivery monitoring, sender support"),
      @("Product maintenance and customer support", "₦340,000", "Founder/contract engineering and customer success allowance"),
      @("Sales, administration and professional services", "₦220,000", "Sales activity, bookkeeping, legal/admin reserve"),
      @("Operating contingency", "₦100,000", "FX, taxes not modeled, usage surprises"),
      @("Total fixed monthly overhead", "₦800,000", "Break-even denominator")
    ) @(3400, 1900, 4000)))
    $body.Add((New-Paragraph "Message-cost reserve: ₦40 per outbound message. This is not presented as the Meta tariff. It is a planning allowance combining Twilio's published US$0.005 per-message fee, Meta's variable template fee, exchange rate, and a risk reserve. Reprice against the actual approved template category and invoice every month." "Callout"))
  } else {
    $body.Add((New-Table @(
      @("Fixed monthly cost", "Planning amount", "Basis"),
      @("Vercel Pro and shared web usage", "₦40,000", "US$20 developer plan plus modest usage reserve"),
      @("Supabase Pro base organization", "₦40,000", "Published US$25 starting price"),
      @("Email, monitoring and domain allocation", "₦29,000", "Transactional email, uptime/error monitoring, DNS"),
      @("Product maintenance and customer support", "₦300,000", "Founder/contract engineering and customer success allowance"),
      @("Sales, administration and professional services", "₦200,000", "Sales activity, bookkeeping, legal/admin reserve"),
      @("Operating contingency", "₦91,000", "FX, taxes not modeled, usage surprises"),
      @("Total fixed monthly overhead", "₦700,000", "Break-even denominator")
    ) @(3400, 1900, 4000)))
  }

  $body.Add((New-Paragraph "5. Recommended pricing" "Heading1"))
  if ($WithWhatsApp) {
    $body.Add((New-Table @(
      @("Plan", "Monthly price", "Implementation", "Included scope"),
      @("Starter", "₦65,000", "₦150,000", "Up to 100 workers, 5 accounts, 250 WhatsApp messages"),
      @("Standard - recommended", "₦120,000", "₦200,000", "Up to 300 workers, 15 accounts, 1,000 WhatsApp messages"),
      @("Network", "₦260,000", "₦350,000", "Up to 750 workers, 40 accounts, 3,000 WhatsApp messages"),
      @("Message overage", "₦60/message", "Not applicable", "Billed above the plan allowance; subject to repricing")
    ) @(1900, 1700, 1700, 4000)))
    $body.Add((New-Bullet "Annual Standard: ₦1,200,000 prepaid for 12 months (two months effectively free)."))
    $body.Add((New-Bullet "Never absorb messaging overages silently. Alert customers at 70%, 90%, and 100% of allowance."))
    $body.Add((New-Bullet "Require a signed WhatsApp consent and acceptable-use schedule before activation."))
  } else {
    $body.Add((New-Table @(
      @("Plan", "Monthly price", "Implementation", "Included scope"),
      @("Starter", "₦35,000", "₦100,000", "Up to 100 workers and 5 user accounts; intentionally thin margin"),
      @("Standard - recommended", "₦60,000", "₦150,000", "Up to 300 workers and 15 accounts; full core workflows"),
      @("Network", "₦120,000", "₦300,000", "Up to 750 workers and 40 accounts; priority onboarding"),
      @("Dedicated billing boundary", "+₦30,000-₦40,000", "As scoped", "When the customer requires a separate supplier organization")
    ) @(1900, 1700, 1700, 4000)))
    $body.Add((New-Bullet "Annual Standard: ₦600,000 prepaid for 12 months (two months effectively free)."))
    $body.Add((New-Bullet "Do not sell the Starter tier through high-touch sales; acquisition and support can erase its small contribution."))
    $body.Add((New-Bullet "Charge separately for data cleanup, custom reports, on-site training, integrations, and priority SLA."))
  }

  $body.Add((New-Paragraph "6. Unit economics and break-even" "Heading1"))
  if ($WithWhatsApp) {
    $body.Add((New-Table @(
      @("Standard plan unit economics", "Amount per month"),
      @("Subscription revenue", "₦120,000"),
      @("Dedicated project and web allocation", "₦23,200"),
      @("Monitoring/support provision", "₦4,800"),
      @("1,000-message reserve", "₦40,000"),
      @("Payment fee allowance (2.5%)", "₦3,000"),
      @("Total variable cost", "₦71,000"),
      @("Contribution per church", "₦49,000 (rounded to ₦50,000 for planning)"),
      @("Contribution margin", "Approximately 41%")
    ) @(4700, 4600)))
    $body.Add((New-Paragraph "Break-even formula: fixed monthly overhead ÷ contribution per church = ₦800,000 ÷ ₦50,000 = 16 Standard churches." "Callout"))
    $body.Add((New-Table @(
      @("Standard churches", "Monthly revenue", "Variable cost", "Fixed overhead", "Operating result"),
      @("10", "₦1,200,000", "₦700,000", "₦800,000", "(₦300,000) loss"),
      @("16", "₦1,920,000", "₦1,120,000", "₦800,000", "Approximately break-even"),
      @("20", "₦2,400,000", "₦1,400,000", "₦800,000", "₦200,000 profit"),
      @("30", "₦3,600,000", "₦2,100,000", "₦800,000", "₦700,000 profit"),
      @("50", "₦6,000,000", "₦3,500,000", "₦800,000", "₦1,700,000 profit")
    ) @(1500, 1900, 1900, 1900, 2100)))
    $body.Add((New-Paragraph "Commercialization payback: ignoring setup-fee contribution, ₦4,000,000 is recovered in about 5.7 months at 30 Standard churches (₦700,000 monthly surplus). Setup fees can shorten payback, but only the portion remaining after onboarding labour and acquisition cost should be counted." "BodyText"))
  } else {
    $body.Add((New-Table @(
      @("Standard plan unit economics", "Amount per month"),
      @("Subscription revenue", "₦60,000"),
      @("Dedicated Supabase project allocation", "₦16,000"),
      @("Web, backup, monitoring and support provision", "₦11,000"),
      @("Payment fee allowance (2.5%)", "₦1,500"),
      @("Total variable cost", "₦28,500 (use ₦27,500-₦30,000 planning range)"),
      @("Contribution per church", "₦31,500 (use ₦32,500 target after optimization)"),
      @("Contribution margin", "Approximately 52%-54%")
    ) @(4700, 4600)))
    $body.Add((New-Paragraph "Break-even formula: fixed monthly overhead ÷ target contribution per church = ₦700,000 ÷ ₦32,500 = 21.5, rounded up to 22 Standard churches." "Callout"))
    $body.Add((New-Table @(
      @("Standard churches", "Monthly revenue", "Variable cost", "Fixed overhead", "Operating result"),
      @("10", "₦600,000", "₦275,000", "₦700,000", "(₦375,000) loss"),
      @("22", "₦1,320,000", "₦605,000", "₦700,000", "₦15,000 profit / break-even range"),
      @("25", "₦1,500,000", "₦687,500", "₦700,000", "₦112,500 profit"),
      @("30", "₦1,800,000", "₦825,000", "₦700,000", "₦275,000 profit"),
      @("50", "₦3,000,000", "₦1,375,000", "₦700,000", "₦925,000 profit")
    ) @(1500, 1900, 1900, 1900, 2100)))
    $body.Add((New-Paragraph "Commercialization payback: ignoring setup-fee contribution, ₦3,120,000 is recovered in about 11.3 months at 30 Standard churches (₦275,000 monthly surplus). At 50 churches, payback falls to about 3.4 months. Setup fees can shorten payback after onboarding and acquisition costs are deducted." "BodyText"))
  }

  $body.Add((New-Paragraph "7. Commercialization plan" "Heading1"))
  $body.Add((New-Table @(
    @("Phase", "Customer target", "Offer", "Exit condition"),
    @("Paid design partners", "3-5 churches", "Discounted 90-day Standard plan with structured feedback", "Weekly workflow succeeds; measurable admin time saved"),
    @("Pilot commercialization", "10 churches", "Standard contracts, implementation fee, training, monthly review", "Retention, support load, backup and reporting proven"),
    @("Repeatable sales", "25 churches", "Referral and denominational branch partnerships", "Positive monthly contribution and documented onboarding"),
    @("Scale investment", "50+ churches", "Automated fleet or tenant platform", "Security review and unit-cost case approve the architecture")
  ) @(1900, 1800, 3000, 2600)))
  $body.Add((New-Bullet "Sell outcomes: faster attendance completion, fewer missed follow-ups, visible First Timers movement, safer records, and leadership-ready reports."))
  $body.Add((New-Bullet "Use a written implementation scope. Data cleanup, custom imports, new features, integrations, and on-site work are separate professional services."))
  $body.Add((New-Bullet "Collect implementation fees before provisioning and subscriptions before the service period. Prefer annual prepayment for early cash stability."))
  $body.Add((New-Bullet "Review churn, active users, support hours, database size, bandwidth, report generation, and onboarding time monthly."))

  $body.Add((New-Paragraph "8. Principal risks and controls" "Heading1"))
  $riskRows = @(
    @("Risk", "Commercial effect", "Control"),
    @("USD/NGN movement", "Cloud cost rises while naira price stays fixed", "Quarterly price review and 10% FX reserve"),
    @("Single-church architecture", "Provisioning and migration workload grows linearly", "Dedicated fleet automation before 10-15 churches"),
    @("Support-intensive customers", "Gross margin disappears", "Support scope, training, knowledge base, paid priority SLA"),
    @("Privacy/security incident", "Trust, legal and reputational damage", "RLS review, least privilege, backups, logs, incident plan"),
    @("Free-tier dependency", "Unexpected pause, rate limit, or poor reliability", "Use production paid plans and spend alerts"),
    @("Scope creep", "Custom work consumes subscription margin", "Change requests and professional-services pricing")
  )
  if ($WithWhatsApp) {
    $riskRows += @(
      @("Meta template reclassification", "Message cost or deliverability changes", "Monthly invoice reconciliation and repricing clause"),
      @("Missing consent or opt-out failure", "Compliance and reputation risk", "Auditable opt-in, immediate opt-out cancellation, access control"),
      @("Message spike", "Large unbilled supplier charge", "Allowances, hard alerts, wallet/overage billing, Twilio spend controls")
    )
  }
  $body.Add((New-Table $riskRows @(2100, 3000, 4200)))

  $body.Add((New-Paragraph "9. Recommended decision" "Heading1"))
  if ($WithWhatsApp) {
    $body.Add((New-Paragraph "Offer WhatsApp only as a clearly metered premium plan or add-on. Launch it after the core workflow is stable, templates are approved, consent records are auditable, and customer billing can reconcile actual message usage. The Standard price should not fall below approximately ₦110,000 at the stated allowance without reducing message volume or support." "BodyText"))
    $body.Add((New-Paragraph "Commercial go/no-go: proceed when at least five churches sign a paid pilot or letter of intent, supplier accounts are production-ready, message-cost alerts are tested, and at least six months of fixed overhead plus supplier deposits are available." "Callout"))
  } else {
    $body.Add((New-Paragraph "Commercialize the core platform first. It already provides meaningful value without automated messaging because Action Centre and First Timers coordinators can manage care manually. This model has fewer pricing surprises and is the best route for validating retention, onboarding effort, and support demand." "BodyText"))
    $body.Add((New-Paragraph "Commercial go/no-go: proceed when at least five churches sign a paid pilot or letter of intent, the production checklist and restore test pass, standard terms are reviewed, and at least six months of fixed overhead is available." "Callout"))
  }

  $body.Add((New-PageBreak))
  $body.Add((New-Paragraph "Appendix A - formulas to update" "Heading1"))
  $body.Add((New-Bullet "Monthly contribution per church = subscription price − dedicated infrastructure − metered usage − payment fee − customer-specific support provision."))
  $body.Add((New-Bullet "Break-even church count = round up(fixed monthly overhead ÷ contribution per church)."))
  $body.Add((New-Bullet "Operating profit = (paying churches × contribution per church) − fixed monthly overhead."))
  $body.Add((New-Bullet "Commercialization payback months = remaining one-time investment ÷ monthly operating profit."))
  $body.Add((New-Bullet "Annual recurring revenue = monthly subscription × 12 × paying churches, before discounts and churn."))
  if ($WithWhatsApp) {
    $body.Add((New-Bullet "Message reserve per church = included delivered messages × current all-in planning cost per message."))
  }

  $body.Add((New-Paragraph "Appendix B - official pricing references" "Heading1"))
  $body.Add((New-Paragraph "Pricing was reviewed on 22 July 2026. Suppliers may change prices, quotas, taxes, and terms. Revalidate before signing customers." "BodyText"))
  $sources = @(
    "Supabase pricing - Pro from US$25/month; first project included; additional projects from US$10/month: https://supabase.com/pricing",
    "Supabase billing FAQ and compute/project billing: https://supabase.com/docs/guides/platform/billing-faq",
    "Vercel plan and pricing documentation - Pro developer seats and metered resources: https://vercel.com/docs/pricing",
    "Vercel Pro billing: https://vercel.com/docs/plans/pro-plan/billing",
    "Resend transactional email pricing - free 3,000 emails/month; Pro US$20 for 50,000: https://resend.com/docs/knowledge-base/what-is-resend-pricing",
    "Central Bank of Nigeria NFEM reference rates: https://www.cbn.gov.ng/rates/ExchRateByCurrency.html"
  )
  if ($WithWhatsApp) {
    $sources += @(
      "Twilio WhatsApp pricing - US$0.005 per inbound/outbound message plus Meta template fees: https://www.twilio.com/en-us/whatsapp/pricing",
      "Twilio notice on Meta's per-template pricing model effective July 2025: https://www.twilio.com/en-us/changelog/meta-is-updating-whatsapp-pricing-on-july-1--2025"
    )
  }
  foreach ($source in $sources) { $body.Add((New-Bullet $source)) }

  $documentXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    $($body -join "`n")
    <w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="600" w:footer="600"/><w:cols w:space="708"/><w:docGrid w:linePitch="360"/></w:sectPr>
  </w:body>
</w:document>
"@

  $contentTypes = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>
'@
  $rootRels = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>
'@
  $documentRels = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>
'@
  $coreXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>Flock Commercial Viability Analysis - $variant</dc:title><dc:creator>Flock</dc:creator><dc:subject>Scalability, commercialization and break-even analysis</dc:subject><dcterms:created xsi:type="dcterms:W3CDTF">2026-07-22T00:00:00Z</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">2026-07-22T00:00:00Z</dcterms:modified>
</cp:coreProperties>
"@
  $appXml = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>Microsoft Office Word</Application><AppVersion>16.0000</AppVersion></Properties>
'@

  $tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("flock-docx-" + [guid]::NewGuid().ToString("N"))
  New-Item -ItemType Directory -Path (Join-Path $tempRoot "_rels"), (Join-Path $tempRoot "word\_rels"), (Join-Path $tempRoot "docProps") -Force | Out-Null
  [System.IO.File]::WriteAllText((Join-Path $tempRoot "[Content_Types].xml"), $contentTypes, $utf8NoBom)
  [System.IO.File]::WriteAllText((Join-Path $tempRoot "_rels\.rels"), $rootRels, $utf8NoBom)
  [System.IO.File]::WriteAllText((Join-Path $tempRoot "word\document.xml"), $documentXml, $utf8NoBom)
  [System.IO.File]::WriteAllText((Join-Path $tempRoot "word\styles.xml"), (Get-StylesXml), $utf8NoBom)
  [System.IO.File]::WriteAllText((Join-Path $tempRoot "word\_rels\document.xml.rels"), $documentRels, $utf8NoBom)
  [System.IO.File]::WriteAllText((Join-Path $tempRoot "docProps\core.xml"), $coreXml, $utf8NoBom)
  [System.IO.File]::WriteAllText((Join-Path $tempRoot "docProps\app.xml"), $appXml, $utf8NoBom)

  Add-Type -AssemblyName System.IO.Compression
  Add-Type -AssemblyName System.IO.Compression.FileSystem
  if (Test-Path $OutputPath) { Remove-Item -LiteralPath $OutputPath -Force }
  $archive = [System.IO.Compression.ZipFile]::Open($OutputPath, [System.IO.Compression.ZipArchiveMode]::Create)
  try {
    foreach ($file in Get-ChildItem -LiteralPath $tempRoot -File -Recurse) {
      $relativePath = $file.FullName.Substring($tempRoot.Length + 1).Replace("\", "/")
      $entry = $archive.CreateEntry($relativePath, [System.IO.Compression.CompressionLevel]::Optimal)
      $inputStream = $file.OpenRead()
      $outputStream = $entry.Open()
      try { $inputStream.CopyTo($outputStream) } finally { $outputStream.Dispose(); $inputStream.Dispose() }
    }
  } finally {
    $archive.Dispose()
  }
  Remove-Item -LiteralPath $tempRoot -Recurse -Force
}

New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
New-CommercialDocument $false (Join-Path $OutputDirectory "Flock_Commercial_Analysis_Without_WhatsApp.docx")
New-CommercialDocument $true (Join-Path $OutputDirectory "Flock_Commercial_Analysis_With_WhatsApp.docx")
Write-Output "Created two Flock commercial analysis Word documents in $OutputDirectory"

