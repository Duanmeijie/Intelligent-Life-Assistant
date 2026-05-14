# 智能生活助手 (Intelligent Life Assistant)

> 一款面向个人的时间管理与习惯追踪全栈 Web 应用，帮助用户高效管理日程、培养良好习惯、记录每日打卡，并结合社交互动与 AI 推荐提升自我管理效率。

---

## 目录

- [项目简介](#项目简介)
- [功能特性](#功能特性)
- [技术栈](#技术栈)
- [系统架构](#系统架构)
- [快速开始](#快速开始)
- [环境变量配置](#环境变量配置)
- [数据库表结构](#数据库表结构)
- [API 接口文档](#api-接口文档)
- [测试指南](#测试指南)
- [项目结构](#项目结构)
- [开发规范](#开发规范)
- [贡献指南](#贡献指南)
- [常见问题](#常见问题)
- [许可证](#许可证)

---

## 项目简介

智能生活助手（Intelligent Life Assistant）是一个全栈 Web 应用，旨在通过数字化的手段帮助用户科学管理时间、培养良好习惯。系统涵盖了日程管理、习惯追踪、每日打卡、社交社区、数据可视化和 AI 智能推荐六大核心功能模块。

### 目标用户

- **普通用户**：希望提升个人时间管理能力和养成良好习惯的职场人士、学生群体
- **开发者**：希望学习 Vue 3 + Express 全栈开发的技术爱好者

---

## 功能特性

### 用户体系
- 用户注册（用户名 + 邮箱 + 密码，bcrypt 加密）
- 用户登录（JWT Token 认证，有效期 7 天）
- 个人信息编辑（昵称、头像、个性签名）
- 密码修改

### 时间管理
- 日程创建、编辑、删除、查看
- 日程分类（工作、学习、生活、运动、其他）
- 日程状态管理（待办、进行中、已完成、已取消）
- 按日期范围/分类/状态筛选

### 习惯追踪
- 习惯创建、编辑、删除
- 习惯频率设置（每日、每周、每月、自定义）
- 习惯分类管理
- 习惯活跃/暂停控制

### 打卡记录
- 每日打卡签到
- 重复打卡校验（同一习惯同一天不可重复）
- 打卡记录查询与撤销
- 连续打卡天数统计
- 打卡完成率统计

### 社交社区
- 动态发布（支持多图片）
- 点赞与取消点赞
- 动态评论
- 社区广场与个人时间线

### 数据可视化
- 习惯完成率统计图表（ECharts 柱状图）
- 年度打卡热力图
- 日程分类分布图
- 个人成长趋势图

### AI 智能推荐
- 基于打卡数据的智能习惯推荐
- 个性化日程优化建议
- 效率分析报告（含强弱项识别与改进建议）

---

## 技术栈

### 前端

| 技术 | 版本 | 说明 |
|------|------|------|
| Vue 3 | ^3.4.0 | 渐进式 JavaScript 框架（Composition API） |
| Vite | ^5.4.0 | 构建工具与开发服务器 |
| Pinia | ^2.1.0 | 状态管理 |
| Vue Router | ^4.3.0 | 路由管理（History 模式） |
| Element Plus | ^2.7.0 | UI 组件库 |
| Axios | ^1.7.0 | HTTP 请求库 |
| ECharts 5 | ^5.5.0 | 数据可视化 |
| vue-echarts | ^6.7.0 | Vue 3 ECharts 封装 |
| Day.js | ^1.11.0 | 日期处理库 |

### 后端

| 技术 | 版本 | 说明 |
|------|------|------|
| Node.js | 18+ | 运行环境 |
| Express | ^4.18.2 | Web 框架 |
| MySQL2 | ^3.6.5 | MySQL 数据库驱动（连接池模式） |
| ioredis | ^5.3.2 | Redis 客户端 |
| jsonwebtoken | ^9.0.2 | JWT Token 签发与验证 |
| bcryptjs | ^2.4.3 | 密码加密哈希 |
| express-validator | ^7.0.1 | 请求参数校验 |
| morgan | ^1.10.0 | HTTP 请求日志 |

### 数据库

| 数据库 | 版本 | 用途 |
|--------|------|------|
| MySQL | 8.0+ | 主业务数据存储（7 张表） |
| Redis | 6.0+ | 缓存 / Token 黑名单 |

---

## 系统架构

### 整体架构

```
┌─────────────────────────────────────────────────┐
│                 客户端 (Vue 3)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │  Views   │  │ Components│  │ Pinia Stores │  │
│  └────┬─────┘  └────┬─────┘  └──────┬───────┘  │
│       └──────────────┴──────────────┘           │
│                      │                          │
│              ┌───────┴───────┐                  │
│              │  Axios 请求层  │                  │
│              └───────┬───────┘                  │
└──────────────────────┼──────────────────────────┘
                       │ HTTP RESTful API
┌──────────────────────┼──────────────────────────┐
│                 服务端 (Express)                  │
│  ┌──────────┐ ┌──────┴─────┐ ┌──────────────┐  │
│  │Middleware│ │  Routes    │ │  Controllers  │  │
│  │ · 认证   │ │  (路由)    │ │  (控制器)     │  │
│  │ · 校验   │ │            │ │              │  │
│  │ · 日志   │ │            │ │              │  │
│  │ · 错误处理│ │            │ │              │  │
│  └──────────┘ └────────────┘ └──────┬───────┘  │
│                                      │          │
│                           ┌──────────┴──────┐   │
│                           │    Models       │   │
│                           │  (数据模型层)    │   │
│                           └────────┬────────┘   │
│                    ┌───────────────┼────────┐   │
│                    ▼               ▼        ▼   │
│              ┌─────────┐   ┌─────────┐         │
│              │  MySQL  │   │  Redis  │         │
│              └─────────┘   └─────────┘         │
└─────────────────────────────────────────────────┘
```

### 前后端分离

- **前端**：Vite + Vue 3，运行在 `localhost:5173`
- **后端**：Express，运行在 `localhost:3000`
- **代理**：开发期通过 Vite 代理转发 `/api` 请求到后端

---

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- MySQL >= 8.0
- Redis >= 6.0（可选，用于缓存）
- npm >= 9.0.0

### 1. 克隆项目

```bash
git clone https://github.com/<your-username>/Intelligent-Life-Assistant.git
cd Intelligent-Life-Assistant
```

### 2. 数据库初始化

```bash
# 登录 MySQL
mysql -u root -p

# 创建数据库
CREATE DATABASE IF NOT EXISTS intelligent_life_assistant
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

# 导入表结构和初始数据
source server/sql/init.sql

# 退出 MySQL
exit
```

### 3. 后端安装与启动

```bash
cd server

# 安装依赖
npm install

# 配置环境变量（复制并编辑）
cp .env.example .env
# 编辑 .env 文件，配置数据库连接信息

# 启动后端（开发模式，支持热重载）
npm run dev

# 或生产模式启动
npm start

# 后端默认运行在 http://localhost:3000
```

### 4. 前端安装与启动

```bash
cd client

# 安装依赖
npm install

# 启动前端（开发模式）
npm run dev

# 前端默认运行在 http://localhost:5173
```

### 5. 访问应用

打开浏览器访问：[http://localhost:5173](http://localhost:5173)

---

## 环境变量配置

### 后端 `.env` 文件

```env
# 服务器配置
PORT=3000
NODE_ENV=development

# MySQL 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=intelligent_life_assistant

# Redis 配置（可选）
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT 配置
JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_EXPIRES_IN=7d
```

> **注意**：`.env` 文件包含敏感信息，已加入 `.gitignore`，不会被提交到仓库。请参考 `.env.example` 创建自己的配置文件。

---

## 数据库表结构

系统共包含 7 张数据表，使用 InnoDB 引擎 + utf8mb4 字符集：

### users（用户表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT PRIMARY KEY AUTO_INCREMENT | 用户 ID |
| username | VARCHAR(50) UNIQUE NOT NULL | 用户名 |
| email | VARCHAR(100) UNIQUE NOT NULL | 邮箱 |
| password | VARCHAR(255) NOT NULL | 密码（bcrypt 加密） |
| nickname | VARCHAR(50) | 昵称 |
| avatar | VARCHAR(255) | 头像 URL |
| bio | VARCHAR(255) | 个性签名 |
| status | TINYINT DEFAULT 1 | 状态（0=禁用, 1=正常） |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

### schedules（日程表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT PRIMARY KEY AUTO_INCREMENT | 日程 ID |
| user_id | INT NOT NULL | 用户 ID（FK） |
| title | VARCHAR(100) NOT NULL | 标题 |
| description | TEXT | 描述 |
| category | ENUM('work','study','life','sports','other') | 分类 |
| status | ENUM('pending','in_progress','completed','cancelled') | 状态 |
| start_time | DATETIME NOT NULL | 开始时间 |
| end_time | DATETIME NOT NULL | 结束时间 |

### habits（习惯表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT PRIMARY KEY AUTO_INCREMENT | 习惯 ID |
| user_id | INT NOT NULL | 用户 ID（FK） |
| name | VARCHAR(100) NOT NULL | 习惯名称 |
| frequency | ENUM('daily','weekly','monthly','custom') | 频率 |
| color | VARCHAR(7) DEFAULT '#409EFF' | 颜色标记 |
| is_active | TINYINT DEFAULT 1 | 是否启用 |

### checkins（打卡记录表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT PRIMARY KEY AUTO_INCREMENT | 记录 ID |
| user_id | INT NOT NULL | 用户 ID（FK） |
| habit_id | INT NOT NULL | 习惯 ID（FK） |
| checkin_date | DATE NOT NULL | 打卡日期 |
| UNIQUE(habit_id, checkin_date) | 防止重复打卡 |

### social_posts（社交动态表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT PRIMARY KEY AUTO_INCREMENT | 动态 ID |
| user_id | INT NOT NULL | 用户 ID（FK） |
| content | TEXT NOT NULL | 内容 |
| images | JSON | 图片列表 |
| likes_count | INT DEFAULT 0 | 点赞数 |
| comments_count | INT DEFAULT 0 | 评论数 |

### social_comments（评论表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT PRIMARY KEY AUTO_INCREMENT | 评论 ID |
| post_id | INT NOT NULL | 动态 ID（FK） |
| user_id | INT NOT NULL | 用户 ID（FK） |
| parent_id | INT | 父评论 ID（回复） |
| content | TEXT NOT NULL | 评论内容 |

### social_likes（点赞表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT PRIMARY KEY AUTO_INCREMENT | 点赞 ID |
| user_id | INT NOT NULL | 用户 ID（FK） |
| post_id | INT NOT NULL | 动态 ID（FK） |
| UNIQUE(user_id, post_id) | 防止重复点赞 |

> 完整建表语句请参考 `server/sql/init.sql`

---

## API 接口文档

### 统一响应格式

```json
// 成功响应
{
  "success": true,
  "code": 200,
  "message": "操作成功",
  "data": {}
}

// 错误响应
{
  "success": false,
  "code": 400,
  "message": "错误描述"
}

// 分页响应
{
  "success": true,
  "code": 200,
  "message": "获取成功",
  "data": {
    "list": [],
    "total": 100,
    "page": 1,
    "pageSize": 10,
    "totalPages": 10
  }
}
```

### HTTP 状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未认证 / JWT 过期 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 409 | 资源冲突 |
| 500 | 服务器内部错误 |

### 认证模块 `/api/auth`

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | /api/auth/register | 否 | 用户注册 |
| POST | /api/auth/login | 否 | 用户登录 |
| GET | /api/auth/profile | 是 | 获取个人资料 |
| PUT | /api/auth/profile | 是 | 更新个人资料 |
| PUT | /api/auth/password | 是 | 修改密码 |

### 日程模块 `/api/schedules`

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | /api/schedules | 是 | 查询日程列表 |
| POST | /api/schedules | 是 | 创建日程 |
| PUT | /api/schedules/:id | 是 | 编辑日程 |
| DELETE | /api/schedules/:id | 是 | 删除日程 |
| PUT | /api/schedules/:id/status | 是 | 更新日程状态 |

### 习惯模块 `/api/habits`

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | /api/habits | 是 | 查询习惯列表 |
| POST | /api/habits | 是 | 创建习惯 |
| PUT | /api/habits/:id | 是 | 编辑习惯 |
| DELETE | /api/habits/:id | 是 | 删除习惯 |

### 打卡模块 `/api/checkins`

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | /api/checkins | 是 | 打卡 |
| GET | /api/checkins | 是 | 查询打卡记录 |
| GET | /api/checkins/stats | 是 | 查看打卡统计 |
| DELETE | /api/checkins/:id | 是 | 撤销打卡 |

### 社交模块 `/api/social`

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | /api/social | 是 | 获取动态列表 |
| POST | /api/social | 是 | 发布动态 |
| DELETE | /api/social/:id | 是 | 删除动态 |
| POST | /api/social/:id/like | 是 | 点赞/取消点赞 |
| POST | /api/social/:id/comment | 是 | 添加评论 |
| GET | /api/social/:id/comments | 是 | 获取评论列表 |

### AI 模块 `/api/ai`

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | /api/ai/recommend-habits | 是 | 获取习惯推荐 |
| GET | /api/ai/analysis | 是 | 获取效率分析 |
| GET | /api/ai/schedule-suggest | 是 | 获取日程建议 |

### 系统

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | /api/health | 否 | 健康检查 |

---

## 测试指南

完整的测试文档位于 [`docs/测试文档.md`](docs/测试文档.md)，包含：

- **56 个测试用例**：覆盖全部 8 个功能模块
- **测试环境配置**：硬件、软件、工具详细说明
- **测试步骤**：后端 API 测试、前端页面测试、集成测试
- **测试工具说明**：Postman、Chrome DevTools、Vue DevTools 等
- **测试结果分析模板**：缺陷分类统计、通过率计算
- **问题记录模板**：缺陷跟踪

### 快速测试

```bash
# 后端 API 测试
# 使用 Postman 导入 API 集合
# 设置 baseURL = http://localhost:3000/api

# 前端页面测试
# 在浏览器中访问 http://localhost:5173
# 使用 Chrome DevTools 调试
```

---

## 项目结构

```
Intelligent Life Assistant/
├── README.md                    # 项目说明文档
├── LICENSE                      # MIT 开源许可证
├── .gitignore                   # Git 忽略配置
├── package-lock.json
├── docs/
│   ├── 需求分析.md               # 需求分析文档
│   └── 测试文档.md               # 测试文档
├── client/                      # 前端项目
│   ├── package.json
│   ├── vite.config.js           # Vite 配置（含代理）
│   ├── index.html
│   └── src/
│       ├── main.js              # 应用入口
│       ├── App.vue              # 根组件
│       ├── router/index.js      # 路由配置
│       ├── stores/              # Pinia 状态管理
│       │   ├── auth.js          # 认证状态
│       │   ├── habit.js         # 习惯状态
│       │   └── schedule.js      # 日程状态
│       ├── api/                 # API 请求层
│       │   ├── request.js       # Axios 实例
│       │   ├── auth.js
│       │   ├── schedule.js
│       │   ├── habit.js
│       │   ├── checkin.js
│       │   ├── social.js
│       │   ├── ai.js
│       │   └── user.js
│       ├── views/               # 页面组件
│       │   ├── Login.vue        # 登录
│       │   ├── Register.vue     # 注册
│       │   ├── Dashboard.vue    # 仪表盘
│       │   ├── Schedule.vue     # 日程管理
│       │   ├── Habits.vue       # 习惯追踪
│       │   ├── CheckIn.vue      # 每日打卡
│       │   ├── Social.vue       # 社交社区
│       │   ├── Profile.vue      # 个人中心
│       │   └── Analytics.vue    # 数据分析
│       ├── components/          # 公共组件
│       │   ├── AppLayout.vue    # 布局组件
│       │   ├── NavBar.vue       # 导航栏
│       │   ├── SideBar.vue      # 侧边栏
│       │   ├── HabitChart.vue   # 习惯图表
│       │   ├── CalendarHeatmap.vue # 热力图
│       │   └── PostCard.vue     # 动态卡片
│       └── styles/
│           └── global.css       # 全局样式
└── server/                      # 后端项目
    ├── package.json
    ├── app.js                   # Express 入口
    ├── .env.example             # 环境变量模板
    ├── config/
    │   ├── db.js                # MySQL 连接池
    │   ├── redis.js             # Redis 配置
    │   └── jwt.js               # JWT 配置
    ├── middleware/
    │   ├── auth.js              # JWT 认证
    │   ├── validator.js         # 参数校验
    │   ├── errorHandler.js      # 异常处理
    │   └── logger.js            # 请求日志
    ├── routes/
    │   ├── auth.js
    │   ├── schedules.js
    │   ├── habits.js
    │   ├── checkins.js
    │   ├── social.js
    │   └── ai.js
    ├── controllers/
    │   ├── authController.js
    │   ├── scheduleController.js
    │   ├── habitController.js
    │   ├── checkinController.js
    │   ├── socialController.js
    │   └── aiController.js
    ├── models/
    │   ├── User.js
    │   ├── Schedule.js
    │   ├── Habit.js
    │   ├── CheckIn.js
    │   ├── SocialPost.js
    │   ├── SocialComment.js
    │   └── SocialLike.js
    ├── utils/
    │   ├── response.js          # 统一响应格式
    │   └── helpers.js           # 工具函数
    └── sql/
        └── init.sql             # 数据库初始化脚本
```

---

## 开发规范

### 命名规范

- **前端**：camelCase（变量/函数），PascalCase（组件名）
- **后端**：camelCase（变量/函数），snake_case（数据库字段）
- **API 路径**：小写 + 中横线（kebab-case）

### Git 提交规范

```
feat: 新功能
fix: 修复 Bug
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建/工具配置
perf: 性能优化
```

示例：`feat: 新增日程提醒功能`

### 代码风格

- 使用 ESLint 保持代码一致性（可根据需要配置）
- 使用 Prettier 统一代码格式化
- Vue 组件使用 `<script setup>` 语法
- 后端遵循 MVC 分层架构

---

## 贡献指南

欢迎任何形式的贡献！以下是参与项目的方式：

### 提交 Issue

发现 Bug 或有功能建议时，请提交 GitHub Issue，包括：
- Bug 报告：描述问题、复现步骤、运行环境
- 功能建议：描述需求和使用场景

### 提交 Pull Request

1. Fork 本仓库
2. 创建功能分支：`git checkout -b feature/my-feature`
3. 提交更改：`git commit -m 'feat: 添加新功能'`
4. 推送到分支：`git push origin feature/my-feature`
5. 提交 Pull Request

### 开发流程

1. 在本地搭建开发环境（参考[快速开始](#快速开始)）
2. 确保现有测试全部通过
3. 为新功能添加测试用例
4. 提交前检查是否有敏感信息泄露
5. 确保代码风格与现有代码一致

---

## 常见问题

### 1. 安装依赖报错
```bash
# 清除 npm 缓存
npm cache clean --force

# 使用国内镜像源
npm config set registry https://registry.npmmirror.com
```

### 2. 数据库连接失败
- 确认 MySQL 服务已启动
- 检查 `.env` 配置文件中的数据库连接信息
- 确认数据库 `intelligent_life_assistant` 已创建

### 3. Redis 连接失败（可选组件）
- 如果未安装 Redis，可以在 `.env` 中注释掉 Redis 相关配置
- 或直接安装 Redis 服务

### 4. JWT Token 过期
- Token 有效期默认为 7 天
- 过期后需要重新登录获取新 Token

### 5. 端口被占用
```bash
# 查看端口占用情况
netstat -ano | findstr :3000
netstat -ano | findstr :5173

# 修改 server/.env 中的 PORT
# 或修改 client/vite.config.js 中的端口配置
```

### 6. CORS 跨域问题
- 后端已配置 CORS 中间件
- 前端 Vite 已配置代理转发 `/api` 到后端
- 确认前后端服务均正常运行

---

## 许可证

[MIT License](LICENSE)

Copyright (c) 2025 Intelligent Life Assistant

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
