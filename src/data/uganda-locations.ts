/**
 * Where a seeker lives or wants to work: strictly Ugandan places. The list is Uganda's districts by
 * region, plus Kampala Capital City, Fort Portal City and Entebbe, which listings name on their own.
 * District names follow the Ministry of Local Government spelling.
 */
export type UgandaRegion = "Central" | "Eastern" | "Northern" | "Western";

export const UGANDA_DISTRICTS: Record<UgandaRegion, readonly string[]> = {
  Central: ["Buikwe", "Bukomansimbi", "Butambala", "Buvuma", "Entebbe", "Gomba", "Kalangala", "Kalungu", "Kampala", "Kasanda", "Kayunga", "Kiboga", "Kyankwanzi", "Kyotera", "Luweero", "Lwengo", "Lyantonde", "Masaka", "Mityana", "Mpigi", "Mubende", "Mukono", "Nakaseke", "Nakasongola", "Rakai", "Sembabule", "Wakiso"],
  Eastern: ["Amuria", "Budaka", "Bududa", "Bugiri", "Bugweri", "Bukedea", "Bukwo", "Bulambuli", "Busia", "Butaleja", "Butebo", "Buyende", "Iganga", "Jinja", "Kaberamaido", "Kalaki", "Kaliro", "Kamuli", "Kapchorwa", "Kapelebyong", "Katakwi", "Kibuku", "Kumi", "Kween", "Luuka", "Manafwa", "Mayuge", "Mbale", "Namayingo", "Namisindwa", "Namutumba", "Ngora", "Pallisa", "Serere", "Sironko", "Soroti", "Tororo"],
  Northern: ["Abim", "Adjumani", "Agago", "Alebtong", "Amolatar", "Amudat", "Amuru", "Apac", "Arua", "Dokolo", "Gulu", "Kaabong", "Karenga", "Kitgum", "Koboko", "Kole", "Kotido", "Kwania", "Lamwo", "Lira", "Madi-Okollo", "Maracha", "Moroto", "Moyo", "Nabilatuk", "Nakapiripirit", "Napak", "Nebbi", "Nwoya", "Obongi", "Omoro", "Otuke", "Oyam", "Pader", "Pakwach", "Terego", "Yumbe", "Zombo"],
  Western: ["Buhweju", "Buliisa", "Bundibugyo", "Bunyangabu", "Bushenyi", "Fort Portal", "Hoima", "Ibanda", "Isingiro", "Kabale", "Kabarole", "Kagadi", "Kakumiro", "Kamwenge", "Kanungu", "Kasese", "Kazo", "Kibaale", "Kikuube", "Kiruhura", "Kiryandongo", "Kisoro", "Kitagwenda", "Kyegegwa", "Kyenjojo", "Masindi", "Mbarara", "Mitooma", "Ntoroko", "Ntungamo", "Rubanda", "Rubirizi", "Rukiga", "Rukungiri", "Rwampara", "Sheema"],
};

/** Preferred locations may also be "Uganda", meaning anywhere in the country. */
export const ANYWHERE_IN_UGANDA = "Uganda";

/** Older spellings people still type, mapped to the current district name. */
const ALIASES: Record<string, string> = { luwero: "Luweero", kassanda: "Kasanda", ssembabule: "Sembabule", "madi okollo": "Madi-Okollo", "fort portal city": "Fort Portal", "kampala capital city": "Kampala", kcca: "Kampala" };

const key = (value: string): string => value.toLowerCase().replace(/[^a-z]+/g, " ").replace(/\b(district|city|municipality|uganda)\b/g, " ").replace(/\s+/g, " ").trim();

const REGION_OF = new Map<string, UgandaRegion>();
const BY_KEY = new Map<string, string>();
for (const [region, places] of Object.entries(UGANDA_DISTRICTS) as Array<[UgandaRegion, readonly string[]]>) {
  for (const place of places) { REGION_OF.set(place, region); BY_KEY.set(key(place), place); }
}
for (const [alias, place] of Object.entries(ALIASES)) BY_KEY.set(key(alias), place);

/** Every place a seeker can pick as their current location, A to Z. */
export const UGANDA_LOCATIONS: readonly string[] = [...REGION_OF.keys()].sort((a, b) => a.localeCompare(b));

export function ugandaRegion(place: string): UgandaRegion | null { return REGION_OF.get(place) ?? null; }

/**
 * The canonical district name for what someone typed or stored ("kampala", "Gulu District, Uganda",
 * "Luwero"), or null when it is not a Ugandan district.
 */
export function canonicalUgandaLocation(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  return BY_KEY.get(key(value)) ?? null;
}

/** Same as canonicalUgandaLocation, but also accepts "Uganda" (anywhere in the country) for preferences. */
export function canonicalPreferredLocation(value: string | null | undefined): string | null {
  if (value?.trim().toLowerCase() === ANYWHERE_IN_UGANDA.toLowerCase()) return ANYWHERE_IN_UGANDA;
  return canonicalUgandaLocation(value);
}
