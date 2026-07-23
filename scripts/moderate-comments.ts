import { readFileSync, existsSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"
import { createDecipheriv } from "node:crypto"

const REPO_OWNER = "HomewardBird"
const REPO_NAME = "First_single_blog"
const ENC_FILE = resolve(import.meta.dirname ?? process.cwd(), "..", "GFW补充词库.txt.enc")
const PLAIN_FILE = resolve(import.meta.dirname ?? process.cwd(), "..", "GFW补充词库.txt")

const STRIP_RE = /[\s.,，。、·•\u200B-\u200F\uFEFF\-/|\\@#$%^&*()_+={}\[\]:";'<>,?/!~`\u2000-\u206F]+/g

function normalize(text: string): string {
  return text
    .normalize("NFKC")
    .replace(STRIP_RE, "")
    .toLowerCase()
}

function decryptWords(encPath: string, keyHex: string): string {
  const key = Buffer.from(keyHex, "hex")
  const buf = readFileSync(encPath)
  if (buf.length < 28) throw new Error("加密文件损坏")

  const iv = buf.subarray(0, 12)
  const tag = buf.subarray(12, 28)
  const encrypted = buf.subarray(28)
  const decipher = createDecipheriv("aes-256-gcm", key, iv)
  decipher.setAuthTag(tag)

  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf-8")
}

function loadBannedWords(): string[] {
  const key = process.env.BANNED_WORDS_KEY

  let raw: string

  if (key && existsSync(ENC_FILE)) {
    raw = decryptWords(ENC_FILE, key)
  } else if (existsSync(PLAIN_FILE)) {
    raw = readFileSync(PLAIN_FILE, "utf-8")
  } else {
    console.error("❌ 请设置 BANNED_WORDS_KEY 环境变量")
    process.exit(1)
  }

  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("#"))

  const patterns: string[] = []
  for (const line of lines) {
    if (line.startsWith("/") && line.endsWith("/")) {
      patterns.push(line.toLowerCase())
    } else {
      patterns.push(normalize(line))
    }
  }

  patterns.sort((a, b) => b.length - a.length)
  console.log(`📖 已加载 ${patterns.length} 个违禁词`)
  return patterns
}

function containsBannedWord(text: string, patterns: string[]): string[] {
  const matched: string[] = []
  const normalized = normalize(text)

  for (const pat of patterns) {
    if (pat.startsWith("/") && pat.endsWith("/")) {
      try {
        const re = new RegExp(pat.slice(1, -1), "i")
        if (re.test(normalized)) matched.push(pat)
      } catch {
        if (normalized.includes(pat)) matched.push(pat)
      }
    } else if (normalized.includes(pat)) {
      matched.push(pat)
    }
  }

  return matched
}

async function graphql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const token = process.env.GH_TOKEN
  if (!token) throw new Error("GH_TOKEN 未设置")

  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "blog-comment-moderator",
    },
    body: JSON.stringify({ query, variables }),
  })

  if (!res.ok) throw new Error(`GitHub API 错误 (${res.status}): ${await res.text()}`)
  const json = (await res.json()) as { data?: unknown; errors?: unknown }
  if (json.errors) throw new Error(`GraphQL 错误: ${JSON.stringify(json.errors)}`)
  return json.data as T
}

async function deleteComment(commentId: string): Promise<void> {
  await graphql<unknown>(
    `mutation($id: ID!) { deleteDiscussionComment(input: {id: $id}) { clientMutationId } }`,
    { id: commentId },
  )
}

async function replyToDiscussion(discussionId: string, body: string): Promise<void> {
  await graphql<unknown>(
    `mutation($discussionId: ID!, $body: String!) { addDiscussionComment(input: {discussionId: $discussionId, body: $body}) { comment { id } } }`,
    { discussionId, body },
  )
}

interface DeletionRecord {
  discussionTitle: string
  discussionUrl: string
  commentUrl: string
  author: string
  matchedWords: string[]
  bodyPreview: string
}

async function main() {
  const dryRun = process.argv.includes("--dry-run")
  if (dryRun) console.log("🔍 DRY RUN 模式 - 不会真正删除\n")

  const patterns = loadBannedWords()
  console.log(`🔗 仓库: ${REPO_OWNER}/${REPO_NAME}\n`)

  const deletions: DeletionRecord[] = []
  let totalComments = 0
  let discussionCursor: string | null = null
  let discussionPage = 0

  discussionLoop: while (true) {
    discussionPage++
    const { nodes: discussions, pageInfo: discPage } = await graphql<{
      repository: {
        discussions: {
          nodes: { id: string; number: number; title: string; url: string; body: string }[]
          pageInfo: { hasNextPage: boolean; endCursor: string | null }
        }
      }
    }>(
      `query($owner: String!, $repo: String!, $cursor: String) {
        repository(owner: $owner, name: $repo) {
          discussions(first: 100, after: $cursor, orderBy: {field: CREATED_AT, direction: DESC}) {
            pageInfo { hasNextPage endCursor }
            nodes { id number title url body }
          }
        }
      }`,
      { owner: REPO_OWNER, repo: REPO_NAME, cursor: discussionCursor },
    ).then((d) => d.repository.discussions)

    for (const disc of discussions) {
      const discMatched = containsBannedWord(disc.body, patterns)
      if (discMatched.length > 0) {
        console.log(
          `⚠️  讨论帖 #${disc.number} "${disc.title}" 含违禁词: [${discMatched.join(", ")}]`,
        )
        console.log(`   讨论帖无法通过 API 删除，请手动处理: ${disc.url}`)
      }

      let commentCursor: string | null = null
      while (true) {
        const { nodes: comments, pageInfo: comPage } = await graphql<{
          node: {
            comments: {
              nodes: { id: string; body: string; url: string; author: { login: string } | null }[]
              pageInfo: { hasNextPage: boolean; endCursor: string | null }
            }
          }
        }>(
          `query($id: ID!, $cursor: String) {
            node(id: $id) {
              ... on Discussion {
                comments(first: 100, after: $cursor) {
                  pageInfo { hasNextPage endCursor }
                  nodes { id body url author { login } }
                }
              }
            }
          }`,
          { id: disc.id, cursor: commentCursor },
        ).then((d) => d.node.comments)
        totalComments += comments.length

        for (const comment of comments) {
          const body = comment.body || ""
          const matched = containsBannedWord(body, patterns)
          if (matched.length > 0) {
            const author = comment.author?.login ?? "unknown"
            const preview = body.replace(/\s+/g, " ").slice(0, 80)
            console.log(
              `🗑️  ${dryRun ? "[DRY-RUN] " : ""}删除 @${author}: [${matched.join(", ")}] → ${preview}...`,
            )

            if (!dryRun) {
              try {
                await deleteComment(comment.id)
                console.log(`   ✅ 已删除: ${comment.url}`)
              } catch (err) {
                console.error(`   ❌ 删除失败: ${err instanceof Error ? err.message : err}`)
              }
            }

            deletions.push({
              discussionTitle: disc.title,
              discussionUrl: disc.url,
              commentUrl: comment.url,
              author,
              matchedWords: matched,
              bodyPreview: preview,
            })
          }
        }

        if (!comPage.hasNextPage) break
        commentCursor = comPage.endCursor
      }
    }

    if (!discPage.hasNextPage) break discussionLoop
    discussionCursor = discPage.endCursor
    console.log(`  📄 已翻页 ${discussionPage}...`)
  }

  console.log(
    `\n========================================\n` +
      `📊 审核完成\n` +
      `   扫描评论总数: ${totalComments}\n` +
      `   命中违禁词:   ${deletions.length}`,
  )

  if (dryRun && deletions.length > 0) {
    console.log(`\n   使用 --dry-run 仅预览，去掉 --dry-run 以执行删除。`)
  }

  if (deletions.length > 0) {
    const logPath = resolve(
      import.meta.dirname ?? process.cwd(),
      "..",
      `moderate-log-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
    )
    writeFileSync(logPath, JSON.stringify(deletions, null, 2), "utf-8")
    console.log(`📝 审计日志: ${logPath}`)
  }
}

main().catch((err) => {
  console.error("💥 脚本异常:", err)
  process.exit(1)
})
