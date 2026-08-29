/* 批量补写页面 frontmatter description（一次性脚本）
 * 使用：node scripts/add-descriptions.mjs
 */
import { readFileSync, writeFileSync } from "node:fs"

const MAP = [
  {
    file: "content/个人博客.md",
    hasFm: true,
    add: { description: "站内导航都在这：计算机入门指南、杂谈、随笔，挑个感兴趣的慢慢看。" },
  },
  {
    file: "content/杂谈/01 网名的故事.md",
    hasFm: false,
    add: {
      title: "网名的故事",
      description: "「安巢鸟」这网名哪来的？关于起名这件小事的一段碎碎念。",
    },
  },
  {
    file: "content/杂谈/index.md",
    hasFm: true,
    add: { description: "没啥意义的碎碎念都放这了：网名、生活、转瞬即逝的想法，欢迎来聊。" },
  },
  {
    file: "content/计算机入门指南/index.md",
    hasFm: true,
    add: {
      description: "从零开始的计算机入门教程：硬件、系统、软件、使用习惯，写给想用明白电脑的新手。",
    },
  },
  {
    file: "content/计算机入门指南/基础入门/01 硬件相关知识.md",
    hasFm: false,
    add: {
      title: "01 硬件相关知识",
      description: "从主板到电源，大白话讲清电脑各部件是干嘛的、怎么挑好坏，防止被奸商当肥羊宰。",
    },
  },
  {
    file: "content/计算机入门指南/基础入门/02 你该知道的电脑认知.md",
    hasFm: false,
    add: {
      title: "02 你该知道的电脑认知",
      description: "商家为什么爱“骗人”？搞懂这些电脑认知，后面学什么都顺理成章。",
    },
  },
  {
    file: "content/计算机入门指南/基础入门/03 哇，新电脑.md",
    hasFm: false,
    add: {
      title: "03 哇，新电脑",
      description: "新电脑到手怎么开荒？激活、设置、避坑指南，一步步带你把新机玩明白。",
    },
  },
  {
    file: "content/计算机入门指南/基础入门/04 从懂电脑到救电脑.md",
    hasFm: false,
    add: {
      title: "04 从懂电脑到救电脑",
      description: "电脑卡慢自救手册：系统维护、良好习惯，让几千块的电脑发挥它该有的价值。",
    },
  },
  {
    file: "content/计算机入门指南/基础入门/05 软件推荐.md",
    hasFm: false,
    add: {
      title: "05 软件推荐",
      description: "GitHub 是什么？解压、下载、装机必备软件推荐，实用为主，新手友好。",
    },
  },
  {
    file: "content/计算机入门指南/基础入门/06 结束感言.md",
    hasFm: false,
    add: {
      title: "06 结束感言",
      description: "基础篇完结：学完这几章，你已经掌握了大部分电脑知识和操作，够用了。",
    },
  },
  {
    file: "content/计算机入门指南/基础入门/index.md",
    hasFm: false,
    add: {
      title: "基础入门",
      description: "电脑基础入门：组成、系统、常用软件与使用习惯，为用好电脑打下基础。",
    },
  },
  {
    file: "content/计算机入门指南/知识分享/index.md",
    hasFm: false,
    add: {
      title: "知识分享",
      description: "电脑之外的电子产品使用心得：碰到问题怎么解决，欢迎一起讨论。",
    },
  },
  {
    file: "content/随笔/index.md",
    hasFm: true,
    add: { description: "零碎的想法、短暂的心情，随手记在这里，多半是些废话。" },
  },
]

for (const { file, hasFm, add } of MAP) {
  let content = readFileSync(file, "utf8")
  if (hasFm) {
    if (content.startsWith("---\n")) {
      const end = content.indexOf("\n---", 4)
      if (end === -1) throw new Error(`${file}: frontmatter 未闭合`)
      const fm = content.slice(4, end)
      const body = content.slice(end + 4)
      let lines = fm.split("\n").filter((l) => l.trim() !== "")
      for (const [k, v] of Object.entries(add)) {
        if (!lines.some((l) => l.startsWith(`${k}:`))) lines.push(`${k}: ${v}`)
      }
      content = `---\n${lines.join("\n")}\n---${body}`
    } else {
      throw new Error(`${file}: 标记有 frontmatter 但实际没有`)
    }
  } else {
    const fm = Object.entries(add)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n")
    content = `---\n${fm}\n---\n\n${content.replace(/^\s*/, "")}`
  }
  writeFileSync(file, content)
  console.log(`✅ ${file}`)
}
console.log("done")
