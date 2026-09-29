// Brand photography for the landing page. These are licensed stock photos
// (Unsplash / Pexels licences) chosen for their verified Nigerian locations.
// They illustrate places and lifestyle only — never present them as listings.
// Listing imagery always comes from what landlords, agents and realtors upload.

export interface BrandPhoto {
  src: string;
  alt: string;
  /** Verified location from the photo's source metadata. */
  place: string;
  credit: string;
  source: string;
  /** CSS object-position, to keep the subject in frame when cropped. */
  focus?: string;
}

const dir = "/images/landing";

export const PHOTOS = {
  hero: {
    src: `${dir}/hero-victoria-island.jpg`,
    alt: "Aerial view of Victoria Island and Ikoyi across the Lagos lagoon",
    place: "Victoria Island, Lagos",
    credit: "Malik Buraimoh",
    source: "https://unsplash.com/photos/EMjpo0YjHPw",
    focus: "50% 40%",
  },
  poolVilla: {
    src: `${dir}/lagos-home-pool-terrace.jpg`,
    alt: "Contemporary white home with a private pool and glass balcony",
    place: "Lagos",
    credit: "Pexels contributor",
    source: "https://www.pexels.com/photo/16791339/",
    focus: "50% 82%",
  },
  mansion: {
    src: `${dir}/lagos-mansion-courtyard.jpg`,
    alt: "Large family home with a landscaped courtyard and palm trees",
    place: "Lagos",
    credit: "Vitalis Nwenyi",
    source: "https://unsplash.com/photos/QYVarY4t49o",
    focus: "25% 45%",
  },
  tower: {
    src: `${dir}/lagos-residential-tower.jpg`,
    alt: "Modern high-rise residential building",
    place: "Lagos",
    credit: "Pexels contributor",
    source: "https://www.pexels.com/photo/34557960/",
    focus: "50% 30%",
  },
  duplex: {
    src: `${dir}/contemporary-duplex.jpg`,
    alt: "Contemporary duplex entrance with stone cladding and glass railings",
    place: "Nigeria",
    credit: "Pexels contributor",
    source: "https://www.pexels.com/photo/34591375/",
  },
  villa: {
    src: `${dir}/akure-modern-villa.jpg`,
    alt: "Modern white villa with columns",
    place: "Akure",
    credit: "Ferdinand Asakome",
    source: "https://unsplash.com/photos/YI5vG37d-Ig",
  },
  kitchen: {
    src: `${dir}/lagos-kitchen.jpg`,
    alt: "Marble kitchen with pendant lights in a newly finished home",
    place: "Lagos",
    credit: "Emmanuel Ikwuegbu",
    source: "https://unsplash.com/photos/BdZPID68yjM",
  },
  livingRoom: {
    src: `${dir}/abuja-living-room.jpg`,
    alt: "Warm modern living room and kitchen",
    place: "Abuja",
    credit: "Pexels contributor",
    source: "https://www.pexels.com/photo/39854853/",
  },
  modernHome: {
    src: `${dir}/abuja-modern-home.jpg`,
    alt: "Contemporary family home with brick and render facade",
    place: "Abuja",
    credit: "Pexels contributor",
    source: "https://www.pexels.com/photo/38040969/",
  },
  poolside: {
    src: `${dir}/abuja-poolside.jpg`,
    alt: "Poolside lounge in a landscaped garden",
    place: "Abuja",
    credit: "Pexels contributor",
    source: "https://www.pexels.com/photo/36852971/",
  },
  land: {
    src: `${dir}/land-plots-aerial.jpg`,
    alt: "Aerial view of land plots and new homes",
    place: "Ibadan",
    credit: "Tunde Buremo",
    source: "https://images.unsplash.com/photo-1783260606332-23546f99b8c8",
  },
  estate: {
    src: `${dir}/sangotedo-estate.jpg`,
    alt: "Quiet estate street lined with white duplexes and palm trees",
    place: "Ajah / Sangotedo, Lagos",
    credit: "Mac Nzombola",
    source: "https://unsplash.com/photos/BE9-swZtUa8",
  },
  lakowe: {
    src: `${dir}/lakowe-lakes-home.jpg`,
    alt: "Home balcony overlooking a lawn at Lakowe Lakes estate",
    place: "Lakowe Lakes, Lekki–Epe",
    credit: "Ositadinma Onyeobi",
    source: "https://images.unsplash.com/photo-1788024171338-e5b007e08bfb",
  },
  lifestyle: {
    src: `${dir}/lagos-home-lifestyle.jpg`,
    alt: "Two friends laughing on a sofa at home",
    place: "Lagos",
    credit: "Ninthgrid",
    source: "https://images.unsplash.com/photo-1739300293388-ddbe4b4cb1f0",
    focus: "50% 35%",
  },
  bridgeNight: {
    src: `${dir}/lekki-bridge-night.jpg`,
    alt: "Lekki–Ikoyi Link Bridge lit up at night",
    place: "Lekki–Ikoyi Link Bridge, Lagos",
    credit: "Opeyemi Adisa",
    source: "https://images.unsplash.com/photo-1648023200201-8fcede127835",
  },
  areaLekki: {
    src: `${dir}/area-lekki.jpg`,
    alt: "Aerial view over the Lekki–Ikoyi Link Bridge and lagoon",
    place: "Lekki, Lagos",
    credit: "Tunde Buremo",
    source: "https://unsplash.com/photos/n8DxalbQBic",
  },
  areaVI: {
    src: `${dir}/area-victoria-island.jpg`,
    alt: "Victoria Island skyline by the Atlantic",
    place: "Victoria Island, Lagos",
    credit: "Onaopemipo Oladipupo",
    source: "https://unsplash.com/photos/20o-8pav22k",
  },
  areaIkoyi: {
    src: `${dir}/area-ikoyi.jpg`,
    alt: "Residential blocks and greenery in Ikoyi",
    place: "Ikoyi, Lagos",
    credit: "Obinna Okerekeocha",
    source: "https://images.unsplash.com/photo-1594538756542-8c88bda491c5",
  },
  areaAbuja: {
    src: `${dir}/area-abuja.jpg`,
    alt: "Homes near Zuma Rock outside Abuja",
    place: "Abuja",
    credit: "Pexels contributor",
    source: "https://www.pexels.com/photo/36814806/",
  },
  areaPH: {
    src: `${dir}/port-harcourt-pool.jpg`,
    alt: "Outdoor pool at a home in Port Harcourt",
    place: "Port Harcourt",
    credit: "Pexels contributor",
    source: "https://www.pexels.com/photo/14934629/",
  },
} satisfies Record<string, BrandPhoto>;
