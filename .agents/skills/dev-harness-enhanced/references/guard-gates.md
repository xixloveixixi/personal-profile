# 软硬门禁规则

## 核心逻辑

AI 代码完成 → 自动进入 GUARD_CHECK，按顺序执行门禁检查链：

```
CODING 完成
    ↓
GUARD_CHECK
    1. gofmt（软）→ 通过 → 下一项
                   → 失败 → AUTO_FIX → 修复 → 重新检查
                                       → 2 轮不收敛 → HARD_FAIL
    2. golangci-lint（软）→ 同上
    3. tsc --noEmit（软）→ 失败 → 当前无可修复 skill → HARD_FAIL
    4. go build ./...（硬）→ 失败 → HARD_FAIL
    5. npm run build（硬）→ 失败 → HARD_FAIL
    全部通过 → ACCEPTANCE
```

## 门禁映射

### 软门禁（AI 可自动修复）

| 检查项 | 检查命令 | 修复 skill | 失败处理 |
|--------|---------|-----------|---------|
| Go 格式 | `gofmt -l backend/` | `code-formatter` | 自动修复后重新检查；2 轮相同错误 → HARD_FAIL |
| Go lint | `golangci-lint run ./...` | `lint-fixer` | 同上 |
| TS 类型 | `npx tsc --noEmit` | — | 无可修复 skill，直接升级为硬门禁 |
| Prettier | `npx prettier --check app/` | `code-formatter` | 自动修复后重新检查；2 轮不收敛 → HARD_FAIL |

### 硬门禁（必须用户决策）

| 检查项 | 检查命令 | 失败处理 |
|--------|---------|---------|
| Go 构建 | `go build ./...` | 输出卡点报告，等待用户决策 |
| 前端构建 | `npm run build` | 同上 |
| 集成测试 | `go test ./...` | 同上 |

## 输出格式

### 全部通过

```
[FSM: GUARD_CHECK → 通过]

门禁检查结果：
- ✅ gofmt: 通过
- ✅ golangci-lint: 通过
- ✅ tsc --noEmit: 通过
- ✅ go build ./...: 通过
- ✅ npm run build: 通过

进入 ACCEPTANCE，请验收。
```

### 硬门禁失败

```
[FSM: HARD_FAIL]

门禁项：go build ./... → 失败

错误输出：
[实际 terminal 输出，截取错误部分]

建议修复方向：
[AI 分析，如：xxx 包未导入 / xxx 字段不存在]

请确认：修复 / 忽略继续？
```
