#!/usr/bin/env node
/** 生成机器学习示例并写入服务器 data/zettelkasten.json */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_FILE = path.join(__dirname, '..', 'server', 'data', 'zettelkasten.json')

function card(id, number, title, body, extra = {}) {
  const t = extra.t ?? Date.now()
  return {
    id,
    number,
    title,
    body,
    source: extra.source ?? '',
    note: extra.note ?? '',
    status: extra.status ?? 'published',
    createdAt: t,
    updatedAt: t,
  }
}

const base = Date.now()
let t = base

const cards = [
  card('ml-004', '4', '机器学习在学什么', `机器学习学的是：从数据里估计一个函数 f，使 f(x) 尽量接近真实关系。

不是背公式集合，而是「数据 → 模型 → 损失 → 优化」这条流水线。

本卡只做一件事：给出 ML 一句话定义。`, { source: '周志华《机器学习》绪论；Andrew Ng ML 课程', t: t++ }),
  card('ml-004a', '4a', '三种学习范式', `按标签有无与反馈形式粗分：

• 监督学习 — 有 (x, y)，学 y ≈ f(x)
• 无监督学习 — 只有 x，找结构（聚类、降维）
• 强化学习 — 动作 → 奖励，学策略

详见下卡 [[4a1]]；与训练目标相关的损失见 [[4a2]]。`, { t: t++ }),
  card('ml-004a1', '4a1', '监督学习：最小化预测误差', `给定数据集 {(xᵢ, yᵢ)}，选模型 h_θ，最小化损失 L(θ)。

回归常用 MSE；分类常用交叉熵。

「监督」= 标签监督信号。回到总览 [[4]]。`, { t: t++ }),
  card('ml-004a2', '4a2', '损失函数 = 错多少的度量', `损失不是算法本身，而是优化目标。

同一模型可换不同损失（如分类里 hinge vs 交叉熵），训练行为会变。

训练循环见 [[5]]。`, { t: t++ }),
  card('ml-005', '5', '训练 = 在参数空间里下山', `找到 θ 使 L(θ) 尽量小。深度模型里用随机梯度下降（SGD）及其变体。

本卡只强调：训练是优化问题，不是「记住训练集」。`, { t: t++ }),
  card('ml-005a', '5a', '梯度下降直觉', `损失 L 对参数 θ 的梯度 ∇L 指向上升最快方向；沿负梯度走一小步即更新：

θ ← θ − η·∇L

η 是学习率。过大震荡，过小收敛慢 → [[5a1]]`, { t: t++ }),
  card('ml-005a1', '5a1', '学习率与 batch size', `小 batch：梯度噪声大，有时反而有助泛化。
大 batch：估计准，但需调大学习率或 warmup。

实践：先用 lr finder / 默认 AdamW，再微调。`, { note: '可链到 PyTorch lr_scheduler', t: t++ }),
  card('ml-005b', '5b', '过拟合：记住了噪声', `训练误差很低、验证误差升高 → 过拟合。

对策：更多数据、正则（L2、Dropout）、早停、简化模型。

与 [[4a1]] 的监督设定相关：数据少时更易过拟合。`, { t: t++ }),
  card('ml-006', '6', '神经网络 = 可组合的非线性', `层叠线性变换 + 非线性激活，可逼近复杂函数。

「深度」= 多层；表达能力换易过拟合风险。

反向传播如何算梯度 → [[6a]]`, { source: 'Goodfellow et al., Deep Learning, ch.6', t: t++ }),
  card('ml-006a', '6a', '反向传播在干什么', `前向：算预测与损失。
反向：用链式法则把 ∂L/∂θ 从输出层传回每一层。

实现上是计算图上的自动微分，不是手推公式的替代品 → [[6a1]]`, { t: t++ }),
  card('ml-006a1', '6a1', '链式法则 = 梯度相乘', `若 y = f(g(x))，则 dy/dx = (df/dg)·(dg/dx)。

深度网络中每层乘 Jacobian；梯度消失/爆炸与激活、深度有关。

优化技巧见 [[5a]]。`, { t: t++ }),
  card('ml-006b', '6b', 'ReLU 为何常用', `ReLU(x)=max(0,x)：计算快、稀疏激活、缓解部分梯度消失。

缺点：dead ReLU。变体：Leaky ReLU、GELU（Transformer 常用）。`, { t: t++ }),
  card('ml-007', '7', '论文卡：Attention Is All You Need', `问题：序列建模依赖 RNN 串行，难并行、长程依赖弱。

方法：Self-Attention 堆叠成 Transformer，完全抛弃 recurrence。

本卡 = 论文「问题+方法」摘要，细节拆到子卡。`, { source: 'Vaswani et al., NeurIPS 2017', t: t++ }),
  card('ml-007a', '7a', 'Self-Attention 一句话', `每个 token 用 Query 去「问」所有 token 的 Key，对 Value 加权求和 → 得到上下文表示。

复杂度 O(n²·d)，n 为序列长度。`, { t: t++ }),
  card('ml-007a1', '7a1', 'Q、K、V 各是什么', `Q = W_q·x，K = W_k·x，V = W_v·x（同一输入 x 的三种线性投影）。

Attention(Q,K,V) = softmax(QK^T/√d_k)·V

「问谁、被谁问、取什么信息」三分工。上级 [[7a]]。`, { t: t++ }),
  card('ml-007b', '7b', 'Transformer vs RNN', `RNN：时间步串行，长依赖要传很多步。
Transformer：任意两 token 一步相连，训练可并行。

代价：内存随 n² 涨。与 [[6]] 的「深度网络」不同，这是架构级选择。`, { t: t++ }),
  card('ml-007a1a', '7a1a', 'Multi-Head = 多套注意力并行', `多个 head 学不同子空间关系，再拼接投影。

不是「同一注意力算多遍」，而是不同 Q/K/V 子空间。见 [[7a1]]。`, { t: t++ }),
  card('ml-inbox-1', '', '', '💡 ML 闪念：用 lr=3e-4 训 CNN 在 CIFAR-10，看验证曲线是否过拟合——先搁这。', { status: 'inbox', t: t++ }),
  card('ml-inbox-2', '', '', '💡 ML 闪念：BatchNorm 的 train/eval 差别 → 查完可挂在 [[6b]] 下。', { status: 'inbox', t: t++ }),
]

const byNumber = Object.fromEntries(cards.filter((c) => c.number).map((c) => [c.number, c.id]))
const links = []

for (const c of cards) {
  const refs = [...c.body.matchAll(/\[\[([0-9a-z]+)\]\]/g)]
  for (const m of refs) {
    const toId = byNumber[m[1]]
    if (toId && toId !== c.id) links.push({ fromId: c.id, toId })
  }
}

const payload = {
  version: 1,
  exportedAt: new Date().toISOString(),
  cards,
  links,
  tags: [],
  cardTags: [],
  tombstones: [],
}

await fs.mkdir(path.dirname(DATA_FILE), { recursive: true })
await fs.writeFile(DATA_FILE, JSON.stringify(payload, null, 2), 'utf8')
console.log(`已写入 ${DATA_FILE}`)
console.log(`卡片 ${cards.length} 张，链接 ${links.length} 条`)
