/**
 * GitHub 仓库信息获取
 * 用于将 GitHub 仓库内容整合到知识库中
 */

interface GitHubRepo {
  name: string
  full_name: string
  description: string
  html_url: string
  language: string
  topics: string[]
  stargazers_count: number
  updated_at: string
}

interface GitHubFile {
  name: string
  path: string
  type: 'file' | 'dir'
  content?: string
  size: number
}

/**
 * 获取用户的公开仓库列表
 */
export async function getUserRepos(
  username: string,
  token?: string
): Promise<GitHubRepo[]> {
  const headers: HeadersInit = {
    Accept: 'application/vnd.github.v3+json',
  }

  if (token) {
    headers.Authorization = `token ${token}`
  }

  const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=20`, {
    headers,
  })

  if (!response.ok) {
    throw new Error(`GitHub API 错误: ${response.status} ${response.statusText}`)
  }

  const repos: GitHubRepo[] = await response.json()
  return repos.filter((repo) => !repo.name.includes('personal-portfolio')) // 排除当前仓库
}

/**
 * 获取仓库的 README 内容
 */
export async function getRepoReadme(
  owner: string,
  repo: string,
  token?: string
): Promise<string | null> {
  const headers: HeadersInit = {
    Accept: 'application/vnd.github.v3+json',
  }

  if (token) {
    headers.Authorization = `token ${token}`
  }

  try {
    // 尝试获取 README.md
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/readme`,
      { headers }
    )

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    
    // Base64 解码
    if (data.content && data.encoding === 'base64') {
      const content = Buffer.from(data.content, 'base64').toString('utf-8')
      return content
    }

    return null
  } catch (error) {
    console.warn(`获取 ${owner}/${repo} 的 README 失败:`, error)
    return null
  }
}

/**
 * 获取仓库的主要代码文件（限制大小，避免过大）
 */
export async function getRepoMainFiles(
  owner: string,
  repo: string,
  token?: string,
  maxSize = 50000 // 50KB
): Promise<Array<{ path: string; content: string }>> {
  const headers: HeadersInit = {
    Accept: 'application/vnd.github.v3+json',
  }

  if (token) {
    headers.Authorization = `token ${token}`
  }

  const files: Array<{ path: string; content: string }> = []

  try {
    // 获取仓库的根目录内容
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents`,
      { headers }
    )

    if (!response.ok) {
      return files
    }

    const contents: GitHubFile[] = await response.json()

    // 只处理主要文件（README、package.json、主要代码文件等）
    const importantFiles = contents.filter(
      (file) =>
        file.type === 'file' &&
        file.size < maxSize &&
        (file.name === 'README.md' ||
          file.name === 'package.json' ||
          file.name === 'README.md' ||
          file.name.endsWith('.ts') ||
          file.name.endsWith('.tsx') ||
          file.name.endsWith('.js') ||
          file.name.endsWith('.jsx'))
    )

    // 限制文件数量
    const filesToFetch = importantFiles.slice(0, 5)

    for (const file of filesToFetch) {
      try {
        const fileResponse = await fetch(file.download_url || '', { headers })
        if (fileResponse.ok) {
          const content = await fileResponse.text()
          files.push({
            path: file.path,
            content: content.substring(0, 10000), // 限制每个文件最多10KB
          })
        }
      } catch (error) {
        console.warn(`获取文件 ${file.path} 失败:`, error)
      }
    }
  } catch (error) {
    console.warn(`获取 ${owner}/${repo} 的文件列表失败:`, error)
  }

  return files
}

/**
 * 获取仓库的完整信息（包括 README 和主要文件）
 */
export async function getRepoFullInfo(
  owner: string,
  repo: string,
  token?: string
): Promise<{
  repo: GitHubRepo
  readme: string | null
  mainFiles: Array<{ path: string; content: string }>
}> {
  const headers: HeadersInit = {
    Accept: 'application/vnd.github.v3+json',
  }

  if (token) {
    headers.Authorization = `token ${token}`
  }

  const [repoInfo, readme, mainFiles] = await Promise.all([
    fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`获取仓库信息失败: ${res.status}`)
        }
        return res.json() as Promise<GitHubRepo>
      }),
    getRepoReadme(owner, repo, token),
    getRepoMainFiles(owner, repo, token),
  ])

  return {
    repo: repoInfo,
    readme,
    mainFiles,
  }
}

