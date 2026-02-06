# AI Agent Evaluation Test Runner
# This script tests the AI agent by calling the API directly

$baseUrl = "http://localhost:3000/api/ai/agent"
$results = @()

# Test questions (high priority)
$questions = @(
    "¿Cómo va mi presupuesto este mes?",
    "¿Cuánto me queda disponible en cada categoría?",
    "¿Cómo va mi presupuesto de Ocio?",
    "¿Cuánto dinero me queda por gastar este mes en Supervivencia?",
    "¿Estoy dentro del presupuesto de Cultura?",
    "¿Cuánto he gastado en comida este mes?",
    "¿Cuánto llevo gastado en Ocio?",
    "¿Cuánto he gastado este mes en total?",
    "¿En qué he gastado más dinero este mes?",
    "¿Estoy gastando más o menos que el mes pasado?"
)

Write-Host "🧪 Starting AI Agent Evaluation Tests..." -ForegroundColor Cyan
Write-Host "Testing $($questions.Count) questions`n" -ForegroundColor Cyan

foreach ($i in 0..($questions.Count - 1)) {
    $question = $questions[$i]
    $testNum = $i + 1
    
    Write-Host "[$testNum/$($questions.Count)] Testing: $question" -ForegroundColor Yellow
    
    $body = @{
        message = $question
        history = @()
    } | ConvertTo-Json -Depth 10
    
    try {
        $response = Invoke-RestMethod -Uri $baseUrl -Method Post -Body $body -ContentType "application/json" -UseBasicParsing
        
        $result = @{
            question = $question
            success  = $true
            intent   = $response.intent
            tools    = $response.tools
            response = $response.message
            latency  = $response.latencyMs
            cost     = $response.costUsd
        }
        
        Write-Host "  ✅ Intent: $($response.intent)" -ForegroundColor Green
        Write-Host "  🔧 Tools: $($response.tools -join ', ')" -ForegroundColor Blue
        Write-Host "  ⏱️  Latency: $($response.latencyMs)ms" -ForegroundColor Gray
        Write-Host ""
        
    }
    catch {
        $result = @{
            question = $question
            success  = $false
            error    = $_.Exception.Message
        }
        
        Write-Host "  ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
    }
    
    $results += $result
    
    # Small delay between requests
    Start-Sleep -Milliseconds 500
}

# Summary
Write-Host "`n📊 Test Summary" -ForegroundColor Cyan
Write-Host "=" * 50

$successful = ($results | Where-Object { $_.success }).Count
$failed = ($results | Where-Object { -not $_.success }).Count

Write-Host "Total tests: $($questions.Count)" -ForegroundColor White
Write-Host "Successful: $successful" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor Red

if ($successful -gt 0) {
    $avgLatency = ($results | Where-Object { $_.success } | Measure-Object -Property latency -Average).Average
    $totalCost = ($results | Where-Object { $_.success } | Measure-Object -Property cost -Sum).Sum
    
    Write-Host "`nAverage latency: $([math]::Round($avgLatency, 0))ms" -ForegroundColor Gray
    Write-Host "Total cost: `$$([math]::Round($totalCost, 6))" -ForegroundColor Gray
}

# Export results
$results | ConvertTo-Json -Depth 10 | Out-File "agent_test_results.json"
Write-Host "`n💾 Results saved to agent_test_results.json" -ForegroundColor Cyan
