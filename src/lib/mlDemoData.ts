import type { Card } from '../types/card'
import { newId } from './uuid'

function makeCard(
  t: { value: number },
  number: string,
  title: string,
  body: string,
  extra?: Partial<Pick<Card, 'source' | 'note'>>,
): Card {
  const now = t.value++
  return {
    id: newId(),
    number,
    title,
    body,
    source: extra?.source ?? '',
    note: extra?.note ?? '',
    status: 'published',
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * 机器学习示例笔记（编号从 4 起，避免与「用法示例」1–3 冲突）
 * 演示：一卡一事、编号延伸、跨主线 [[链接]]、论文卡、实验闪念
 */
export function buildMLDemoCards(): Card[] {
  const t = { value: Date.now() }

  return [
    // ── 主线 4：ML 是什么 ──
    makeCard(
      t,
      '4',
      '机器学习在学什么',
      `机器学习学的是：从数据里估计一个函数 f，使 f(x) 尽量接近真实关系。

不是背公式集合，而是「数据 → 模型 → 损失 → 优化」这条流水线。

本卡只做一件事：给出 ML 一句话定义。`,
      { source: '周志华《机器学习》绪论；Andrew Ng ML 课程' },
    ),
    makeCard(
      t,
      '4a',
      '三种学习范式',
      `按标签有无与反馈形式粗分：

• 监督学习 — 有 (x, y)，学 y ≈ f(x)
• 无监督学习 — 只有 x，找结构（聚类、降维）
• 强化学习 — 动作 → 奖励，学策略

详见下卡 [[4a1]]；与训练目标相关的损失见 [[4a2]]。`,
    ),
    makeCard(
      t,
      '4a1',
      '监督学习：最小化预测误差',
      `给定数据集 {(xᵢ, yᵢ)}，选模型 h_θ，最小化损失 L(θ)。

回归常用 MSE；分类常用交叉熵。

「监督」= 标签监督信号。回到总览 [[4]]。`,
    ),
    makeCard(
      t,
      '4a2',
      '损失函数 = 错多少的度量',
      `损失不是算法本身，而是优化目标。

同一模型可换不同损失（如分类里 hinge vs 交叉熵），训练行为会变。

训练循环见 [[5]]。`,
    ),

    // ── 主线 5：训练与泛化 ──
    makeCard(
      t,
      '5',
      '训练 = 在参数空间里下山',
      `找到 θ 使 L(θ) 尽量小。深度模型里用随机梯度下降（SGD）及其变体。

本卡只强调：训练是优化问题，不是「记住训练集」。`,
    ),
    makeCard(
      t,
      '5a',
      '梯度下降直觉',
      `损失 L 对参数 θ 的梯度 ∇L 指向上升最快方向；沿负梯度走一小步即更新：

θ ← θ − η·∇L

η 是学习率。过大震荡，过小收敛慢 → [[5a1]]`,
    ),
    makeCard(
      t,
      '5a1',
      '学习率与 batch size',
      `小 batch：梯度噪声大，有时反而有助泛化。
大 batch：估计准，但需调大学习率或 warmup。

实践：先用 lr finder / 默认 AdamW，再微调。`,
      { note: '可链到具体框架：PyTorch lr_scheduler' },
    ),
    makeCard(
      t,
      '5b',
      '过拟合：记住了噪声',
      `训练误差很低、验证误差升高 → 过拟合。

对策：更多数据、正则（L2、Dropout）、早停、简化模型。

与 [[4a1]] 的监督设定相关：数据少时更易过拟合。`,
    ),

    // ── 主线 6：神经网络 ──
    makeCard(
      t,
      '6',
      '神经网络 = 可组合的非线性',
      `层叠线性变换 + 非线性激活，可逼近复杂函数。

「深度」= 多层；表达能力换易过拟合风险。

反向传播如何算梯度 → [[6a]]`,
      { source: 'Goodfellow et al., Deep Learning, ch.6' },
    ),
    makeCard(
      t,
      '6a',
      '反向传播在干什么',
      `前向：算预测与损失。
反向：用链式法则把 ∂L/∂θ 从输出层传回每一层。

实现上是计算图上的自动微分，不是手推公式的替代品 → [[6a1]]`,
    ),
    makeCard(
      t,
      '6a1',
      '链式法则 = 梯度相乘',
      `若 y = f(g(x))，则 dy/dx = (df/dg)·(dg/dx)。

深度网络中每层乘 Jacobian；梯度消失/爆炸与激活、深度有关。

优化技巧见 [[5a]]。`,
    ),
    makeCard(
      t,
      '6b',
      'ReLU 为何常用',
      `ReLU(x)=max(0,x)：计算快、稀疏激活、缓解部分梯度消失。

缺点：dead ReLU（神经元永不激活）。变体：Leaky ReLU、GELU（Transformer 常用）。`,
    ),

    // ── 主线 7：论文阅读示例 ──
    makeCard(
      t,
      '7',
      '论文卡：Attention Is All You Need',
      `问题：序列建模依赖 RNN 串行，难并行、长程依赖弱。

方法：Self-Attention 堆叠成 Transformer，完全抛弃 recurrence。

本卡 = 论文「问题+方法」摘要，细节拆到子卡。`,
      { source: 'Vaswani et al., NeurIPS 2017' },
    ),
    makeCard(
      t,
      '7a',
      'Self-Attention 一句话',
      `每个 token 用 Query 去「问」所有 token 的 Key，对 Value 加权求和 → 得到上下文表示。

复杂度 O(n²·d)，n 为序列长度。`,
    ),
    makeCard(
      t,
      '7a1',
      'Q、K、V 各是什么',
      `Q = W_q·x，K = W_k·x，V = W_v·x（同一输入 x 的三种线性投影）。

Attention(Q,K,V) = softmax(QK^T/√d_k)·V

「问谁、被谁问、取什么信息」三分工。上级 [[7a]]。`,
    ),
    makeCard(
      t,
      '7b',
      'Transformer vs RNN',
      `RNN：时间步串行，长依赖要传很多步。
Transformer：任意两 token 一步相连，训练可并行。

代价：内存随 n² 涨。与 [[6]] 的「深度网络」不同，这是架构级选择。`,
    ),
    makeCard(
      t,
      '7a1a',
      'Multi-Head = 多套注意力并行',
      `多个 head 学不同子空间关系，再拼接投影。

不是「同一注意力算多遍」，而是不同 Q/K/V 子空间。见 [[7a1]]。`,
    ),
  ]
}

export function buildMLDemoInbox(): Card[] {
  const now = Date.now()
  return [
    {
      id: newId(),
      number: '',
      title: '',
      body: '💡 ML 闪念：试着用 lr=3e-4 训一个小 CNN 在 CIFAR-10，看验证曲线是否过拟合——还没想好放哪条编号线下，先搁这。',
      source: '',
      note: '',
      status: 'inbox',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: newId(),
      number: '',
      title: '',
      body: '💡 ML 闪念：搞不清 BatchNorm 在 train/eval 模式差别 → 查完写成正式卡，可挂在 [[6b]] 下面当分支。',
      source: '',
      note: '',
      status: 'inbox',
      createdAt: now + 1,
      updatedAt: now + 1,
    },
  ]
}

/** 机器学习示例浏览路线 */
export const mlQuickStartSteps = [
  {
    step: 1,
    title: '从 4 号主线进入',
    desc: 'ML 一句话定义 + 三种范式',
    to: '/card/4',
  },
  {
    step: 2,
    title: '训练链 5 → 5a → 5b',
    desc: '梯度下降、学习率、过拟合',
    to: '/card/5b',
  },
  {
    step: 3,
    title: '神经网络 6a1',
    desc: '反向传播与链式法则，看双向链接',
    to: '/card/6a1',
  },
  {
    step: 4,
    title: '论文卡 7 → 7a1a',
    desc: 'Transformer 怎么拆成多张一卡一事',
    to: '/card/7a1a',
  },
  {
    step: 5,
    title: '目录树看 ML 结构',
    desc: '4 / 5 / 6 / 7 四条主线并列',
    to: '/tree',
  },
  {
    step: 6,
    title: '搜「梯度」',
    desc: '跨卡片检索相关笔记',
    to: '/search?q=梯度',
  },
]
