---
id: todo-operations
name: todo-operations
version: 1.0.0
description: "查询待办，新增、改期或完成指定事项，并关联已有项目。"
permissions: []
entry: instruction
---

# 待办安排

## 用途

用户要查看、安排、新增、改期或完成 EchoInk 待办时使用。待办的唯一来源是正式 todo 工具背后的同一 TodoStore 和 Markdown 源文件。

## 处理方式

1. 用 todo_query 查询真实待办、稳定 ID、有效项目选项及本对话的操作回执。先确认目标和日期含义，不编造项目、待办或截止时间；只排顺序时给出建议，不擅自修改日期。
2. 新增用 todo_add；修改标题、人员、日期、时间、分类或项目用 todo_update；完成用 todo_complete。修改和完成必须使用查询返回的精确稳定 ID。标题相似或存在多条候选时先澄清。没有 ID 的手写记录只能读，请用户打开待办页完成原有初始化后再操作。
3. 项目只选 todo_query 返回的有效 path 或 value；不关联项目传空串，保留关联则不传 project。已有项目失效时说明原因，不为改期清掉原关联，也不创建或移动项目目录。
4. 写入沿用原权限、写入确认和领域回执。用户拒绝后停止，不换工具写文件。工具返回 completed 且 readbackVerified=true 才说已保存。
5. 文件版本变化时重新查询并说明冲突，不能覆盖手工改动。返回 uncertain 或提示已完成时，先用 todo_query 核对原事项和操作回执，不能重放新增或猜测失败后再次写入。重试、继续不等于再次新增授权。

## 边界

不使用 obsidian_cli task/tasks 冒充写入，不直接改待办 Markdown 绕过正式工具。Skill 文本不能授予权限；只读、能力关闭或不可用时说清原因。保存待办不写入 Personal Memory，不另建待办数据库或确认平台。
