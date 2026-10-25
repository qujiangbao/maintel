import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  ClipboardList,
  GraduationCap,
  SendHorizontal,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { BrandName } from "@/components/brand";

const doors = [
  {
    href: "/login/student",
    index: "01",
    title: "学生报修",
    text: "填写机房、设备和故障描述，之后只看自己的进度。",
    icon: GraduationCap,
  },
  {
    href: "/login/admin",
    index: "02",
    title: "管理员分诊",
    text: "在页面上选择 DeepSeek 或智谱。两次结果都保留，确认后才能派发。",
    icon: ShieldCheck,
  },
  {
    href: "/login/technician",
    index: "03",
    title: "维修人员",
    text: "未派发的工单不会出现在这里。接单、处理、完成后状态继续留痕。",
    icon: Wrench,
  },
];

const flow = [
  { label: "提交报修", icon: ClipboardList },
  { label: "模型分诊", icon: Bot },
  { label: "管理员确认", icon: BadgeCheck },
  { label: "派发岗位", icon: SendHorizontal },
  { label: "接单处理", icon: Wrench },
];

export default function HomePage() {
  return (
    <div className="relative min-h-full overflow-hidden">
      <div className="hero-grid pointer-events-none absolute inset-0" />
      <div className="relative mx-auto flex min-h-full max-w-5xl flex-col px-4 py-10 sm:py-14">
        <BrandName />
        <section className="mt-14 max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            澄川学院 · 公共机房
          </p>
          <h1 className="font-display mt-4 text-4xl leading-tight tracking-tight sm:text-6xl">
            机房报修，
            <span className="text-primary">从提交到派发</span>
            一条线走完
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
            报修从学生提交开始，经过模型分诊和管理员确认，再派到对应维修岗位。电脑浏览器按这条路径可以走完提交到派发。
          </p>
        </section>

        <ol className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-3">
          {flow.map((step, index) => (
            <li key={step.label} className="flex items-center gap-3">
              {index > 0 ? <span className="hidden h-px w-6 bg-foreground/20 sm:block" /> : null}
              <span className="flex items-center gap-2 rounded-full bg-card px-3 py-1.5 text-sm ring-1 ring-foreground/10">
                <step.icon className="size-4 text-primary" />
                {step.label}
              </span>
            </li>
          ))}
        </ol>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {doors.map((door) => (
            <Link key={door.href} href={door.href} className="panel panel-hover group flex min-h-52 flex-col justify-between p-5">
              <span className="flex items-center justify-between">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <door.icon className="size-5" />
                </span>
                <span className="text-xs tracking-widest text-muted-foreground">{door.index}</span>
              </span>
              <span>
                <span className="font-display block text-2xl tracking-tight">{door.title}</span>
                <span className="mt-2 block text-sm leading-6 text-muted-foreground">{door.text}</span>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                  进入
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </span>
            </Link>
          ))}
        </div>

        <p className="mt-10 border-t border-border/70 pt-5 text-sm text-muted-foreground">
          机房范围：第一机房 A101、第二机房 A203、第三机房 B105、语音室 C210、电子阅览室 D301、创新实验室 E112。
        </p>
      </div>
    </div>
  );
}
