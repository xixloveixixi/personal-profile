# GitHub 仓库集成说明

## 功能说明

现在 AI 助手可以读取你的 GitHub 仓库信息来回答问题！系统会自动：

1. 获取你的公开仓库列表
2. 读取每个仓库的 README 文件
3. 获取主要代码文件（package.json、主要 TypeScript/JavaScript 文件等）
4. 将这些信息整合到知识库中

## 配置方法

### 1. 设置环境变量

在 `.env.local` 文件中添加：

```bash
# GitHub 用户名（必需）
GITHUB_USERNAME=xixloveixixi

# GitHub Token（可选，但推荐）
# 有 token 可以：
# - 避免 API 限流（无 token 每小时 60 次请求）
# - 访问私有仓库（如果有）
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
```

### 2. 获取 GitHub Token（可选）

1. 访问 https://github.com/settings/tokens
2. 点击 "Generate new token (classic)"
3. 选择权限：
   - `public_repo` - 访问公开仓库
   - `repo` - 访问私有仓库（如果需要）
4. 生成并复制 token
5. 添加到 `.env.local`

### 3. 初始化知识库

运行初始化命令，系统会自动读取 GitHub 仓库：

```bash
# 方法1: 使用 curl
curl -X POST http://localhost:3000/api/init-knowledge

# 方法2: 在浏览器访问
http://localhost:3000/api/init-knowledge

# 方法3: 使用 npm 脚本
npm run init:knowledge
```

## 功能特性

### 自动读取的内容

- ✅ 仓库基本信息（名称、描述、语言、标签、星标数）
- ✅ README.md 文件内容
- ✅ 主要代码文件（限制前 5 个，每个最多 10KB）
- ✅ 最后更新时间

### 限制说明

- 最多处理 10 个仓库（按更新时间排序）
- 每个仓库最多读取 5 个主要文件
- 每个文件最多 10KB 内容
- 自动排除 `personal-portfolio` 仓库（避免循环）

### 错误处理

- 如果 GitHub API 调用失败，不会影响其他知识库内容的初始化
- 单个仓库失败不会影响其他仓库的处理
- 会在控制台输出警告信息

## 使用示例

初始化后，AI 助手可以回答：

- "你有哪些 GitHub 项目？"
- "你的某个项目是做什么的？"
- "某个项目的技术栈是什么？"
- "某个项目的最新更新是什么时候？"

## 更新知识库

当你更新了 GitHub 仓库后（比如更新了 README、添加了新项目），需要重新初始化知识库：

```bash
curl -X POST http://localhost:3000/api/init-knowledge
```

## 注意事项

1. **API 限流**：
   - 无 token：每小时 60 次请求
   - 有 token：每小时 5000 次请求
   - 建议使用 token 避免限流

2. **私有仓库**：
   - 需要 GitHub token 且有 `repo` 权限
   - 默认只读取公开仓库

3. **文件大小限制**：
   - 只读取小于 50KB 的文件
   - 每个文件最多保留 10KB 内容
   - 避免知识库过大

4. **性能考虑**：
   - 初始化时可能需要一些时间（取决于仓库数量）
   - 建议定期更新，而不是每次聊天都更新

## 故障排查

### 问题1: 无法获取仓库信息

**可能原因：**
- GitHub 用户名错误
- API 限流（无 token 时）
- 网络问题

**解决方法：**
- 检查 `GITHUB_USERNAME` 是否正确
- 添加 `GITHUB_TOKEN` 避免限流
- 查看控制台错误信息

### 问题2: 读取的仓库内容不完整

**可能原因：**
- 仓库没有 README
- 文件太大被跳过
- API 请求失败

**解决方法：**
- 检查控制台日志
- 确认仓库有 README.md
- 检查文件大小是否超过限制

### 问题3: 初始化很慢

**可能原因：**
- 仓库数量多
- 网络慢
- API 限流

**解决方法：**
- 减少处理的仓库数量（修改代码中的 `slice(0, 10)`）
- 使用 GitHub token 提高限流
- 检查网络连接

