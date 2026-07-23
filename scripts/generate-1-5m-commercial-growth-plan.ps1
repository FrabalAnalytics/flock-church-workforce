param(
  [string]$OutputPath = (Join-Path $PSScriptRoot "..\docs\commercial\Flock_1_5M_Monthly_Profit_Growth_Plan.docx")
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
      $shade = if ($rowIndex -eq 0) { "<w:shd w:val=`"clear`" w:fill=`"EAF0FF`"/>" } elseif ($rowIndex % 2 -eq 0) { "<w:shd w:val=`"clear`" w:fill=`"F8FAFC`"/>" } else { "" }
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
  <w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Aptos" w:hAnsi="Aptos"/><w:sz w:val="21"/><w:color w:val="26334D"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="110" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>
  <w:style w:type="paragraph" w:styleId="BodyText"><w:name w:val="Body Text"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="90" w:line="276" w:lineRule="auto"/></w:pPr></w:style>
  <w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="300" w:after="220"/><w:jc w:val="center"/></w:pPr><w:rPr><w:b/><w:color w:val="173B8F"/><w:sz w:val="40"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="180"/><w:jc w:val="center"/></w:pPr><w:rPr><w:color w:val="64748B"/><w:sz w:val="24"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="250" w:after="115"/></w:pPr><w:rPr><w:b/><w:color w:val="173B8F"/><w:sz w:val="29"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="190" w:after="85"/></w:pPr><w:rPr><w:b/><w:color w:val="334E8C"/><w:sz w:val="24"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Callout"><w:name w:val="Callout"/><w:basedOn w:val="Normal"/><w:pPr><w:shd w:val="clear" w:fill="EEF3FF"/><w:spacing w:before="100" w:after="160"/><w:ind w:left="180" w:right="180"/></w:pPr><w:rPr><w:b/><w:color w:val="173B8F"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Warning"><w:name w:val="Warning"/><w:basedOn w:val="Normal"/><w:pPr><w:shd w:val="clear" w:fill="FFF7E8"/><w:spacing w:before="90" w:after="140"/><w:ind w:left="180" w:right="180"/></w:pPr><w:rPr><w:color w:val="7C4A03"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Small"><w:name w:val="Small"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="70"/></w:pPr><w:rPr><w:color w:val="64748B"/><w:sz w:val="18"/></w:rPr></w:style>
</w:styles>
'@
}

$body = New-Object 'System.Collections.Generic.List[string]'

$body.Add((New-Paragraph "FLOCK" "Title"))
$body.Add((New-Paragraph "Commercial Growth Plan to ₦1.5 Million Monthly Profit" "Subtitle"))
$body.Add((New-Paragraph "Multi-tenant model | WhatsApp automation disabled | Nigeria planning case" "Subtitle"))
$body.Add((New-Paragraph "Prepared 23 July 2026" "BodyText" $false "center"))
$body.Add((New-Paragraph "Recommended destination: 30 paying churches producing ₦2.725 million monthly recurring revenue and approximately ₦1.512 million monthly operating profit before tax." "Callout"))

$body.Add((New-Paragraph "Executive decision summary" "Heading1"))
$body.Add((New-Paragraph "A naira amount is profit, not margin. Margin is the percentage of revenue retained. This plan therefore separates three targets that should not be treated as the same target." "BodyText"))
$body.Add((New-Table @(
  @("Target", "Recommended portfolio", "MRR", "Result", "Margin"),
  @("₦1.5m gross profit", "20 churches", "₦1,755,000", "₦1,500,125 gross profit", "85.5%"),
  @("₦1.5m operating profit before tax", "30 churches", "₦2,725,000", "₦1,511,875 operating profit", "55.5%"),
  @("₦1.5m after planning tax reserve", "32 churches", "₦3,095,000", "₦1,579,831 after reserve", "51.0%")
) @(2200, 1900, 1700, 2300, 1200)))
$body.Add((New-Bullet "Use the 20-church case as the first commercial milestone."))
$body.Add((New-Bullet "Use the 30-church case as the sustainable founder-operated business target."))
$body.Add((New-Bullet "Use the 32-church case as the safer cash target after applying a 15% management reserve to pre-tax profit."))
$body.Add((New-Bullet "Do not include setup fees in monthly recurring revenue or recurring-profit claims."))
$body.Add((New-Paragraph "The 15% reserve is a management assumption, not a Nigerian tax rate or tax opinion. Confirm the current legal treatment, company classification and allowable expenses with a qualified accountant." "Warning"))

$body.Add((New-Paragraph "1. Commercial model and planning assumptions" "Heading1"))
$body.Add((New-Table @(
  @("Assumption", "Planning value", "Why it is used"),
  @("Architecture", "Shared multi-tenant application", "One controlled platform serving isolated church tenants"),
  @("Messaging", "WhatsApp automation disabled", "Manual follow-up avoids messaging-provider cost and consent complexity"),
  @("Hosting baseline", "Vercel Pro + Supabase Pro", "Paid production baseline with included usage allowances"),
  @("Exchange-rate assumption", "₦1,600 per US dollar", "Internal budgeting value; review monthly"),
  @("Payment collection cost", "2.5% of subscription revenue", "Conservative processing and collection provision"),
  @("Fixed platform reserve", "₦150,000 per month", "Hosting, domains, monitoring, backups and usage headroom"),
  @("Operating expenses", "₦900,000 per month at scale", "Values founder labour and provides a real operating budget"),
  @("Annual billing incentive", "Pay for 10 months, receive 12", "Improves cash flow while limiting discount to 16.7%")
) @(2500, 2350, 4450)))
$body.Add((New-Paragraph "Supplier pricing is denominated in US dollars and can change. The ₦150,000 platform reserve is deliberately larger than the current base-plan conversion so early usage growth, exchange-rate movement and support tooling do not immediately destroy the model." "Small"))

$body.Add((New-PageBreak))
$body.Add((New-Paragraph "2. Recommended church tier model" "Heading1"))
$body.Add((New-Table @(
  @("Tier", "Monthly", "Setup", "Recommended scope", "Primary buyer"),
  @("Founding Pilot", "₦30,000", "₦50k-₦75k", "First five churches; 6-12 month fixed pilot term", "Early validation partners"),
  @("Starter", "₦35,000", "₦100,000", "1 branch; up to 100 workers; 5 users", "Small local church"),
  @("Growth", "₦60,000", "₦150,000", "1 branch; up to 300 workers; 15 users", "Growing church"),
  @("Large", "₦120,000", "₦300,000", "Up to 750 workers; 30 users; enhanced onboarding", "Large local church"),
  @("Mega / Multisite", "From ₦250,000", "From ₦750,000", "Multiple branches; priority support; custom limits", "Mega church or ministry network")
) @(1500, 1350, 1550, 3350, 1550)))

$body.Add((New-Paragraph "Tier design rules" "Heading2"))
$body.Add((New-Bullet "Price by operational complexity, worker population, authorised users, branch count, reporting scope and support level - not by attendance alone."))
$body.Add((New-Bullet "Keep the Founding Pilot plan limited to the first five churches and place an expiry or migration date in the agreement."))
$body.Add((New-Bullet "Publish fair-use limits. Quote data migration, custom reports, onsite training and unusual integrations separately."))
$body.Add((New-Bullet "Mega pricing begins at ₦250,000; it is not an automatic fixed price for every multi-branch church. Scope it before contracting."))
$body.Add((New-Bullet "Never sell lifetime pricing. Review prices annually and give existing customers advance notice."))

$body.Add((New-Paragraph "Contribution economics by tier" "Heading2"))
$body.Add((New-Table @(
  @("Tier", "Monthly fee", "2.5% collection", "Tenant usage provision", "Contribution before shared platform"),
  @("Starter", "₦35,000", "₦875", "₦1,000", "₦33,125"),
  @("Growth", "₦60,000", "₦1,500", "₦2,000", "₦56,500"),
  @("Large", "₦120,000", "₦3,000", "₦4,000", "₦113,000"),
  @("Mega / Multisite", "₦250,000", "₦6,250", "₦10,000", "₦233,750")
) @(1700, 1500, 1700, 1900, 2500)))
$body.Add((New-Paragraph "Contribution = monthly fee - collection cost - tier usage provision. The shared ₦150,000 platform reserve is deducted once from the portfolio, not once per church." "Small"))

$body.Add((New-Paragraph "3. Cost breakdown" "Heading1"))
$body.Add((New-Paragraph "Direct delivery costs" "Heading2"))
$body.Add((New-Table @(
  @("Direct cost", "Monthly planning treatment", "Control"),
  @("Vercel and Supabase", "Included within ₦150,000 fixed platform reserve", "Track actual invoices and resource alerts"),
  @("Domains, email, monitoring and backups", "Included within fixed platform reserve", "Renew centrally and review annually"),
  @("Payment processing / collections", "2.5% of subscription revenue", "Encourage annual bank-transfer billing where appropriate"),
  @("Tenant usage provision", "₦1k / ₦2k / ₦4k / ₦10k by tier", "Compare provision with actual usage each quarter"),
  @("WhatsApp provider charges", "₦0 in this model", "Manual coordinator follow-up remains the operating process")
) @(2650, 3200, 3450)))

$body.Add((New-Paragraph "Operating expense budget at scale" "Heading2"))
$body.Add((New-Table @(
  @("Operating expense", "Monthly budget", "Purpose"),
  @("Founder maintenance salary", "₦300,000", "Values product ownership, fixes, releases and customer oversight"),
  @("Sales, demos and transport", "₦200,000", "Prospecting, church visits, presentations and follow-up"),
  @("Customer support and tools", "₦100,000", "Support channels, training materials and operational tools"),
  @("Legal and accounting", "₦75,000", "Contracts, bookkeeping, compliance and professional review"),
  @("Product and security reserve", "₦150,000", "Testing, audits, devices, contractors and incident readiness"),
  @("Administration and contingency", "₦75,000", "Banking, communications and unexpected small costs"),
  @("Total", "₦900,000", "Sustainable monthly operating budget")
) @(3000, 1950, 4350)))
$body.Add((New-Paragraph "If the founder temporarily takes less cash, report the unpaid portion as founder subsidy. Do not pretend the business is profitable by assigning no value to maintenance labour." "Warning"))

$body.Add((New-PageBreak))
$body.Add((New-Paragraph "4. Target A - first ₦1.5 million monthly gross profit" "Heading1"))
$body.Add((New-Paragraph "Recommended 20-church portfolio" "Heading2"))
$body.Add((New-Table @(
  @("Tier", "Churches", "Price", "MRR", "Contribution"),
  @("Starter", "5", "₦35,000", "₦175,000", "₦165,625"),
  @("Growth", "8", "₦60,000", "₦480,000", "₦452,000"),
  @("Large", "5", "₦120,000", "₦600,000", "₦565,000"),
  @("Mega / Multisite", "2", "₦250,000", "₦500,000", "₦467,500"),
  @("Portfolio", "20", "-", "₦1,755,000", "₦1,650,125 before fixed platform")
) @(2000, 1200, 1700, 2100, 2300)))
$body.Add((New-Table @(
  @("Profit bridge", "Amount"),
  @("Monthly recurring revenue", "₦1,755,000"),
  @("Payment / collection provision", "(₦43,875)"),
  @("Tenant usage provisions", "(₦61,000)"),
  @("Fixed platform reserve", "(₦150,000)"),
  @("Monthly gross profit", "₦1,500,125"),
  @("Gross margin", "85.5%")
) @(5700, 3600)))
$body.Add((New-Paragraph "This milestone covers direct delivery costs but does not yet deduct the ₦900,000 operating-expense budget. At this portfolio, operating profit before tax would be approximately ₦600,125." "Callout"))

$body.Add((New-Paragraph "5. Target B - ₦1.5 million monthly operating profit before tax" "Heading1"))
$body.Add((New-Paragraph "Recommended 30-church portfolio" "Heading2"))
$body.Add((New-Table @(
  @("Tier", "Churches", "Price", "MRR", "Contribution"),
  @("Starter", "5", "₦35,000", "₦175,000", "₦165,625"),
  @("Growth", "14", "₦60,000", "₦840,000", "₦791,000"),
  @("Large", "8", "₦120,000", "₦960,000", "₦904,000"),
  @("Mega / Multisite", "3", "₦250,000", "₦750,000", "₦701,250"),
  @("Portfolio", "30", "-", "₦2,725,000", "₦2,561,875 before fixed platform")
) @(2000, 1200, 1700, 2100, 2300)))
$body.Add((New-Table @(
  @("Profit bridge", "Amount"),
  @("Monthly recurring revenue", "₦2,725,000"),
  @("Payment / collection provision", "(₦68,125)"),
  @("Tenant usage provisions", "(₦95,000)"),
  @("Fixed platform reserve", "(₦150,000)"),
  @("Monthly gross profit", "₦2,411,875"),
  @("Operating expenses", "(₦900,000)"),
  @("Operating profit before tax", "₦1,511,875"),
  @("Pre-tax operating margin", "55.5%")
) @(5700, 3600)))
$body.Add((New-Paragraph "This is the principal commercial target: it pays direct costs, budgets the founder's work, funds sales and support, and still produces more than ₦1.5 million before tax." "Callout"))

$body.Add((New-PageBreak))
$body.Add((New-Paragraph "6. Target C - ₦1.5 million after a planning tax reserve" "Heading1"))
$body.Add((New-Paragraph "Recommended 32-church safety portfolio" "Heading2"))
$body.Add((New-Table @(
  @("Tier", "Churches", "MRR"),
  @("Starter", "5", "₦175,000"),
  @("Growth", "14", "₦840,000"),
  @("Large", "9", "₦1,080,000"),
  @("Mega / Multisite", "4", "₦1,000,000"),
  @("Portfolio", "32", "₦3,095,000")
) @(3300, 2400, 3600)))
$body.Add((New-Table @(
  @("Profit bridge", "Amount"),
  @("Monthly recurring revenue", "₦3,095,000"),
  @("Payment / collection provision", "(₦77,375)"),
  @("Tenant usage provisions", "(₦109,000)"),
  @("Fixed platform reserve", "(₦150,000)"),
  @("Monthly gross profit", "₦2,758,625"),
  @("Operating expenses", "(₦900,000)"),
  @("Operating profit before tax", "₦1,858,625"),
  @("15% management tax reserve", "(₦278,794)"),
  @("Profit after planning reserve", "₦1,579,831"),
  @("After-reserve margin", "51.0%")
) @(5700, 3600)))
$body.Add((New-Paragraph "Tax is assessed under applicable law and may not equal 15% of monthly accounting profit. This reserve is a cash-planning buffer only. Obtain current professional advice before setting dividends, tax payments or final net-profit claims." "Warning"))

$body.Add((New-Paragraph "7. Why a mixed portfolio matters" "Heading1"))
$body.Add((New-Table @(
  @("Portfolio approach", "Churches needed", "Commercial implication"),
  @("All Growth for ₦1.5m gross profit", "30 Growth churches", "Simpler sales offer, but 10 more tenants than the mixed gross-profit case"),
  @("All Growth for ₦1.5m pre-tax operating profit", "46 Growth churches", "Higher support volume and longer sales cycle"),
  @("Recommended mixed gross-profit case", "20 churches", "Large and Mega contracts accelerate contribution"),
  @("Recommended mixed pre-tax case", "30 churches", "Balanced concentration and realistic support load")
) @(3500, 2100, 3700)))
$body.Add((New-Bullet "Do not depend on one Mega church for survival; no single customer should represent more than 20% of MRR."))
$body.Add((New-Bullet "Use Starter as an accessible entry plan, Growth as the standard plan, and Large/Mega as the profit accelerators."))
$body.Add((New-Bullet "A Mega contract should require multi-year or annual commitments, defined branch limits and paid implementation."))

$body.Add((New-PageBreak))
$body.Add((New-Paragraph "8. Sales targets required to reach the portfolios" "Heading1"))
$body.Add((New-Paragraph "Monthly sales-engine target" "Heading2"))
$body.Add((New-Table @(
  @("Funnel stage", "Monthly target", "Planning conversion"),
  @("Qualified church prospects", "30", "Starting pool"),
  @("Discovery conversations", "12", "40% of qualified prospects"),
  @("Product demonstrations", "7", "Approximately 58% of discovery calls"),
  @("Controlled pilots / proposals", "3", "Approximately 43% of demonstrations"),
  @("New paying churches", "2", "Approximately 67% of pilots")
) @(3500, 2500, 3300)))
$body.Add((New-Paragraph "The sales target is two new paying churches per month after the sales process becomes repeatable. The mix target should average approximately 25% Starter, 45% Growth, 20-25% Large and 10% Mega." "Callout"))

$body.Add((New-Paragraph "Pipeline requirement from an initial five-church pilot" "Heading2"))
$body.Add((New-Table @(
  @("Milestone", "Additional wins required", "At 2 wins/month", "Primary evidence"),
  @("8 paying churches", "3", "2 months", "Repeatable onboarding"),
  @("14 paying churches", "9", "5 months", "Retention and case studies"),
  @("20 paying churches", "15", "8 months", "₦1.5m gross-profit portfolio mix"),
  @("30 paying churches", "25", "13 months", "₦1.5m pre-tax operating-profit mix"),
  @("32 paying churches", "27", "14 months", "After-reserve safety target")
) @(2600, 2050, 2000, 2650)))

$body.Add((New-Paragraph "Sales activity by week" "Heading2"))
$body.Add((New-Bullet "Add 7-8 qualified churches to the pipeline."))
$body.Add((New-Bullet "Complete 3 discovery conversations and 1-2 demonstrations."))
$body.Add((New-Bullet "Issue every proposal within 48 hours and schedule its decision date."))
$body.Add((New-Bullet "Request one referral from every satisfied pilot sponsor and active customer."))
$body.Add((New-Bullet "Review lost deals by reason: price, trust, timing, missing capability, approval process or competitor."))

$body.Add((New-Paragraph "9. Eighteen-month execution roadmap" "Heading1"))
$body.Add((New-Table @(
  @("Period", "Paying-church target", "Commercial priority", "Exit evidence"),
  @("Months 1-2", "0-1", "Complete multi-tenancy, tenant isolation and sales materials", "Security tests and demo environment"),
  @("Months 3-4", "4", "Run five-church pilot; convert four to paid", "References, baseline metrics and signed terms"),
  @("Months 5-6", "8", "Standardise setup and coordinator training", "Onboarding under 10 hours"),
  @("Months 7-9", "14", "Build partner/referral channel and close first Large plan", "Churn below 2% and reliable collections"),
  @("Months 10-12", "20", "Reach recommended gross-profit mix", "Approximately ₦1.5m monthly gross profit"),
  @("Months 13-18", "30-32", "Add Large/Mega churches without weakening support", "₦1.5m pre-tax or after-reserve target")
) @(1750, 1800, 3100, 2650)))
$body.Add((New-Paragraph "Time-to-target scenarios" "Heading2"))
$body.Add((New-Table @(
  @("Sales pace", "Gross-profit target", "Operating-profit target", "Interpretation"),
  @("Conservative: 1 close/month", "18-20 months", "30+ months", "Founder-led sales only; slower proof cycle"),
  @("Base: 2 closes/month", "10-12 months", "15-18 months", "Recommended operating plan"),
  @("Accelerated partnerships", "7-9 months", "10-14 months", "Requires referral partners and Large/Mega wins")
) @(2400, 2100, 2200, 2600)))

$body.Add((New-PageBreak))
$body.Add((New-Paragraph "10. Setup fees, acquisition cost and cash flow" "Heading1"))
$body.Add((New-Paragraph "Setup fees are implementation revenue. Use them to recover onboarding effort rather than disguising them as recurring margin." "Callout"))
$body.Add((New-Table @(
  @("Setup-fee use", "Recommended allocation"),
  @("Configuration and data import", "35%"),
  @("Training and launch support", "25%"),
  @("Sales and acquisition recovery", "20%"),
  @("Multi-tenancy / product recovery", "10%"),
  @("Contingency and rework", "10%")
) @(4800, 4500)))
$body.Add((New-Bullet "Collect at least 50% of setup fees before configuration begins and the balance before production launch."))
$body.Add((New-Bullet "Target customer-acquisition-cost payback within three subscription months."))
$body.Add((New-Bullet "Offer annual prepayment after the pilot, not as a substitute for product validation."))
$body.Add((New-Bullet "A 10-for-12 annual price improves cash flow but reduces recognised monthly subscription yield by 16.7%; track it separately."))
$body.Add((New-Paragraph "At the full operating budget, six months of fixed platform and operating expense equals ₦6.3 million: (₦150,000 + ₦900,000) x 6. Build this reserve progressively before hiring ahead of revenue." "Warning"))

$body.Add((New-Paragraph "11. Commercial controls and sensitivity" "Heading1"))
$body.Add((New-Table @(
  @("Risk", "Trigger", "Required response"),
  @("Foreign-exchange movement", "USD/NGN moves more than 10%", "Reforecast supplier costs and review new-customer pricing"),
  @("Supplier usage growth", "Platform reserve used above 80%", "Identify tenant drivers, optimise usage and revise tier limits"),
  @("Customer concentration", "One church exceeds 20% of MRR", "Prioritise new logos before adding fixed commitments"),
  @("Weak collections", "Collection rate below 95%", "Tighten invoice dates, reminders, suspension terms and annual billing"),
  @("Excessive support", "Over 2 support hours per church/month", "Improve training, in-product guidance and tier boundaries"),
  @("Churn", "Monthly logo churn above 2%", "Interview losses and pause acquisition claims until causes are fixed"),
  @("Custom-work creep", "Unpriced church-specific requests", "Use change requests and implementation quotations")
) @(2550, 2500, 4250)))

$body.Add((New-Paragraph "Downside stress checks" "Heading2"))
$body.Add((New-Bullet "If exchange rates rise 20%, the ₦150,000 fixed platform reserve should absorb early base-plan movement, but actual invoices must still be reviewed monthly."))
$body.Add((New-Bullet "If the blended selling price falls because of discounting, the number of churches needed rises quickly. Protect list prices and limit founder discounts."))
$body.Add((New-Bullet "If Mega churches require extensive onsite service, move those costs into paid implementation or a higher support tier."))
$body.Add((New-Bullet "If retention is not proven, prioritise activation and support before increasing sales spend."))

$body.Add((New-Paragraph "12. Management KPI scorecard" "Heading1"))
$body.Add((New-Table @(
  @("KPI", "Target", "Review frequency"),
  @("Monthly recurring revenue", "Against 20-, 30- and 32-church milestones", "Weekly pipeline; monthly finance"),
  @("Gross margin", "Above 80%", "Monthly"),
  @("Collection rate", "Above 95%", "Weekly"),
  @("Monthly logo churn", "Below 2%", "Monthly"),
  @("New paying churches", "2 per month after validation", "Monthly"),
  @("Qualified prospects", "30 per month", "Weekly"),
  @("Onboarding effort", "Below 10 hours per church", "Per launch"),
  @("Support effort", "Below 2 hours per church per month", "Monthly"),
  @("CAC payback", "Below 3 subscription months", "Quarterly"),
  @("Annual prepay share", "Above 40% of active churches", "Quarterly"),
  @("Early-stage MRR growth", "Approximately 10% month over month", "Monthly")
) @(3500, 3600, 2200)))

$body.Add((New-PageBreak))
$body.Add((New-Paragraph "13. Recommended commercial decisions" "Heading1"))
$body.Add((New-Paragraph "Decision 1 - Complete tenant isolation before external scale" "Heading2"))
$body.Add((New-Paragraph "Do not onboard unrelated churches into the existing single-church data model. Complete multi-tenancy, tenant-aware authorization, migration testing, backups and restore procedures first." "BodyText"))
$body.Add((New-Paragraph "Decision 2 - Sell the outcome, not the software screens" "Heading2"))
$body.Add((New-Paragraph "Lead with reliable attendance reporting, timely care follow-up, first-timer movement visibility, membership-training tracking and leadership decision support." "BodyText"))
$body.Add((New-Paragraph "Decision 3 - Make Growth the default recommendation" "Heading2"))
$body.Add((New-Paragraph "Starter protects accessibility; Growth should be the standard offer; Large and Mega plans supply the contribution required to reach the target without an unmanageable number of tenants." "BodyText"))
$body.Add((New-Paragraph "Decision 4 - Separate pilot, setup and subscription" "Heading2"))
$body.Add((New-Paragraph "A controlled pilot proves value. The setup fee pays for implementation. The subscription pays for ongoing access, maintenance, support and product development. Put each obligation in writing." "BodyText"))
$body.Add((New-Paragraph "Decision 5 - Manage to the 30-church portfolio" "Heading2"))
$body.Add((New-Paragraph "The 20-church target is commercially encouraging, but the 30-church target is the better definition of success because it includes a sustainable operating budget before reporting ₦1.5 million profit." "Callout"))

$body.Add((New-Paragraph "14. Immediate 90-day action plan" "Heading1"))
$body.Add((New-Table @(
  @("Window", "Actions", "Output"),
  @("Days 1-30", "Finish multi-tenant design; document tier limits; prepare demo tenant, contract and data-processing terms", "Sellable and safely isolated pilot package"),
  @("Days 31-60", "Present to local leadership; recruit five pilots; baseline current attendance/reporting effort", "Five signed pilot scopes and named sponsors"),
  @("Days 61-90", "Launch pilots; measure activation and support; collect testimonials; begin 30-prospect monthly pipeline", "Conversion evidence and repeatable onboarding checklist")
) @(1800, 5000, 2500)))

$body.Add((New-Paragraph "15. Formula reference" "Heading1"))
$body.Add((New-Bullet "Monthly recurring revenue (MRR) = sum of active monthly subscription values."))
$body.Add((New-Bullet "Gross profit = MRR - payment/collection cost - tenant usage provisions - fixed platform reserve."))
$body.Add((New-Bullet "Gross margin = gross profit / MRR."))
$body.Add((New-Bullet "Operating profit before tax = gross profit - operating expenses."))
$body.Add((New-Bullet "Operating margin before tax = operating profit before tax / MRR."))
$body.Add((New-Bullet "Setup fees, one-off migration work and pass-through expenses are excluded from MRR."))

$body.Add((New-Paragraph "16. Sources and planning disclaimer" "Heading1"))
$body.Add((New-Bullet "Supabase pricing: https://supabase.com/pricing"))
$body.Add((New-Bullet "Supabase billing FAQ: https://supabase.com/docs/guides/platform/billing-faq"))
$body.Add((New-Bullet "Vercel Pro plan: https://vercel.com/docs/plans/pro-plan"))
$body.Add((New-Bullet "FIRS historical Finance Act clarification: https://old.firs.gov.ng/wp-content/uploads/2021/06/CLARIFICATION-ON-SUNDRY-PROVISIONS-OF-THE-FINANCE.pdf"))
$body.Add((New-Paragraph "This document is a management planning model, not a supplier quotation, valuation, guarantee, tax opinion, legal opinion or investment recommendation. Supplier prices, exchange rates, taxes, payment fees, staffing needs, customer behaviour and product usage can change. Reforecast monthly and obtain professional Nigerian accounting and legal advice before commercial launch." "Warning"))

# Windows PowerShell 5.1 reads UTF-8 scripts without a BOM through the active
# ANSI code page. Repair the only non-ASCII source glyph before packaging.
$misreadNaira = ([string][char]0x00E2) + ([string][char]0x201A) + ([string][char]0x00A6)
$naira = [string][char]0x20A6
for ($index = 0; $index -lt $body.Count; $index++) {
  $body[$index] = $body[$index].Replace($misreadNaira, $naira)
}

$documentXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    $($body -join "`n")
    <w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1000" w:right="950" w:bottom="1000" w:left="950" w:header="600" w:footer="600"/><w:cols w:space="708"/><w:docGrid w:linePitch="360"/></w:sectPr>
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
  <dc:title>Flock Commercial Growth Plan to ₦1.5 Million Monthly Profit</dc:title>
  <dc:creator>Flock</dc:creator>
  <dc:subject>Church tier pricing, cost model, sales targets and profit roadmap</dc:subject>
  <dcterms:created xsi:type="dcterms:W3CDTF">2026-07-23T00:00:00Z</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">2026-07-23T00:00:00Z</dcterms:modified>
</cp:coreProperties>
'@
$coreXml = $coreXml.Replace($misreadNaira, $naira)

$appXml = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>Microsoft Office Word</Application><AppVersion>16.0000</AppVersion></Properties>
'@

$outputDirectory = Split-Path -Parent $OutputPath
New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
$tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("flock-growth-plan-docx-" + [guid]::NewGuid().ToString("N"))
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
