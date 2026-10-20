import type { PublicUser, Role, User } from "./types";

export const USERS: User[] = [
  {
    id: "s1",
    role: "student",
    username: "2023001",
    password: "lab2023",
    name: "陈一宁",
    detail: "计科2301",
  },
  {
    id: "s2",
    role: "student",
    username: "2023018",
    password: "lab2023",
    name: "林夏",
    detail: "软工2302",
  },
  {
    id: "s3",
    role: "student",
    username: "2023088",
    password: "lab2023",
    name: "周予安",
    detail: "网安2301",
  },
  {
    id: "a1",
    role: "admin",
    username: "admin",
    password: "room-admin",
    name: "赵衡",
    detail: "公共机房管理员",
  },
  {
    id: "t-host",
    role: "technician",
    username: "hw01",
    password: "repair-hw",
    name: "马工",
    detail: "主机维修岗",
    position: "主机维修岗",
  },
  {
    id: "t-display",
    role: "technician",
    username: "dp01",
    password: "repair-dp",
    name: "孙工",
    detail: "显示维修岗",
    position: "显示维修岗",
  },
  {
    id: "t-network",
    role: "technician",
    username: "net01",
    password: "repair-net",
    name: "吴工",
    detail: "网络维修岗",
    position: "网络维修岗",
  },
  {
    id: "t-media",
    role: "technician",
    username: "md01",
    password: "repair-md",
    name: "郑工",
    detail: "多媒体维修岗",
    position: "多媒体维修岗",
  },
  {
    id: "t-peripheral",
    role: "technician",
    username: "pe01",
    password: "repair-pe",
    name: "钱工",
    detail: "外设维修岗",
    position: "外设维修岗",
  },
];

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    role: user.role,
    username: user.username,
    name: user.name,
    detail: user.detail,
    position: user.position,
  };
}

export function findUser(id: string): User | undefined {
  return USERS.find((user) => user.id === id);
}

export function technicians(): User[] {
  return USERS.filter((user) => user.role === "technician");
}

export function authenticate(
  username: string,
  password: string,
  role: Role,
): { ok: true; user: User } | { ok: false; error: string } {
  const user = USERS.find((item) => item.username === username);
  if (!user || user.password !== password) {
    return { ok: false, error: "账号或密码不正确" };
  }
  if (user.role !== role) {
    return {
      ok: false,
      error: "这个入口不接受该类账号，请从对应身份的入口登录",
    };
  }
  return { ok: true, user };
}
