import Link from "next/link";

const doors = [
  {
    href: "/login/student",
    index: "01",
    title: "学生报修",
    text: "填写机房、设备和故障描述，之后只看自己的进度。",
  },
  {
    href: "/login/admin",
    index: "02",
    title: "管理员分诊",
    text: "在页面上选择 DeepSeek 或智谱。两次结果都保留，确认后才能派发。",
  },
  {
    href: "/login/technician",
    index: "03",
    title: "维修人员",
    text: "未派发的工单不会出现在这里。接单、处理、完成后状态继续留痕。",
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto flex min-h-full max-w-5xl flex-col px-4 py-10 sm:py-16">
      <p className="text-sm text-muted-foreground">澄川学院 · 公共机房</p>
      <h1 className="font-display mt-3 text-4xl sm:text-5xl">机务台</h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
        报修从学生提交开始，经过模型分诊和管理员确认，再派到对应维修岗位。电脑浏览器按这条路径可以走完提交到派发。
      </p>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {doors.map((door) => (
          <Link
            key={door.href}
            href={door.href}
            className="flex min-h-44 flex-col justify-between rounded-xl bg-card p-5 ring-1 ring-foreground/10 transition-colors hover:bg-accent"
          >
            <span className="text-xs tracking-widest text-muted-foreground">{door.index}</span>
            <span>
              <span className="font-display block text-2xl">{door.title}</span>
              <span className="mt-2 block text-sm leading-6 text-muted-foreground">{door.text}</span>
            </span>
          </Link>
        ))}
      </div>
      <p className="mt-10 text-sm text-muted-foreground">
        机房范围：第一机房 A101、第二机房 A203、第三机房 B105、语音室 C210、电子阅览室 D301、创新实验室 E112。
      </p>
    </div>
  );
}
