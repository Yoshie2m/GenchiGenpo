/** デザインシステムの素材（SVG）の URL。昼用（-day）と夜用（-night）を切り替える。 */
const files = import.meta.glob('./assets/**/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

function url(path: string): string {
  const found = files[`./assets/${path}`]
  if (!found) throw new Error(`デザインシステムの素材がありません: ${path}`)
  return found
}

const time = (night: boolean) => (night ? 'night' : 'day')

const PICTOGRAMS = {
  office: 'office',
  postTown: 'post-town',
  pass: 'pass',
  waypoint: 'waypoint',
} as const
export type PictogramKind = keyof typeof PICTOGRAMS

export const pictogramUrl = (kind: PictogramKind, night: boolean) =>
  url(`Pictograms/pict-${PICTOGRAMS[kind]}-${time(night)}.svg`)

/** 目的地のロゴ（候補 ID は代表漢字の読み。例: hamaki）。 */
export const destinationLogoUrl = (candidateId: string, night: boolean) =>
  url(`TeamLogos/team-${candidateId}-${time(night)}.svg`)

export const logoUrl = (night: boolean) => url(`Logos/ho-logo-${time(night)}.svg`)

/** 道中で通る6国の景色。 */
const PROVINCES: Readonly<Record<string, string>> = {
  三河国: 'mikawa',
  遠江国: 'tohtoumi',
  駿河国: 'suruga',
  伊豆国: 'izu',
  相模国: 'sagami',
  武蔵国: 'musashi',
}

export const provinceSceneUrl = (province: string): string | null =>
  PROVINCES[province] ? url(`Illustrations/kuni-${PROVINCES[province]}.svg`) : null
