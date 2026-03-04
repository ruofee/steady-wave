# AI 分析服务 API 返回格式

## 接口信息

**URL**: `POST http://localhost:8001/api/v1/analyze`

**Content-Type**: `application/json`

## 请求格式

```typescript
interface HoldingInput {
  fund_code: string;      // 基金代码
  amount: number;         // 持仓金额
  ratio: number;          // 持仓比例 (0-1)
  asset_type: string;     // 资产类型: stock, long_bond, mid_bond, commodity, gold
}

interface AnalysisRequest {
  holdings: HoldingInput[];
}
```

## 响应格式

```typescript
interface HoldingWithAction {
  fund_code: string;
  amount: number;
  ratio: number;
  asset_type: string;
  action: number;           // 操作建议: 0=持平, 1=加仓, -1=减仓
  suggested_ratio: number;  // 建议比例 (0-1)
  action_reason: string;    // 操作原因说明
}

interface AnalysisResponse {
  status: string;              // 状态: "success" | "error"
  timestamp: string;           // 时间戳: "2026-03-05 00:30:00"
  has_risk_warning: boolean;   // 是否存在风险提示
  holdings: HoldingWithAction[]; // 持仓列表（包含操作建议）
  report: string;              // 完整分析报告
}
```

## 响应示例

### 成功响应

```json
{
  "status": "success",
  "timestamp": "2026-03-05 00:30:00",
  "has_risk_warning": true,
  "holdings": [
    {
      "fund_code": "001406",
      "amount": 14986,
      "ratio": 1.0,
      "asset_type": "stock",
      "action": -1,
      "suggested_ratio": 0.30,
      "action_reason": "建议减仓至30%，当前股票配比严重超标"
    }
  ],
  "report": "# 全天候策略投资分析报告\n\n..."
}
```

### 错误响应

```json
{
  "detail": "分析失败: 错误信息"
}
```

## 字段说明

### status
- `"success"`: 分析成功
- `"error"`: 分析失败（通过 HTTP 500 返回）

### timestamp
- 格式: `YYYY-MM-DD HH:MM:SS`
- 示例: `"2026-03-05 00:30:00"`

### has_risk_warning
- `true`: 存在风险提示，需要用户注意
- `false`: 当前无特殊风险

### holdings
增强的持仓列表，每项包含：

#### action
- `1`: 建议加仓
- `0`: 建议持平（维持当前配置）
- `-1`: 建议减仓

#### suggested_ratio
- 建议的目标比例（0-1）
- 示例：`0.30` 表示建议调整至 30%

#### action_reason
- 操作原因的文字说明
- 示例：`"建议减仓至30%，当前股票配比严重超标"`

### report
- 完整的 AI 分析报告（Markdown 格式）
- 包含详细的配比分析、市场分析、调仓建议等

## 全天候策略标准配比参考

在分析时，AI 会参考以下标准配比：

```javascript
{
  stock: 0.30,        // 股票 30%
  long_bond: 0.40,    // 长期国债 40%
  mid_bond: 0.15,     // 中期国债 15%
  commodity: 0.075,   // 商品 7.5%
  gold: 0.075         // 黄金 7.5%
}
```

偏差阈值：5%（超过此阈值会标记为异常）

## 前端集成建议

### 1. 加载状态
分析可能需要 10-30 秒，建议显示加载动画

### 2. 错误处理
```typescript
try {
  const response = await fetch('/api/v1/analyze', { ... });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail);
  }
  const data = await response.json();
} catch (error) {
  console.error('分析失败:', error.message);
}
```

### 3. 数据展示
- **摘要**: 顶部显示 `analysis.summary`
- **完整报告**: 展开区域显示 `analysis.raw_output`
- **建议**: 以列表形式展示 `analysis.recommendations`
- **风险**: 醒目位置显示 `analysis.risk_warnings`
- **偏离提示**: 如果 `has_deviation` 为 `true`，显示警告标识

### 4. 资产类型映射
```typescript
const assetTypeMap = {
  stock: '股票',
  long_bond: '长期国债',
  mid_bond: '中期国债',
  commodity: '商品',
  gold: '黄金'
};
```
