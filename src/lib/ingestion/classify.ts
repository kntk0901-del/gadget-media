/**
 * Rule-based classifier for incoming gadget items.
 * Supports both English and Japanese keywords.
 *
 * Rule order matters: first match wins for category. Specific accessory/audio
 * rules come BEFORE generic smartphone-brand rules so that e.g.
 * "Xiaomi REDMI Buds" routes to スマホ周辺機器 instead of スマートフォン.
 */

export type ClassifyInput = {
  title: string;
  summary?: string | null;
  sourceSlug?: string | null;
};

export type ClassifyResult = {
  category_slug: string | null;
  tags: string[];
  keyword_boost: number;
  is_blacklisted: boolean;
  is_relevant: boolean;
  reasons: string[];
};

type Rule = { match: RegExp; cat?: string; tags?: string[]; boost?: number };

const BLACKLIST: RegExp[] = [
  /\bchatgpt\b/i, /\bopenai\b/i, /\bgemini\s+(model|api)\b/i,
  /\bprompt\s+engineer/i, /\bjailbreak/i,
  /\b(politi(?:cs|cal)|election|senate|congress)\b/i,
  /\b(tiktok|instagram|facebook)\s+(tip|trick|hack|trend)\b/i,
  /\b(celebrity|hollywood|kpop)\b/i,
  /\b(crypto|bitcoin|ethereum|nft)\b/i,
  /\b(stock|earnings|ipo)\b/i,
  /\bopinion piece\b/i,
  /(政治|選挙|国会|与党|野党)/,
  /(芸能|タレント|アイドル|スキャンダル)/,
  /(暗号資産|仮想通貨|ビットコイン|NFT)/,
  /(株価|決算|IPO)/,
  /(プロンプト\s*エンジニ|生成AI(?:が|を|の)使い方|ChatGPT\s*(?:の|で)\s*(?:使い方|プロンプト))/,

  // Pure software / SaaS / cloud — not a hard gadget
  /(クラウドストレージ|オンラインストレージ|pCloud|Dropbox|Google\s*Drive)/,
  /(進捗管理|タスク管理|プロジェクト管理|スケジュール管理|TODO\s*アプリ).*アプリ/,
  /(ビデオ通話|ミーティング)アプリ/,
  /(.+アプリ.*(?:話題|配信開始|リリース))/,
  // Cashless / payment campaign noise (not a hardware story)
  /(キャッシュレス|決済.*まとめ|ポイント還元.*まとめ|キャンペーンまとめ)/,
  /(Suica|PayPay|楽天ペイ).*(?:キャンペーン|まとめ|還元)/,
  // Data breach / leak
  /(個人情報|ユーザー情報).*漏えい/,
  /情報漏(?:え|洩)/,
  // Medical / science news (often false-positives appliance/sensor rules)
  /(アルツハイマー|認知症|腫瘍|ワクチン|抗体|血液型)/,
  /(マウス|ラット).*症状/,
  /脳(?:内|の|波).*?(?:研究|治療|疾患|症状|機能)/,
  // Generic shopping campaign noise (not a product story)
  /(爆買|スーパーSALE|ウルトラSALE).*開催/,
  /ショッピング.*(?:SALE|セール).*開催/,
];

const HARD_GADGET: RegExp[] = [
  /\b(smartphone|phone|android|iphone|foldable)\b/i,
  /\b(power\s*bank|portable\s*charger|gan(\s|-)?charger|charger|charging|usb-?c|magsafe|qi2)\b/i,
  /\b(washer|dryer|refrigerator|fridge|microwave|oven|air\s*purifier|vacuum|robot\s*vacuum|aircon|hvac|hair\s*dryer|shaver|trimmer|fan|humidifier|projector|router)\b/i,
  /\b(smartwatch|wearable|fitness\s*tracker|smart\s*ring|earbud|headphone|earphone|speaker)\b/i,
  /\b(e-?bike|electric\s*bike|scooter|micro-?mobility)\b/i,
  /\b(tablet|ipad|kindle|e-?reader)\b/i,
  /\b(monitor|keyboard|mouse|laptop|dock|hub|ssd|nas)\b/i,
  /\b(robot|humanoid|drone)\b/i,
  /\b(battery|cell|sensor|display|oled|microled|micro-?led|chipset|soc|silicon)\b/i,
  /\b(case|stand|cable|mount|tripod)\b/i,
  /(スマートフォン|スマホ|iPhone|Android|Galaxy|Pixel|Xperia|AQUOS|折りたたみ|フォルダブル)/,
  /(充電器|充電|モバイルバッテリー|ポータブル電源|USB-?C|MagSafe|Qi2?|ワイヤレス充電|GaN|急速充電)/,
  /(冷蔵庫|洗濯機|電子レンジ|オーブン|空気清浄機|掃除機|ロボット掃除機|エアコン|家電|炊飯器|テレビ|ドライヤー|ヘアドライヤー|シェーバー|電動シェーバー|ヘアアイロン|加湿器|除湿器|扇風機|サーキュレーター|電気ケトル|電動歯ブラシ|美容家電|美顔器|プロジェクター|ホームシアター|ルーター|Wi-?Fi)/,
  /(スマートウォッチ|Apple\s*Watch|Galaxy\s*Watch|Fitbit|ウェアラブル|フィットネス|スマートリング)/,
  /(電動自転車|電動アシスト|e-?bike|電動キックボード|電動スクーター|モビリティ)/,
  /(イヤホン|ヘッドホン|イヤフォン|スピーカー|オーディオ|完全ワイヤレス|Buds)/,
  /(タブレット|iPad|Kindle|電子書籍リーダー)/,
  /(モニター|キーボード|マウス|ノートPC|ノートパソコン|ドック|ハブ|SSD|NAS)/,
  /(ロボット|ヒューマノイド|ドローン)/,
  /(バッテリー|有機EL|OLED|液晶|ディスプレイ|センサー|チップ|プロセッサ|SoC)/,
  /(ケース|スタンド|ケーブル|マウント|三脚)/,
  /(カメラ|レンズ|ミラーレス|一眼)/,
];

const RULES: Rule[] = [
  // ============================================================
  // 1. スマホ周辺機器 (charging slug) — HIGH PRIORITY so that brand-
  //    accessory titles like "Xiaomi REDMI Buds" don't get caught
  //    by the generic Xiaomi smartphone rule below.
  // ============================================================
  // GaN / chargers / power banks
  { match: /\bgan(\s|-)?charger|gan\b/i,                          cat: "charging",   tags: ["gan", "usb-c"], boost: 8 },
  { match: /GaN/,                                                 cat: "charging",   tags: ["gan", "usb-c"], boost: 8 },
  { match: /\bpower\s*bank|portable\s*charger\b/i,                cat: "charging",   tags: ["powerbank"], boost: 7 },
  { match: /(モバイルバッテリー|ポータブル電源|モバイル\s*バッテリー)/, cat: "charging", tags: ["powerbank"], boost: 7 },
  { match: /(充電器|急速充電|ワイヤレス充電)/,                     cat: "charging",   boost: 6 },
  { match: /\bmagsafe|qi2\b/i,                                    cat: "charging",   tags: ["magsafe", "qi2"], boost: 6 },
  { match: /MagSafe|Qi2/,                                         cat: "charging",   tags: ["magsafe", "qi2"], boost: 6 },
  { match: /\busb-?c|fast\s*charg/i,                              cat: "charging",   tags: ["usb-c"], boost: 4 },

  // Earbuds / headphones / speakers
  { match: /\b(earbud|airpods|earphone|buds)\b/i,                 cat: "charging",   tags: ["earbuds"], boost: 5 },
  { match: /(イヤホン|イヤフォン|AirPods|完全ワイヤレスイヤホン|REDMI\s*Buds)/,
                                                                  cat: "charging",   tags: ["earbuds"], boost: 5 },
  { match: /\b(headphone|over-?ear|noise\s*cancel)\b/i,           cat: "charging",   tags: ["headphones"], boost: 5 },
  { match: /(ヘッドホン|ヘッドフォン|ノイズキャンセリング|ノイキャン)/,
                                                                  cat: "charging",   tags: ["headphones"], boost: 5 },
  { match: /(スピーカー|サウンドバー|Bluetoothスピーカー)/,         cat: "charging",   boost: 3 },

  // Cases / cables / stands / mounts (smartphone accessories)
  { match: /\b(case|stand|cable|mount|tripod|grip|holder)\b/i,    cat: "charging",   boost: 2 },
  { match: /(ケース|スタンド|ケーブル|マウント|三脚|スマホグリップ|ホルダー|スマホスタンド)/,
                                                                  cat: "charging",   boost: 2 },

  // ============================================================
  // 2. Robotics (specific) — must beat the generic vacuum rule
  // ============================================================
  { match: /\brobot\s*vacuum\b/i,                                 cat: "robotics",   tags: ["robot-vacuum"], boost: 7 },
  { match: /ロボット掃除機/,                                       cat: "robotics",   tags: ["robot-vacuum"], boost: 7 },
  { match: /お掃除ロボ/,                                           cat: "robotics",   tags: ["robot-vacuum"], boost: 6 },

  // ============================================================
  // 3. Home appliances (broad — beauty / climate / kitchen included)
  // ============================================================
  { match: /\b(washer|dryer|refrigerator|fridge|microwave|oven|air\s*purifier|vacuum|aircon|dishwasher|hair\s*dryer|shaver|trimmer|humidifier|fan)\b/i,
                                                                  cat: "appliances", boost: 5 },
  { match: /(冷蔵庫|洗濯機|電子レンジ|オーブン|空気清浄機|掃除機|エアコン|食洗機|食器洗い|炊飯器|電気ポット|電気ケトル|トースター)/,
                                                                  cat: "appliances", boost: 6 },
  // beauty / personal care
  { match: /(ドライヤー|ヘアドライヤー|シェーバー|電動シェーバー|ヘアアイロン|電動歯ブラシ|美容家電|美顔器|脱毛器)/,
                                                                  cat: "appliances", tags: [], boost: 6 },
  // climate / fan
  { match: /(加湿器|除湿器|扇風機|サーキュレーター|ヒーター|ストーブ|空調)/,
                                                                  cat: "appliances", boost: 5 },
  { match: /(家電)/,                                              cat: "appliances", boost: 3 },

  // ============================================================
  // 4. Wearables (specific)
  // ============================================================
  { match: /\b(apple\s*watch|galaxy\s*watch|smartwatch)\b/i,      cat: "wearables",  tags: ["smartwatch"], boost: 6 },
  { match: /(Apple\s*Watch|Galaxy\s*Watch|スマートウォッチ)/,      cat: "wearables",  tags: ["smartwatch"], boost: 6 },
  { match: /\b(fitness\s*tracker|smart\s*ring|whoop|oura)\b/i,    cat: "wearables",  boost: 5 },
  { match: /(フィットネストラッカー|スマートリング|ウェアラブル)/,  cat: "wearables",  boost: 5 },

  // ============================================================
  // 5. E-bikes & mobility
  // ============================================================
  { match: /\b(e-?bike|electric\s*bike|cargo\s*bike|pedelec)\b/i, cat: "ebikes",     tags: ["ebike"], boost: 8 },
  { match: /(電動自転車|電動アシスト)/,                            cat: "ebikes",     tags: ["ebike"], boost: 8 },
  { match: /\b(electric\s*scooter|e-?scooter)\b/i,                cat: "ebikes",     boost: 6 },
  { match: /(電動キックボード|電動スクーター)/,                    cat: "ebikes",     boost: 6 },

  // ============================================================
  // 6. Smartphones — model/brand specific (after accessory rules!)
  // ============================================================
  { match: /\b(iphone\s*\d+|iphone\s*pro|iphone)\b/i,             cat: "smartphones", tags: ["iphone", "apple"], boost: 6 },
  { match: /iPhone/,                                              cat: "smartphones", tags: ["iphone", "apple"], boost: 6 },
  { match: /\bgalaxy\s*(s|z|note|fold|flip)/i,                    cat: "smartphones", tags: ["samsung", "android"], boost: 6 },
  { match: /Galaxy\s*(S|Z|Note|Fold|Flip)/,                       cat: "smartphones", tags: ["samsung", "android"], boost: 6 },
  { match: /\bpixel\s*\d/i,                                       cat: "smartphones", tags: ["google", "android"], boost: 5 },
  { match: /Pixel\s*\d/,                                          cat: "smartphones", tags: ["google", "android"], boost: 5 },
  { match: /(Xperia|AQUOS|arrows|Rakuten\s*Hand)/,                cat: "smartphones", tags: ["android"], boost: 5 },
  { match: /(折りたたみスマ|フォルダブル|foldable\s*phone|fold\s*phone|flip\s*phone)/i,
                                                                  cat: "smartphones", tags: ["foldable"], boost: 4 },
  { match: /\b(xiaomi|oneplus|nothing|vivo|oppo|honor)\s*\d/i,    cat: "smartphones", tags: ["android"], boost: 3 },
  { match: /(Xiaomi|OPPO|vivo|OnePlus|Nothing|Honor|Huawei)\s*\d/,cat: "smartphones", tags: ["android"], boost: 3 },
  { match: /(スマートフォン)/,                                     cat: "smartphones", boost: 3 },
  // generic スマホ — lowest signal so charger-for-smartphone articles
  // don't end up here.
  { match: /スマホ(?!.*(?:充電|バッテリー|イヤホン|ヘッドホン|スタンド|ケース|ケーブル|スピーカー))/,
                                                                  cat: "smartphones", boost: 2 },

  // ============================================================
  // 7. Tablets
  // ============================================================
  { match: /\b(ipad|tablet|e-?reader|kindle)\b/i,                 cat: "tablets",    boost: 3 },
  { match: /(iPad|タブレット|Kindle|電子書籍リーダー)/,            cat: "tablets",    boost: 3 },

  // ============================================================
  // 8. PC peripherals (distinct from phone accessories)
  // ============================================================
  { match: /\b(keyboard|mouse|monitor|dock|webcam)\b/i,           cat: "peripherals",boost: 3 },
  { match: /(キーボード|マウス|モニター|ディスプレイ|ノートPC|ノートパソコン)/,
                                                                  cat: "peripherals",boost: 3 },

  // ============================================================
  // 9. Smart home + networking gear
  // ============================================================
  { match: /\b(smart\s*home|matter|thread|hue|nest|smart\s*lock|smart\s*plug|wi-?fi\s*\d?|mesh|router)\b/i,
                                                                  cat: "smarthome",  boost: 4 },
  { match: /(スマートホーム|スマートロック|スマートプラグ|スマート家電|Matter|Wi-?Fi\s*ルーター|メッシュ\s*Wi-?Fi|ルーター)/,
                                                                  cat: "smarthome",  boost: 4 },
  { match: /(プロジェクター|ホームシアター)/,                      cat: "smarthome",  boost: 3 },

  // ============================================================
  // 10. Robotics (generic)
  // ============================================================
  { match: /\b(humanoid|robot\s*arm|robotics)\b/i,                cat: "robotics",   boost: 5 },
  { match: /(ヒューマノイド|ロボティクス|ドローン)/,               cat: "robotics",   boost: 5 },

  // ============================================================
  // 11. Tech / materials
  // ============================================================
  { match: /\b(oled|microled|micro-?led|amoled|ltpo)\b/i,         cat: "tech",       tags: ["display"], boost: 4 },
  { match: /(有機EL|OLED|microLED|AMOLED)/,                       cat: "tech",       tags: ["display"], boost: 4 },
  { match: /\b(silicon|chipset|soc|snapdragon|exynos|m\d\s*chip|a\d{2}\s*chip)\b/i,
                                                                  cat: "tech",       tags: ["chip"], boost: 4 },
  { match: /(Snapdragon|Exynos|Apple\s*M\d|プロセッサ|チップ)/,    cat: "tech",       tags: ["chip"], boost: 4 },
  { match: /\b(solid-?state\s*battery|sodium-?ion|lifepo4|battery\s*tech)\b/i,
                                                                  cat: "tech",       tags: ["battery"], boost: 6 },
  { match: /(全固体電池|ナトリウムイオン|リン酸鉄|バッテリー技術)/, cat: "tech",       tags: ["battery"], boost: 6 },
  { match: /\b(sensor|lidar|tof)\b/i,                             cat: "tech",       tags: ["sensor"], boost: 3 },
  { match: /(センサー|LiDAR|ToF)/,                                cat: "tech",       tags: ["sensor"], boost: 3 },

  // ============================================================
  // 12. Cameras → tech (no dedicated bucket)
  // ============================================================
  { match: /(ミラーレス|一眼レフ|レンズ|カメラ)/,                  cat: "tech",       boost: 2 },
];

function unique<T>(arr: T[]): T[] { return Array.from(new Set(arr)); }

/**
 * Why we classify on TITLE only:
 *
 * Sites like Makuake include a generic boilerplate disclaimer in every
 * project description ("使用するパソコン、スマートフォン等環境によって..."). That
 * accidentally matched the "スマートフォン" rule and routed pet collars, wallets,
 * insoles, and pots into the smartphone category.
 *
 * Titles in JP gadget media are highly descriptive — if the article is about a
 * smartphone, the title says so. Using only the title for the category and the
 * hard-gadget gate gives high precision; we still mine the full text for tags
 * and keyword-boost (lower stakes).
 */
export function classify(input: ClassifyInput): ClassifyResult {
  const title = input.title;
  const fullText = `${input.title} ${input.summary ?? ""}`;
  const reasons: string[] = [];

  // Blacklist runs on full text (catch noise wherever).
  for (const r of BLACKLIST) {
    if (r.test(fullText)) {
      return {
        category_slug: null,
        tags: [],
        keyword_boost: 0,
        is_blacklisted: true,
        is_relevant: false,
        reasons: [`blacklist:${r.source}`],
      };
    }
  }

  // Hard-gadget gate uses TITLE only — keyword in boilerplate ≠ hard gadget.
  const isHard = HARD_GADGET.some((r) => r.test(title));
  if (!isHard) reasons.push("not_hard_gadget_title");

  // Category from TITLE — first match wins.
  let category: string | null = null;
  const tags = new Set<string>();
  let boost = 0;

  for (const rule of RULES) {
    if (rule.match.test(title)) {
      if (!category && rule.cat) {
        category = rule.cat;
        reasons.push(`cat:${rule.cat}`);
      }
      rule.tags?.forEach((t) => tags.add(t));
      boost += rule.boost ?? 0;
    }
  }

  // Secondary pass over the summary contributes tags and a softened boost,
  // but never changes the category (avoids the boilerplate problem).
  if (input.summary) {
    for (const rule of RULES) {
      if (rule.match.test(input.summary)) {
        rule.tags?.forEach((t) => tags.add(t));
        boost += Math.round((rule.boost ?? 0) * 0.35);
      }
    }
  }

  return {
    category_slug: category,
    tags: unique(Array.from(tags)),
    keyword_boost: boost,
    is_blacklisted: false,
    is_relevant: isHard,
    reasons,
  };
}
