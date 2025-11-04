// lib/mock.ts
export type EventItem = {
  id: number;
  name: string;
  city: string;
  venue: string;
  date: string;
  time: string;
  cover: string;
  artist: string;
  desc: string;
};

export type Tier = {
  id: number;
  eventId: number;
  name: string;
  price: number;
  remaining: number;
};

export const mockEvents: EventItem[] = [
  {
    id: 1,
    name: "INTO1 南京演唱会",
    city: "南京",
    venue: "南京青奥体育公园体育馆",
    date: "2025-12-10",
    time: "19:30",
    cover: "https://picsum.photos/1200/600?random=11",
    artist: "INTO1",
    desc: "INTO1 全国巡演南京站，限量应援周边现场发放，支持实名制与电子票。",
  },
  {
    id: 2,
    name: "时代少年团 苏州见面会",
    city: "苏州",
    venue: "苏州奥体中心体育馆",
    date: "2025-11-20",
    time: "19:00",
    cover: "https://picsum.photos/1200/600?random=22",
    artist: "时代少年团",
    desc: "限定城市特别场，现场互动与惊喜环节，支持电子纪念品。",
  },
  {
    id: 3,
    name: "THE9 南京重聚演唱会",
    city: "南京",
    venue: "南京奥体中心体育馆",
    date: "2026-01-05",
    time: "19:30",
    cover: "https://picsum.photos/1200/600?random=33",
    artist: "THE9",
    desc: "重聚特别舞台，经典曲目全新编排，粉丝应援区限定。",
  },
];

export const mockTiers: Tier[] = [
  { id: 101, eventId: 1, name: "看台A", price: 380, remaining: 128 },
  { id: 102, eventId: 1, name: "看台B", price: 480, remaining: 96 },
  { id: 103, eventId: 1, name: "内场",  price: 680, remaining: 42 },
  { id: 201, eventId: 2, name: "普通票", price: 299, remaining: 200 },
  { id: 202, eventId: 2, name: "VIP",   price: 599, remaining: 50  },
  { id: 301, eventId: 3, name: "看台",  price: 420, remaining: 150 },
  { id: 302, eventId: 3, name: "内场",  price: 720, remaining: 60  },
];

export function getEventById(id: number) {
  return mockEvents.find(e => e.id === id) ?? null;
}
export function getTiersByEventId(eventId: number) {
  return mockTiers.filter(t => t.eventId === eventId);
}
