#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

const ROOT = path.resolve(__dirname, '..')
const RESULTS_DIR = path.join(ROOT, 'docs/evals/results')

function parseArgs(argv) {
  const args = {
    retrievalSample: 'docs/evals/public-chat-retrieval-fuzzy.json',
    ragasSample: 'docs/evals/public-chat-ragas.json',
    strategies: ['baseline', 'fusion'],
    limits: [3, 5],
    thresholds: [0],
    reranks: ['rule'],
    maxCases: 0,
    runRagas: true,
    dryRunRagas: false,
  }

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i]
    const next = argv[i + 1]
    if (arg === '--max-cases' && next) {
      args.maxCases = Number(next)
      i += 1
    } else if (arg === '--strategies' && next) {
      args.strategies = next.split(',').map((item) => item.trim()).filter(Boolean)
      i += 1
    } else if (arg === '--limits' && next) {
      args.limits = next.split(',').map(Number).filter((item) => Number.isFinite(item))
      i += 1
    } else if (arg === '--thresholds' && next) {
      args.thresholds = next.split(',').map(Number).filter((item) => Number.isFinite(item))
      i += 1
    } else if (arg === '--reranks' && next) {
      args.reranks = next.split(',').map((item) => item.trim()).filter(Boolean)
      i += 1
    } else if (arg === '--no-ragas') {
      args.runRagas = false
    } else if (arg === '--dry-run-ragas') {
      args.dryRunRagas = true
    }
  }

  return args
}

function stamp() {
  const now = new Date()
  const pad = (value) => String(value).padStart(2, '0')
  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    '-',
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
  ].join('')
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true })
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: options.capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
  })
  if (result.status !== 0) {
    const detail = result.stderr || result.stdout || ''
    throw new Error(`${command} ${args.join(' ')} failed with exit ${result.status}\n${detail}`)
  }
  return result.stdout
}

function runRetrieval(config, maxCases) {
  const args = [
    'scripts/evaluate-retrieval.js',
    '--sample',
    config.sample,
    '--strategy',
    config.strategy,
    '--rerank',
    config.rerank,
    '--limit',
    String(config.limit),
    '--threshold',
    String(config.threshold),
    '--json',
    '--include-content',
  ]
  if (maxCases) {
    args.push('--max-cases', String(maxCases))
  }
  return JSON.parse(run('node', args, { capture: true }))
}

function runRagas(config, outputPath, maxCases, dryRun) {
  const args = [
    'scripts/evaluate-ragas.py',
    '--sample',
    config.sample,
    '--strategy',
    config.strategy,
    '--rerank',
    config.rerank,
    '--limit',
    String(config.limit),
    '--threshold',
    String(config.threshold),
    '--output',
    outputPath,
    '--json',
  ]
  if (maxCases) {
    args.push('--max-cases', String(maxCases))
  }
  if (dryRun) {
    args.push('--dry-run')
  }

  const result = spawnSync('python3', args, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const output = result.stdout ? safeJsonParse(result.stdout) : null
  if (result.status !== 0 && !output) {
    return {
      status: 'failed',
      warnings: [result.stderr || `python3 ${args.join(' ')} failed with exit ${result.status}`],
      ragas: { summary: {} },
    }
  }
  return output || {
    status: result.status === 0 ? 'ok' : 'skipped',
    warnings: [result.stderr].filter(Boolean),
    ragas: { summary: {} },
  }
}

function safeJsonParse(value) {
  try {
    return JSON.parse(value)
  } catch {
    const start = value.indexOf('{')
    const end = value.lastIndexOf('}')
    if (start >= 0 && end > start) {
      return JSON.parse(value.slice(start, end + 1))
    }
    return null
  }
}

function formatPercent(value) {
  if (typeof value !== 'number') return '-'
  return `${(value * 100).toFixed(1)}%`
}

function formatNumber(value) {
  if (typeof value !== 'number') return '-'
  return value.toFixed(3)
}

function writeMarkdownReport(pathname, report) {
  const lines = [
    '# Public Chat RAG Experiments',
    '',
    `Generated at: ${report.generatedAt}`,
    '',
    '## Summary',
    '',
    '| Strategy | Rerank | TopK | Threshold | Hit@1 | Hit@K | MRR | WrongType | NegativePass | RAGAS Status | Faithfulness | Answer Relevancy | Context Precision | Context Recall |',
    '| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | ---: | ---: | ---: | ---: |',
  ]

  for (const item of report.experiments) {
    const r = item.retrieval.summary || {}
    const g = item.ragas?.ragas?.summary || {}
    lines.push([
      item.config.strategy,
      item.config.rerank,
      item.config.limit,
      item.config.threshold,
      formatPercent(r.hitAt1),
      formatPercent(r.hitAtK),
      formatNumber(r.mrr),
      formatPercent(r.wrongTypeRate),
      formatPercent(r.negativePassRate),
      item.ragas?.status || 'not-run',
      formatNumber(g.faithfulness),
      formatNumber(g.answer_relevancy),
      formatNumber(g.context_precision),
      formatNumber(g.context_recall),
    ].join(' | ').replace(/^/, '| ').replace(/$/, ' |'))
  }

  lines.push('')
  lines.push('## Notes')
  lines.push('')
  lines.push('- Retrieval metrics use the existing golden fuzzy set and include Hit@K, MRR, wrong type rate, and negative pass rate.')
  lines.push('- RAGAS metrics require Python dependencies: `python3 -m pip install ragas datasets`.')
  lines.push('- This first experiment matrix scans retrieval strategy, topK, threshold, and local rule rerank. Chunk strategy comparison requires rebuilding vector indexes with multiple chunk schemas.')

  fs.writeFileSync(pathname, `${lines.join('\n')}\n`, 'utf8')
}

async function main() {
  const args = parseArgs(process.argv)
  ensureDir(RESULTS_DIR)

  const runId = stamp()
  const experiments = []

  for (const strategy of args.strategies) {
    for (const rerank of args.reranks) {
      for (const limit of args.limits) {
        for (const threshold of args.thresholds) {
          const config = {
            sample: args.retrievalSample,
            strategy,
            rerank,
            limit,
            threshold,
          }
          process.stderr.write(`[retrieval] ${strategy} rerank=${rerank} topK=${limit} threshold=${threshold}\n`)
          const retrieval = runRetrieval(config, args.maxCases)

          let ragas = { status: 'not-run', ragas: { summary: {} }, warnings: [] }
          if (args.runRagas) {
            process.stderr.write(`[ragas] ${strategy} rerank=${rerank} topK=${limit} threshold=${threshold}\n`)
            const ragasPath = path.join(RESULTS_DIR, `ragas-${runId}-${strategy}-${rerank}-k${limit}-t${threshold}.json`)
            ragas = runRagas({
              sample: args.ragasSample,
              strategy,
              rerank,
              limit,
              threshold,
            }, ragasPath, args.maxCases, args.dryRunRagas)
          }

          experiments.push({ config, retrieval, ragas })
        }
      }
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    runId,
    config: args,
    experiments,
  }
  const jsonPath = path.join(RESULTS_DIR, `rag-experiments-${runId}.json`)
  const mdPath = path.join(RESULTS_DIR, `rag-experiments-${runId}.md`)
  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  writeMarkdownReport(mdPath, report)

  console.log(`RAG experiment report written:`)
  console.log(`- ${path.relative(ROOT, jsonPath)}`)
  console.log(`- ${path.relative(ROOT, mdPath)}`)
}

main().catch((error) => {
  console.error(`RAG experiment run failed: ${error.message}`)
  process.exit(1)
})
