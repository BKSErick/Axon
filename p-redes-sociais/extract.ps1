Add-Type -AssemblyName 'System.IO.Compression.FileSystem'
$docxPath = 'd:\MetaAds\p-redes-sociais\Plano_Tecnico_MetaReports_v2.docx'
$outPath = 'd:\MetaAds\p-redes-sociais\plano_v2.txt'

$zip = [System.IO.Compression.ZipFile]::OpenRead($docxPath)
$entry = $zip.GetEntry('word/document.xml')
$stream = $entry.Open()
$reader = New-Object System.IO.StreamReader($stream)
$xml = $reader.ReadToEnd()
$reader.Close()
$stream.Close()
$zip.Dispose()

# Strip XML tags but preserve paragraph breaks
$text = $xml -replace '</w:p>', "`n"
$text = $text -replace '<[^>]+>', ''
$text = $text -replace '&amp;', '&'
$text = $text -replace '&lt;', '<'
$text = $text -replace '&gt;', '>'
$text = $text -replace '\r?\n\r?\n+', "`n`n"

$text | Out-File $outPath -Encoding UTF8
Write-Host "Done: $outPath"
