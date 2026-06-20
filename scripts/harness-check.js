#!/usr/bin/env node
/**
 * Harness 自检脚本
 * 用法：npm run harness:check
 *
 * 校验项：
 *   1. progress-log.md 最后一条日志的日期不晚于今天
 *   2. state.json 与 stage-plan.md 当前阶段游标一致
 *   3. stage-plan.md 当前阶段 Gate A-F 状态可读
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

function readJson(file) {
  const content = read(file);
  if (!content) return null;
  try {
    return JSON.parse(content);
  } catch (e) {
    err(`${file} 不是合法 JSON：${e.message}`);
    return null;
  }
}

function getCurrentStage() {
  const content = read("stage-plan.md");
  if (!content) {
    err("stage-plan.md 不存在");
    return null;
  }

  const headings = [...content.matchAll(/^##\s*当前阶段：([^\n]+)$/gm)];
  if (headings.length === 0) {
    warn("未在 stage-plan.md 找到 '当前阶段' 标题");
    return null;
  }
  if (headings.length > 1) {
    err(`stage-plan.md 存在 ${headings.length} 个 '当前阶段' 标题，只能保留一个`);
  }

  const heading = headings[0];
  const start = heading.index + heading[0].length;
  const nextHeading = content.slice(start).match(/\n##\s/);
  const end = nextHeading ? start + nextHeading.index : content.length;

  return {
    name: heading[1].trim(),
    body: content.slice(start, end),
  };
}

function checkboxStats(text) {
  const items = [...text.matchAll(/^-\s*\[( |x|X)\]/gm)];
  return {
    checked: items.filter((i) => i[1].toLowerCase() === "x").length,
    total: items.length,
  };
}

function gateStats(stageBody, gate) {
  const re = new RegExp(`####\\s*${gate}[^\\n]*\\n([\\s\\S]*?)(?=\\n####|\\n##|$)`);
  const match = stageBody.match(re);
  if (!match) return null;
  return checkboxStats(match[1]);
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

// 2. 结构化状态与阶段游标
function checkStateFile(currentStage) {
  const state = readJson("state.json");
  if (!state) return warn("state.json 不存在或不可读，将只使用 stage-plan.md");
  if (!state.currentStage) return err("state.json 缺少 currentStage");
  if (currentStage && state.currentStage !== currentStage.name) {
    err(`state.json currentStage 与 stage-plan.md 不一致：state=${state.currentStage} / stage-plan=${currentStage.name}`);
  } else if (currentStage) {
    ok(`state.json 当前阶段与 stage-plan.md 一致：${state.currentStage}`);
  }
  if (state.harnessMode !== "lightweight") {
    warn(`state.json harnessMode=${state.harnessMode || "(空)"}，当前建议保持 lightweight`);
  }
}

// 3. 当前阶段 Gate 状态
function checkCurrentStageGates(currentStage) {
  if (!currentStage) return;
  const gates = ["Gate A", "Gate B", "Gate C", "Gate D", "Gate E", "Gate F"];
  const summaries = [];

  for (const gate of gates) {
    const stats = gateStats(currentStage.body, gate);
    if (!stats) {
      warn(`阶段 [${currentStage.name}] 未定义 ${gate}`);
      continue;
    }
    if (stats.total === 0) {
      warn(`阶段 [${currentStage.name}] ${gate} 无勾选项`);
      continue;
    }
    summaries.push(`${gate.replace("Gate ", "")}:${stats.checked}/${stats.total}`);
    if (stats.checked < stats.total) {
      warn(`阶段 [${currentStage.name}] ${gate} 进度 ${stats.checked}/${stats.total}`);
    }
  }

  if (summaries.length) ok(`阶段 [${currentStage.name}] Gate 状态：${summaries.join(" ")}`);
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

// 5. 契约文档轻量漂移检查
function checkContractDrift(currentStage) {
  const api = read("api-contract.md");
  if (api && currentStage) {
    const m = api.match(/^>\s*当前阶段：(.+)$/m);
    if (m) {
      const marker = m[1].trim();
      const currentNumber = currentStage.name.match(/阶段\s*(\d+)/)?.[1];
      if (currentNumber && !marker.includes(`Stage ${currentNumber}`) && !marker.includes(`阶段 ${currentNumber}`)) {
        warn(`api-contract.md 顶部当前阶段标记可能过期：${marker}；stage-plan 当前为 ${currentStage.name}`);
      }
    }
  }

  const schema = read("schema.md");
  if (!schema) return;
  const mixed = [...schema.matchAll(/^##\s*待冻结表[^\n]*\n\s*\n>\s*状态：✅\s*已冻结[^\n]*/gm)];
  for (const match of mixed) {
    const line = schema.slice(0, match.index).split("\n").length;
    warn(`schema.md:${line} 标题写“待冻结表”但状态为“已冻结”，建议改成“已冻结表”或“候选表”`);
  }
}

// 6. AGENTS.md 禁止条款
function checkAgentsRule() {
  const p = path.join(ROOT, "AGENTS.md");
  if (!fs.existsSync(p)) return err("AGENTS.md 不存在");
  const content = fs.readFileSync(p, "utf8");
  if (!/未填禁止写业务\s*handler/i.test(content)) {
    err("AGENTS.md 缺少'未填禁止写业务 handler'约束（P0 规则丢失）");
  } else ok("AGENTS.md 包含契约冻结约束");
}

function main() {
  const currentStage = getCurrentStage();
  checkProgressLogDate();
  checkStateFile(currentStage);
  checkCurrentStageGates(currentStage);
  checkLegacyKeywords();
  checkContractFiles();
  checkContractDrift(currentStage);
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
