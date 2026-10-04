// このファイルは scripts/generate-master-data.mjs が team-tokaido-mobility-map.md から作る。直接編集しない（npm run master-data）。
import type { MissionPlan } from '../../publishedLanguage/missionPlan.ts'

/** ミッション候補の一覧（並び順が自動確定の優先順）。 */
export const MISSION_CANDIDATES: readonly MissionPlan[] = [
  {
    candidateId: 'hamaki',
    destination: {
      name: '遠州・浜名屋',
      kanji: '浜木',
      reading: 'Hamaki',
      province: '遠江国',
      memo: '旧東海道・浜松宿のあたり。浜名湖を越えれば遠州路。ここを越えればチームの団結力も本物。',
    },
    targetSteps: 114000,
    periodDays: 11,
    waypoints: [
      {
        name: '藤川宿',
        progressSteps: 38000,
        points: {
          first: 1000,
          second: 500,
        },
      },
      {
        name: '二川宿',
        progressSteps: 76000,
        points: {
          first: 1000,
          second: 500,
        },
      },
    ],
  },
  {
    candidateId: 'shokuho',
    destination: {
      name: '裾野・からくり村',
      kanji: '織豊',
      reading: 'Shokuho',
      province: '駿河国',
      memo: '富士山のふもと、裾野に広がる村。東海道から富士山側へ分岐して目指す。',
    },
    targetSteps: 305000,
    periodDays: 29,
    waypoints: [
      {
        name: '赤坂宿',
        progressSteps: 44000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '新居宿',
        progressSteps: 87000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '見附宿',
        progressSteps: 131000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '金谷宿',
        progressSteps: 174000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '丸子宿',
        progressSteps: 218000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '蒲原宿',
        progressSteps: 261000,
        points: {
          first: 1100,
          second: 550,
        },
      },
    ],
  },
  {
    candidateId: 'irin',
    destination: {
      name: '湘南・大八車工房',
      kanji: '伊鈴',
      reading: 'Irin',
      province: '相模国',
      memo: '旧東海道・藤沢宿の目と鼻の先。湘南の海風を感じながら、江戸まであと一息。',
    },
    targetSteps: 388000,
    periodDays: 37,
    waypoints: [
      {
        name: '赤坂宿',
        progressSteps: 43000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '新居宿',
        progressSteps: 86000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '見附宿',
        progressSteps: 129000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '金谷宿',
        progressSteps: 172000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '丸子宿',
        progressSteps: 216000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '蒲原宿',
        progressSteps: 259000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '沼津宿',
        progressSteps: 302000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '小田原宿',
        progressSteps: 345000,
        points: {
          first: 1100,
          second: 550,
        },
      },
    ],
  },
  {
    candidateId: 'seibo',
    destination: {
      name: '恵比寿・都大路屋',
      kanji: '星昴',
      reading: 'Seibo',
      province: '武蔵国',
      memo: '品川宿の手前で、渋谷・恵比寿方面へ進路を取る都会ルート。',
    },
    targetSteps: 465000,
    periodDays: 44,
    waypoints: [
      {
        name: '赤坂宿',
        progressSteps: 47000,
        points: {
          first: 1200,
          second: 600,
        },
      },
      {
        name: '新居宿',
        progressSteps: 93000,
        points: {
          first: 1200,
          second: 600,
        },
      },
      {
        name: '見附宿',
        progressSteps: 140000,
        points: {
          first: 1200,
          second: 600,
        },
      },
      {
        name: '嶋田宿',
        progressSteps: 186000,
        points: {
          first: 1200,
          second: 600,
        },
      },
      {
        name: '江尻宿',
        progressSteps: 233000,
        points: {
          first: 1200,
          second: 600,
        },
      },
      {
        name: '吉原宿',
        progressSteps: 279000,
        points: {
          first: 1200,
          second: 600,
        },
      },
      {
        name: '箱根宿',
        progressSteps: 326000,
        points: {
          first: 1200,
          second: 600,
        },
      },
      {
        name: '大磯宿',
        progressSteps: 372000,
        points: {
          first: 1200,
          second: 600,
        },
      },
      {
        name: '程ヶ谷宿',
        progressSteps: 419000,
        points: {
          first: 1200,
          second: 600,
        },
      },
    ],
  },
  {
    candidateId: 'yoya',
    destination: {
      name: '古河・鉄輪工房',
      kanji: '陽野',
      reading: 'Yoya',
      province: '下総国',
      memo: '江戸を越え、旧日光街道の宿場町「古河宿」へ向かう北関東ルート。',
    },
    targetSteps: 569000,
    periodDays: 54,
    waypoints: [
      {
        name: '赤坂宿',
        progressSteps: 44000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '白須賀宿',
        progressSteps: 88000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '見附宿',
        progressSteps: 131000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '日坂宿',
        progressSteps: 175000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '丸子宿',
        progressSteps: 219000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '由比宿',
        progressSteps: 263000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '沼津宿',
        progressSteps: 306000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '小田原宿',
        progressSteps: 350000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '平塚宿',
        progressSteps: 394000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '神奈川宿',
        progressSteps: 438000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '日本橋',
        progressSteps: 481000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '粕壁宿',
        progressSteps: 525000,
        points: {
          first: 1100,
          second: 550,
        },
      },
    ],
  },
  {
    candidateId: 'yumemoto',
    destination: {
      name: '芳賀・知恵蔵',
      kanji: '夢本',
      reading: 'Yumemoto',
      province: '下野国',
      memo: '江戸を越えて日光街道を北へ。宇都宮宿の先、田園の広がる下野の地。',
    },
    targetSteps: 632000,
    periodDays: 60,
    waypoints: [
      {
        name: '赤坂宿',
        progressSteps: 45000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '新居宿',
        progressSteps: 90000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '見附宿',
        progressSteps: 135000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '嶋田宿',
        progressSteps: 181000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '府中宿',
        progressSteps: 226000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '吉原宿',
        progressSteps: 271000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '箱根宿',
        progressSteps: 316000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '大磯宿',
        progressSteps: 361000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '戸塚宿',
        progressSteps: 406000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '品川宿',
        progressSteps: 451000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '越ヶ谷宿',
        progressSteps: 497000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '中田宿',
        progressSteps: 542000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '小金井宿',
        progressSteps: 587000,
        points: {
          first: 1100,
          second: 550,
        },
      },
    ],
  },
  {
    candidateId: 'konsho',
    destination: {
      name: '安芸・瀬戸内屋',
      kanji: '魂松',
      reading: 'Konsho',
      province: '安芸国',
      memo: '刈谷から西国街道をひたすら西へ。瀬戸内の海を目指す山陽ルート。',
    },
    targetSteps: 653000,
    periodDays: 62,
    waypoints: [
      {
        name: '桑名宿',
        progressSteps: 44000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '石薬師宿',
        progressSteps: 87000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '土山宿',
        progressSteps: 131000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '草津宿',
        progressSteps: 174000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '京・三条大橋',
        progressSteps: 218000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '芥川宿',
        progressSteps: 261000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '兵庫',
        progressSteps: 305000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '加古川',
        progressSteps: 348000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '姫路',
        progressSteps: 392000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '片上',
        progressSteps: 435000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '岡山',
        progressSteps: 479000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '矢掛宿',
        progressSteps: 522000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '尾道',
        progressSteps: 566000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '西条',
        progressSteps: 609000,
        points: {
          first: 1100,
          second: 550,
        },
      },
    ],
  },
  {
    candidateId: 'hanpo',
    destination: {
      name: 'みちのく・大衡工房',
      kanji: '絆豊',
      reading: 'Hanpo',
      province: '陸奥国',
      memo: '宇都宮・白河の関を越えて、奥州街道をひたすら北上するみちのくの旅。',
    },
    targetSteps: 916000,
    periodDays: 86,
    waypoints: [
      {
        name: '御油宿',
        progressSteps: 46000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '舞坂宿',
        progressSteps: 92000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '掛川宿',
        progressSteps: 137000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '岡部宿',
        progressSteps: 183000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '由比宿',
        progressSteps: 229000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '三島宿',
        progressSteps: 275000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '小田原宿',
        progressSteps: 321000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '戸塚宿',
        progressSteps: 366000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '品川宿',
        progressSteps: 412000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '粕壁宿',
        progressSteps: 458000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '野木宿',
        progressSteps: 504000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '雀宮宿',
        progressSteps: 550000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '喜連川宿',
        progressSteps: 595000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '芦野宿',
        progressSteps: 641000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '矢吹宿',
        progressSteps: 687000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '本宮宿',
        progressSteps: 733000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '福島宿',
        progressSteps: 779000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '白石宿',
        progressSteps: 824000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '仙台',
        progressSteps: 870000,
        points: {
          first: 1100,
          second: 550,
        },
      },
    ],
  },
  {
    candidateId: 'kyuho',
    destination: {
      name: '筑前・宮若工房',
      kanji: '九豊',
      reading: 'Kyuho',
      province: '筑前国',
      memo: 'ついに大台の100万歩突破。山陽道を制覇し、関門海峡を越えて九州へ！',
    },
    targetSteps: 1027000,
    periodDays: 97,
    waypoints: [
      {
        name: '桑名宿',
        progressSteps: 45000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '石薬師宿',
        progressSteps: 89000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '土山宿',
        progressSteps: 134000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '草津宿',
        progressSteps: 179000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '京・三条大橋',
        progressSteps: 223000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '芥川宿',
        progressSteps: 268000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '兵庫',
        progressSteps: 313000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '明石',
        progressSteps: 357000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '姫路',
        progressSteps: 402000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '片上',
        progressSteps: 447000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '岡山',
        progressSteps: 491000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '矢掛宿',
        progressSteps: 536000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '尾道',
        progressSteps: 580000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '三原',
        progressSteps: 625000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '海田',
        progressSteps: 670000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '玖波',
        progressSteps: 714000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '高森',
        progressSteps: 759000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '徳山',
        progressSteps: 804000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '宮市（防府）',
        progressSteps: 848000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '船木',
        progressSteps: 893000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '厚狭',
        progressSteps: 938000,
        points: {
          first: 1100,
          second: 550,
        },
      },
      {
        name: '小倉',
        progressSteps: 982000,
        points: {
          first: 1100,
          second: 550,
        },
      },
    ],
  },
]
