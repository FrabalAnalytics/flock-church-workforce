param(
  [string]$OutputPath = (Join-Path $PSScriptRoot "..\docs\presentations\Flock_Local_Church_Introduction_and_Pilot_Pitch.docx")
)

$ErrorActionPreference = "Stop"
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Escape-Xml([string]$Value) {
  if ($null -eq $Value) { return "" }
  return [System.Security.SecurityElement]::Escape($Value)
}

function New-Paragraph(
  [string]$Text,
  [string]$Style = "Normal",
  [bool]$Bold = $false,
  [string]$Align = "left"
) {
  $escaped = Escape-Xml $Text
  $boldXml = if ($Bold) { "<w:b/>" } else { "" }
  return "<w:p><w:pPr><w:pStyle w:val=`"$Style`"/><w:jc w:val=`"$Align`"/></w:pPr><w:r><w:rPr>$boldXml</w:rPr><w:t xml:space=`"preserve`">$escaped</w:t></w:r></w:p>"
}

function New-Bullet([string]$Text) {
  return New-Paragraph "- $Text" "BodyText"
}

function New-PageBreak {
  return "<w:p><w:r><w:br w:type=`"page`"/></w:r></w:p>"
}

function New-Table([object[]]$Rows, [int[]]$Widths) {
  $xml = "<w:tbl><w:tblPr><w:tblW w:w=`"9300`" w:type=`"dxa`"/><w:tblLayout w:type=`"fixed`"/><w:tblBorders><w:top w:val=`"single`" w:sz=`"4`" w:color=`"CBD5E1`"/><w:left w:val=`"single`" w:sz=`"4`" w:color=`"CBD5E1`"/><w:bottom w:val=`"single`" w:sz=`"4`" w:color=`"CBD5E1`"/><w:right w:val=`"single`" w:sz=`"4`" w:color=`"CBD5E1`"/><w:insideH w:val=`"single`" w:sz=`"4`" w:color=`"E2E8F0`"/><w:insideV w:val=`"single`" w:sz=`"4`" w:color=`"E2E8F0`"/></w:tblBorders></w:tblPr><w:tblGrid>"
  foreach ($width in $Widths) { $xml += "<w:gridCol w:w=`"$width`"/>" }
  $xml += "</w:tblGrid>"

  for ($rowIndex = 0; $rowIndex -lt $Rows.Count; $rowIndex++) {
    $xml += "<w:tr>"
    for ($columnIndex = 0; $columnIndex -lt $Rows[$rowIndex].Count; $columnIndex++) {
      $value = Escape-Xml ([string]$Rows[$rowIndex][$columnIndex])
      $shade = if ($rowIndex -eq 0) { "<w:shd w:val=`"clear`" w:fill=`"EAF0FF`"/>" } else { "" }
      $bold = if ($rowIndex -eq 0) { "<w:b/>" } else { "" }
      $xml += "<w:tc><w:tcPr><w:tcW w:w=`"$($Widths[$columnIndex])`" w:type=`"dxa`"/>$shade<w:tcMar><w:top w:w=`"90`" w:type=`"dxa`"/><w:left w:w=`"100`" w:type=`"dxa`"/><w:bottom w:w=`"90`" w:type=`"dxa`"/><w:right w:w=`"100`" w:type=`"dxa`"/></w:tcMar></w:tcPr><w:p><w:r><w:rPr>$bold<w:sz w:val=`"19`"/></w:rPr><w:t xml:space=`"preserve`">$value</w:t></w:r></w:p></w:tc>"
    }
    $xml += "</w:tr>"
  }
  return "$xml</w:tbl><w:p/>"
}

function Get-StylesXml {
  return @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Aptos" w:hAnsi="Aptos"/><w:sz w:val="22"/><w:color w:val="26334D"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="286" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>
  <w:style w:type="paragraph" w:styleId="BodyText"><w:name w:val="Body Text"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="100" w:line="286" w:lineRule="auto"/></w:pPr></w:style>
  <w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="300" w:after="220"/><w:jc w:val="center"/></w:pPr><w:rPr><w:b/><w:color w:val="173B8F"/><w:sz w:val="40"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="180"/><w:jc w:val="center"/></w:pPr><w:rPr><w:color w:val="64748B"/><w:sz w:val="24"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="260" w:after="120"/></w:pPr><w:rPr><w:b/><w:color w:val="173B8F"/><w:sz w:val="29"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="200" w:after="90"/></w:pPr><w:rPr><w:b/><w:color w:val="334E8C"/><w:sz w:val="24"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Callout"><w:name w:val="Callout"/><w:basedOn w:val="Normal"/><w:pPr><w:shd w:val="clear" w:fill="EEF3FF"/><w:spacing w:before="100" w:after="160"/><w:ind w:left="180" w:right="180"/></w:pPr><w:rPr><w:b/><w:color w:val="173B8F"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Script"><w:name w:val="Script"/><w:basedOn w:val="Normal"/><w:pPr><w:shd w:val="clear" w:fill="F8FAFC"/><w:spacing w:before="80" w:after="100"/><w:ind w:left="280" w:right="280"/></w:pPr><w:rPr><w:i/><w:color w:val="334155"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Note"><w:name w:val="Speaker Note"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="60" w:after="120"/></w:pPr><w:rPr><w:b/><w:color w:val="8A5A16"/><w:sz w:val="19"/></w:rPr></w:style>
</w:styles>
'@
}

$body = New-Object 'System.Collections.Generic.List[string]'

$body.Add((New-Paragraph "FLOCK" "Title"))
$body.Add((New-Paragraph "Helping Our Church See Clearly, Follow Up Consistently and Care Better" "Subtitle"))
$body.Add((New-Paragraph "Leadership introduction, demonstration and controlled-pilot proposal" "Subtitle"))
$body.Add((New-Paragraph "Prepared for a local church leadership presentation" "BodyText" $false "center"))
$body.Add((New-Paragraph "Purpose: secure leadership approval for a limited, measurable internal pilot - not immediate church-wide replacement." "Callout"))

$body.Add((New-Paragraph "How to use this document" "Heading1"))
$body.Add((New-Bullet "Request a focused 20-30 minute meeting."))
$body.Add((New-Bullet "Use the prepared script as a guide rather than reading every sentence mechanically."))
$body.Add((New-Bullet "Keep the live demonstration to approximately 10 minutes."))
$body.Add((New-Bullet "Present Flock as a ministry-care and decision-support tool, not a worker-surveillance system."))
$body.Add((New-Bullet "End with one clear request: approval for an eight-week controlled pilot."))
$body.Add((New-Paragraph "Primary message" "Heading2"))
$body.Add((New-Paragraph "Flock helps leadership know who served, who is missing, who needs care, and whether first-timers are becoming connected members." "Callout"))

$body.Add((New-Paragraph "1. Recommended meeting participants" "Heading1"))
$body.Add((New-Bullet "Resident pastor, senior pastor or designated church leader"))
$body.Add((New-Bullet "Church administrator"))
$body.Add((New-Bullet "Departmental leadership representative"))
$body.Add((New-Bullet "First Timers or follow-up team leader"))
$body.Add((New-Bullet "You, as the product owner and pilot facilitator"))

$body.Add((New-Paragraph "2. Meeting structure" "Heading1"))
$body.Add((New-Table @(
  @("Section", "Time", "Purpose"),
  @("Introduction and ministry problem", "4 minutes", "Explain why the current challenge deserves attention"),
  @("What has been tested", "2 minutes", "Establish credibility without overstating readiness"),
  @("Live demonstration", "10 minutes", "Show the most valuable workflows"),
  @("Security and role controls", "3 minutes", "Address trust and privacy concerns"),
  @("Pilot proposal", "5 minutes", "Present scope, success measures and safeguards"),
  @("Questions and approval request", "5 minutes", "Resolve concerns and request a decision")
) @(3000, 1500, 4800)))

$body.Add((New-PageBreak))
$body.Add((New-Paragraph "3. Prepared opening script" "Heading1"))
$body.Add((New-Paragraph "Good morning, and thank you for giving me this opportunity." "Script"))
$body.Add((New-Paragraph "Over the past few weeks, I have been testing a church-management system called Flock within my department. I began working on it because I noticed that important information - such as worker attendance, repeated absences, first-timer follow-ups and service reports - is often spread across paper registers, spreadsheets and WhatsApp conversations." "Script"))
$body.Add((New-Paragraph "This makes it difficult for leaders to get a clear picture quickly. It can also mean that someone stops attending, or a first-timer is not followed up, before the right leader becomes aware." "Script"))
$body.Add((New-Paragraph "Flock is designed to bring these activities into one secure workspace. Its purpose is not to police people. Its purpose is to help leaders notice sooner, follow up more consistently and make decisions using reliable information." "Script"))
$body.Add((New-Paragraph "I have tested the basic workflow with my department, and I would like to demonstrate what it can do and request permission to run a controlled pilot with a few selected ministry teams." "Script"))
$body.Add((New-Paragraph "Speaker note: Speak calmly and avoid describing Flock as a finished church-wide replacement. The goal is permission to validate it responsibly." "Note"))

$body.Add((New-Paragraph "4. The ministry problems to explain" "Heading1"))
$body.Add((New-Bullet "Attendance records may be spread across paper, spreadsheets and messages."))
$body.Add((New-Bullet "Leadership reports can take significant time to compile."))
$body.Add((New-Bullet "Department submissions may be incomplete or late without clear visibility."))
$body.Add((New-Bullet "Repeated absences may not be noticed quickly enough for timely care."))
$body.Add((New-Bullet "First-timer contact and follow-up history may depend on individual memory."))
$body.Add((New-Bullet "It can be difficult to measure return visits, membership training and eventual membership."))
$body.Add((New-Bullet "Service programmes may be shared through uncontrolled documents or message threads."))
$body.Add((New-Bullet "Important operational actions may not have one visible owner or deadline."))
$body.Add((New-Paragraph "Recommended wording" "Heading2"))
$body.Add((New-Paragraph "The existing process has served the church, but growth makes it increasingly difficult to manage manually. Flock is intended to strengthen the people and processes already serving the church." "Script"))
$body.Add((New-Paragraph "Speaker note: Never criticise existing leaders, registers or follow-up teams. Present Flock as support for their work." "Note"))

$body.Add((New-Paragraph "5. Ten-minute demonstration sequence" "Heading1"))
$body.Add((New-Paragraph "A. Department attendance" "Heading2"))
$body.Add((New-Bullet "Sign in from a phone as a Department Head."))
$body.Add((New-Bullet "Show that the user sees only the assigned department."))
$body.Add((New-Bullet "Mark workers present or absent and submit attendance."))
$body.Add((New-Bullet "Explain recoverable drafts when connectivity drops."))

$body.Add((New-Paragraph "B. Leadership dashboard and reports" "Heading2"))
$body.Add((New-Bullet "Show attendance trends and department submission status."))
$body.Add((New-Bullet "Show congregation figures and items requiring attention."))
$body.Add((New-Bullet "Open a church-branded report with charts."))
$body.Add((New-Bullet "Demonstrate PDF or CSV download using active filters."))

$body.Add((New-Paragraph "C. Worker care" "Heading2"))
$body.Add((New-Bullet "Show how repeated absence creates a care alert."))
$body.Add((New-Bullet "Show how a leader records a follow-up and its outcome."))
$body.Add((New-Paragraph "Attendance is used to identify care needs and participation patterns. Follow-up remains a human pastoral decision." "Callout"))

$body.Add((New-Paragraph "D. First Timers" "Heading2"))
$body.Add((New-Bullet "Register a first-timer manually."))
$body.Add((New-Bullet "Assign the person to a First Timers Coordinator."))
$body.Add((New-Bullet "Record contact outcomes and return visits."))
$body.Add((New-Bullet "Show membership-training progress."))
$body.Add((New-Bullet "Explain that Member status is unavailable until training is completed."))
$body.Add((New-Bullet "Show leadership movement analysis from first visit to membership."))

$body.Add((New-Paragraph "E. Service programme and QR" "Heading2"))
$body.Add((New-Bullet "Open a published service programme."))
$body.Add((New-Bullet "Show the controlled public link or downloadable QR code."))
$body.Add((New-Bullet "Explain that authorised administrators can disable or replace a shared link."))

$body.Add((New-PageBreak))
$body.Add((New-Paragraph "6. Explain role separation" "Heading1"))
$body.Add((New-Table @(
  @("Role", "What the role does", "Important restriction"),
  @("Super Admin", "Manages the church workspace, users and system configuration", "Reserved for trusted administrators"),
  @("Church Leader", "Views church-wide dashboards, reports and first-timer analysis", "Does not perform unrestricted administration"),
  @("Department Head", "Records and reviews attendance for an assigned department", "Cannot access another department's private workflow"),
  @("First Timers Coordinator", "Registers newcomers and manages follow-ups, visits and training progress", "Cannot access unrelated administration"),
  @("Workers and first-timers", "Exist in authorised ministry records", "Do not require Flock accounts")
) @(2100, 4400, 2800)))
$body.Add((New-Bullet "Sensitive settings and user administration remain restricted."))
$body.Add((New-Bullet "WhatsApp automation is currently disabled."))
$body.Add((New-Bullet "The pilot will use only the information required for the approved workflows."))

$body.Add((New-Paragraph "7. Eight-week controlled-pilot proposal" "Heading1"))
$body.Add((New-Paragraph "I am requesting approval to run Flock as an eight-week internal pilot. I suggest starting with three departments, the First Timers team and two designated church leaders." "Script"))
$body.Add((New-Paragraph "The current paper or approved process can remain available during the pilot. At the end, we will review the results and decide whether Flock should be expanded, adjusted or discontinued." "Script"))
$body.Add((New-Paragraph "Suggested participants" "Heading2"))
$body.Add((New-Bullet "Your own department"))
$body.Add((New-Bullet "Two additional willing departments"))
$body.Add((New-Bullet "The First Timers team"))
$body.Add((New-Bullet "The church administrator"))
$body.Add((New-Bullet "One or two Church Leaders"))

$body.Add((New-Paragraph "Suggested pilot schedule" "Heading2"))
$body.Add((New-Table @(
  @("Period", "Activity"),
  @("Week 1", "Configuration, user access, training and baseline records"),
  @("Weeks 2-3", "Department attendance and report validation"),
  @("Weeks 4-5", "First Timers workflow and Action Centre validation"),
  @("Weeks 6-7", "Leadership reporting, programme QR and correction workflows"),
  @("Week 8", "Final review, user feedback and leadership decision")
) @(2200, 7100)))

$body.Add((New-Paragraph "8. Pilot success measures" "Heading1"))
$body.Add((New-Table @(
  @("Measure", "Proposed success indicator"),
  @("Attendance completion", "Selected departments submit consistently and leadership can see missing submissions"),
  @("Reporting", "Leadership produces required reports without manually combining spreadsheets"),
  @("First Timers ownership", "Newcomers are assigned promptly and follow-up outcomes are recorded"),
  @("Membership journey", "Return visits and training progress are visible"),
  @("Security", "No unauthorised role accesses another role's restricted information"),
  @("Mobile usability", "Participants complete their tasks comfortably on a phone"),
  @("Data integrity", "No approved existing record is lost or altered incorrectly"),
  @("Leadership usefulness", "Designated leaders confirm that the dashboard supports decisions")
) @(3000, 6300)))

$body.Add((New-Paragraph "9. The specific approval request" "Heading1"))
$body.Add((New-Paragraph "I am requesting leadership approval for an eight-week controlled pilot, permission to work with the selected departments and First Timers team, and the appointment of one church leader as the pilot sponsor." "Script"))
$body.Add((New-Paragraph "I will handle setup, training, support and maintenance during the pilot. I will also provide a short progress report before we recommend any wider rollout." "Script"))
$body.Add((New-Paragraph "Decision requested" "Heading2"))
$body.Add((New-Bullet "Approval or decline of the controlled pilot"))
$body.Add((New-Bullet "Appointment of a leadership sponsor"))
$body.Add((New-Bullet "Selection of two additional departments"))
$body.Add((New-Bullet "Nomination of the participating First Timers leader"))
$body.Add((New-Bullet "Approval of the pilot start date"))

$body.Add((New-PageBreak))
$body.Add((New-Paragraph "10. How to discuss cost" "Heading1"))
$body.Add((New-Paragraph "There is no charge for the controlled pilot. My immediate objective is to validate the system properly with leadership and ministry teams. If the church later decides to adopt it permanently, I will present a transparent operating and support proposal before any financial commitment." "Script"))
$body.Add((New-Bullet "Do not make pricing the centre of the first presentation."))
$body.Add((New-Bullet "Do not promise permanent free use during the presentation."))
$body.Add((New-Bullet "Separate pilot approval from any future commercial agreement."))
$body.Add((New-Bullet "Document any future subscription, support and data arrangements before permanent adoption."))

$body.Add((New-Paragraph "11. Likely questions and suggested responses" "Heading1"))
$body.Add((New-Table @(
  @("Question or concern", "Suggested response"),
  @("Is this monitoring or policing workers?", "No. Attendance helps leaders identify care needs, participation patterns and incomplete records. Follow-up remains a human pastoral decision."),
  @("Will every worker need an account?", "No. Only authorised leaders, administrators and coordinators require accounts."),
  @("What about people who are not technically inclined?", "First-timers and workers do not operate the system. An authorised coordinator or leader records the information."),
  @("Is our data safe?", "Access is role-based, administrative functions are restricted, and the pilot includes permission testing and backups."),
  @("Will this replace existing processes immediately?", "No. The approved process can remain available during the controlled pilot while leadership evaluates Flock."),
  @("Is the system completely finished?", "The core workflows are operational and have been tested in one department. The purpose of the pilot is to validate them with more authorised users before wider adoption."),
  @("Why not continue using spreadsheets?", "Spreadsheets record information, but Flock connects attendance, missing submissions, care actions, first-timer progress and leadership reporting in one controlled workflow."),
  @("What happens after the pilot?", "Leadership reviews the evidence and decides whether to stop, extend, adjust or adopt the system.")
) @(3200, 6100)))

$body.Add((New-Paragraph "12. Presentation cautions" "Heading1"))
$body.Add((New-Bullet "Do not claim that Flock will solve every church-management problem."))
$body.Add((New-Bullet "Do not promise functionality that has not been implemented."))
$body.Add((New-Bullet "Do not demonstrate live personal information without permission; use safe sample records where possible."))
$body.Add((New-Bullet "Do not describe absence alerts as disciplinary tools."))
$body.Add((New-Bullet "Do not make the meeting too technical unless leadership asks technical questions."))
$body.Add((New-Bullet "Do not request immediate church-wide rollout."))
$body.Add((New-Bullet "Do not onboard external churches before multi-tenant isolation is complete."))

$body.Add((New-Paragraph "13. One-minute closing statement" "Heading1"))
$body.Add((New-Paragraph "Flock is not intended to replace pastoral relationships. It is intended to give our leaders a clearer and more timely picture so those relationships can be strengthened." "Script"))
$body.Add((New-Paragraph "I am asking for the opportunity to prove its value carefully through a limited eight-week pilot. We will keep the scope controlled, measure the results, protect access to information and return to leadership with evidence before recommending anything further." "Script"))

$body.Add((New-Paragraph "Final presentation title" "Heading1"))
$body.Add((New-Paragraph "Flock: Helping Our Church See Clearly, Follow Up Consistently and Care Better" "Callout"))

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

$coreXml = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>Flock Local Church Introduction and Pilot Pitch</dc:title>
  <dc:creator>Flock</dc:creator>
  <dc:subject>Leadership presentation and controlled pilot proposal</dc:subject>
  <dcterms:created xsi:type="dcterms:W3CDTF">2026-07-23T00:00:00Z</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">2026-07-23T00:00:00Z</dcterms:modified>
</cp:coreProperties>
'@

$appXml = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>Microsoft Office Word</Application><AppVersion>16.0000</AppVersion></Properties>
'@

$outputDirectory = Split-Path -Parent $OutputPath
New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
$tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("flock-pitch-docx-" + [guid]::NewGuid().ToString("N"))
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
Write-Output "Created $OutputPath"
