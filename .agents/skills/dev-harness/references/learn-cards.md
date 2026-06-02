# Gate C 学习卡片库

AI 在 Gate C 确认环节，根据当前阶段实际用到的技术，把对应卡片直接呈现给用户。
用户读完、跑通最小示例后，自己勾选 Gate C。

---

## 卡片：Go module 与 Gin 最小结构

**用到时机**：Stage 1 / 任何新 Go 后端阶段

### 核心 API

```
go mod init <module-path>   # 初始化模块
go get <pkg>                # 添加依赖
go build ./...              # 编译全部包
go run main.go              # 启动
```

```go
// Gin 最小结构
r := gin.Default()
r.GET("/ping", func(c *gin.Context) {
    c.JSON(200, gin.H{"message": "pong"})
})
r.Run(":8080")
```

**3 行解释**：`gin.Default()` 创建带日志和 recover 的引擎；`r.GET` 注册路由；`c.JSON` 写响应并结束请求。

---

## 卡片：GORM 最小 API

**用到时机**：引入 GORM 的阶段（Stage 2 起）

### 核心 API

```go
// 打开连接
db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})

// 建表（开发辅助，生产用手写 SQL）
db.AutoMigrate(&MyModel{})

// 写
db.Create(&record)
db.Save(&record)   // 全量更新（有主键则 UPDATE，无则 INSERT）

// 读
db.First(&record, id)          // 按主键，找不到返回 ErrRecordNotFound
db.Find(&records, "owner_id=?", 1)

// 软删
db.Delete(&record, id)         // 需要 model 有 gorm.DeletedAt 字段
```

**3 行解释**：GORM 通过 struct tag `gorm:"column:xxx"` 映射字段；`First` 找不到记录会返回 `gorm.ErrRecordNotFound`，需要用 `errors.Is` 判断；`Save` 是全量替换，未传字段会被清空，前端编辑前必须先 GET。

---

## 卡片：database/sql driver 与连接池

**用到时机**：引入 GORM / 任何 DB 连接阶段

### 核心配置

```go
sqlDB, _ := db.DB()
sqlDB.SetMaxOpenConns(20)
sqlDB.SetMaxIdleConns(5)
sqlDB.SetConnMaxLifetime(time.Hour)
sqlDB.Ping()  // 启动时验证连通性
```

**3 行解释**：`MaxOpenConns` 限制并发连接数，防止打爆 DB；`MaxIdleConns` 控制连接池保留的空闲连接；`Ping()` 在启动时做一次强校验，失败直接 fatal，避免服务带着坏连接跑起来。

---

## 卡片：MySQL 本机安装与基础操作

**用到时机**：首次引入 MySQL 的阶段

### 核心命令

```bash
brew install mysql          # 安装（实际版本跟随 Homebrew，可能是 9.x）
brew services start mysql   # 启动
mysql -u root               # 登录（首次无密码）

# 建库建用户
CREATE DATABASE mydb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'app'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON mydb.* TO 'app'@'localhost';
FLUSH PRIVILEGES;
```

**3 行解释**：`brew install mysql` 装的是最新主版本，不一定是 8.x；GORM driver 兼容 8/9，无需降级；建用户时限定 `@'localhost'` 比 `@'%'` 更安全，本地开发够用。

---

## 卡片：JWT 中间件基础

**用到时机**：实现登录鉴权的阶段

### 核心 API

```go
// 签发
token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
    "sub": "user_id",
    "exp": time.Now().Add(24 * time.Hour).Unix(),
})
signed, _ := token.SignedString([]byte(secret))

// 校验（Gin 中间件）
token, err := jwt.Parse(raw, func(t *jwt.Token) (interface{}, error) {
    if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
        return nil, fmt.Errorf("unexpected signing method")
    }
    return []byte(secret), nil
})
if err != nil || !token.Valid { /* abort 401 */ }
```

**3 行解释**：`exp` 是 Unix 时间戳，过期后 `Parse` 会返回错误；`SigningMethodHMAC` 检查防止算法混淆攻击；校验失败必须调 `c.Abort()`，否则后续 handler 仍会执行。

---

## 卡片：Next.js App Router 数据获取

**用到时机**：前端切 API 的阶段（Stage 3 起）

### 核心模式

```tsx
// Server Component（推荐，无需 useEffect）
async function ProfilePage() {
  const res = await fetch('http://localhost:8080/api/public/profile', {
    next: { revalidate: 60 }  // ISR：60 秒重新验证
  })
  const { data } = await res.json()
  return <div>{data.displayName}</div>
}

// Client Component（需要交互时）
'use client'
const [data, setData] = useState(null)
useEffect(() => { fetch(...).then(...) }, [])
```

**3 行解释**：App Router 默认 Server Component，直接 `async/await` 即可，不需要 `useEffect`；`next: { revalidate }` 控制缓存时间；只有需要浏览器 API 或用户交互时才加 `'use client'`。

---

## 卡片：Zustand 状态管理基础

**用到时机**：前端引入全局状态的阶段

### 核心 API

```ts
// lib/stores/auth.ts
import { create } from 'zustand'

interface AuthState {
  token: string | null
  setToken: (t: string) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  setToken: (token) => set({ token }),
}))

// 使用
const token = useAuthStore((s) => s.token)
```

**3 行解释**：`create` 返回一个 hook，直接在组件里调用；传选择器 `(s) => s.token` 避免无关状态变化触发重渲染；store 文件放 `lib/stores/<feature>.ts`，不要放在 `components/` 里。
