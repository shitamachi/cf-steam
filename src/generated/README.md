# 生成的 Protobuf TypeScript 代码

这个目录包含从 protobuf 定义文件自动生成的 TypeScript 代码。

## 文件说明

- `common.ts` - 通用类型定义（来自 common.proto）
- `common_base.ts` - 基础类型定义（来自 common_base.proto）
- `service_storetopsellers.ts` - Steam Store Top Sellers 服务的类型定义
- `service_storetopsellers.client.ts` - Steam Store Top Sellers 服务的客户端接口
- `google/protobuf/descriptor.ts` - Protobuf 描述符类型
- `index.ts` - 统一导出文件
- `example.ts` - 使用示例

## 使用方法

### 导入类型

```typescript
import type {
  CStoreTopSellers_GetCountryList_Request,
  CStoreTopSellers_GetCountryList_Response,
  CStoreTopSellers_GetWeeklyTopSellers_Request,
  CStoreTopSellers_GetWeeklyTopSellers_Response,
  IStoreTopSellersClient
} from './generated';
```

### 创建请求

```typescript
import { createCountryListRequest, createWeeklyTopSellersRequest } from './generated/example';

// 获取国家列表
const countryRequest = createCountryListRequest('chinese');

// 获取周销售排行榜
const topSellersRequest = createWeeklyTopSellersRequest('CN', 0, 50);
```

## 重新生成代码

如果 protobuf 文件有更新，可以使用以下命令重新生成 TypeScript 代码：

```bash
pnpm run protoc:generate
```

## 依赖

生成的代码依赖以下包：
- `@protobuf-ts/runtime` - 运行时支持
- `@protobuf-ts/runtime-rpc` - RPC 支持

这些依赖已经添加到项目的 devDependencies 中。

## 注意事项

- 所有生成的文件都标记为 `@generated`，不应手动编辑
- 如果需要修改，请修改原始的 `.proto` 文件并重新生成
- 大型文件（如 `common.ts`）包含大量类型定义，建议按需导入 