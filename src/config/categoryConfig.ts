// 定义三级类目的数据结构
export interface SubCategory {
  id: string;
  label: string; // 下拉菜单显示的中文名
  labelEn: string; // 英文名（用于Prompt）
  keywords: string; // 核心材质与形态词
  scene: string; // 推荐的拍摄场景/道具
}

export interface MainCategory {
  id: string;
  label: string;
  subCategories: SubCategory[];
}

// 🚀 核心配置数据
export const PRODUCT_CATEGORIES: MainCategory[] = [
  // === 1. 3C数码/电子 ===
  {
    id: "electronics",
    label: "3C数码/电子",
    subCategories: [
      {
        id: "3c_phone_case",
        label: "手机壳",
        labelEn: "Phone Case",
        keywords: "shockproof corners, transparent casing, matte grip texture, anti-yellowing, airbag protection visual, slim fit",
        scene: "floating in mid-air, angled to show thinness, tech background"
      },
      {
        id: "3c_earbuds",
        label: "无线耳机",
        labelEn: "Wireless Earbuds",
        keywords: "glossy charging case, ergonomic shape, silicone ear tips, led indicator light, noise cancellation mesh",
        scene: "case open with earbuds floating out, neon rim light"
      },
      {
        id: "3c_smartwatch",
        label: "智能手表",
        labelEn: "Smartwatch",
        keywords: "glowing screen interface, curved glass edge, silicone strap texture, health monitoring sensors",
        scene: "wrist wearing visual (partial), gym background blur"
      },
      {
        id: "3c_cable",
        label: "数据线/充电器",
        labelEn: "Cable & Charger",
        keywords: "braided nylon texture, reinforced connector, metallic plug head, flexible coil, gallium nitride matte finish",
        scene: "coiled neatly, macro shot of connector, charging effect"
      },
      {
        id: "3c_screen_protector",
        label: "钢化膜",
        labelEn: "Screen Protector",
        keywords: "9H hardness, crystal clear glass, explosion-proof visual, edge-to-edge coverage, oleophobic coating water drops",
        scene: "bending test visual, hammer impact implication, phone screen overlay"
      }
    ]
  },

  // === 2. 家具/厨房 ===
  {
    id: "home",
    label: "家具/厨房",
    subCategories: [
      {
        id: "home_cup",
        label: "水杯/保温杯",
        labelEn: "Tumbler & Mug",
        keywords: "matte powder coating, stainless steel rim, condensation droplets (cold), steam rising (hot), ergonomic handle",
        scene: "wooden coaster, car cup holder, ice cubes nearby"
      },
      {
        id: "home_organizer",
        label: "收纳整理",
        labelEn: "Organizer Box",
        keywords: "clear acrylic material, stackable design, organized contents, see-through, sturdy plastic",
        scene: "inside a drawer, neat pantry shelf, filled with colorful items"
      },
      {
        id: "home_bedding",
        label: "床品/枕头",
        labelEn: "Bedding & Pillow",
        keywords: "wrinkle texture, soft egyptian cotton, plush feeling, fluffy, breathable fabric weave",
        scene: "cozy bedroom morning light, open book on bed"
      },
      {
        id: "home_kitchen_tool",
        label: "厨房小工具",
        labelEn: "Kitchen Gadget",
        keywords: "stainless steel blade, food grade plastic, ergonomic grip, slicing action, sharp edge",
        scene: "cutting board, fresh vegetables, marble counter"
      }
    ]
  },

  // === 3. 美妆/个护 ===
  {
    id: "beauty",
    label: "美妆/个护",
    subCategories: [
      {
        id: "beauty_skincare",
        label: "护肤品(瓶/罐)",
        labelEn: "Skincare Bottle/Jar",
        keywords: "amber glass texture, dropper, rich cream texture, moisture hydration visual, translucent liquid",
        scene: "water splash, podium display, botanical leaves, bathroom vanity"
      },
      {
        id: "beauty_tool",
        label: "美容仪器",
        labelEn: "Beauty Device",
        keywords: "smooth abs plastic, metallic probe head, led therapy light, rose gold accents",
        scene: "clean towel background, soft glow, spa atmosphere"
      },
      {
        id: "beauty_makeup",
        label: "彩妆/工具",
        labelEn: "Makeup & Tools",
        keywords: "powder texture, soft bristles (brush), vibrant pigment, compact mirror reflection",
        scene: "spilled powder art, vanity mirror, silk fabric"
      },
      {
        id: "beauty_wig",
        label: "假发",
        labelEn: "Wig",
        keywords: "realistic hair strands, natural shine, lace front detail, voluminous, silky texture",
        scene: "mannequin head, comb, soft backlighting"
      }
    ]
  },

  // === 4. 服装 ===
  {
    id: "clothing",
    label: "服装",
    subCategories: [
      {
        id: "cloth_yoga",
        label: "瑜伽/运动装",
        labelEn: "Yoga Activewear",
        keywords: "stretchy fabric, matte finish, body contouring, seamless stitching, sweat-wicking",
        scene: "yoga mat, gym mirror, dynamic pose"
      },
      {
        id: "cloth_dress",
        label: "裙装/女装",
        labelEn: "Dress & Casual",
        keywords: "flowy fabric, floral pattern details, drape texture, soft linen/cotton",
        scene: "hanging on rack, street view background, sunlight flare"
      },
      {
        id: "cloth_men",
        label: "男装/T恤",
        labelEn: "Men's Apparel",
        keywords: "heavyweight cotton, wrinkle-free, crisp collar, fabric texture zoom",
        scene: "folded neatly, hanger against concrete wall"
      },
      {
        id: "cloth_underwear", 
        label: "内衣/塑身", 
        labelEn: "Lingerie & Shapewear", 
        keywords: "lace detail, sheer mesh, silk smooth, breathable fabric, elastic band", 
        scene: "satin sheets, soft mood lighting, privacy" 
      } 
    ] 
  }, 
 
  // === 5. 饰品 === 
  { 
    id: "accessories", 
    label: "饰品", 
    subCategories: [ 
      { 
        id: "acc_jewelry", 
        label: "项链/戒指", 
        labelEn: "Jewelry", 
        keywords: "sparkling diamond facet, gold/silver luster, macro photography, elegant reflection", 
        scene: "velvet jewelry stand, scattered petals, bokeh light" 
      }, 
      { 
        id: "acc_bag", 
        label: "箱包", 
        labelEn: "Bag & Purse", 
        keywords: "pebbled leather texture, metal hardware buckle, stitching details, structured shape", 
        scene: "coffee table, luxury car seat, fashion magazine prop" 
      }, 
      { 
        id: "acc_glasses", 
        label: "眼镜/墨镜", 
        labelEn: "Eyewear", 
        keywords: "reflective lens, tortoise shell frame, metallic hinge, uv protection visual", 
        scene: "beach sand, hard case, sunlight reflection" 
      } 
    ] 
  }, 
 
  // === 6. 工具/汽配 === 
  { 
    id: "tools", 
    label: "工具/汽配", 
    subCategories: [ 
      { 
        id: "tool_hand", 
        label: "手动工具", 
        labelEn: "Hand Tool", 
        keywords: "chrome vanadium steel, anti-slip rubber grip, heavy duty, rugged texture", 
        scene: "garage workshop bench, blueprints, sawdust" 
      }, 
      { 
        id: "tool_car_acc", 
        label: "车载用品", 
        labelEn: "Car Accessory", 
        keywords: "carbon fiber texture, leather car seat match, dashboard mount, led integration", 
        scene: "inside car dashboard, steering wheel view, motion blur window" 
      } 
    ] 
  }, 
 
  // === 7. 玩具/母婴 === 
  { 
    id: "toys", 
    label: "玩具/母婴", 
    subCategories: [ 
      { 
        id: "toy_plush", 
        label: "毛绒玩具", 
        labelEn: "Plush Toy", 
        keywords: "soft fuzzy texture, embroidery eyes, squishy, pastel colors, cute", 
        scene: "kid's playroom, soft rug, cozy bed" 
      }, 
      { 
        id: "toy_baby_feed", 
        label: "母婴喂养", 
        labelEn: "Baby Feeding", 
        keywords: "bpa free plastic, soft silicone nipple, safe material, rounded edges, pastel tones", 
        scene: "clean kitchen counter, milk bottle, sunlight" 
      } 
    ] 
  }, 
 
  // === 8. 户外/运动 === 
  { 
    id: "outdoor", 
    label: "户外/运动", 
    subCategories: [ 
      { 
        id: "out_camping", 
        label: "露营装备", 
        labelEn: "Camping Gear", 
        keywords: "waterproof fabric, durable nylon, portable design, night glow (if light)", 
        scene: "forest campsite, bonfire background, starry night" 
      }, 
      { 
        id: "out_fitness", 
        label: "健身器材", 
        labelEn: "Fitness Equipment", 
        keywords: "cast iron texture, sweat resistance, non-slip grip, heavy weight visual", 
        scene: "gym floor rubber mat, sweat drops, energetic vibe" 
      } 
    ] 
  } 
];
