import OpenAI from 'openai';
import { getDb } from '../models/database.js';

let client = null;

function getClient() {
  if (client) return client;
  const db = getDb();
  const apiKey = db.prepare('SELECT value FROM settings WHERE key = ?').get('llm_api_key')?.value || process.env.DEEPSEEK_API_KEY || '';
  const baseURL = db.prepare('SELECT value FROM settings WHERE key = ?').get('llm_base_url')?.value || 'https://api.deepseek.com/v1';
  const model = db.prepare('SELECT value FROM settings WHERE key = ?').get('llm_model')?.value || 'deepseek-chat';

  client = new OpenAI({
    baseURL,
    apiKey,
  });
  client._model = model;
  return client;
}

export function getModel() {
  return getClient()._model;
}

export function clearClient() {
  client = null;
}

// PPT generation system prompt — generates structured content data
// Uses frontend-slides design system (12 curated style presets)
const PPT_SYSTEM_PROMPT = `你是一位专业的PPT内容策划和设计专家。你需要根据用户的需求，生成一份结构完整、内容充实的PPT。

请严格按照以下JSON格式回复（不要包含任何markdown代码块标记，只输出纯JSON）：

{
  "title": "PPT标题",
  "subtitle": "副标题",
  "style_key": "根据用户风格要求选择最匹配的主题键名（从下面列表中选择）",
  "slides": [
    {
      "layout": "cover",
      "title": "幻灯片标题",
      "subtitle": "副标题（仅封面用）",
      "points": []
    },
    {
      "layout": "content",
      "title": "标题",
      "points": ["要点1", "要点2", "要点3"],
      "notes": "演讲备注（可选）"
    },
    {
      "layout": "section",
      "title": "章节标题",
      "subtitle": "章节副标题（可选）",
      "points": []
    },
    {
      "layout": "two_column",
      "title": "双栏对比标题",
      "points": ["左栏要点1", "左栏要点2", "右栏要点1", "右栏要点2"],
      "col_left_label": "左栏标签（可选）",
      "col_right_label": "右栏标签（可选）"
    },
    {
      "layout": "quote",
      "title": "引用内容",
      "subtitle": "引用来源",
      "points": []
    },
    {
      "layout": "comparison",
      "title": "对比标题",
      "points": [],
      "left_side": { "label": "传统方案", "points": ["缺点1", "缺点2"] },
      "right_side": { "label": "本方案", "points": ["优点1", "优点2"] }
    },
    {
      "layout": "stats",
      "title": "数据标题",
      "points": [],
      "stats": [
        { "value": "85%", "label": "效率提升" },
        { "value": "3x", "label": "速度增长" }
      ]
    },
    {
      "layout": "ending",
      "title": "谢谢观看",
      "subtitle": "联系方式",
      "points": []
    }
  ]
}

可用 style_key（根据用户风格选择最接近的，优先推荐前8个精心设计的风格）：
设计精选风格（推荐）：
- "bold-signal": Bold Signal 自信信号 — 深色背景+橙色卡片，大胆现代
- "electric-studio": Electric Studio 电力工作室 — 黑白分屏+蓝，专业干练
- "creative-voltage": Creative Voltage 创意电压 — 电光蓝+霓虹黄，前卫创意
- "dark-botanical": Dark Botanical 暗黑植物 — 暗色+暖色点缀，优雅艺术
- "notebook-tabs": Notebook Tabs 笔记本标签 — 奶油纸+彩色标签，编辑文艺
- "pastel-geometry": Pastel Geometry 粉彩几何 — 粉彩+柔和卡片，友好现代
- "split-pastel": Split Pastel 分屏粉彩 — 桃粉+薰衣草分屏，活泼亲切
- "vintage-editorial": Vintage Editorial 复古编辑 — 奶油底+深红，个性鲜明
特色风格（适合特定场景）：
- "neon-cyber": Neon Cyber 霓虹赛博 — 深海军蓝+荧光绿，未来科技
- "terminal-green": Terminal Green 终端绿色 — 代码终端风格，开发者首选
- "swiss-modern": Swiss Modern 瑞士现代 — 白+黑+红，极简国际主义
- "paper-ink": Paper & Ink 纸墨书香 — 暖白+衬线字体，文艺书卷气
经典风格（向后兼容）：
- "blue-professional": 简约商务蓝白
- "dark-tech": 科技感深色渐变
- "soft-pastel": 小清新柔和粉彩
- "luxury-gold": 高端大气深蓝金
- "academic-strict": 学术严谨白底深灰

布局类型说明：
- cover: 封面页，仅需标题和副标题，points 为空
- content: 内容页，包含标题和要点列表（最常用）
- section: 章节分隔页，仅标题和副标题
- two_column: 双栏布局，points 自动平分左右显示（左半+右半），可指定 col_left_label/col_right_label
- quote: 引用页，title 为引用内容，subtitle 为引用来源
- comparison: 对比页，需要 left_side 和 right_side 对象，各含 label 和 points
- stats: 数据页，需要 stats 数组，每项有 value（数字/百分比）和 label（说明）
- ending: 结束页，仅标题和副标题

设计原则：
1. 每页要点控制在3-5个，每个要点简洁有力
2. 内容要有深度、有数据支撑（引用研究数据需标注来源）
3. 根据用户要求的页数严格控制幻灯片数量
4. 同一份PPT中应混合使用不同布局（至少使用3种），避免千篇一律
5. 善用 section 页做章节划分（每5-7页内容插入一个 section）
6. 适当使用 quote 页做观点强调，comparison 页做对比分析，stats 页展示数据
7. 每个要点使用主动语态，以动词开头，简洁有力
8. 避免空洞的形容词，用具体数据、案例、事实支撑观点`;

// Guided conversation flow steps
export const GUIDE_STEPS = [
  {
    key: 'topic',
    question: '🎯 你的 PPT 主题是什么？请告诉我具体的内容方向或主题名称。',
    field: 'title',
  },
  {
    key: 'pages',
    question: '📄 你希望做多少页的 PPT？（建议 8-15 页）',
    field: 'pages',
    default: 10,
  },
  {
    key: 'style',
    question: '🎨 你希望 PPT 是什么风格？\n\n推荐精选（设计感强）：\n- Bold Signal · 自信信号（深色+橙，大胆现代）\n- Electric Studio · 电力工作室（黑白分屏，专业干练）\n- Creative Voltage · 创意电压（电光蓝+霓虹黄）\n- Dark Botanical · 暗黑植物（优雅暖色点缀）\n- Notebook Tabs · 笔记本标签（奶油纸+彩色标签）\n- Pastel Geometry · 粉彩几何（柔和粉彩）\n- Split Pastel · 分屏粉彩（桃粉+薰衣草）\n- Vintage Editorial · 复古编辑（奶油底+深红）\n\n特色风格：\n- Neon Cyber · 霓虹赛博（未来科技风）\n- Terminal Green · 终端绿色（代码风）\n- Swiss Modern · 瑞士现代（极简白+红）\n- Paper & Ink · 纸墨书香（文艺衬线）\n\n经典风格：\n- 简约商务（蓝白经典）\n- 科技感（深色渐变）\n- 小清新（柔和粉彩）\n- 高端大气（深蓝金）\n- 学术严谨（白底规范）',
    field: 'style',
  },
  {
    key: 'direction',
    question: '🧭 这份 PPT 的核心方向是什么？\n\n例如：\n- 汇报总结\n- 方案介绍\n- 产品推广\n- 知识科普\n- 项目计划\n- 培训教学',
    field: 'direction',
  },
  {
    key: 'research',
    question: '🔍 是否需要 LLM 联网搜索调研资料来支撑内容？（需要/不需要）',
    field: 'research_needed',
    options: ['需要', '不需要'],
  },
  {
    key: 'use_case',
    question: '👥 使用场景和受众是谁？\n\n例如：\n- 向公司高管汇报\n- 产品发布会\n- 课堂演讲\n- 投资人路演\n- 团队内部培训',
    field: 'use_case',
  },
  {
    key: 'additional',
    question: '💡 还有什么额外的要求或补充信息吗？（如果没有，直接说"没有"即可）',
    field: 'additional_info',
    optional: true,
  },
  {
    key: 'confirm',
    question: '✅ 好的，我来确认一下你的需求：\n\n{summary}\n\n以上信息是否正确？如果正确回复"确认"，如果需要修改请说明要改哪里。',
    field: 'confirm',
  },
];

export function getGuideStep(index) {
  const step = GUIDE_STEPS[index];
  if (!step) return null;
  return { ...step, index };
}

export function buildSummary(data) {
  return `📋 PPT 主题：${data.title || '未设置'}
📄 页数：${data.pages || 10} 页
🎨 风格：${data.style || '未设置'}
🧭 方向：${data.direction || '未设置'}
🔍 调研：${data.research_needed ? '需要' : '不需要'}
👥 场景：${data.use_case || '未设置'}
💡 补充：${data.additional_info || '无'}`;
}

export async function generatePPTContent(data) {
  const openai = getClient();
  const model = openai._model;

  let researchContext = '';
  if (data.research_needed) {
    try {
      researchContext = '\n\n[注意：请在内容中结合你对这个主题的专业知识，如果引用数据请标注来源。]';
    } catch (e) {
      console.warn('Research failed, continuing without:', e.message);
    }
  }

  const userPrompt = `请为以下主题生成一份PPT内容：

主题：${data.title}
页数：${data.pages} 页
风格要求：${data.style}
核心方向：${data.direction}
使用场景：${data.use_case}
额外要求：${data.additional_info || '无'}
${researchContext}

请严格按照JSON格式输出，包含标题、副标题、style_key 和所有幻灯片内容。`;

  const response = await openai.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: PPT_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
    max_tokens: 8192,
  });

  const content = response.choices[0]?.message?.content || '{}';
  const parsed = JSON.parse(content);
  return parsed;
}

export async function continueConversation(projectId, messages) {
  const openai = getClient();
  const model = openai._model;

  const response = await openai.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: '你是一个PPT制作助手，帮助用户完善PPT内容和设计。请用中文友好回复。' },
      ...messages,
    ],
    temperature: 0.7,
    max_tokens: 4096,
  });

  const content = response.choices[0]?.message?.content || '';
  return content;
}

export default {
  generatePPTContent,
  continueConversation,
  getGuideStep,
  buildSummary,
  GUIDE_STEPS,
  clearClient,
  getModel,
};
