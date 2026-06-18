#!/usr/bin/env python3
"""Evaluate public chat RAG answers with RAGAS.

The script intentionally keeps retrieval orchestration in the existing Node
pipeline. It consumes a retrieval JSON file that includes retrieved chunk
content, generates answers with DeepSeek/OpenAI-compatible chat completions,
then runs RAGAS generation metrics.
"""

from __future__ import annotations

import argparse
import json
import os
import requests
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SAMPLE_PATH = ROOT / "docs/evals/public-chat-ragas.json"
DEFAULT_RESULTS_DIR = ROOT / "docs/evals/results"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run RAGAS evaluation for public chat RAG.")
    parser.add_argument("--sample", default=str(DEFAULT_SAMPLE_PATH), help="RAGAS sample JSON path.")
    parser.add_argument("--retrieval-json", default="", help="Existing retrieval evaluation JSON with chunk content.")
    parser.add_argument("--strategy", default="fusion", choices=["baseline", "fusion", "llm-fusion"])
    parser.add_argument("--rerank", default="rule", choices=["rule", "none"])
    parser.add_argument("--limit", type=int, default=5)
    parser.add_argument("--threshold", type=float, default=0)
    parser.add_argument("--max-cases", type=int, default=0, help="0 means all cases.")
    parser.add_argument("--output", default="", help="Output JSON path.")
    parser.add_argument("--json", action="store_true", help="Print machine-readable JSON only.")
    parser.add_argument("--dry-run", action="store_true", help="Build dataset and skip answer generation/RAGAS.")
    return parser.parse_args()


def load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as file:
        json.dump(value, file, ensure_ascii=False, indent=2)
        file.write("\n")


def load_env_file(path: Path) -> None:
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, value = stripped.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        os.environ.setdefault(key, value)


def load_env() -> None:
    load_env_file(ROOT / ".env.local")
    load_env_file(ROOT / ".env")


def now_stamp() -> str:
    return datetime.now().strftime("%Y%m%d-%H%M%S")


def normalize_contexts(evaluation: Dict[str, Any]) -> List[str]:
    contexts = []
    for result in evaluation.get("topResults", []):
        content = result.get("content") or result.get("preview") or ""
        if content:
            contexts.append(str(content))
    return contexts


def load_or_build_retrieval(args: argparse.Namespace) -> Dict[str, Any]:
    if args.retrieval_json:
        return load_json(Path(args.retrieval_json))

    command = [
        "node",
        "scripts/evaluate-retrieval.js",
        "--sample",
        os.path.relpath(args.sample, ROOT),
        "--strategy",
        args.strategy,
        "--rerank",
        args.rerank,
        "--limit",
        str(args.limit),
        "--threshold",
        str(args.threshold),
        "--json",
        "--include-content",
    ]
    if args.max_cases:
        command.extend(["--max-cases", str(args.max_cases)])

    completed = subprocess.run(
        command,
        cwd=str(ROOT),
        check=True,
        capture_output=True,
        text=True,
    )
    return json.loads(completed.stdout)


def build_eval_rows(samples: List[Dict[str, Any]], retrieval: Dict[str, Any]) -> List[Dict[str, Any]]:
    retrieval_by_id = {item["id"]: item for item in retrieval.get("evaluations", [])}
    rows = []

    for sample in samples:
        item = retrieval_by_id.get(sample["id"])
        if not item:
            continue
        rows.append(
            {
                "id": sample["id"],
                "user_input": sample["query"],
                "retrieved_contexts": normalize_contexts(item),
                "reference": sample.get("reference", ""),
                "expectedTypes": sample.get("expectedTypes", []),
                "isNegative": bool(sample.get("isNegative") or sample.get("shouldNotAnswer")),
                "retrieval": {
                    "hitRank": item.get("hitRank"),
                    "hitAtK": item.get("hitAtK"),
                    "negativePass": item.get("negativePass"),
                    "maxSimilarity": item.get("maxSimilarity"),
                    "topResults": item.get("topResults", []),
                },
            }
        )

    return rows


def build_prompt(row: Dict[str, Any]) -> str:
    contexts = "\n\n".join(
        f"[{index + 1}] {context}" for index, context in enumerate(row["retrieved_contexts"])
    )
    return f"""你是阿菥的个人AI助手。请只基于给定的公开上下文回答用户问题。

公开上下文:
{contexts if contexts else "（没有可用上下文）"}

回答要求:
1. 不要编造公开上下文没有的信息。
2. 如果上下文没有证据，明确说明当前公开资料中没有找到相关信息。
3. 用中文回答，简洁但完整。

用户问题: {row["user_input"]}"""


def generate_response(prompt: str) -> str:
    from langchain_openai import ChatOpenAI

    api_key = os.environ.get("DEEPSEEK_API_KEY") or os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("Missing DEEPSEEK_API_KEY or OPENAI_API_KEY for answer generation.")

    llm = ChatOpenAI(
        api_key=api_key,
        base_url=os.environ.get("DEEPSEEK_BASE_URL", "https://api.deepseek.com/v1"),
        model=os.environ.get("DEEPSEEK_MODEL", "deepseek-chat"),
        temperature=0,
    )
    response = llm.invoke(prompt)
    return str(response.content).strip()


def generate_answers(rows: List[Dict[str, Any]]) -> None:
    for index, row in enumerate(rows):
        sys.stderr.write(f"[answer {index + 1}/{len(rows)}] {row['id']} {row['user_input']}\n")
        if not row["retrieved_contexts"]:
            row["response"] = "当前公开资料中没有找到足够信息回答这个问题。"
            continue
        row["response"] = generate_response(build_prompt(row))
        time.sleep(0.2)


class AlibabaDashScopeEmbeddings:
    """Minimal LangChain-compatible embeddings wrapper for RAGAS."""

    def __init__(self) -> None:
        self.api_key = os.environ.get("ALIBABA_API_KEY")
        self.base_url = os.environ.get("ALIBABA_BASE_URL", "https://dashscope.aliyuncs.com/api/v1")
        self.model = os.environ.get("ALIBABA_EMBEDDING_MODEL", "text-embedding-v1")
        if not self.api_key:
            raise RuntimeError("Missing ALIBABA_API_KEY for RAGAS embeddings.")

    def _embed_one(self, text: str) -> List[float]:
        response = requests.post(
            f"{self.base_url}/services/embeddings/text-embedding/text-embedding",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}",
            },
            json={
                "model": self.model,
                "input": {"texts": [text]},
            },
            timeout=30,
        )
        if response.status_code >= 400:
            raise RuntimeError(f"Alibaba embedding failed: {response.status_code} {response.text}")
        data = response.json()
        raw_embedding = data.get("output", {}).get("embeddings", [{}])[0].get("embedding")
        if isinstance(raw_embedding, list):
            return [float(value) for value in raw_embedding]
        if isinstance(raw_embedding, str):
            try:
                parsed = json.loads(raw_embedding)
                if isinstance(parsed, list):
                    return [float(value) for value in parsed]
            except json.JSONDecodeError:
                return [float(value) for value in raw_embedding.split(",")]
        raise RuntimeError(f"Unexpected Alibaba embedding format: {type(raw_embedding)}")

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return [self._embed_one(text) for text in texts]

    def embed_query(self, text: str) -> List[float]:
        return self._embed_one(text)


def get_ragas_llm():
    from langchain_openai import ChatOpenAI

    api_key = os.environ.get("DEEPSEEK_API_KEY") or os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("Missing DEEPSEEK_API_KEY or OPENAI_API_KEY for RAGAS metric LLM.")

    return ChatOpenAI(
        api_key=api_key,
        base_url=os.environ.get("DEEPSEEK_BASE_URL", "https://api.deepseek.com/v1"),
        model=os.environ.get("DEEPSEEK_MODEL", "deepseek-chat"),
        temperature=0,
    )


def import_ragas():
    try:
        from datasets import Dataset
        from ragas import evaluate
        from ragas.metrics import (
            answer_relevancy,
            context_precision,
            context_recall,
            faithfulness,
        )

        optional_metrics = []
        try:
            from ragas.metrics import factual_correctness

            optional_metrics.append(factual_correctness)
        except Exception:
            pass

        return Dataset, evaluate, [
            faithfulness,
            answer_relevancy,
            context_precision,
            context_recall,
            *optional_metrics,
        ]
    except ModuleNotFoundError as error:
        missing = error.name or "ragas"
        raise RuntimeError(
            f"Missing Python dependency: {missing}. Install with: "
            "python3 -m pip install ragas datasets"
        ) from error


def run_ragas(rows: List[Dict[str, Any]]) -> Dict[str, Any]:
    Dataset, evaluate, metrics = import_ragas()
    dataset = Dataset.from_list(
        [
            {
                "user_input": row["user_input"],
                "retrieved_contexts": row["retrieved_contexts"],
                "response": row["response"],
                "reference": row["reference"],
            }
            for row in rows
        ]
    )

    result = evaluate(
        dataset,
        metrics=metrics,
        llm=get_ragas_llm(),
        embeddings=AlibabaDashScopeEmbeddings(),
        raise_exceptions=False,
    )
    result_df = result.to_pandas()
    per_case = json.loads(result_df.to_json(orient="records", force_ascii=False))
    summary = {}
    for column in result_df.columns:
        if column in {"user_input", "retrieved_contexts", "response", "reference"}:
            continue
        numeric = result_df[column].dropna()
        if len(numeric) > 0:
            try:
                summary[column] = float(numeric.mean())
            except Exception:
                pass

    return {"summary": summary, "perCase": per_case}


def format_console_report(report: Dict[str, Any]) -> str:
    lines = [
        "",
        "=== Public Chat RAGAS Evaluation ===",
        f"cases: {len(report['cases'])}",
        f"status: {report['status']}",
    ]
    if report.get("ragas", {}).get("summary"):
        lines.append("")
        for key, value in report["ragas"]["summary"].items():
            lines.append(f"{key}: {value:.3f}")
    if report.get("warnings"):
        lines.append("")
        lines.extend(f"warning: {warning}" for warning in report["warnings"])
    if report.get("output"):
        lines.append("")
        lines.append(f"output: {report['output']}")
    return "\n".join(lines)


def main() -> int:
    args = parse_args()
    load_env()

    sample_path = Path(args.sample)
    samples = load_json(sample_path)
    if args.max_cases:
        samples = samples[: args.max_cases]

    output_path = Path(args.output) if args.output else DEFAULT_RESULTS_DIR / f"ragas-{now_stamp()}.json"
    warnings: List[str] = []

    retrieval = load_or_build_retrieval(args)
    rows = build_eval_rows(samples, retrieval)

    status = "ok"
    ragas_result: Dict[str, Any] = {"summary": {}, "perCase": []}

    if args.dry_run:
        status = "dry-run"
        warnings.append("Dry run requested; skipped answer generation and RAGAS metrics.")
        for row in rows:
            row["response"] = ""
    else:
        try:
            import_ragas()
            get_ragas_llm()
            AlibabaDashScopeEmbeddings()
            generate_answers(rows)
            ragas_result = run_ragas(rows)
        except Exception as error:
            status = "skipped"
            warnings.append(str(error))

    report = {
        "status": status,
        "config": {
            "samplePath": os.path.relpath(sample_path, ROOT),
            "strategy": args.strategy,
            "rerank": args.rerank,
            "limit": args.limit,
            "threshold": args.threshold,
            "maxCases": args.max_cases or len(samples),
        },
        "retrievalSummary": retrieval.get("summary", {}),
        "ragas": ragas_result,
        "cases": rows,
        "warnings": warnings,
        "generatedAt": datetime.now().isoformat(timespec="seconds"),
    }

    report["output"] = str(output_path)
    write_json(output_path, report)

    if args.json:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    else:
        print(format_console_report(report))

    return 0 if status in {"ok", "dry-run", "skipped"} else 2


if __name__ == "__main__":
    raise SystemExit(main())
