import { readFileSync, existsSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"
import { createDecipheriv } from "node:crypto"

const REPO_OWNER = "HomewardBird"
const REPO_NAME = "First_single_blog"
const ENC_FILE = resolve(import.meta.dirname ?? process.cwd(), "..", "GFW补充词库.txt.enc")
const PLAIN_FILE = resolve(import.meta.dirname ?? process.cwd(), "..", "GFW补充词库.txt")
const ADMIN_USERS = (process.env.ADMIN_USERS ?? "HomewardBird").split(",").map((s) => s.trim().toLowerCase())
const RATE_LIMIT_WINDOW = 60 // 秒
const RATE_LIMIT_MAX = 3 // 时间窗口内最多违规次数

const STRIP_RE = /[\s.,，。、·•\u200B-\u200F\uFEFF\-/|\\@#$%^&*()_+={}\[\]:";'<>,?/!~`\u2000-\u206F]+/g

function normalize(text: string): string {
  return text.normalize("NFKC").replace(STRIP_RE, "").toLowerCase()
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
        if (new RegExp(pat.slice(1, -1), "i").test(normalized)) matched.push(pat)
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
  const json = (await res.json()) as { data?: T; errors?: unknown }
  if (json.errors) throw new Error(`GraphQL 错误: ${JSON.stringify(json.errors)}`)
  return json.data as T
}

async function rest(method: string, path: string, body?: unknown): Promise<Response> {
  const token = process.env.GH_TOKEN
  if (!token) throw new Error("GH_TOKEN 未设置")
  return fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "blog-comment-moderator",
    },
    body: body ? JSON.stringify(body) : undefined,
  })
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

interface CommentInfo {
  id: string
  author: string
  createdAt: string
  body: string
}

async function fetchRecentComments(discussionId: string): Promise<CommentInfo[]> {
  const data = await graphql<{
    node: {
      comments: {
        nodes: { id: string; author: { login: string } | null; createdAt: string; body: string }[]
      }
    }
  }>(
    `query($id: ID!) {
      node(id: $id) {
        ... on Discussion {
          comments(first: 100, orderBy: {field: CREATED_AT, direction: DESC}) {
            nodes { id author { login } createdAt body }
          }
        }
      }
    }`,
    { id: discussionId },
  )
  return data.node.comments.nodes.map((n) => ({
    id: n.id,
    author: n.author?.login ?? "unknown",
    createdAt: n.createdAt,
    body: n.body,
  }))
}

async function blockUser(username: string): Promise<boolean> {
  const res = await rest("PUT", `/user/blocks/${username}`)
  if (res.status === 204) return true
  if (res.status === 404) {
    console.log(`⚠️  Token 没有 user 权限，无法封禁 @${username}`)
    return false
  }
  console.error(`   封禁失败 (${res.status}): ${await res.text()}`)
  return false
}

function logHit(author: string, matched: string[], body: string, url: string, blocked: boolean) {
  const entry = {
    timestamp: new Date().toISOString(),
    author,
    matchedWords: matched,
    bodyOriginal: body.replace(/\s+/g, " ").slice(0, 200),
    commentUrl: url,
    blocked,
  }
  const logPath = resolve(import.meta.dirname ?? process.cwd(), "..", "moderation-log.jsonl")
  writeFileSync(logPath, JSON.stringify(entry) + "\n", { flag: "a" })
}

async function main() {
  const eventPath = process.env.GITHUB_EVENT_PATH
  if (!eventPath) {
    console.error("❌ 请在 GitHub Actions 中运行此脚本")
    process.exit(1)
  }

  const event = JSON.parse(readFileSync(eventPath, "utf-8"))
  if (event.action !== "created") {
    console.log(`⏭️  忽略事件: discussion_comment.${event.action}`)
    process.exit(0)
  }

  const comment = event.comment
  const commentId: string = comment.node_id
  const discussionId: string = comment.discussion_node_id
  const author: string = comment.user?.login ?? "unknown"
  const body: string = comment.body ?? ""
  const htmlUrl: string = comment.html_url ?? ""

  console.log(`👤 @${author}`)
  console.log(`💬 ${body.slice(0, 100)}${body.length > 100 ? "..." : ""}`)

  if (ADMIN_USERS.includes(author.toLowerCase())) {
    console.log(`👑 管理员 @${author}，跳过审核`)
    process.exit(0)
  }

  const patterns = loadBannedWords()
  const matched = containsBannedWord(body, patterns)

  if (matched.length === 0) {
    console.log("✅ 未检测到违禁词，放行")
    process.exit(0)
  }

  console.log(`🚫 命中: [${matched.join(", ")}]`)

  // 速度限制：查询该作者在讨论中的近况
  const recent = await fetchRecentComments(discussionId)
  const now = Date.now()
  const authorComments = recent.filter((c) => c.author === author)
  const authorRecent = authorComments.filter(
    (c) => (now - new Date(c.createdAt).getTime()) / 1000 < RATE_LIMIT_WINDOW,
  )
  const recentViolations = recent.filter(
    (c) =>
      c.body.includes("违禁词") &&
      c.body.includes(author) &&
      (now - new Date(c.createdAt).getTime()) / 1000 < RATE_LIMIT_WINDOW,
  )

  console.log(
    `📊 @${author} 近${RATE_LIMIT_WINDOW}秒发评 ${authorRecent.length} 条，已有警告 ${recentViolations.length} 次`,
  )

  const isSpam =
    authorRecent.length > RATE_LIMIT_MAX * 2 || recentViolations.length >= RATE_LIMIT_MAX

  await deleteComment(commentId)
  console.log("🗑️  评论已删除")

  let blocked = false
  if (isSpam) {
    blocked = await blockUser(author)
    if (blocked) console.log(`🚷 已封禁 @${author}`)
    await replyToDiscussion(
      discussionId,
      `🚷 @${author} 因短时间大量发送违禁内容，已被**永久封禁**。`,
    )
  } else {
    const warnCount = recentViolations.length + 1
    const warnMsg =
      warnCount >= 2
        ? `⚠️ 第 ${warnCount} 次警告！再犯将被封禁。`
        : "请修改后重新发布，谢谢配合。 🙏"
    await replyToDiscussion(
      discussionId,
      [
        `👋 @${author}，您的评论因包含**违禁词**已被自动移除。`,
        "",
        `> 命中的违禁词: **${matched.join("**、**")}**`,
        "",
        warnMsg,
      ].join("\n"),
    )
  }
  console.log("💬 已回复")

  logHit(author, matched, body, htmlUrl, blocked)
  console.log("📝 日志已记录")
}

main().catch((err) => {
  console.error("💥 脚本异常:", err)
  process.exit(1)
})
