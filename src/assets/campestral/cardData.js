export const campestral = {
  maum: {
    id: "maum",
    type: "shumi",
    src: "campestral/maum.png",
    pic: "campestral/pics/maum-pic.png",
    name: "Maum",
    speed: "s",
    habitat: "campestral",
    stage: 1,
    yaoCost: 1,
    health: 3,
    range: "m",
    keywords: [],
    specialAttacks: [
      {
        id: "razorgrass_claws",
        name: "Razorgrass Claws",
        yaoCost: 2,
        damage: 1,
        target: ["enemy"],
        modifier: {
          resource: "storedYao",
          source: ["this"],
          amount: 1
        },
        effect: null,
        text: "(2) Razorgrass Claws: 1 + X (X is Stored Yao on this Shumi)"
      }
    ],
    baseAttacks: [
      {
        id: "claws",
        name: "Claws",
        yaoCost: 0,
        damage: 1,
        target: ["enemy"],
        modifier: null,
        effect: null,
        text: "Claws: 1"
      }
    ],
    abilities: [
      {
        id: "maum_etb",
        name: "Prosper 1",
        trigger: { type: "etb", source: "this" },
        optional: false,
        effect: {
          type: "prosper",
          prosper: {
            object: "this",
            amount: 1
          }
        },
        text: "When Maum enters the Battlefield, it Prospers 1."
      },
      {
        id: "maum_amplify",
        name: "Amplify Damage (X ≤ 3)",
        trigger: { type: "activated" },
        speed: "i",
        where: "battlefield",
        cost: [{ storedYao: "x", maxX: 3, minX: 1, stored: "this" }],
        target: ["any1", "any2"],
        effect: {
          type: "amplify_damage",
          amplify_damage: {
            source: "any1",
            recipient: "any2",
            amount: "x",
            delay: true,
            duration: "end_of_turn"
          }
        },
        text: "I, [X Stored Yao (max 3)]: The next time target source would deal damage to another target this turn, increase that damage by X."
      }
    ],
    text: "ETB: Prosper 1. | (I), [X Stored Yao ≤ 3]: Increase next damage from target source to another target by X this turn.",
    flavorText: "In grassy green garment it strolls through the land, unwelcome patting may cost you your hand."
  },

  faele: {
    id: "faele",
    type: "shumi",
    src: "campestral/faele.png",
    pic: "campestral/pics/faele-pic.png",
    name: "Faele",
    speed: "s",
    habitat: "campestral",
    stage: 1,
    yaoCost: 2,
    health: 5,
    range: "m",
    keywords: [],
    specialAttacks: [
      {
        id: "flail",
        name: "Flail",
        yaoCost: 2,
        damage: 4,
        target: ["enemy"],
        modifier: null,
        effect: {
          type: "recoil",
          recoil: {
            amount: 2
          }
        },
        text: "(2) Flail: 4, Recoil 2"
      }
    ],
    baseAttacks: [
      {
        id: "ram",
        name: "Ram",
        yaoCost: 0,
        damage: 1,
        target: ["enemy"],
        modifier: null,
        effect: null,
        text: "Ram: 1"
      }
    ],
    abilities: [
      {
        id: "faele_etb",
        name: "Transfer Yao",
        trigger: { type: "etb", source: "this" },
        optional: false,
        effect: {
          type: "transfer",
          transfer: {
            object: "this",
            source: ["yao_reserve"],
            amount: "x"
          }
        },
        text: "When Faele enters the Battlefield, Transfer any amount of Yao from your Reserve onto Faele."
      },
      {
        id: "faele_lf_boost",
        name: "Yao Vitality",
        trigger: { type: "continuous" },
        optional: false,
        effect: {
          type: "increase_lf_per_resource",
          increase_lf_per_resource: {
            resource: "storedYao",
            source: ["this"],
            amount: 1,
            object: ["this"]
          }
        },
        text: "Faele has +1 LF for each Yao on it."
      }
    ],
    text: "ETB: Transfer any amount of Yao from Reserve onto Faele. | Continuous: +1 LF per Stored Yao.",
    flavorText: "Many a Faele has been witnessed to stumble and fall, but never once have they failed to lift themselves up once more."
  },

  muspem: {
    id: "muspem",
    type: "shumi",
    src: "campestral/muspem.png",
    pic: "campestral/pics/muspem-pic.png",
    name: "Muspem",
    speed: "s",
    habitat: "campestral",
    stage: 1,
    yaoCost: 1,
    health: 1,
    range: "m",
    keywords: [],
    specialAttacks: [
      {
        id: "squeak_for_help",
        name: "Squeak for Help",
        yaoCost: 2,
        damage: 0,
        target: null,
        modifier: null,
        effect: {
          type: "search_and_play",
          search_and_play: {
            deck: "action_deck",
            filter: { id: "muspem" },
            destination: "battlefield",
            then: "shuffle_deck"
          }
        },
        text: "(2) Squeak for Help: Search your Action Deck for a Muspem and put it onto the Battlefield. Shuffle."
      }
    ],
    baseAttacks: [
      {
        id: "bite",
        name: "Bite",
        yaoCost: 0,
        damage: 1,
        target: ["enemy"],
        modifier: null,
        effect: null,
        text: "Bite: 1"
      }
    ],
    abilities: [
      {
        id: "muspem_etb",
        name: "Gather & Transfer Yao",
        trigger: { type: "etb", source: "this" },
        optional: false,
        effect: {
          type: "add_yao transfer",
          add_yao: {
            amount: 1,
            order: 1
          },
          transfer: {
            object: "this",
            amount: 1,
            order: 2
          }
        },
        text: "When Muspem enters the Battlefield, add 1 Yao to your Reserve, then Transfer 1 Yao onto Muspem."
      }
    ],
    text: "ETB: Add 1 Yao to Reserve, then Transfer 1 Yao onto Muspem.",
    flavorText: "Squeak! - Muspem / Squeak, Squeak! - Pair of Muspem"
  },

  supel: {
    id: "supel",
    type: "shumi",
    src: "campestral/supel.png",
    pic: "campestral/pics/supel-pic.png",
    name: "Supel",
    speed: "s",
    habitat: "campestral",
    stage: 1,
    yaoCost: 2,
    health: 4,
    range: "m",
    keywords: [],
    specialAttacks: [
      {
        id: "hop",
        name: "Hop",
        yaoCost: 1,
        damage: 2,
        target: ["enemy"],
        modifier: null,
        effect: null,
        text: "(1) Hop: 2"
      }
    ],
    baseAttacks: [
      {
        id: "flop",
        name: "Flop",
        yaoCost: 0,
        damage: 1,
        target: ["enemy"],
        modifier: null,
        effect: null,
        text: "Flop: 1"
      }
    ],
    abilities: [
      {
        id: "supel_etb",
        name: "Prosper 1",
        trigger: { type: "etb", source: "this" },
        optional: false,
        effect: {
          type: "prosper",
          prosper: {
            object: "this",
            amount: 1
          }
        },
        text: "When Supel enters the Battlefield, it Prospers 1."
      },
      {
        id: "supel_flight",
        name: "Try to Fly (Hop Flight)",
        trigger: { type: "activated" },
        optional: true,
        where: "battlefield",
        speed: "s",
        cost: [{ yao: 1 }],
        effect: {
          type: "grant_keyword",
          grant_keyword: {
            keyword: "flight",
            object: "this",
            attackOnly: "hop",
            duration: "end_of_turn"
          }
        },
        text: "(S), [1 Yao]: Supel gains Flight when attacking with Hop until end of turn."
      }
    ],
    text: "ETB: Prosper 1. | (S), [1 Yao]: Gains Flight for Hop until end of turn.",
    flavorText: "Supel, Supel, hops and flops - Supel, Supel never stops / Supel, Supel cannot fly - Supel, Supel will still try"
  },

  horucan: {
    id: "horucan",
    type: "shumi",
    src: "campestral/horucan.png",
    pic: "campestral/pics/horucan-pic.png",
    name: "Horucan",
    speed: "s",
    habitat: "campestral",
    stage: 2,
    maturesFrom: "caquil",
    yaoCost: 7,
    health: 13,
    range: "m",
    keywords: [],
    specialAttacks: [
      {
        id: "greater_yao_release",
        name: "Greater Yao Release",
        yaoCost: 5,
        damage: 7,
        target: ["enemy"],
        modifier: null,
        effect: null,
        text: "(5) Greater Yao Release: 7"
      }
    ],
    baseAttacks: [
      {
        id: "claws",
        name: "Claws",
        yaoCost: 0,
        damage: 4,
        target: ["enemy"],
        modifier: null,
        effect: null,
        text: "Claws: 4"
      }
    ],
    abilities: [
      {
        id: "horucan_etb",
        name: "Prosper on Entry",
        trigger: { type: "etb", source: "this" },
        optional: false,
        effect: {
          type: "prosper",
          prosper: {
            object: "this",
            amount: 1,
            condition: { enteredBy: "maturing" },
            otherwise: {
              amount: 2
            }
          }
        },
        text: "When Horucan enters the Battlefield, if it entered by Maturing it Prospers 1; otherwise it Prospers 2."
      },
      {
        id: "horucan_shield",
        name: "Sentinel Ward",
        trigger: { type: "activated" },
        cost: [{ storedYao: 1, stored: "this" }],
        speed: "i",
        where: "battlefield",
        target: ["any_shumi"],
        effect: {
          type: "prevent_damage draw_card",
          prevent_damage: {
            object: "target",
            amount: 1,
            delay: true,
            order: 1
          },
          draw_card: {
            amount: 1,
            order: 2
          }
        },
        text: "(I), [1 Stored Yao on Horucan]: Prevent the next 1 damage that would be dealt to target Shumi. Draw a card."
      }
    ],
    text: "Mature Caquil. ETB: Prosper 1 (if Matured) or 2. | (I), [1 Stored Yao]: Prevent next 1 dmg to target Shumi & Draw a card.",
    flavorText: "This grasslands nightly sentinel, even in the deepest darkness, nothing escapes its watchful gaze."
  },

  gramaum: {
    id: "gramaum",
    type: "shumi",
    src: "campestral/gramaum.png",
    pic: "campestral/pics/gramaum-pic.png",
    name: "Gramaum",
    speed: "s",
    habitat: "campestral",
    stage: 2,
    maturesFrom: "maum",
    yaoCost: 7,
    health: 14,
    range: "m",
    keywords: [],
    specialAttacks: [
      {
        id: "razorgrass_fang",
        name: "Razorgrass Fang",
        yaoCost: 0,
        damage: 2,
        target: ["enemy"],
        modifier: null,
        effect: {
          type: "prosper",
          prosper: {
            object: "this",
            amount: 1
          }
        },
        text: "(0) Razorgrass Fang: 2, Gramaum Prospers 1"
      }
    ],
    baseAttacks: [
      {
        id: "claws",
        name: "Claws",
        yaoCost: 0,
        damage: 4,
        target: ["enemy"],
        modifier: null,
        effect: null,
        text: "Claws: 4"
      }
    ],
    abilities: [
      {
        id: "gramaum_etb",
        name: "Gather All Yao",
        trigger: { type: "etb", source: "this" },
        optional: false,
        effect: {
          type: "transfer",
          transfer: {
            object: "this",
            source: ["all_friendly_sources"],
            amount: "x"
          }
        },
        text: "When Gramaum enters the Battlefield, Transfer any amount of Yao from all sources you control onto Gramaum."
      },
      {
        id: "gramaum_amplify",
        name: "Amplify Damage (X)",
        trigger: { type: "activated" },
        speed: "i",
        where: "battlefield",
        cost: [{ storedYao: "x", minX: 1, stored: "this" }],
        target: ["any1", "any2"],
        effect: {
          type: "amplify_damage",
          amplify_damage: {
            source: "any1",
            recipient: "any2",
            amount: "x",
            delay: true,
            duration: "end_of_turn"
          }
        },
        text: "(I), [X Stored Yao on Gramaum]: The next time target source would deal damage to another target this turn, increase that damage by X."
      }
    ],
    text: "Mature Maum. ETB: Transfer any Yao from your sources onto Gramaum. | (I), [X Stored Yao]: Increase next damage from target source to target by X.",
    flavorText: "The undisputed rulers of the grasslands. A rare and enigmatic creature only few have glimpsed upon."
  },

  musclyp: {
    id: "musclyp",
    type: "shumi",
    src: "campestral/musclyp.png",
    pic: "campestral/pics/musclyp-pic.png",
    name: "Musclyp",
    speed: "s",
    habitat: "campestral",
    stage: 2,
    maturesFrom: "muspem",
    yaoCost: 3,
    health: 4,
    range: "m",
    keywords: [],
    specialAttacks: [
      {
        id: "pack_attack",
        name: "Pack Attack",
        yaoCost: 1,
        damage: 2,
        target: ["enemy"],
        modifier: {
          resource: "friendly_shumi_count",
          filter: { id: "muspem" },
          source: ["battlefield"],
          amount: 1
        },
        effect: null,
        text: "(1) Pack Attack: 2 + 1 for each friendly Muspem"
      }
    ],
    baseAttacks: [
      {
        id: "claws",
        name: "Claws",
        yaoCost: 0,
        damage: 2,
        target: ["enemy"],
        modifier: null,
        effect: null,
        text: "Claws: 2"
      }
    ],
    abilities: [
      {
        id: "musclyp_etb",
        name: "Recover Muspem",
        trigger: { type: "etb", source: "this" },
        optional: false,
        conditions: [
          { object: "this", condition: "entered_by_maturing" }
        ],
        effect: {
          type: "return_to_hand",
          return_to_hand: {
            object: "matured_from"
          }
        },
        text: "When Musclyp enters the Battlefield by Maturing, return the Muspem it matured from to your hand."
      },
      {
        id: "musclyp_deploy",
        name: "Deploy Muspem",
        trigger: { type: "activated" },
        where: "battlefield",
        speed: "q",
        optional: true,
        cost: [],
        conditions: [
          { object: "this", condition: "has_momentum" },
          { object: "hand", condition: "has_muspem" }
        ],
        oncePerTurn: true,
        effect: {
          type: "put_into_play",
          put_into_play: {
            source: "hand",
            filter: { id: "muspem" }
          }
        },
        text: "(Q), Once per turn (if Musclyp has Momentum): Put a Muspem from your hand onto the Battlefield."
      }
    ],
    text: "Mature Muspem. ETB (if Matured): Return the Muspem to hand. | (Q), Once/turn (with Momentum): Put a Muspem from hand into play.",
    flavorText: "A strange creature. It is unknown what truly happens when it matures fully. Naturally there are rumors..."
  },

  farloss: {
    id: "farloss",
    type: "shumi",
    src: "campestral/farloss.png",
    pic: "campestral/pics/farloss-pic.png",
    name: "Farloss",
    speed: "s",
    habitat: "campestral",
    stage: 2,
    maturesFrom: "faele",
    yaoCost: 6,
    health: 10,
    range: "m",
    keywords: [],
    specialAttacks: [
      {
        id: "charge",
        name: "Charge",
        yaoCost: 1,
        damage: 2,
        target: ["enemy"],
        modifier: null,
        effect: {
          type: "prosper",
          prosper: {
            object: "this",
            amount: 1
          }
        },
        text: "(1) Charge: 2, Farloss Prospers 1"
      }
    ],
    baseAttacks: [
      {
        id: "ram",
        name: "Ram",
        yaoCost: 0,
        damage: 2,
        target: ["enemy"],
        modifier: null,
        effect: null,
        text: "Ram: 2"
      }
    ],
    abilities: [
      {
        id: "farloss_lf_boost",
        name: "Yao Vitality",
        trigger: { type: "continuous" },
        optional: false,
        effect: {
          type: "increase_lf_per_resource",
          increase_lf_per_resource: {
            resource: "storedYao",
            source: ["this"],
            amount: 1,
            object: ["this"]
          }
        },
        text: "Farloss has +1 LF for each Yao on it."
      },
      {
        id: "farloss_atk_boost",
        name: "Yao Might",
        trigger: { type: "continuous" },
        optional: false,
        effect: {
          type: "increase_attack_damage_per_resource",
          increase_attack_damage_per_resource: {
            resource: "storedYao",
            source: ["this"],
            amount: 1,
            object: ["this"]
          }
        },
        text: "Farloss deals +1 attack damage for each Yao on it."
      }
    ],
    text: "Mature Faele. Continuous: Farloss gets +1 LF and +1 attack damage for each Stored Yao on it.",
    flavorText: "The most hardheaded creature to inhabit the grasslands. Can convert inner Yao into physical energy."
  },

  caquil: {
    id: "caquil",
    type: "shumi",
    src: "campestral/caquil.png",
    pic: "campestral/pics/caquil-pic.png",
    name: "Caquil",
    speed: "s",
    habitat: "campestral",
    stage: 1,
    yaoCost: 3,
    health: 5,
    range: "m",
    keywords: [],
    specialAttacks: [
      {
        id: "lesser_yao_release",
        name: "Lesser Yao Release",
        yaoCost: 2,
        damage: 3,
        target: ["enemy"],
        modifier: null,
        effect: null,
        text: "(2) Lesser Yao Release: 3"
      }
    ],
    baseAttacks: [
      {
        id: "peck",
        name: "Peck",
        yaoCost: 0,
        damage: 2,
        target: ["enemy"],
        modifier: null,
        effect: null,
        text: "Peck: 2"
      }
    ],
    abilities: [
      {
        id: "caquil_etb",
        name: "Guiding Glow",
        trigger: { type: "etb", source: "this" },
        optional: false,
        effect: {
          type: "search_and_put_into_hand",
          search_and_put_into_hand: {
            deck: "action_deck",
            filter: {
              habitat: "campestral",
              type: "shumi",
              yaoCost: [1, 2, 3],
              not: { id: "caquil" }
            },
            destination: "hand",
            then: "shuffle_deck"
          }
        },
        text: "When Caquil enters the Battlefield, search your Action Deck for a Campestral Shumi with YC 1, 2, or 3 (not named Caquil), put it into your hand, and shuffle."
      }
    ],
    text: "ETB: Search Action Deck for a Campestral Shumi with YC 1–3 not named Caquil, put it into hand, and shuffle.",
    flavorText: "A creature of the dark, ever glowing, guiding lost souls through the night."
  },

  schnuut: {
    id: "schnuut",
    type: "shumi",
    src: "campestral/schnuut.png",
    pic: "campestral/pics/schnuut-pic.png",
    name: "Schnuut",
    speed: "s",
    habitat: "campestral",
    stage: 1,
    yaoCost: 1,
    health: 1,
    range: "m",
    keywords: [],
    specialAttacks: [
      {
        id: "from_the_shadows",
        name: "From the Shadows",
        yaoCost: 1,
        damage: 1,
        target: ["enemy"],
        modifier: null,
        effect: null,
        text: "(1) From the Shadows: 1"
      }
    ],
    baseAttacks: [
      {
        id: "jumpscare",
        name: "Jumpscare",
        yaoCost: 0,
        damage: 0,
        target: ["enemy"],
        modifier: null,
        effect: null,
        text: "Jumpscare: 0"
      }
    ],
    abilities: [
      {
        id: "schnuut_jumpscare",
        name: "Jumpscare Retreat",
        trigger: { type: "on_attack_resolve", attack: "jumpscare" },
        optional: false,
        effect: {
          type: "return_to_hand move_to_backline",
          return_to_hand: {
            object: "this",
            order: 1
          },
          move_to_backline: {
            object: "attack_target",
            order: 2,
            onFail: {
              condition: "already_in_backline_or_cannot_move",
              effect: {
                type: "return_to_hand",
                return_to_hand: {
                  object: "attack_target"
                }
              }
            }
          }
        },
        text: "After Jumpscare resolves, return Schnuut to hand, then move the attacked Shumi to the Backline (or return it to hand if already in Backline or unable to move)."
      }
    ],
    text: "On Jumpscare resolve: Return Schnuut to hand, then push attacked Shumi to Backline (or to hand if already in Backline/full).",
    flavorText: "It loves to playfully scare children, but only because it knows that they, too find it very enjoyable."
  },

  inazovis: {
    id: "inazovis",
    type: "shumi",
    src: "campestral/inazovis.png",
    pic: "campestral/pics/inazovis-pic.png",
    name: "Inazovis",
    speed: "s",
    habitat: "campestral",
    stage: 2,
    maturesFrom: "inagnu",
    yaoCost: 5,
    health: 9,
    range: "m",
    keywords: [],
    specialAttacks: [
      {
        id: "charge",
        name: "Charge",
        yaoCost: 1,
        damage: 0,
        target: null,
        modifier: null,
        effect: {
          type: "prosper",
          prosper: {
            object: "this",
            amount: 1
          }
        },
        text: "(1) Charge: Inazovis Prospers 1"
      }
    ],
    baseAttacks: [
      {
        id: "shock",
        name: "Shock",
        yaoCost: 0,
        damage: 3,
        target: ["enemy"],
        modifier: null,
        effect: null,
        text: "Shock: 3"
      }
    ],
    abilities: [
      {
        id: "inazovis_spark",
        name: "Static Discharge",
        trigger: { type: "on_yao_added", object: "this" },
        optional: false,
        target: ["any_shumi"],
        effect: {
          type: "damage",
          damage: {
            object: "target",
            amount: 1
          }
        },
        text: "Whenever Yao is put onto Inazovis, it deals 1 damage to target Shumi."
      }
    ],
    text: "Mature Inagnu. Whenever Yao is put onto Inazovis, deal 1 damage to target Shumi.",
    flavorText: "Among the Keepers of Inazovis exists a golden Rule: Males and Females must be kept in equal number."
  },

  equuna: {
    id: "equuna",
    type: "shumi",
    src: "campestral/equuna.png",
    pic: "campestral/pics/equuna-pic.png",
    name: "Equuna",
    speed: "s",
    habitat: "campestral",
    stage: 1,
    yaoCost: 4,
    health: 8,
    range: "m",
    keywords: [],
    specialAttacks: [
      {
        id: "tag_team",
        name: "Tag Team",
        yaoCost: 0,
        damage: 1,
        target: ["enemy"],
        modifier: null,
        effect: null,
        text: "(0) Tag Team: 1"
      }
    ],
    baseAttacks: [
      {
        id: "kick",
        name: "Kick",
        yaoCost: 0,
        damage: 2,
        target: ["enemy"],
        modifier: null,
        effect: null,
        text: "Kick: 2"
      }
    ],
    abilities: [
      {
        id: "equuna_etb",
        name: "Draw a Card",
        trigger: { type: "etb", source: "this" },
        optional: false,
        effect: {
          type: "draw_card",
          draw_card: {
            amount: 1
          }
        },
        text: "When Equuna enters the Battlefield, draw a card."
      },
      {
        id: "equuna_tag_team",
        name: "Tag Team Boost",
        trigger: { type: "on_attack", attack: "tag_team" },
        optional: true,
        additionalCost: [
          {
            type: "return_to_hand",
            object: "another_friendly_shumi_with_momentum",
            remember: true
          }
        ],
        conditions: [
          {
            object: "friendly_battlefield",
            condition: "has_another_shumi_with_momentum"
          }
        ],
        effect: {
          type: "amplify_attack",
          amplify_attack: {
            attack: "tag_team",
            amount: "remembered.baseAttackDamage"
          }
        },
        text: "When Equuna uses Tag Team, you may return another friendly Shumi with Momentum to hand: Tag Team deals additional damage equal to that Shumi's Base Attack damage."
      }
    ],
    text: "ETB: Draw a card. | On Tag Team attack: You may return another friendly Shumi with Momentum to hand to add its BA damage.",
    flavorText: "The fields recoil beneath its hooves."
  },

  kalfil: {
    id: "kalfil",
    type: "shumi",
    src: "campestral/kalfil.png",
    pic: "campestral/pics/kalfil-pic.png",
    name: "Kalfil",
    speed: "s",
    habitat: "campestral",
    stage: 1,
    yaoCost: 0,
    health: 2,
    range: "m",
    keywords: ["cannot_frontline"],
    specialAttacks: [
      {
        id: "moo_innocently",
        name: "Moo Innocently",
        yaoCost: 2,
        damage: 0,
        target: null,
        modifier: null,
        effect: {
          type: "search_and_put_into_hand",
          search_and_put_into_hand: {
            deck: "action_deck",
            filter: { maturesFrom: "kalfil" },
            then: "shuffle_deck"
          }
        },
        text: "(2) Moo Innocently: Search your Action Deck for a Mature Kalfil, put it into your hand, and shuffle."
      }
    ],
    baseAttacks: [
      {
        id: "rest",
        name: "Rest",
        yaoCost: 0,
        damage: 0,
        target: null,
        modifier: null,
        effect: null,
        text: "Rest: 0"
      }
    ],
    abilities: [
      {
        id: "kalfil_guardian",
        name: "Fierce Guardian",
        trigger: { type: "on_targeted_by_attack", object: "this" },
        optional: true,
        additionalCost: [
          {
            type: "reveal_from_hand",
            filter: { maturesFrom: "kalfil" },
            remember: false
          }
        ],
        conditions: [
          {
            object: "hand",
            condition: "has_mature_kalfil"
          }
        ],
        effect: {
          type: "cancel_attack",
          cancel_attack: {
            object: "incoming_attack"
          }
        },
        text: "Cannot be on the Frontline. When targeted by an attack, you may reveal a Mature Kalfil from your hand to cancel the attack."
      }
    ],
    text: "Cannot be on Frontline. | When targeted by an attack, reveal a Mature Kalfil from hand to cancel the attack.",
    flavorText: "Since Kalfil severly lack proficiency at existing, their guardians protect them ever so fiercely."
  },

  sendris: {
    id: "sendris",
    type: "shumi",
    src: "campestral/sendris.png",
    pic: "campestral/pics/sendris-pic.png",
    name: "Sendris",
    speed: "s",
    habitat: "campestral",
    stage: 1,
    yaoCost: 4,
    health: 7,
    range: "m",
    keywords: [],
    specialAttacks: [
      {
        id: "swift_slice",
        name: "Swift Slice",
        yaoCost: 1,
        damage: 0,
        target: ["enemy"],
        modifier: {
          resource: "storedYao",
          source: ["all_friendly_shumi"],
          amount: 1
        },
        effect: null,
        text: "(1) Swift Slice: X (X is total Stored Yao on all friendly Shumi)"
      }
    ],
    baseAttacks: [
      {
        id: "claws",
        name: "Claws",
        yaoCost: 0,
        damage: 3,
        target: ["enemy"],
        modifier: null,
        effect: null,
        text: "Claws: 3"
      }
    ],
    abilities: [
      {
        id: "sendris_defeat",
        name: "Hunter's Prosper",
        trigger: { type: "on_defeat_another" },
        optional: false,
        effect: {
          type: "prosper",
          prosper: {
            object: "this",
            amount: 1
          }
        },
        text: "Whenever Sendris defeats another Shumi, it Prospers 1."
      },
      {
        id: "sendris_frontline_aura",
        name: "Pack Frontline",
        trigger: {
          type: "continuous",
          conditions: [
            {
              object: "friendly_frontline",
              condition: "has_{3}_shumi"
            }
          ]
        },
        optional: false,
        effect: {
          type: "increase_ba_damage",
          amount: 1,
          object: "friendly_frontline_shumi"
        },
        text: "While you have 3 or more Shumi on your Frontline, friendly Frontline Shumi deal +1 damage with their Base Attacks."
      }
    ],
    text: "On defeating a Shumi: Prosper 1. | Continuous: If you have 3+ Frontline Shumi, they deal +1 Base Attack damage.",
    flavorText: "If it thinks you its prey, you best start to pray."
  },

  leppun: {
    id: "leppun",
    type: "shumi",
    src: "campestral/leppun.png",
    pic: "campestral/pics/leppun-pic.png",
    name: "Leppun",
    speed: "s",
    habitat: "campestral",
    stage: 2,
    maturesFrom: "supel",
    yaoCost: 5,
    health: 8,
    range: "m",
    keywords: ["flight"],
    specialAttacks: [
      {
        id: "descend_upon",
        name: "Descend Upon",
        yaoCost: 2,
        damage: 3,
        target: ["enemy"],
        modifier: null,
        effect: {
          type: "splash_damage",
          splash_damage: {
            damage: 1,
            target: "same_line"
          }
        },
        text: "(2) Descend Upon: 3, plus 1 damage to each other Shumi sharing a line with the target."
      }
    ],
    baseAttacks: [
      {
        id: "overrun",
        name: "Overrun",
        yaoCost: 0,
        damage: 3,
        target: ["enemy"],
        modifier: null,
        effect: null,
        text: "Overrun: 3"
      }
    ],
    abilities: [],
    text: "Mature Supel. Flight. | (2) Descend Upon: 3 dmg + 1 splash damage to other Shumi in the same lane.",
    flavorText: "In the past, spotting Leppun in the Skies was said to be a boon, aiding in overcoming hardship and fulfilling ones dreams."
  },

  kalflux: {
    id: "kalflux",
    type: "shumi",
    src: "campestral/kalflux.png",
    pic: "campestral/pics/kalflux-pic.png",
    name: "Kalflux",
    speed: "s",
    habitat: "campestral",
    stage: 2,
    maturesFrom: "kalfil",
    yaoCost: 4,
    health: 10,
    range: "m",
    keywords: [],
    specialAttacks: [
      {
        id: "guidance",
        name: "Guidance",
        yaoCost: 0,
        damage: 0,
        target: ["friendly_kalfil"],
        modifier: null,
        effect: {
          type: "prosper",
          prosper: {
            object: "target",
            amount: 2
          }
        },
        text: "(0) Guidance: Target Kalfil Prospers 2"
      }
    ],
    baseAttacks: [
      {
        id: "horns",
        name: "Horns",
        yaoCost: 0,
        damage: 1,
        target: ["enemy"],
        modifier: {
          resource: "friendly_shumi_count",
          filter: { id: "kalfil" },
          source: ["battlefield"],
          amount: 1
        },
        effect: null,
        text: "Horns: 1 + 1 for each friendly Kalfil"
      }
    ],
    abilities: [
      {
        id: "kalflux_protect",
        name: "Maternal Shield",
        trigger: { type: "continuous" },
        optional: false,
        effect: {
          type: "grant_immunity",
          grant_immunity: {
            object: "friendly_kalfil",
            immunity: "cannot_be_attack_target"
          }
        },
        text: "Friendly Kalfil cannot be chosen as targets for attacks. Deals +1 BA damage for each friendly Kalfil."
      }
    ],
    text: "Mature Kalfil. Continuous: Friendly Kalfil cannot be attacked; +1 BA damage per friendly Kalfil.",
    flavorText: "The most docile creature in the grasslands - until it thinks its offspring in danger, that is..."
  },

  inagnu: {
    id: "inagnu",
    type: "shumi",
    src: "campestral/inagnu.png",
    pic: "campestral/pics/inagnu-pic.png",
    name: "Inagnu",
    speed: "s",
    habitat: "campestral",
    stage: 1,
    yaoCost: 2,
    health: 4,
    range: "m",
    keywords: [],
    specialAttacks: [
      {
        id: "tempest_cuddle",
        name: "Tempest Cuddle",
        yaoCost: 2,
        damage: 0,
        target: null,
        modifier: null,
        effect: {
          type: "draw_card damage_self",
          draw_card: {
            amount: 1,
            order: 1
          },
          damage_self: {
            object: "owner",
            amount: 1,
            order: 2
          }
        },
        text: "(2) Tempest Cuddle: Draw a card, Inagnu deals 1 damage to you."
      }
    ],
    baseAttacks: [
      {
        id: "shock",
        name: "Shock",
        yaoCost: 0,
        damage: 2,
        target: ["enemy"],
        modifier: null,
        effect: null,
        text: "Shock: 2"
      }
    ],
    abilities: [
      {
        id: "inagnu_cycle_prosper",
        name: "Peaceful Cycle",
        trigger: { type: "on_end_of_yao_cycle" },
        optional: false,
        conditions: [
          { object: "this", condition: "has_not_dealt_damage_this_yao_cycle" }
        ],
        effect: {
          type: "prosper",
          prosper: {
            object: "this",
            amount: 1
          }
        },
        text: "At the end of each Yao Cycle, if Inagnu has not dealt any damage this Yao Cycle, it Prospers 1."
      },
      {
        id: "inagnu_zap",
        name: "Static Zap",
        trigger: { type: "activated" },
        where: "battlefield",
        speed: "i",
        optional: false,
        cost: [{ yao: 3 }],
        oncePerYaoCycle: true,
        target: ["any"],
        effect: {
          type: "damage",
          damage: {
            object: "target",
            amount: 1
          }
        },
        text: "(I), [3 Yao], Once per Yao Cycle: Inagnu deals 1 damage to any target."
      }
    ],
    text: "End of Yao Cycle: If Inagnu dealt no damage this Cycle, Prosper 1. | (I), [3 Yao], Once/Cycle: Deal 1 damage to any target.",
    flavorText: "Some say the greatest shame in all the World is humanities shocking inability to pet this creature."
  },

  campest: {
    id: "campest",
    type: "myth",
    src: "campestral/campest.png",
    pic: "campestral/pics/campest-pic.png",
    name: "Campest",
    fullName: "Campestral Myth - Campest",
    subtype: "spirit_of_the_vast",
    speed: "s",
    habitat: "campestral",
    yaoCost: 0,
    health: 20,
    range: "m",
    keywords: [],
    summoningCondition: {
      type: "remove_stored_yao",
      source: ["friendly_shumi"],
      totalAmount: 10
    },
    specialAttacks: [
      {
        id: "earthquake",
        name: "Earthquake",
        yaoCost: 1,
        damage: 2,
        target: ["all_other_shumi"],
        modifier: null,
        effect: null,
        text: "(1) Earthquake: 2 damage to all other Shumi"
      }
    ],
    baseAttacks: [
      {
        id: "crush",
        name: "Crush",
        yaoCost: 0,
        damage: 5,
        target: ["enemy"],
        modifier: null,
        effect: null,
        text: "Crush: 5"
      }
    ],
    abilities: [
      {
        id: "campest_etb",
        name: "Wrath of the Vast",
        trigger: { type: "etb", source: "this" },
        optional: false,
        effect: {
          type: "transfer defeat_all_shumi",
          transfer: {
            object: "this",
            source: ["all_friendly_sources"],
            amount: "all",
            order: 1
          },
          defeat_all_shumi: {
            object: "all_other_battlefield_shumi",
            order: 2
          }
        },
        text: "Summon only by removing 10 Stored Yao from among your Shumi. When Campest enters the Battlefield, transfer all Yao on all sources you control onto Campest, then Campest defeats all other Shumi on the Battlefield."
      }
    ],
    text: "Summon by removing 10 Stored Yao from your Shumi. ETB: Transfer all your Yao onto Campest, then defeat all other Shumi.",
    flavorText: "I am the fertile field to birth the razorgrass and, too the winds to bend it - I am Campest the Vast"
  },

  hasten: {
    id: "hasten",
    src: "campestral/hasten.png",
    type: "spell",
    name: "Hasten",
    speed: "s",
    habitat: "campestral",
    yaoCost: 3,
    target: ["any_shumi"],
    effect: {
      type: "gain_momentum",
      gain_momentum: {
        object: "target"
      }
    },
    text: "Target Shumi gains Momentum."
  },

  "ritual-of-the-vast": {
    id: "ritual-of-the-vast",
    src: "campestral/ritual-of-the-vast.png",
    type: "spell",
    name: "Ritual of the Vast",
    speed: "s",
    habitat: "campestral",
    yaoCost: 5,
    target: ["friendly_lane"],
    effect: {
      type: "ritual_of_the_vast"
    },
    text: "Search your Action Deck for a card named 'Campest' and put it into your hand. Shuffle your Action Deck. Create a Sacrificial Spirit token (6 LF / BA: Bloom - 1). Each Shumi you control with a Base Attack named 'Bloom' Prospers 1."
  },

  "the-grand-harvest": {
    id: "the-grand-harvest",
    src: "campestral/the-grand-harvest.png",
    type: "spell",
    name: "The Grand Harvest",
    speed: "s",
    habitat: "campestral",
    yaoCost: 6,
    payOnlyWithStoredYao: true,
    target: null,
    effect: {
      type: "the_grand_harvest"
    },
    text: "Pay for this Spell only with Stored Yao on your Shumi. Each Shumi which had Yao removed from it this way gains Momentum and LF equal to the amount of Yao removed from it. Draw a card for each of those Shumi."
  },

  "razorgrass-shield": {
    id: "razorgrass-shield",
    src: "campestral/razorgrass-shield.png",
    type: "interception",
    name: "Razorgrass Shield",
    speed: "i",
    habitat: "campestral",
    yaoCost: 1,
    target: ["attacked_friendly_frontline_shumi"],
    conditions: [
      {
        object: "friendly_frontline_shumi",
        condition: "attacked"
      },
      {
        object: "friendly_backline",
        condition: "not_full"
      }
    ],
    effect: {
      type: "move_to_backline create_token change_attack_target",
      move_to_backline: {
        object: "target"
      },
      create_token: {
        tokenId: "razorgrass-shield-token",
        lane: "friendly_frontline"
      },
      change_attack_target: {
        object: "created_token"
      }
    },
    text: "As an additional cost to cast this, return an attacked friendly Shumi on the Frontline to the Backline. Create a Razorgrass Shield token (3 LF / BA: Slice - 1) on the Frontline as the new target for the attack."
  },

  prosper: {
    id: "prosper",
    src: "campestral/prosper.png",
    name: "Prosper",
    type: "quickcast",
    yaoCost: 1,
    speed: "q",
    habitat: "campestral",
    target: ["any_shumi"],
    conditions: [
      {
        object: "battlefield",
        condition: "has_shumi"
      }
    ],
    effect: {
      type: "prosper draw_card",
      prosper: {
        object: "target",
        amount: 1
      },
      draw_card: {
        amount: 1
      }
    },
    text: "Target Shumi Prospers 1. Draw a card."
  },

  "cycle-summon": {
    id: "cycle-summon",
    src: "campestral/cycle-summon.png",
    name: "Cycle Summon",
    type: "interception",
    yaoCost: 2,
    additionalCost: [
      {
        type: "return_to_hand",
        object: "friendly_shumi",
        remember: true
      }
    ],
    speed: "i",
    habitat: "campestral",
    target: ["friendly_shumi"],
    conditions: [
      {
        object: "friendly_battlefield",
        condition: "has_shumi"
      }
    ],
    effect: {
      type: "put_onto_battlefield_from_hand",
      put_onto_battlefield_from_hand: {
        object: "shumi",
        yaoCost: "less_than_returned"
      }
    },
    text: "As additional cost to cast this, return a friendly Shumi to hand. You may put another Shumi with YC less than it onto the Battlefield from your Hand."
  },

  "unleash-the-wild-one": {
    id: "unleash-the-wild-one",
    src: "campestral/unleash-the-wild-one.png",
    name: "Unleash the Wild One",
    type: "interception",
    yaoCost: "x",
    minX: 1,
    speed: "i",
    habitat: "campestral",
    target: null,
    effect: {
      type: "unleash_the_wild_one"
    },
    text: "Put a Shumi with YC of X+1 or less onto the Battlefield from your Hand. (X can't be 0)"
  },

  "rune-of-the-razorgrass": {
    id: "rune-of-the-razorgrass",
    type: "power-rune",
    src: "campestral/rune-of-the-razorgrass.png",
    name: "Rune of the Razorgrass",
    habitat: "campestral",
    upperAbility: [
      {
        id: "razorgrass_upper",
        trigger: { type: "on_summon" },
        effect: {
          type: "reduce_play_cost",
          amount: 1,
          delayed: true,
          object: {
            habitat: "summoned_habitat",
            type: "shumi",
            delay: "next"
          }
        },
        text: "Upper (↑): Whenever you summon a Shumi, the next Shumi of the same habitat you summon this turn costs 1 Yao less to summon."
      }
    ],
    lowerAbility: [
      {
        id: "razorgrass_lower",
        trigger: { type: "continuous" },
        effect: {
          type: "increase_spa_damage",
          amount: 1,
          object: {
            type: "friendly-shumi",
            stored: 1
          }
        },
        text: "Lower (↓): Each Shumi under your control with at least 1 Stored Yao deals 1 additional damage with their Special Attacks."
      }
    ],
    combinedAbility: [
      {
        id: "razorgrass_combined",
        trigger: {
          type: "on_yao_put_onto_empty_shumi"
        },
        effect: {
          type: "draw_card",
          amount: 1
        },
        text: "Combined (↕): Whenever Yao are put on a Shumi you control, if it had none on it, draw a card."
      }
    ],
    text: "↑: Next same-habitat Shumi this turn costs -1 Yao. | ↓: Friendly Shumi with Stored Yao deal +1 Special Attack dmg. | ↕: When Yao is put on a friendly Shumi that had 0 Yao, draw a card."
  },

  "rune-of-the-fertile-field": {
    id: "rune-of-the-fertile-field",
    src: "campestral/rune-of-the-fertile-field.png",
    type: "power-rune",
    name: "Rune of the Fertile Field",
    habitat: "campestral",
    upperAbility: [
      {
        id: "fertile_upper_passive",
        trigger: {
          type: "on_friendly_defeated",
          conditions: [
            {
              object: "defeated_shumi",
              condition: "had_stored"
            }
          ]
        },
        effect: {
          type: "put_yao",
          object: "this",
          amount: "had_stored"
        },
        text: "Upper (↑): Whenever a Shumi you control is defeated, if it had any Yao on it, put it on this card."
      },
      {
        id: "fertile_upper_act",
        name: "Transfer 1 Yao to Shumi",
        oncePerTurn: true,
        trigger: {
          type: "activated"
        },
        where: "runeZone",
        speed: "s",
        cost: [],
        conditions: [
          {
            object: "this",
            condition: "has_stored"
          },
          {
            object: "friendly_battlefield",
            condition: "has_shumi"
          }
        ],
         target: ["friendly_shumi"],
        effect: {
          type: "transfer",
          amount: 1,
          source: "this",
          object: "target"
        },
        text: "Once per Turn (S): Transfer 1 Yao from this card to a Shumi you control."
      }
    ],
    lowerAbility: [
      {
        id: "fertile_lower",
        trigger: {
          type: "continuous",
          conditions: [
            {
              object: "friendly_frontline",
              condition: "has_{3}_shumi"
            }
          ]
        },
        effect: {
          type: "redirect_frontline_yao"
        },
        text: "Lower (↓): If you have 3 or more Shumi on your Frontline, if Yao would be put on any of them, you may choose to put them on another one of your Frontline Shumi instead."
      }
    ],
    combinedAbility: [
      {
        id: "fertile_combined_passive",
        trigger: {
          type: "on_yao_reserve_add"
        },
        effect: {
          type: "put_yao",
          object: "this",
          amount: 1
        },
        text: "Combined (↕): Whenever Yao is added to your Reserve, put 1 Yao on this card."
      },
      {
        id: "fertile_combined_act",
        name: "Transfer 1 Yao to Shumi",
        oncePerTurn: true,
        trigger: {
          type: "activated"
        },
        where: "runeZone",
        speed: "s",
        cost: [],
        conditions: [
          {
            object: "this",
            condition: "has_stored"
          },
          {
            object: "friendly_battlefield",
            condition: "has_shumi"
          }
        ],
        target: ["friendly_shumi"],
        effect: {
          type: "transfer",
          amount: 1,
          source: "this",
          object: "target"
        },
        text: "Once per Turn (S): Transfer 1 Yao from this card to a Shumi you control."
      }
    ],
    text: "↑: Recover Stored Yao from defeated Shumi; Once/turn (S) Transfer 1 Yao to friendly Shumi. | ↓: With 3+ Frontline Shumi, may redirect Yao placed on a Frontline Shumi to another Frontline Shumi. | ↕: Whenever Yao is added to Reserve, put 1 Yao on this rune; Once/turn (S) Transfer 1 Yao to friendly Shumi."
  },

  "campestral-yao-crystal": {
    type: "crystal",
    yaoCost: 0,
    speed: "s",
    src: "campestral/campestral-yao-crystal.png",
    pic: "campestral/pics/campestral-yao-crystal-pic.png",
    id: "campestral-yao-crystal",
    name: "Campestral Yao Crystal",
    habitat: "campestral",
    crystalDefaultEffect: true,
    abilities: [
      {
        id: "crystal_burst",
        name: "Burst: Target Shumi Prospers 1",
        isBurst: true,
        trigger: {
          type: "activated"
        },
        where: "hand",
        speed: "s",
        cost: [],
        conditions: [
          {
            object: "battlefield",
            condition: "has_shumi"
          }
        ],
        target: ["any_shumi"],
        effect: {
          type: "prosper",
          amount: 1,
          object: "target"
        },
        text: "Burst (Destroy in hand, S): Target Shumi Prospers 1."
      }
    ],
    text: "At the beginning of your Yao Phase, add 1 Yao to your Reserve. | Burst (from hand): Destroy this crystal; Target Shumi Prospers 1."
  },

  // Tokens
  "razorgrass-shield-token": {
    id: "razorgrass-shield-token",
    type: "shumi",
    isToken: true,
    src: "campestral/razorgrass-shield.png",
    pic: "campestral/razorgrass-shield.png",
    name: "Razorgrass Shield",
    speed: "s",
    habitat: "campestral",
    stage: 1,
    yaoCost: 0,
    health: 3,
    range: "m",
    keywords: [],
    specialAttacks: [],
    baseAttacks: [
      {
        id: "slice",
        name: "Slice",
        yaoCost: 0,
        damage: 1,
        target: ["enemy"],
        modifier: null,
        effect: null,
        text: "Slice: 1"
      }
    ],
    abilities: [],
    text: "Token (3 LF / BA: Slice - 1)"
  },

  "sacrificial-spirit-token": {
    id: "sacrificial-spirit-token",
    type: "shumi",
    isToken: true,
    src: "campestral/ritual-of-the-vast.png",
    pic: "campestral/ritual-of-the-vast.png",
    name: "Sacrificial Spirit",
    speed: "s",
    habitat: "campestral",
    stage: 1,
    yaoCost: 0,
    health: 6,
    range: "m",
    keywords: [],
    specialAttacks: [],
    baseAttacks: [
      {
        id: "bloom",
        name: "Bloom",
        yaoCost: 0,
        damage: 1,
        target: ["enemy"],
        modifier: null,
        effect: null,
        text: "Bloom: 1"
      }
    ],
    abilities: [],
    text: "Token — Campestral Shumi (6 LF / BA: Bloom - 1)"
  },

  "no-rune": {
    id: "no-rune",
    src: null
  }
};

// Backward-compatible alias for hyphenated rune ID
campestral["rune-of-the-razor-grass"] = campestral["rune-of-the-razorgrass"];

export function getCardData() {
  return campestral;
}

export default campestral;
