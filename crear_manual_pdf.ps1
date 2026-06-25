$source = Join-Path $PSScriptRoot 'MANUAL_DE_USUARIO.md'
$output = Join-Path $PSScriptRoot 'ManualUsuario.html'
$lines = Get-Content $source -Encoding UTF8
$html = New-Object Text.StringBuilder
[void]$html.Append('<!doctype html><html><head><meta charset="utf-8"><style>@page{size:A4;margin:18mm}body{font-family:Arial,sans-serif;color:#243447;font-size:10.5pt;line-height:1.42}h1{color:#17365d;font-size:25pt;border-bottom:3px solid #2f75b5;padding-bottom:10px}h2{color:#1f4e78;font-size:17pt;margin-top:22px;page-break-after:avoid}h3{color:#2f75b5;font-size:13pt;page-break-after:avoid}p{margin:5px 0}ul,ol{margin:5px 0 8px 22px}li{margin:3px 0}table{width:100%;border-collapse:collapse;margin:10px 0 16px;font-size:9.5pt}th{background:#dce6f1;color:#17365d}th,td{border:1px solid #b7c3d0;padding:7px;text-align:left;vertical-align:top}hr{border:0;border-top:1px solid #aab7c4;margin:20px 0}</style></head><body>')
$inList=$false; $listType=''; $inTable=$false; $rows=@()
function Enc([string]$s){ [Net.WebUtility]::HtmlEncode($s) -replace '\*\*([^*]+)\*\*','<strong>$1</strong>' -replace '`([^`]+)`','<code>$1</code>' }
function CloseList { if($script:inList){[void]$script:html.Append("</$script:listType>");$script:inList=$false} }
function FlushTable { if($script:inTable){[void]$script:html.Append('<table>');for($i=0;$i -lt $script:rows.Count;$i++){[void]$script:html.Append('<tr>');foreach($c in $script:rows[$i]){$tag=if($i -eq 0){'th'}else{'td'};[void]$script:html.Append("<$tag>$(Enc $c)</$tag>")};[void]$script:html.Append('</tr>')}[void]$script:html.Append('</table>');$script:rows=@();$script:inTable=$false} }
foreach($line in $lines){
 if($line -match '^\|.*\|$'){CloseList;if($line -match '^\|[\s:|-]+\|$'){continue};$rows+=,@($line.Trim('|').Split('|')|%{$_.Trim()});$inTable=$true;continue}else{FlushTable}
 if($line -match '^# (.+)$'){CloseList;[void]$html.Append("<h1>$(Enc $Matches[1])</h1>");continue}
 if($line -match '^## (.+)$'){CloseList;[void]$html.Append("<h2>$(Enc $Matches[1])</h2>");continue}
 if($line -match '^### (.+)$'){CloseList;[void]$html.Append("<h3>$(Enc $Matches[1])</h3>");continue}
 if($line -match '^\d+\. (.+)$'){if(!$inList -or $listType-ne'ol'){CloseList;[void]$html.Append('<ol>');$inList=$true;$listType='ol'};[void]$html.Append("<li>$(Enc $Matches[1])</li>");continue}
 if($line -match '^\s*- (.+)$'){if(!$inList -or $listType-ne'ul'){CloseList;[void]$html.Append('<ul>');$inList=$true;$listType='ul'};[void]$html.Append("<li>$(Enc $Matches[1])</li>");continue}
 CloseList;if($line -eq '---'){[void]$html.Append('<hr>')}elseif($line.Trim()){[void]$html.Append("<p>$(Enc $line)</p>")}
}
FlushTable;CloseList;[void]$html.Append('</body></html>');[IO.File]::WriteAllText($output,$html.ToString(),[Text.UTF8Encoding]::new($false));$output
