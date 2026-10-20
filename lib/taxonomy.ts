import type { TagId, Urgency } from "./types";

export const ROOMS = [
  "第一机房 A101",
  "第二机房 A203",
  "第三机房 B105",
  "语音室 C210",
  "电子阅览室 D301",
  "创新实验室 E112",
] as const;

export type TagDef = {
  id: TagId;
  name: string;
  position: string;
  criteria: string;
};

export const TAGS: TagDef[] = [
  {
    id: "host",
    name: "计算机主机",
    position: "主机维修岗",
    criteria:
      "故障主体是主机箱或整机系统：按电源无反应、开不了机、反复重启、蓝屏、死机无响应、自动关机、风扇或硬盘异响、内存或电源报警、机箱过热死机、冒烟、火花、焦糊味。若写明把显示器接到另一台主机后显示正常，故障在主机。网络图标正常、本地程序卡死，也归主机。",
  },
  {
    id: "display",
    name: "显示设备",
    position: "显示维修岗",
    criteria:
      "主机已经通电、风扇在转或已经进入系统，问题出在显示器或视频信号：黑屏但主机灯亮、花屏、闪屏、偏色、亮线、裂屏、背光不亮、无信号、白屏、半边不亮。若写明这台显示器接到另一台主机仍然故障，归显示设备。学生工位自己的屏幕不属于投影幕布。",
  },
  {
    id: "network",
    name: "网络设备",
    position: "网络维修岗",
    criteria:
      "电脑能开机进入系统，故障在链路、地址或认证：网页打不开、ping 不通、IP 冲突、网线或水晶头损坏、网口无链路灯、交换机指示灯异常、无线 AP 无信号、校园网客户端认证失败、只有这一台或一整排或整间上不了网。本地文件和桌面正常。",
  },
  {
    id: "media",
    name: "投影与多媒体",
    position: "多媒体维修岗",
    criteria:
      "对象是教室公共视听设备，不是学生工位的显示器、键盘或耳麦：投影仪不亮、模糊、偏色、过热关机，幕布升降失败，音响无声或电流声，话筒无声或啸叫，中控死机或开不了，电子白板或教学一体机触控失灵，HDMI 切换后投影没画面而电脑自身屏幕正常。",
  },
  {
    id: "peripheral",
    name: "外设",
    position: "外设维修岗",
    criteria:
      "主机和网络正常，故障在输入输出配件：键盘失灵、鼠标不动或飘移、打印机卡纸、缺墨或脱机、扫描仪无响应、摄像头无图像、耳麦单侧无声或麦克风无输入、数位板无响应。耳麦故障不要判成教室音响，除非写明是墙上音响或全班听力主控。",
  },
];

export type UrgencyDef = {
  id: Urgency;
  name: string;
  criteria: string;
};

export const URGENCIES: UrgencyDef[] = [
  {
    id: "critical",
    name: "特急",
    criteria:
      "出现冒烟、焦糊、火花、烧焦、漏电等安全风险；或者整间房间的主要功能全部不可用，例如整间断网、整间机器都不能用、整间正在进行的考试完全进行不下去。单台教师机或单台投影故障即使正在上课，也不要升到特急，除非同时有安全风险或整间瘫痪。",
  },
  {
    id: "high",
    name: "紧急",
    criteria:
      "没有达到特急，但正文写明正在上课、正在考试、正在测验，或验收、参观、答辩已经开始；或者一整排工位同时故障；或者教师机、投影仪、中控等教室公共设备在本节或下一节马上要用时不可用。",
  },
  {
    id: "medium",
    name: "较急",
    criteria:
      "单台设备已经不能完成当前任务，需要当天处理。没有安全风险，没有写明正在上课或考试，也不是整排或整间同时故障。",
  },
  {
    id: "low",
    name: "一般",
    criteria:
      "设备仍能勉强使用，只有轻微缺陷，或者现场已经有替代设备。例如个别按键失灵但仍能输入、鼠标滚轮坏了左右键正常、打印机卡纸但旁边还有一台、轻微偏色仍能看清。",
  },
];

export const URGENCY_ORDER = [
  "先判断特急，再判断紧急，然后是较急，最后是一般。高等级一旦成立就不再降级。",
] as const;

export function tagById(id: TagId): TagDef {
  const found = TAGS.find((tag) => tag.id === id);
  if (!found) throw new Error(`未知标签 ${id}`);
  return found;
}

export function positionFor(id: TagId): string {
  return tagById(id).position;
}

export function taxonomyPrompt(): string {
  const tags = TAGS.map(
    (tag, index) =>
      `${index + 1}. ${tag.id}（${tag.name}）→ ${tag.position}\n${tag.criteria}`,
  ).join("\n");
  const urgency = URGENCIES.map(
    (item) => `- ${item.id}（${item.name}）：${item.criteria}`,
  ).join("\n");
  return [
    "你是澄川学院公共机房的报修分诊员。只根据下面写入系统的划分依据判断，不要自创类别。",
    "五类设备标签和岗位：",
    tags,
    "紧急程度，按这个顺序匹配：",
    urgency,
    "岗位必须使用该标签对应的维修岗位全称，不要改写。",
    "只输出一个 JSON 对象，不要 Markdown。字段为 tag、urgency、position、reason。",
    'tag 只能是 host、display、network、media、peripheral。urgency 只能是 low、medium、high、critical。reason 用一句中文说明依据，不超过 80 字。',
  ].join("\n\n");
}
