param(
  [string]$SourcePath = "docs/FLOCK_SYSTEM_OVERVIEW.md",
  [string]$OutputPath = "docs/Flock_System_Overview.docx"
)

$ErrorActionPreference = "Stop"

$source = (Resolve-Path -LiteralPath $SourcePath).Path
$output = [System.IO.Path]::GetFullPath((Join-Path (Get-Location) $OutputPath))
$word = $null
$document = $null

function Convert-InlineMarkdown([string]$Text) {
  $clean = $Text -replace '\[([^\]]+)\]\([^\)]+\)', '$1'
  $clean = $clean -replace '(\*\*|__)(.*?)\1', '$2'
  $clean = $clean -replace '(?<!\*)\*([^*]+)\*(?!\*)', '$1'
  $clean = $clean -replace '`([^`]+)`', '$1'
  return $clean
}

function Add-WordParagraph {
  param(
    [Parameter(Mandatory)]$Document,
    [string]$Text = "",
    [string]$Style,
    [ValidateSet("None", "Bullet", "Number")]
    [string]$ListType = "None"
  )

  $paragraph = $Document.Content.Paragraphs.Add()
  $paragraph.Range.Text = (Convert-InlineMarkdown $Text)

  if ($Style) {
    $paragraph.Range.Style = $Style
  }

  if ($ListType -eq "Bullet") {
    $paragraph.Range.ListFormat.ApplyBulletDefault()
  } elseif ($ListType -eq "Number") {
    $paragraph.Range.ListFormat.ApplyNumberDefault()
  }

  $paragraph.Range.InsertParagraphAfter()
}

try {
  $word = New-Object -ComObject Word.Application
  $word.Visible = $false
  $word.DisplayAlerts = 0
  $document = $word.Documents.Add()

  $document.PageSetup.TopMargin = $word.CentimetersToPoints(2.2)
  $document.PageSetup.BottomMargin = $word.CentimetersToPoints(2.2)
  $document.PageSetup.LeftMargin = $word.CentimetersToPoints(2.3)
  $document.PageSetup.RightMargin = $word.CentimetersToPoints(2.3)

  foreach ($line in Get-Content -LiteralPath $source -Encoding UTF8) {
    if ($line -match '^# (.+)$') {
      Add-WordParagraph -Document $document -Text $Matches[1] -Style "Title"
    } elseif ($line -match '^## (.+)$') {
      Add-WordParagraph -Document $document -Text $Matches[1] -Style "Heading 1"
    } elseif ($line -match '^### (.+)$') {
      Add-WordParagraph -Document $document -Text $Matches[1] -Style "Heading 2"
    } elseif ($line -match '^[-*] (.+)$') {
      Add-WordParagraph -Document $document -Text $Matches[1] -ListType "Bullet"
    } elseif ($line -match '^\d+\. (.+)$') {
      Add-WordParagraph -Document $document -Text $Matches[1] -ListType "Number"
    } elseif ($line -match '^> (.+)$') {
      Add-WordParagraph -Document $document -Text $Matches[1] -Style "Quote"
    } elseif ($line -eq '---') {
      Add-WordParagraph -Document $document
    } elseif ([string]::IsNullOrWhiteSpace($line)) {
      Add-WordParagraph -Document $document
    } else {
      Add-WordParagraph -Document $document -Text $line
    }
  }

  $document.SaveAs2($output, 16)
} finally {
  if ($document) {
    $document.Close($false)
    [void][Runtime.InteropServices.Marshal]::ReleaseComObject($document)
  }
  if ($word) {
    $word.Quit()
    [void][Runtime.InteropServices.Marshal]::ReleaseComObject($word)
  }
  [GC]::Collect()
  [GC]::WaitForPendingFinalizers()
}

Write-Output "Created $output"
