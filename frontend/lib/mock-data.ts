import type { ListingType } from "@prestige-homes/types";

export const LOC_TRIBECA = "Tribeca, New York, USA";
export const LOC_BEACON = "Notting Hill, London, United Kingdom";
export const LOC_PACHTS = "Ikoyi, Lagos, Nigeria";
export const LOC_SILVER = "Downtown, Dubai, UAE";
export const LOC_SYDNEY = "Paddington, Sydney, Australia";

export const LOCATIONS = [LOC_TRIBECA, LOC_BEACON, LOC_PACHTS, LOC_SILVER, LOC_SYDNEY];

export const CURRENCY: Record<string, string> = {
  [LOC_TRIBECA]: "$",
  [LOC_BEACON]: "£",
  [LOC_PACHTS]: "₦",
  [LOC_SILVER]: "AED ",
  [LOC_SYDNEY]: "A$",
};

export interface MockLandlord {
  id: string;
  name: string;
  phone: string;
  whatsapp: string;
  email: string;
  bio: string;
  verified: boolean;
  avatarSeed: string;
  homeLocation?: string;
}

export const LANDLORDS: MockLandlord[] = [
  {
    id: "l1",
    name: "Marguerite Voss",
    phone: "+1 212 555 0148",
    whatsapp: "12125550148",
    email: "marguerite@prestigehomes.example",
    bio: "Third-generation landlord with a portfolio of pre-war Tribeca lofts, restored with the same care as when they were first built.",
    verified: true,
    avatarSeed: "marguerite-voss",
  },
  {
    id: "l2",
    name: "Julian Ashford",
    phone: "+44 20 7946 0958",
    whatsapp: "442079460958",
    email: "julian@prestigehomes.example",
    bio: "Restores and lets grand stucco townhouses around Notting Hill, each one down to its original cornicing and sash windows.",
    verified: true,
    avatarSeed: "julian-ashford",
  },
  {
    id: "l3",
    name: "Priya Nakamura",
    phone: "+234 802 555 0172",
    whatsapp: "2348025550172",
    email: "priya@prestigehomes.example",
    bio: "Boutique landlord focused on Ikoyi waterfront residences for discerning long-term tenants and buyers.",
    verified: true,
    avatarSeed: "priya-nakamura",
  },
  {
    id: "l4",
    name: "Desmond Okafor",
    phone: "+971 4 555 0136",
    whatsapp: "97145550136",
    email: "desmond@prestigehomes.example",
    bio: "Downtown Dubai high-rise rentals with hand-selected finishes and full skyline views.",
    verified: false,
    avatarSeed: "desmond-okafor",
  },
  {
    id: "l5",
    name: "Celeste Bardot",
    phone: "+61 2 5550 0193",
    whatsapp: "61255500193",
    email: "celeste@prestigehomes.example",
    bio: "Sells landmark Sydney harbour-view residences exclusively, by private appointment only.",
    verified: true,
    avatarSeed: "celeste-bardot",
  },
  {
    id: "l6",
    name: "Rowan Mercer",
    phone: "+1 212 555 0164",
    whatsapp: "12125550164",
    email: "rowan@prestigehomes.example",
    bio: "Long-time Tribeca landlord currently between tenants — reach out to be first in line when a unit opens.",
    verified: true,
    avatarSeed: "rowan-mercer",
    homeLocation: LOC_TRIBECA,
  },
];

export interface MockListing {
  id: string;
  landlordId: string;
  title: string;
  location: string;
  address: string;
  type: ListingType;
  price: number;
  negotiable: boolean;
  beds: number;
  baths: number;
  sqft: number;
  seed: string;
  desc: string;
  dates: string[];
}

export const LISTINGS: MockListing[] = [
  {
    id: "p1",
    landlordId: "l1",
    title: "The Hudson Loft",
    location: LOC_TRIBECA,
    address: "214 Franklin Street, Unit 5A",
    type: "rent",
    price: 8400,
    negotiable: false,
    beds: 2,
    baths: 2,
    sqft: 1850,
    seed: "hudson-loft",
    desc: "A cast-iron facade loft with 12-foot ceilings, restored steel windows, and quiet river views over the historic district.",
    dates: ["Sat, Jul 18 · 11:00am", "Sun, Jul 19 · 2:00pm", "Wed, Jul 22 · 6:00pm"],
  },
  {
    id: "p2",
    landlordId: "l1",
    title: "Greene Street Duplex",
    location: LOC_TRIBECA,
    address: "88 Greene Street, PH",
    type: "rent",
    price: 12500,
    negotiable: true,
    beds: 3,
    baths: 3,
    sqft: 2600,
    seed: "greene-street-duplex",
    desc: "A duplex penthouse with a private roof terrace overlooking the cobblestones of Tribeca, finished in blackened oak.",
    dates: ["Fri, Jul 17 · 4:00pm", "Mon, Jul 20 · 10:00am"],
  },
  {
    id: "p3",
    landlordId: "l2",
    title: "Lansdowne Crescent Townhouse",
    location: LOC_BEACON,
    address: "12 Lansdowne Crescent",
    type: "sale",
    price: 4850000,
    negotiable: false,
    beds: 5,
    baths: 4,
    sqft: 3600,
    seed: "lansdowne-crescent",
    desc: "A grand stucco-fronted townhouse on one of Notting Hill's finest crescents, with a walled garden and private mews access.",
    dates: ["By private appointment"],
  },
  {
    id: "p4",
    landlordId: "l2",
    title: "Stanley Gardens Flat",
    location: LOC_BEACON,
    address: "9 Stanley Gardens",
    type: "rent",
    price: 5200,
    negotiable: true,
    beds: 2,
    baths: 2,
    sqft: 1400,
    seed: "stanley-gardens",
    desc: "A garden flat with high ceilings and original cornicing, moments from Portobello Road.",
    dates: ["Sat, Jul 18 · 1:00pm"],
  },
  {
    id: "p5",
    landlordId: "l3",
    title: "Bourdillon Road Villa",
    location: LOC_PACHTS,
    address: "14 Bourdillon Road, Ikoyi",
    type: "sale",
    price: 850000000,
    negotiable: false,
    beds: 6,
    baths: 6,
    sqft: 6200,
    seed: "bourdillon-villa",
    desc: "A gated waterfront villa with a private jetty and mature gardens, on Ikoyi's most exclusive road.",
    dates: ["By private appointment"],
  },
  {
    id: "p6",
    landlordId: "l3",
    title: "Glover Court Apartment",
    location: LOC_PACHTS,
    address: "Glover Court, Ikoyi",
    type: "rent",
    price: 3200000,
    negotiable: false,
    beds: 3,
    baths: 3,
    sqft: 2100,
    seed: "glover-court",
    desc: "A serviced waterfront apartment with full backup power and a resident concierge.",
    dates: ["Thu, Jul 16 · 5:30pm", "Sun, Jul 19 · 12:00pm"],
  },
  {
    id: "p7",
    landlordId: "l4",
    title: "Burj Vista Residence",
    location: LOC_SILVER,
    address: "Burj Vista, Downtown Dubai",
    type: "sale",
    price: 6200000,
    negotiable: false,
    beds: 4,
    baths: 5,
    sqft: 3800,
    seed: "burj-vista",
    desc: "A full-floor residence with uninterrupted Burj Khalifa and fountain views.",
    dates: ["By private appointment"],
  },
  {
    id: "p8",
    landlordId: "l4",
    title: "Downtown Views Tower",
    location: LOC_SILVER,
    address: "Downtown Views, Unit 22B",
    type: "rent",
    price: 12500,
    negotiable: true,
    beds: 2,
    baths: 2,
    sqft: 1500,
    seed: "downtown-views",
    desc: "A high-floor apartment with full skyline glazing and hotel-style amenities.",
    dates: ["Tue, Jul 21 · 9:00am"],
  },
  {
    id: "p9",
    landlordId: "l5",
    title: "Hopetoun Street Terrace",
    location: LOC_SYDNEY,
    address: "22 Hopetoun Street, Paddington",
    type: "sale",
    price: 3100000,
    negotiable: false,
    beds: 3,
    baths: 2,
    sqft: 1900,
    seed: "hopetoun-terrace",
    desc: "A restored Victorian terrace with a private courtyard, steps from Five Ways.",
    dates: ["By private appointment"],
  },
];

export interface MockAgent {
  id: string;
  name: string;
  phone: string;
  whatsapp: string;
  email: string;
  areas: string[];
  bio: string;
  experience: string;
}

export const AGENTS: MockAgent[] = [
  {
    id: "ag1",
    name: "Theodore Lang",
    phone: "+1 212 555 0301",
    whatsapp: "12125550301",
    email: "theodore@prestigehomes.example",
    areas: [LOC_TRIBECA, LOC_BEACON],
    bio: "Ten years brokering pre-war conversions across Lower Manhattan and prime London postcodes.",
    experience: "10 years",
  },
  {
    id: "ag2",
    name: "Fiona Marsh",
    phone: "+234 803 555 0322",
    whatsapp: "2348035550322",
    email: "fiona@prestigehomes.example",
    areas: [LOC_PACHTS],
    bio: "Specializes in waterfront residences and estate sales across Ikoyi and Victoria Island.",
    experience: "6 years",
  },
  {
    id: "ag3",
    name: "Andre Silva",
    phone: "+971 4 555 0356",
    whatsapp: "97145550356",
    email: "andre@prestigehomes.example",
    areas: [LOC_SILVER, LOC_SYDNEY],
    bio: "Focused on international buyers and renters across Dubai and Sydney.",
    experience: "4 years",
  },
];

export const FAQS = [
  {
    q: "How are listings verified?",
    a: 'Every landlord is checked against government ID and proof of ownership or management before their name ever reaches this page. A gold "Verified" mark means we have confirmed who they are — not just what they are selling.',
  },
  {
    q: "How do I contact a landlord directly?",
    a: "No agents, no forms that vanish into a call center. Every profile carries a direct phone number and WhatsApp line — tap to call or message the person who actually holds the keys.",
  },
  {
    q: "Is the price negotiable?",
    a: 'It depends on the home. Every listing is tagged clearly as either "Negotiable" or "Fixed Price" so you know exactly what kind of conversation you are walking into before you ever make an offer.',
  },
  {
    q: "How are viewings scheduled?",
    a: "Landlords publish the times they are personally available to show a property. Choose a slot on the listing page, or request your own — the landlord confirms it themselves.",
  },
  {
    q: "How do I list my own property?",
    a: 'Use "List a Property" in the header. You will submit your address, photos or video, price, and the times you are free to show it — live within a day of our review.',
  },
];

export function img(seed: string, w: number, h: number): string {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

export function fmtMoney(n: number, currency?: string): string {
  return (currency ?? "$") + n.toLocaleString("en-US");
}

export function priceLabel(listing: MockListing): string {
  const c = CURRENCY[listing.location] ?? "$";
  return listing.type === "rent" ? `${fmtMoney(listing.price, c)}/mo` : fmtMoney(listing.price, c);
}
