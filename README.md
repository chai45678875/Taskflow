[README.md](https://github.com/user-attachments/files/30158273/README.md)
# TaskFlow - 每日事务管家

帮助你每天决定「做什么」的智能任务管理系统。

## 功能特性

- ✅ **任务管理**：添加/编辑/删除/完成/延期任务
- ✅ **优先级自动计算**：基于类别、死线自动推荐 Top 3
- ✅ **用户主导**：可手动调整顺序，系统学习你的偏好
- ✅ **重复任务**：每日/每周重复任务自动生成
- ✅ **任务标签**：6种预设标签（AI/英语/比赛/课程/项目/生活）
- ✅ **周复盘统计**：完成率、类别分布、标签分布一目了然
- ✅ **每日提醒**：浏览器桌面通知

## 快速开始

### 1. 启动后端

```bash
cd taskflow/backend
pip install -r requirements.txt
python app.py
```

后端服务将在 `http://localhost:5000` 启动。

### 2. 启动前端

```bash
cd taskflow/frontend
npm install
npm run dev
```

前端服务将在 `http://localhost:5173` 启动。

### 3. 打开浏览器

访问 `http://localhost:5173`

## 使用说明

### 添加任务

1. 点击右上角「+ 添加任务」
2. 填写任务名称（必填）
3. 选择类别：
   - **A 类**：核心学习任务，优先级最高
   - **B 类**：有截止日期的任务
   - **C 类**：弹性任务，可延后
4. 选择标签：🤖 人工智能 / 📝 英语 / 🏆 比赛 / 📚 课程 / 💻 项目 / 🏠 生活
5. 设置截止日期（可选）
6. 设置重复周期（可选）

### 每日工作流

1. **早晨**：打开应用，查看系统推荐的 Top 3 任务
2. **采纳或调整**：一键采纳推荐，或拖拽调整顺序
3. **执行任务**：完成一项点击 ✓，不想做可以延期 →
4. **晚上**：查看本周统计，了解学习投入

### 优先级说明

```
优先级得分 = 基础权重 × 时间紧迫度 × 类别加成

A 类任务：基础权重 100，类别加成 ×1.3
B 类任务：基础权重 80
C 类任务：基础权重 40

时间紧迫度：
- 已过期：×5.0
- 今天到期：×3.0
- 明天到期：×2.5
- 3天内到期：×2.0
- 7天内到期：×1.5
```

### 启用每日提醒

1. 首次使用会弹出通知权限请求，点击「允许」
2. 或点击右上角「🔔 测试通知」手动授权
3. 开启后，每天 08:00 会收到桌面通知

## 技术栈

- **后端**：Python Flask + SQLite
- **前端**：React + Tailwind CSS
- **通信**：REST API

## 项目结构

```
taskflow/
├── backend/
│   ├── app.py          # Flask 主应用 + API 路由
│   ├── database.py     # 数据库操作
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx     # 主组件（所有视图）
│   │   └── main.jsx    # 入口文件
│   ├── index.html
│   └── package.json
└── README.md
```

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/tasks | 获取所有任务 |
| GET | /api/tasks/today | 获取今日任务（含推荐）|
| POST | /api/tasks | 创建任务 |
| PUT | /api/tasks/:id | 更新任务 |
| DELETE | /api/tasks/:id | 删除任务 |
| POST | /api/tasks/:id/complete | 完成任务 |
| POST | /api/tasks/:id/defer | 延期任务 |
| POST | /api/tasks/order | 保存任务顺序 |
| GET | /api/stats/weekly | 获取周统计 |

## 数据存储

所有数据存储在本地 SQLite 数据库 `taskflow/backend/taskflow.db`。

## 后续开发

- [ ] 偏好学习优化推荐算法
- [ ] 数据导出（JSON/CSV）
- [ ] 多周历史对比
- [ ] 定时提醒服务

---

祝你学习顺利！🚀
