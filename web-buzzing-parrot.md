# 约旦出口唛头与清单生成系统 - 实施计划

## Context（背景）

开发一个云端 Web 系统，用于生成符合约旦海关（Bayan 系统）要求的唛头和装箱清单。系统需要处理三种物理出口场景：

1. **裸装单件**：一个包装即一个货物，直接贴唛头
2. **分拆设备**：一台机器分成多个部件，需要统一主品名 + 部件名称列
3. **容器整合装**：多个货物装入大木箱/纸箱，容器外贴装箱清单

核心要求：
- 所有物理包装必须有唯一的字母+数字编号（如 JOR-2026-A001）
- 二维码扫描后跳转到网页显示阿拉伯语详细信息
- 标签规格：100mm × 150mm 横向打印
- 支持中英文双语界面
- 需要用户登录和基础用户管理
- 保存历史记录，支持查询和重新打印

## Architecture（技术架构）

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: Ant Design (支持国际化)
- **State Management**: Zustand（轻量级，适合中小型应用）
- **i18n**: react-i18next（中英文切换）
- **PDF Generation**: @react-pdf/renderer（精确控制 mm 尺寸）
- **QR Code**: qrcode.react
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL（关系型数据适合父子件递归查询）
- **ORM**: Prisma（类型安全 + 迁移管理）
- **Authentication**: JWT + bcrypt
- **Deployment**: 
  - Frontend: Vercel/Netlify
  - Backend: Railway/Render
  - Database: Railway/Supabase

### Database Schema

```prisma
model User {
  id            String   @id @default(cuid())
  username      String   @unique
  passwordHash  String
  role          String   @default("operator") // operator | admin
  createdAt     DateTime @default(now())
  items         Item[]
}

model Item {
  id              String   @id @default(cuid())
  uniqueCode      String   @unique // JOR-2026-A001
  type            String   // simple | complex | container
  
  // Names in 3 languages
  nameCn          String
  nameEn          String
  nameAr          String?
  
  // Physical properties
  weightGross     Float?   // kg
  weightNet       Float?   // kg
  length          Float?   // cm
  width           Float?   // cm
  height          Float?   // cm
  
  // For complex items (parent-child)
  parentId        String?
  parent          Item?    @relation("ItemParts", fields: [parentId], references: [id])
  parts           Item[]   @relation("ItemParts")
  partDescription String?  // 部件说明
  
  // For containers
  isContainer     Boolean  @default(false)
  containerItems  ContainerItem[]
  
  // Metadata
  createdBy       String
  creator         User     @relation(fields: [createdBy], references: [id])
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model ContainerItem {
  id          String @id @default(cuid())
  containerId String
  container   Item   @relation(fields: [containerId], references: [id])
  itemId      String
  quantity    Int    @default(1)
  
  @@unique([containerId, itemId])
}

model Sequence {
  id       String @id
  year     Int
  type     String // A | C | P
  current  Int
  
  @@unique([year, type])
}
```

### ID Generation Logic

格式：`JOR-YYYY-TNNNN`
- `JOR`: 约旦前缀
- `YYYY`: 年份
- `T`: 类型标识
  - `A`: 普通货物（Article）
  - `C`: 容器（Container）
  - `P`: 部件（Part，复杂设备的子件）
- `NNNN`: 四位序号（0001-9999）

实现：使用数据库序列表 + 事务锁确保唯一性

## Implementation Plan（实施步骤）

### Phase 1: Project Setup & Database
**Files to create:**
- `package.json` (root - monorepo setup with workspaces)
- `apps/backend/package.json`
- `apps/frontend/package.json`
- `apps/backend/prisma/schema.prisma`
- `apps/backend/.env.example`
- `.gitignore`

**Tasks:**
1. 初始化 monorepo 结构（使用 npm workspaces）
2. 配置 Prisma + PostgreSQL
3. 创建数据库迁移
4. 实现 ID 生成服务（`apps/backend/src/services/idGenerator.ts`）

### Phase 2: Backend API
**Files to create:**
- `apps/backend/src/index.ts` - Express server
- `apps/backend/src/middleware/auth.ts` - JWT 验证
- `apps/backend/src/routes/auth.ts` - 登录/注册
- `apps/backend/src/routes/users.ts` - 用户管理
- `apps/backend/src/routes/items.ts` - 货物 CRUD
- `apps/backend/src/routes/containers.ts` - 容器管理
- `apps/backend/src/services/idGenerator.ts` - 唯一码生成
- `apps/backend/src/services/qrGenerator.ts` - QR 码生成

**API Endpoints:**
```
POST   /api/auth/login
POST   /api/auth/register (admin only)
GET    /api/users
POST   /api/users
DELETE /api/users/:id
PUT    /api/users/:id/password

GET    /api/items
POST   /api/items
GET    /api/items/:id
PUT    /api/items/:id
DELETE /api/items/:id
GET    /api/items/code/:uniqueCode (for QR code landing page)

POST   /api/containers
GET    /api/containers/:id
PUT    /api/containers/:id/items (add/remove items)
```

### Phase 3: Frontend Core
**Files to create:**
- `apps/frontend/src/main.tsx` - Entry point
- `apps/frontend/src/App.tsx` - Root component with routing
- `apps/frontend/src/i18n/index.ts` - i18next config
- `apps/frontend/src/i18n/locales/zh.json`
- `apps/frontend/src/i18n/locales/en.json`
- `apps/frontend/src/store/authStore.ts` - Zustand auth state
- `apps/frontend/src/store/itemStore.ts` - Zustand item state
- `apps/frontend/src/api/client.ts` - Axios instance with JWT interceptor
- `apps/frontend/src/components/Layout.tsx` - Main layout with language switcher

**Routes:**
```
/login
/dashboard
/items/new
/items/:id/edit
/items (list view with search)
/containers/new
/containers/:id/edit
/view/:uniqueCode (public QR code landing page)
/users (admin only)
```

### Phase 4: Item Entry Form
**Files to create:**
- `apps/frontend/src/pages/ItemForm.tsx`
- `apps/frontend/src/components/ItemTypeSelector.tsx`
- `apps/frontend/src/components/SimpleItemForm.tsx`
- `apps/frontend/src/components/ComplexItemForm.tsx` - with recursive parts
- `apps/frontend/src/components/PartsList.tsx` - recursive component for nested parts

**Features:**
1. 动态表单：根据选择的类型（simple/complex/container）显示不同字段
2. 递归部件输入：支持无限层级的子零件
3. 三语言输入：中文、英文、阿拉伯语（阿拉伯语可选）
4. 物理属性：毛重、净重、长宽高
5. 实时预览唯一码（保存前显示将要生成的格式）

### Phase 5: Container Management
**Files to create:**
- `apps/frontend/src/pages/ContainerForm.tsx`
- `apps/frontend/src/components/ItemSelector.tsx` - multi-select with search
- `apps/frontend/src/components/ContainerContents.tsx` - draggable list

**Features:**
1. 从已有货物中选择（支持搜索和筛选）
2. 拖拽排序容器内货物
3. 显示容器总重量和总体积
4. 自动生成容器唯一码（JOR-2026-C001）

### Phase 6: Label & Packing List Generation
**Files to create:**
- `apps/frontend/src/components/pdf/LabelTemplate.tsx` - @react-pdf/renderer component
- `apps/frontend/src/components/pdf/PackingListTemplate.tsx`
- `apps/frontend/src/utils/pdfGenerator.ts`
- `apps/frontend/src/components/PrintPreview.tsx`

**Label Layout (100mm × 150mm landscape):**
```
┌─────────────────────────────────────────────────┐
│ JOR-2026-A001 (大号字体)          [QR Code]    │
│                                                 │
│ 品名 / Item Name                                │
│ 部件 / Part (if applicable)                     │
│                                                 │
│ 毛重 / Gross: 50kg  净重 / Net: 45kg           │
│ 尺寸 / Size: 100×80×60cm                        │
│                                                 │
│ ┌─────────────────────────────┐                │
│ │   MADE IN CHINA             │                │
│ └─────────────────────────────┘                │
│                                                 │
│ 收货公司 / Consignee: [Company Name]           │
└─────────────────────────────────────────────────┘
```

**Packing List Layout (A4):**
- 容器唯一码（顶部大号）
- 表格：序号 | 货物编号 | 品名 | 部件说明 | 数量 | 重量
- 合计行
- QR 码（右上角）

**Implementation:**
1. 使用 @react-pdf/renderer 的 `<Document>`, `<Page>`, `<View>`, `<Text>` 组件
2. 嵌入 Noto Sans Arabic 字体支持阿拉伯语
3. 生成 QR 码（内容为：`https://yourdomain.com/view/JOR-2026-A001`）
4. 提供两种输出：
   - `window.print()` 浏览器打印
   - `pdf(document).toBlob()` 下载 PDF

### Phase 7: QR Code Landing Page
**Files to create:**
- `apps/frontend/src/pages/ItemView.tsx` (public route)
- `apps/frontend/src/components/ItemDetails.tsx`

**Features:**
1. 无需登录即可访问
2. 显示货物的完整信息（阿拉伯语为主，中英文为辅）
3. 如果是容器，显示装箱清单
4. 如果是复杂设备，显示部件树状结构
5. 响应式设计（手机扫码友好）

### Phase 8: User Management
**Files to create:**
- `apps/frontend/src/pages/UserManagement.tsx` (admin only)
- `apps/frontend/src/components/UserTable.tsx`
- `apps/frontend/src/components/UserForm.tsx`

**Features:**
1. 用户列表（用户名、角色、创建时间）
2. 创建新用户（用户名 + 初始密码）
3. 删除用户（带确认）
4. 修改密码（管理员可以重置任何用户密码）
5. 权限控制：只有 admin 角色可以访问

### Phase 9: History & Search
**Files to create:**
- `apps/frontend/src/pages/ItemList.tsx`
- `apps/frontend/src/components/ItemTable.tsx`
- `apps/frontend/src/components/SearchBar.tsx`

**Features:**
1. 分页列表显示所有货物和容器
2. 搜索：按唯一码、品名、创建日期
3. 筛选：按类型（simple/complex/container）
4. 操作：查看详情、重新打印、编辑、删除
5. 批量打印（选择多个货物一次性生成 PDF）

### Phase 10: Deployment & Testing
**Tasks:**
1. 配置环境变量（生产环境数据库、JWT secret）
2. 部署后端到 Railway/Render
3. 部署前端到 Vercel/Netlify
4. 配置 CORS
5. 测试完整流程：
   - 用户登录
   - 创建单体货物 → 生成唛头 → 扫描 QR 码
   - 创建复杂设备（多层级部件）→ 生成唛头
   - 创建容器 → 添加货物 → 生成装箱清单
   - 浏览器打印和 PDF 下载
   - 历史记录查询和重新打印
6. 测试阿拉伯语显示（QR 码落地页）
7. 测试标签物理尺寸（打印到 100mm × 150mm 标签纸）

## Verification（验证方案）

### End-to-End Test Scenarios

**Scenario 1: 裸装单件**
1. 登录系统
2. 创建新货物（类型：simple）
   - 品名：LED 灯泡 / LED Bulbs / مصابيح LED
   - 重量：10kg / 9kg
   - 尺寸：40×30×25cm
3. 保存后自动生成唯一码（如 JOR-2026-A001）
4. 点击"打印唛头"
5. 验证 PDF 预览：
   - 尺寸为 100mm × 150mm 横向
   - 唯一码在左上角大号显示
   - QR 码在右上角
   - "MADE IN CHINA" 有加粗边框
6. 下载 PDF 并打印到标签纸
7. 用手机扫描 QR 码
8. 验证跳转到 `/view/JOR-2026-A001`
9. 验证页面显示阿拉伯语品名和详细信息

**Scenario 2: 分拆设备**
1. 创建新货物（类型：complex）
   - 主品名：数控机床 / CNC Machine / آلة CNC
   - 添加部件：
     - 主机 / Main Unit / الوحدة الرئيسية (200kg)
     - 控制柜 / Control Cabinet / خزانة التحكم (50kg)
     - 附件箱 / Accessories Box / صندوق الملحقات (30kg)
2. 保存后生成主设备码（JOR-2026-A002）和部件码（JOR-2026-P001, P002, P003）
3. 打印唛头，验证每个部件的唛头都显示：
   - 统一主品名："数控机床"
   - 部件名称列："主机" / "控制柜" / "附件箱"
4. 扫描任一部件的 QR 码，验证显示完整设备信息和部件清单

**Scenario 3: 容器整合装**
1. 创建容器（类型：container）
   - 容器名称：木箱 #1 / Wooden Crate #1
2. 添加已有货物到容器：
   - JOR-2026-A001 (LED 灯泡) × 1
   - JOR-2026-A002 (数控机床主机) × 1
3. 保存后生成容器码（JOR-2026-C001）
4. 打印装箱清单（A4 纸）
5. 验证清单包含：
   - 容器唯一码（顶部）
   - 表格列出所有内部货物
   - 合计重量和数量
   - QR 码
6. 扫描容器 QR 码，验证显示装箱明细

**Scenario 4: 用户管理**
1. 以 admin 身份登录
2. 进入用户管理页面
3. 创建新用户（operator 角色）
4. 登出，用新用户登录
5. 验证 operator 无法访问用户管理页面
6. 验证 operator 可以创建货物和打印唛头

**Scenario 5: 历史记录与重新打印**
1. 进入货物列表页面
2. 搜索 "JOR-2026-A001"
3. 点击"重新打印"
4. 验证生成的 PDF 与首次打印完全一致
5. 测试按日期范围筛选
6. 测试批量选择多个货物，一次性生成 PDF

### Technical Verification

1. **Arabic Text Rendering**
   - 在 PDF 中输入阿拉伯语文本
   - 验证 RTL（从右到左）显示正确
   - 验证字符连写形式正确（使用 Noto Sans Arabic 字体）

2. **Label Physical Size**
   - 使用尺子测量打印出的标签
   - 验证实际尺寸为 100mm × 150mm（误差 ±2mm）

3. **QR Code Scanning**
   - 使用多种手机（iOS/Android）扫描
   - 验证 URL 正确跳转
   - 验证落地页在移动端显示正常

4. **Database Integrity**
   - 测试并发创建货物，验证唯一码不重复
   - 测试删除父货物时，子部件的级联处理
   - 测试删除容器时，内部货物不被删除

5. **Authentication**
   - 测试 JWT 过期后自动跳转登录
   - 测试未授权访问 admin 路由被拦截
   - 测试密码加密存储（bcrypt）

## Critical Files

### Backend
- `apps/backend/src/services/idGenerator.ts` - 唯一码生成逻辑
- `apps/backend/src/routes/items.ts` - 货物 API
- `apps/backend/prisma/schema.prisma` - 数据库模型

### Frontend
- `apps/frontend/src/components/pdf/LabelTemplate.tsx` - 唛头模板
- `apps/frontend/src/components/pdf/PackingListTemplate.tsx` - 装箱清单模板
- `apps/frontend/src/pages/ItemForm.tsx` - 货物录入表单
- `apps/frontend/src/components/PartsList.tsx` - 递归部件组件
- `apps/frontend/src/pages/ItemView.tsx` - QR 码落地页

## Dependencies

### Backend
```json
{
  "express": "^4.18.2",
  "prisma": "^5.9.0",
  "@prisma/client": "^5.9.0",
  "jsonwebtoken": "^9.0.2",
  "bcrypt": "^5.1.1",
  "cors": "^2.8.5",
  "dotenv": "^16.4.1",
  "zod": "^3.22.4"
}
```

### Frontend
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.21.3",
  "antd": "^5.13.3",
  "@react-pdf/renderer": "^3.1.15",
  "qrcode.react": "^3.1.0",
  "axios": "^1.6.5",
  "zustand": "^4.5.0",
  "react-i18next": "^14.0.1",
  "i18next": "^23.7.16"
}
```

## Notes

1. **阿拉伯语字体**：需要在 @react-pdf/renderer 中注册 Noto Sans Arabic 字体，否则阿拉伯语会显示为方块
2. **打印精度**：100mm × 150mm = 283.46 × 425.20 pt（PDF points），需要在 `<Page size={[283.46, 425.20]}>` 中精确设置
3. **QR 码容量**：URL 长度应控制在 100 字符以内，确保 QR 码不会过于密集
4. **ID 序号重置**：每年 1 月 1 日，序号从 0001 重新开始（通过 Sequence 表的 year 字段控制）
5. **容器编号独立性**：容器和内部货物的编号完全独立，容器删除不影响内部货物的编号
6. **部件编号**：复杂设备的部件使用 P 类型编号，但在唛头上仍显示主设备的品名
7. **并发安全**：ID 生成使用数据库事务 + SELECT FOR UPDATE 锁，确保高并发下不重复
