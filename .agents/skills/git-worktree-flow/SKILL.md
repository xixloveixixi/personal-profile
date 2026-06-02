---
name: git-worktree-flow
description: 基于 Git worktree 的隔离分支工作流。当需要用 subagent 并行开发、多个任务需要同时在不同分支推进、或希望在独立目录中完成一段需求再决定是否合并时，必须使用此 skill。触发词：「并行开发」「subagent 分工」「隔离分支」「worktree」「多任务并行」「分配给 agent」。
---

# Git Worktree 隔离分支工作流

## 为什么需要 worktree

多个 subagent 同时修改同一工作区会互相覆盖文件。`git worktree` 让每个 subagent 在独立目录 + 独立分支上工作，互不干扰，完成后统一 review 再合并。

---

## 核心命令速查

```bash
# 创建 worktree（新分支）
git worktree add ../project-feature-name -b feature/name

# 查看所有 worktree
git worktree list

# 删除 worktree（完成后清理）
git worktree remove ../project-feature-name
git branch -d feature/name
```

---

## 工作流：单任务隔离开发

适用于：一个需求想在独立分支完成，完成后再决定是否合并。

### 第 1 步：创建 worktree

```bash
# 在主仓库目录执行
git worktree add ../<repo>-<feature> -b feature/<feature>
```

命名规范：`../<仓库名>-<功能简称>`，分支名 `feature/<功能简称>`。

### 第 2 步：在 worktree 里开发

进入 worktree 目录，正常编辑文件、运行服务、提交：

```bash
cd ../<repo>-<feature>
# 开发、测试
git add <files>
git commit -m "feat: ..."
```

### 第 3 步：验收

在 worktree 目录完成验收（curl / 测试 / 编译），确认通过后再合并。

### 第 4 步：合并与清理

```bash
# 回到主工作区
cd ../<repo>

# 合并（推荐 --no-ff 保留分支记录）
git merge --no-ff feature/<feature> -m "feat: merge <feature>"

# 清理 worktree 和分支
git worktree remove ../<repo>-<feature>
git branch -d feature/<feature>
```

---

## 工作流：subagent 并行开发

适用于：把一个阶段的多个独立任务分配给多个 subagent 同时推进。

### 第 1 步：任务拆分

在分配给 subagent 之前，先确认任务之间**没有文件级依赖**（不能两个 agent 同时改同一个文件）。

### 第 2 步：为每个 subagent 创建 worktree

```bash
git worktree add ../project-task-a -b feature/task-a
git worktree add ../project-task-b -b feature/task-b
```

### 第 3 步：分配任务给 subagent

给每个 subagent 的指令里明确：
- 工作目录：`../<repo>-<task>`
- 任务范围：只改哪些文件
- 验收标准：curl / 测试命令
- 完成后：在 worktree 目录提交，不要合并

### 第 4 步：逐个 review 并合并

subagent 完成后，在主工作区逐个 review diff，确认无冲突后合并：

```bash
git merge --no-ff feature/task-a -m "feat: task-a"
git merge --no-ff feature/task-b -m "feat: task-b"
```

有冲突时手动解决，不要让 subagent 自动处理合并冲突。

### 第 5 步：清理

```bash
git worktree remove ../project-task-a
git worktree remove ../project-task-b
git branch -d feature/task-a feature/task-b
```

---

## 安全规则

- worktree 目录命名必须在主仓库目录的**同级**（`../`），不要放在主仓库内部，避免被 git 追踪。
- 合并前必须先在 worktree 里跑通验收，不允许"先合并再修"。
- 清理 worktree 前确认已提交所有变更（`git status` 应为 clean）。
- 不允许在 worktree 里执行 `git worktree remove` 自身——必须回到主工作区执行。

---

## 与 dev-harness 的配合

在 `dev-harness` 的 Gate D 里，如果当前阶段的任务可以并行，先用此 skill 创建 worktree，再分配给 subagent。

任务分配给 subagent 时，把 worktree 路径、任务范围、验收命令一并写入 subagent 的 prompt，不要让 subagent 自己决定在哪里工作。
