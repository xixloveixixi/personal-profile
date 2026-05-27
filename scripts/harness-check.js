#!/usr/bin/env node
/**
 * Harness 自检脚本
 * 用法：npm run harness:check
 *
 * 校验项：
 *   1. progress-log.md 最后一条日志的日期不晚于今天
 *   2. stage-plan.md 当前阶段 Gate E 全部 ✅ 才允许提示进入下一阶段
 *   3. 旧技术栈关键词（Spring Boot / Maven / Mybatis）不应残留在执行文档
 *   4. api-contract.md 与 schema.md 存在且非空
 *   5. AGENTS.md 中"未填禁止写业务 handler"约束仍存在
 *
 * 退出码：0 全部通过；1 有 ERROR；warning 不影响退出码。
 */
const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const HARNESS_DIR = path.join(ROOT, "docs", "dev-harness");

const results = [];
const ok = (msg) => results.push({ level: "ok", msg });
const warn = (msg) => results.push({ level: "warn", msg });
const err = (msg) => results.push({ level: "error", msg });

function read(file) {
  const p = path.join(HARNESS_DIR, file);
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, "utf8");
}

// 1. progress-log 日期校验
function checkProgressLogDate() {
  const content = read("progress-log.md");
  if (!content) return err("progress-log.md 不存在");
  const dates = [...content.matchAll(/^## (\d{4}-\d{2}-\d{2})/gm)].map((m) => m[1]);
  if (dates.length === 0) return warn("progress-log.md 没有日期条目");
  const last = dates[dates.length - 1];
  const today = new Date().toISOString().slice(0, 10);
  if (last > today) return err(`progress-log.md 最新日期 ${last} 晚于今天 ${today}`);
  ok(`progress-log.md 最新日期 ${last}（OK）`);
}

// 2. 当前阶段 Gate E 状态
function checkCurrentStageGateE() {
  const content = read("stage-plan.md");
  if (!content) return err("stage-plan.md 不存在");
  const m = content.match(/##\s*当前阶段：([^\n]+)\n([\s\S]*?)(?=\n##\s|$)/);
  if (!m) return warn("未在 stage-plan.md 找到 '当前阶段' 标题");
  const stageName = m[1].trim();
  const body = m[2];
  const gateE = body.match(/####\s*Gate E[^\n]*\n([\s\S]*?)(?=\n####|\n##|$)/);
  if (!gateE) return warn(`阶段 [${stageName}] 未定义 Gate E`);
  const items = [...gateE[1].matchAll(/^-\s*\[( |x|X)\]/gm)];
  const total = items.length;
  const checked = items.filter((i) => i[1].toLowerCase() === "x").length;
  if (total === 0) return warn(`阶段 [${stageName}] Gate E 无勾选项`);
  if (checked === total)
    ok(`阶段 [${stageName}] Gate E 已全部通过 (${checked}/${total})，可进入下一阶段`);
  else warn(`阶段 [${stageName}] Gate E 进度 ${checked}/${total}，尚未全部通过`);
}

// 3. 旧技术栈关键词残留
function checkLegacyKeywords() {
  const files = [
    "stage-plan.md",
    "progress-log.md",
    "api-contract.md",
    "schema.md",
  ]; // pitfalls.md 记录历史决策，允许引用旧栈关键词，不参与扫描
  const banned = [/\bSpring Boot\b/i, /\bMaven\b/i, /\bMybatis\b/i];
  for (const f of files) {
    const content = read(f);
    if (!content) continue;
    const lines = content.split("\n");
    for (const pat of banned) {
      lines.forEach((line, i) => {
        if (pat.test(line)) err(`${f}:${i + 1} 残留旧技术栈关键词："${line.trim()}"`);
      });
    }
  }
  ok("旧技术栈关键词扫描完成");
}

// 4. 契约文件存在性
function checkContractFiles() {
  for (const f of ["api-contract.md", "schema.md"]) {
    const content = read(f);
    if (!content) err(`${f} 不存在`);
    else if (content.trim().length < 100) warn(`${f} 内容过少（<100 字符），可能未填写`);
    else ok(`${f} 存在且非空`);
  }
}

// 5. AGENTS.md 禁止条款
function checkAgentsRule() {
  const p = path.join(ROOT, "AGENTS.md");
  if (!fs.existsSync(p)) return err("AGENTS.md 不存在");
  const content = fs.readFileSync(p, "utf8");
  if (!/未填禁止写业务\s*handler/i.test(content)) {
    err("AGENTS.md 缺少'未填禁止写业务 handler'约束（P0 规则丢失）");
  } else ok("AGENTS.md 包含契约冻结约束");
}

function main() {
  checkProgressLogDate();
  checkCurrentStageGateE();
  checkLegacyKeywords();
  checkContractFiles();
  checkAgentsRule();

  console.log("\n=== Harness Check Report ===\n");
  for (const r of results) {
    const tag = r.level === "ok" ? "[OK]   " : r.level === "warn" ? "[WARN] " : "[ERROR]";
    console.log(`${tag} ${r.msg}`);
  }
  const errors = results.filter((r) => r.level === "error").length;
  const warns = results.filter((r) => r.level === "warn").length;
  console.log(`\nTotal: ${results.length}, errors: ${errors}, warnings: ${warns}`);
  process.exit(errors > 0 ? 1 : 0);
}

main();
