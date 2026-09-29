// Reference data: Nigerian states and well-known areas within them. Not user data.

export const LOC_LAGOS = "Lagos, Nigeria";
export const LOC_ABUJA = "Abuja, Nigeria";
export const LOC_RIVERS = "Rivers, Nigeria";

// All 36 Nigerian states plus the Federal Capital Territory (Abuja), so the location
// picker/filters cover the whole country — even though live listings today are
// concentrated in the three launch states below.
export const LOCATIONS = [
  "Abia, Nigeria",
  LOC_ABUJA,
  "Adamawa, Nigeria",
  "Akwa Ibom, Nigeria",
  "Anambra, Nigeria",
  "Bauchi, Nigeria",
  "Bayelsa, Nigeria",
  "Benue, Nigeria",
  "Borno, Nigeria",
  "Cross River, Nigeria",
  "Delta, Nigeria",
  "Ebonyi, Nigeria",
  "Edo, Nigeria",
  "Ekiti, Nigeria",
  "Enugu, Nigeria",
  "Gombe, Nigeria",
  "Imo, Nigeria",
  "Jigawa, Nigeria",
  "Kaduna, Nigeria",
  "Kano, Nigeria",
  "Katsina, Nigeria",
  "Kebbi, Nigeria",
  "Kogi, Nigeria",
  "Kwara, Nigeria",
  LOC_LAGOS,
  "Nasarawa, Nigeria",
  "Niger, Nigeria",
  "Ogun, Nigeria",
  "Ondo, Nigeria",
  "Osun, Nigeria",
  "Oyo, Nigeria",
  "Plateau, Nigeria",
  LOC_RIVERS,
  "Sokoto, Nigeria",
  "Taraba, Nigeria",
  "Yobe, Nigeria",
  "Zamfara, Nigeria",
];

// Shortlist for "popular" quick-pick UI (homepage/search) — showing all 37 states there
// would bury the ones people actually browse today.
export const POPULAR_LOCATIONS = [LOC_LAGOS, LOC_ABUJA, LOC_RIVERS];

// Well-known cities/LGAs/districts within each state, keyed by the full LOCATIONS entry.
// Powers the "areas you cover" typeahead once a landlord/agent/realtor picks their state(s) —
// coverage is deepest for the three launch states since that's where real listings live.
export const AREAS_BY_STATE: Record<string, string[]> = {
  "Abia, Nigeria": ["Aba", "Umuahia", "Ohafia", "Arochukwu", "Isiala Ngwa", "Umunneochi"],
  [LOC_ABUJA]: [
    "Maitama",
    "Wuse",
    "Wuse II",
    "Garki",
    "Asokoro",
    "Gwarinpa",
    "Jabi",
    "Utako",
    "Life Camp",
    "Kubwa",
    "Gwagwalada",
    "Lugbe",
  ],
  "Adamawa, Nigeria": ["Yola", "Mubi", "Numan", "Ganye", "Jimeta", "Girei"],
  "Akwa Ibom, Nigeria": ["Uyo", "Eket", "Ikot Ekpene", "Oron", "Abak", "Etinan"],
  "Anambra, Nigeria": ["Awka", "Onitsha", "Nnewi", "Ekwulobia", "Aguata", "Ihiala"],
  "Bauchi, Nigeria": ["Bauchi", "Azare", "Misau", "Jama'are", "Ningi", "Katagum"],
  "Bayelsa, Nigeria": ["Yenagoa", "Brass", "Sagbama", "Ogbia", "Nembe"],
  "Benue, Nigeria": ["Makurdi", "Gboko", "Otukpo", "Katsina-Ala", "Vandeikya"],
  "Borno, Nigeria": ["Maiduguri", "Biu", "Bama", "Dikwa", "Konduga"],
  "Cross River, Nigeria": ["Calabar", "Ikom", "Ogoja", "Obudu", "Ugep"],
  "Delta, Nigeria": ["Warri", "Asaba", "Sapele", "Ughelli", "Agbor", "Effurun"],
  "Ebonyi, Nigeria": ["Abakaliki", "Afikpo", "Onueke", "Ezza"],
  "Edo, Nigeria": ["Benin City", "GRA Benin", "Auchi", "Ekpoma", "Uromi", "Ubiaja"],
  "Ekiti, Nigeria": ["Ado-Ekiti", "Ikere-Ekiti", "Ise-Ekiti", "Ijero-Ekiti", "Oye-Ekiti"],
  "Enugu, Nigeria": ["Enugu", "Nsukka", "Awgu", "Oji River", "Independence Layout", "New Haven"],
  "Gombe, Nigeria": ["Gombe", "Kaltungo", "Billiri", "Dukku"],
  "Imo, Nigeria": ["Owerri", "New Owerri", "Orlu", "Okigwe", "Mbaise"],
  "Jigawa, Nigeria": ["Dutse", "Hadejia", "Gumel", "Birnin Kudu"],
  "Kaduna, Nigeria": ["Kaduna", "Zaria", "Kafanchan", "Barnawa", "Sabon Gari"],
  "Kano, Nigeria": ["Kano", "Fagge", "Nasarawa GRA", "Sabon Gari", "Bompai", "Gwale"],
  "Katsina, Nigeria": ["Katsina", "Daura", "Funtua", "Malumfashi"],
  "Kebbi, Nigeria": ["Birnin Kebbi", "Argungu", "Yauri", "Zuru"],
  "Kogi, Nigeria": ["Lokoja", "Okene", "Idah", "Kabba"],
  "Kwara, Nigeria": ["Ilorin", "Offa", "Omu-Aran", "Jebba"],
  [LOC_LAGOS]: [
    "Yaba",
    "Lekki Phase 1",
    "Ikeja GRA",
    "Ikeja",
    "Surulere",
    "Victoria Island",
    "Ikoyi",
    "Ajah",
    "Lekki",
    "Ikorodu",
    "Apapa",
    "Magodo",
    "Gbagada",
    "Maryland",
    "Festac",
    "Ojodu",
    "Egbeda",
    "Agege",
    "Alimosho",
    "Epe",
    "Badagry",
    "Ibeju-Lekki",
    "Oshodi",
    "Ojota",
  ],
  "Nasarawa, Nigeria": ["Lafia", "Keffi", "Akwanga", "Nasarawa"],
  "Niger, Nigeria": ["Minna", "Bida", "Kontagora", "Suleja"],
  "Ogun, Nigeria": ["Abeokuta", "Sagamu", "Ijebu-Ode", "Ota", "Agbara", "Mowe"],
  "Ondo, Nigeria": ["Akure", "Ondo City", "Owo", "Ile-Oluji", "Okitipupa"],
  "Osun, Nigeria": ["Osogbo", "Ile-Ife", "Ilesa", "Ede", "Iwo"],
  "Oyo, Nigeria": ["Ibadan", "Bodija", "Ring Road", "Ogbomoso", "Iseyin", "Oyo Town"],
  "Plateau, Nigeria": ["Jos", "Bukuru", "Pankshin", "Shendam"],
  [LOC_RIVERS]: [
    "GRA Phase 2",
    "Rumuola",
    "Eliozu",
    "Trans Amadi",
    "Port Harcourt",
    "Woji",
    "D-Line",
    "Ada George",
    "Rumuokwuta",
    "Elelenwo",
  ],
  "Sokoto, Nigeria": ["Sokoto", "Wurno", "Tambuwal", "Gwadabawa"],
  "Taraba, Nigeria": ["Jalingo", "Wukari", "Bali", "Gembu"],
  "Yobe, Nigeria": ["Damaturu", "Potiskum", "Nguru", "Gashua"],
  "Zamfara, Nigeria": ["Gusau", "Kaura Namoda", "Talata Mafara"],
};

// Union of areas across the given states, e.g. once a user picks their state(s) this
// feeds the "areas you cover" typeahead with only the places that actually apply.
export function areasForStates(states: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const state of states) {
    for (const area of AREAS_BY_STATE[state] ?? []) {
      if (!seen.has(area)) {
        seen.add(area);
        out.push(area);
      }
    }
  }
  return out;
}
