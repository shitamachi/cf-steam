# Steam API 分析结果

## 请求参数解析

URL: `https://api.steampowered.com/IStoreTopSellersService/GetWeeklyTopSellers/v1`

### 解码的请求参数
```json
{
  "context": {
    "language": "schinese",
    "countryCode": "US", 
    "steamRealm": 1
  },
  "dataRequest": {
    "includeAssets": true,
    "includeRelease": true,
    "includePlatforms": true,
    "includeScreenshots": true,
    "includeTrailers": true,
    "includeTagCount": 20,
    "includeReviews": true,
    "includeBasicInfo": true
  },
  "startDate": 1751328000,
  "pageCount": 100
}
```

### 请求参数说明
- **language**: "schinese" (简体中文)
- **countryCode**: "US" (美国区域)
- **steamRealm**: 1 (Steam 平台标识)
- **startDate**: 1751328000 (Unix 时间戳，对应某个特定周的开始日期)
- **pageCount**: 100 (请求获取前100名)
- **dataRequest**: 包含各种资产信息的请求标志

## 响应数据结构

### 基本信息
- **状态码**: 200 (成功)
- **内容类型**: application/octet-stream (二进制 protobuf)
- **响应大小**: 480,952 字节
- **数据压缩**: gzip

### 排行榜数据
成功解析出100个游戏的排行榜数据，包含：

#### 排行榜前10名：
1. **Counter-Strike 2** (App ID: 730) - 连续674周第1名，免费游戏
2. **Steam Deck** (App ID: 1675200) - 连续176周，$399.00
3. **PEAK** (App ID: 3527290) - 连续3周，$7.99
4. **赛博朋克 2077** (App ID: 1091500) - 连续109周，$59.99
5. **PUBG: BATTLEGROUNDS** (App ID: 578080) - 连续433周，免费游戏
6. **Apex Legends™** (App ID: 1172470) - 连续244周，免费游戏
7. **黎明杀机** (App ID: 381210) - 连续432周，$19.99
8. **艾尔登法环** (App ID: 1245620) - 连续84周，$59.99
9. **Red Dead Redemption 2** (App ID: 1174180) - 连续2周，$14.99
10. **光与影：33号远征队** (App ID: 1903340) - 连续12周，$44.99

### 每个游戏项目包含的数据字段：

#### 基本信息
- `rank`: 当前排名
- `appid`: Steam 应用ID
- `lastWeekRank`: 上周排名
- `consecutiveWeeks`: 连续上榜周数
- `firstTop100`: 是否首次进入前100

#### 游戏详细信息 (`item`)
- **基础信息**: 名称、类型、可见性、发布日期
- **价格信息**: `bestPurchaseOption` 包含价格、折扣信息
- **分类标签**: `tagids` 和 `tags` 包含游戏分类权重
- **平台支持**: Windows、Steam Deck兼容性等
- **资产信息**: 图标、截图、视频预告片URL
- **评价信息**: 用户评分、评价数量、评价标签
- **开发商信息**: 发布商、开发商名称和ID
- **语言支持**: 支持的语言列表
- **内容描述符**: 年龄评级相关信息

#### 多媒体资产
- **图片资产**: 主图、小图、头图、背景图、库存图等
- **截图**: 全年龄和成人内容截图分开
- **视频**: 预告片的多种格式和分辨率

## 技术特点

1. **数据格式**: 使用 Protocol Buffers 进行二进制序列化
2. **国际化**: 支持多语言(请求中使用简体中文)
3. **地区化**: 根据国家代码返回对应地区数据
4. **完整性**: 包含游戏的全方位信息(价格、评价、资产等)
5. **分页支持**: 支持 `nextPageStart` 进行分页获取

## 使用场景

这个API适用于：
- 获取Steam平台游戏销售排行榜
- 游戏市场分析和趋势监控
- 游戏推荐系统数据源
- 价格监控和比较
- 游戏元数据获取

## 注意事项

- 需要适当的 CORS 头部和 Origin 设置
- 返回的价格信息以美分为单位 (如 "3999n" = $39.99)
- BigInt 类型需要特殊处理进行序列化
- 响应数据量较大，建议根据需要选择性处理 