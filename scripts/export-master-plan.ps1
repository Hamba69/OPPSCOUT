param(
  [string]$InputPath = "OppScout_Master_Technical_Planning_Document.docx",
  [string]$OutputPath = "docs/master-plan.md"
)

Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [System.IO.Compression.ZipFile]::OpenRead((Resolve-Path $InputPath))
try {
  $entry = $archive.GetEntry("word/document.xml")
  $reader = [System.IO.StreamReader]::new($entry.Open())
  try { [xml]$document = $reader.ReadToEnd() } finally { $reader.Dispose() }
  $namespaces = [System.Xml.XmlNamespaceManager]::new($document.NameTable)
  $namespaces.AddNamespace("w", "http://schemas.openxmlformats.org/wordprocessingml/2006/main")
  $lines = [System.Collections.Generic.List[string]]::new()
  $inTable = $false
  $tableRow = 0
  foreach ($node in $document.document.body.ChildNodes) {
    if ($node.LocalName -eq "p") {
      $styleNode = $node.SelectSingleNode("./w:pPr/w:pStyle", $namespaces)
      $style = if ($styleNode) { $styleNode.GetAttribute("val", "http://schemas.openxmlformats.org/wordprocessingml/2006/main") } else { "" }
      $value = (($node.SelectNodes(".//w:t", $namespaces) | ForEach-Object { $_.InnerText }) -join "").Trim()
      if (!$value) { continue }
      $prefix = switch ($style) { "Heading1" { "# " } "Heading2" { "## " } "Heading3" { "### " } "ListParagraph" { "- " } default { "" } }
      $lines.Add($prefix + $value)
      $lines.Add("")
    } elseif ($node.LocalName -eq "tbl") {
      $inTable = $true
      $tableRow = 0
      foreach ($row in $node.SelectNodes("./w:tr", $namespaces)) {
        $cells = @($row.SelectNodes("./w:tc", $namespaces) | ForEach-Object {
          (($PSItem.SelectNodes(".//w:t", $namespaces) | ForEach-Object { $_.InnerText }) -join " ").Trim().Replace("|", "\|")
        })
        $lines.Add("| " + ($cells -join " | ") + " |")
        if ($tableRow -eq 0) { $lines.Add("| " + (($cells | ForEach-Object { "---" }) -join " | ") + " |") }
        $tableRow += 1
      }
      $lines.Add("")
      $inTable = $false
    }
  }
  if ($inTable) { throw "Unclosed table in source document." }
  $absoluteOutput = Join-Path (Get-Location) $OutputPath
  [System.IO.Directory]::CreateDirectory([System.IO.Path]::GetDirectoryName($absoluteOutput)) | Out-Null
  [System.IO.File]::WriteAllText($absoluteOutput, ($lines -join [Environment]::NewLine), [System.Text.UTF8Encoding]::new($false))
} finally {
  $archive.Dispose()
}
