$ErrorActionPreference = "Stop"

$source = Join-Path $PSScriptRoot "MANUAL_DE_USUARIO.md"
$output = Join-Path $PSScriptRoot "MANUAL_DE_USUARIO.docx"
$temp = Join-Path $env:TEMP ("manual_compras_" + [guid]::NewGuid().ToString("N"))

function Escape-Xml([string]$text) {
    return [System.Security.SecurityElement]::Escape($text)
}

function Run([string]$text, [bool]$bold = $false, [int]$size = 22) {
    $b = if ($bold) { "<w:b/>" } else { "" }
    return "<w:r><w:rPr>$b<w:sz w:val=`"$size`"/><w:szCs w:val=`"$size`"/></w:rPr><w:t xml:space=`"preserve`">$(Escape-Xml $text)</w:t></w:r>"
}

function Paragraph([string]$text, [string]$style = "Normal", [string]$before = "0", [string]$after = "100") {
    $clean = $text -replace '\*\*', '' -replace '`', ''
    $size = switch ($style) { "Title" { 36 } "Heading1" { 30 } "Heading2" { 26 } "Heading3" { 23 } default { 21 } }
    $bold = $style -ne "Normal"
    return "<w:p><w:pPr><w:spacing w:before=`"$before`" w:after=`"$after`"/><w:pStyle w:val=`"$style`"/></w:pPr>$(Run $clean $bold $size)</w:p>"
}

function Table([System.Collections.Generic.List[object]]$rows) {
    $xml = '<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders><w:top w:val="single" w:sz="4" w:color="B7C3D0"/><w:left w:val="single" w:sz="4" w:color="B7C3D0"/><w:bottom w:val="single" w:sz="4" w:color="B7C3D0"/><w:right w:val="single" w:sz="4" w:color="B7C3D0"/><w:insideH w:val="single" w:sz="4" w:color="D7DEE7"/><w:insideV w:val="single" w:sz="4" w:color="D7DEE7"/></w:tblBorders></w:tblPr>'
    for ($r = 0; $r -lt $rows.Count; $r++) {
        $xml += '<w:tr>'
        foreach ($cell in $rows[$r]) {
            $shade = if ($r -eq 0) { '<w:shd w:fill="DCE6F1"/>' } else { '' }
            $xml += "<w:tc><w:tcPr>$shade<w:tcMar><w:top w:w=`"80`" w:type=`"dxa`"/><w:left w:w=`"100`" w:type=`"dxa`"/><w:bottom w:w=`"80`" w:type=`"dxa`"/><w:right w:w=`"100`" w:type=`"dxa`"/></w:tcMar></w:tcPr><w:p>$(Run (($cell -replace '\*\*','').Trim()) ($r -eq 0) 20)</w:p></w:tc>"
        }
        $xml += '</w:tr>'
    }
    return $xml + '</w:tbl><w:p/>'
}

New-Item -ItemType Directory -Path (Join-Path $temp '_rels'), (Join-Path $temp 'word'), (Join-Path $temp 'docProps') -Force | Out-Null

$body = New-Object System.Text.StringBuilder
$tableRows = New-Object 'System.Collections.Generic.List[object]'
$inTable = $false

foreach ($line in Get-Content $source -Encoding UTF8) {
    if ($line -match '^\|.*\|$') {
        if ($line -match '^\|[\s:|-]+\|$') { continue }
        $cells = @($line.Trim('|').Split('|') | ForEach-Object { $_.Trim() })
        $tableRows.Add($cells)
        $inTable = $true
        continue
    }
    if ($inTable) {
        [void]$body.Append((Table $tableRows))
        $tableRows = New-Object 'System.Collections.Generic.List[object]'
        $inTable = $false
    }
    if ($line -match '^# (.+)$') { [void]$body.Append((Paragraph $Matches[1] 'Title' '0' '240')); continue }
    if ($line -match '^## (.+)$') { [void]$body.Append((Paragraph $Matches[1] 'Heading1' '260' '120')); continue }
    if ($line -match '^### (.+)$') { [void]$body.Append((Paragraph $Matches[1] 'Heading2' '200' '100')); continue }
    if ($line -match '^(\d+)\. (.+)$') { [void]$body.Append((Paragraph ("$($Matches[1]). $($Matches[2])") 'Normal' '0' '60')); continue }
    if ($line -match '^\s*- (.+)$') { [void]$body.Append((Paragraph ("• " + $Matches[1]) 'Normal' '0' '50')); continue }
    if ($line -eq '---') { [void]$body.Append('<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="6" w:color="AAB7C4"/></w:pBdr></w:pPr></w:p>'); continue }
    if ([string]::IsNullOrWhiteSpace($line)) { [void]$body.Append('<w:p/>'); continue }
    [void]$body.Append((Paragraph $line))
}
if ($inTable) { [void]$body.Append((Table $tableRows)) }

$document = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' + $body.ToString() + '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>'
$styles = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Aptos" w:hAnsi="Aptos"/><w:color w:val="243447"/><w:sz w:val="21"/></w:rPr></w:rPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:rPr><w:color w:val="17365D"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:rPr><w:color w:val="1F4E78"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:rPr><w:color w:val="2F75B5"/></w:rPr></w:style></w:styles>'
$types = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>'
$rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>'
$docRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'
$core = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>Manual de Usuario - Sistema de Compras</dc:title><dc:creator>Sistema de Compras</dc:creator><dc:subject>Manual de usuario</dc:subject></cp:coreProperties>'

[IO.File]::WriteAllText((Join-Path $temp '[Content_Types].xml'), $types, [Text.UTF8Encoding]::new($false))
[IO.File]::WriteAllText((Join-Path $temp '_rels\.rels'), $rels, [Text.UTF8Encoding]::new($false))
[IO.File]::WriteAllText((Join-Path $temp 'word\document.xml'), $document, [Text.UTF8Encoding]::new($false))
[IO.File]::WriteAllText((Join-Path $temp 'word\styles.xml'), $styles, [Text.UTF8Encoding]::new($false))
New-Item -ItemType Directory -Path (Join-Path $temp 'word\_rels') -Force | Out-Null
[IO.File]::WriteAllText((Join-Path $temp 'word\_rels\document.xml.rels'), $docRels, [Text.UTF8Encoding]::new($false))
[IO.File]::WriteAllText((Join-Path $temp 'docProps\core.xml'), $core, [Text.UTF8Encoding]::new($false))

$zip = [IO.Path]::ChangeExtension($output, '.zip')
if (Test-Path $zip) { Remove-Item -LiteralPath $zip -Force }
if (Test-Path $output) { Remove-Item -LiteralPath $output -Force }
Compress-Archive -Path (Join-Path $temp '*') -DestinationPath $zip -Force
Move-Item -LiteralPath $zip -Destination $output
Remove-Item -LiteralPath $temp -Recurse -Force
Write-Output $output
