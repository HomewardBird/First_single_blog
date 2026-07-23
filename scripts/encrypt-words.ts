import { readFileSync, writeFileSync, existsSync } from "node:fs"
import { resolve } from "node:path"
import { randomBytes, createCipheriv } from "node:crypto"

const INPUT = resolve(import.meta.dirname ?? process.cwd(), "..", "GFW补充词库.txt")
const OUTPUT = INPUT + ".enc"
const ALGO = "aes-256-gcm"
const IV_LEN = 12

if (!existsSync(INPUT)) {
  console.error(`❌ 文件不存在: ${INPUT}`)
  process.exit(1)
}

let keyHex = process.env.BANNED_WORDS_KEY

if (keyHex) {
  if (!/^[0-9a-fA-F]{64}$/.test(keyHex)) {
    console.error("❌ BANNED_WORDS_KEY 格式错误，应为 64 位 hex 字符串")
    process.exit(1)
  }
  console.log("🔑 使用环境变量 BANNED_WORDS_KEY 中的密钥")
} else {
  keyHex = randomBytes(32).toString("hex")
  console.log("🔑 已生成新密钥（仅此一次）:")
  console.log()
  console.log(`   ${keyHex}`)
  console.log()
  console.log("⚠️  请立即复制上面的密钥，存入 GitHub Secret (BANNED_WORDS_KEY)")
  console.log("   然后重新运行: set BANNED_WORDS_KEY=<密钥> && npx tsx scripts/encrypt-words.ts")
  console.log("   用相同密钥再次加密后，.enc 文件才能被 Actions 正确解密")
  console.log()
}

const key = Buffer.from(keyHex, "hex")
const iv = randomBytes(IV_LEN)
const cipher = createCipheriv(ALGO, key, iv)

const plaintext = readFileSync(INPUT)
const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()])
const tag = cipher.getAuthTag()
const output = Buffer.concat([iv, tag, encrypted])

writeFileSync(OUTPUT, output)

console.log(`✅ 加密完成: ${OUTPUT} (${(output.length / 1024).toFixed(1)} KB)`)
