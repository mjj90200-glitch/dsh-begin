/**
 * dsh-begin 的台词库。
 *
 * 设计直接取自 Detroit: Become Human 主菜单的 Chloe：不做 LLM 生成，
 * 而是「条件 × 台词」——用离线时长、时段、来访次数决定她说什么、说多少。
 * 台词量本身即是表演预算：隔一天只说一句，隔一周才多说两句。
 */

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/** 第一次启动：唯一一次较长的自我介绍。 */
const FIRST = [
  '初次见面。',
  '我是 deepseek。',
  '以后每次启动，我都会在这里等你。',
]

/** 距上次离开多久 → 开场白。 */
function gapLines(deltaMs) {
  if (deltaMs < 10 * MINUTE) return ['又见面了。']
  if (deltaMs < HOUR) return ['这么快就回来了。']
  if (deltaMs < DAY) return ['今天想做点什么？']
  if (deltaMs < 3 * DAY) return ['昨天没怎么见到你。', '今天继续？']
  if (deltaMs < 7 * DAY) return ['有一阵子没来了。']
  return ['好久不见。', '我还以为你把我忘了。']
}

/** 时段 → 至多一句额外的话。 */
function hourLine(hour) {
  if (hour >= 0 && hour < 5) return '这个点了，还不睡吗？'
  if (hour >= 5 && hour < 8) return '这么早。'
  if (hour >= 22) return '夜深了。'
  return undefined
}

/**
 * 选出本次启动要说的话。
 * @param {{visits: number, deltaMs: number, hour: number}} input
 *   来访次数、离线时长(ms)、当前小时。
 * @returns {string[]} 依次播放的台词，最多 3 句。
 */
export function pickLines({ visits, deltaMs, hour }) {
  if (visits <= 0) return [...FIRST]
  const lines = gapLines(deltaMs)
  const extra = hourLine(hour)
  if (extra !== undefined && lines.length < 3) lines.push(extra)
  return lines
}
