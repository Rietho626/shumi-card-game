export const campestral = {
  maum: {
  id: "maum",
  type: "shumi",
  src: "campestral/maum.png",
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
      name: "Razorgrass Claws",
      yaoCost: 2,
      damage: 1,
      target: ["enemy"],
      modifier: {
        resource: "storedYao",
        source: ["this"],
        amount: 1
      },
      effect: null
    }
  ],
  baseAttacks: [
    {
      name: "Claws",
      yaoCost: 0,
      damage: 1,
      target: ["enemy"],
      modifier: null,
      effect: null
    }
  ],
  abilities: [
    {
      trigger: { type: "etb", source: "this" },
      optional: false,
      effect: {
        type: "prosper",
        prosper: {
          object: "this",
          amount: 1
        }
      }
    },
    {
      trigger: { type: "activated" },
      speed: "i",
      where: "battlefield",
      cost: [{ storedYao: "x", maxX: 3, minX: 1, stored: "this"}],
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
      }
    }
  ],
  flavorText: "In grassy green garment it strolls through the land, unwelcome patting may cost you your hand."
}
,

faele: {
  id: "faele",
  type: "shumi",
  src: "campestral/faele.png",
  name: "Faele",
  speed: "s",
  habitat: "campestral",
  stage: 1,
  yaoCost: 2,
  health: 5,
  range: "m",
  specialAttacks: [
    {
      name: "Tantrum",
      yaoCost: 2,
      damage: 4,
      target: ["enemy"],
      modifier: null,
      effect: {
        type: "recoil",
        recoil: {
          amount: 2
        }
      }
    }
  ],
  baseAttacks: [
    {
      name: "Flail",
      yaoCost: 0,
      damage: 1,
      target: ["enemy"],
      modifier: null,
      effect: null
    }
  ],
  abilities: [
    {
      trigger: { type: "etb", source: "this" },
      optional: false,
      effect: {
        type: "transfer",
        transfer: {
          object: "this",
          amount: "x"
        }
      }
    },
    {
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
      }
    }
  ],
  flavorText: "Many a Faele has been witnessed to stumble and fall, but never once have they failed to lift themselves up once more."
},

muspem: {
  id: "muspem",
  type: "shumi",
  src: "campestral/muspem.png",
  name: "Muspem",
  speed: "s",
  habitat: "campestral",
  stage: 1,
  yaoCost: 1,
  health: 1,
  range: "m",
  specialAttacks: [
    {
      name: "Squeak for Help",
      yaoCost: 2,
      damage: 0,
      target: null,
      modifier: null,
      effect: {
        type: "search_and_play",
        search_and_play: {
          deck: "action_deck",
          filter: { name: "muspem" },
          destination: "battlefield",
          then: "shuffle_deck"
        }
      }
    }
  ],
  baseAttacks: [
    {
      name: "Bite",
      yaoCost: 0,
      damage: 1,
      target: ["enemy"],
      modifier: null,
      effect: null
    }
  ],
  abilities: [
    {
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
      }
    }
  ],
  flavorText: "Squeak! - Muspem / Squeak, Squeak! - Pair of Muspem"
},
supel: {
  id: "supel",
  type: "shumi",
  src: "campestral/supel.png",
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
      name: "Hop",
      yaoCost: 1,
      damage: 2,
      target: ["enemy"],
      modifier: null,
      effect: null
    }
  ],
  baseAttacks: [
    {
      name: "Flop",
      yaoCost: 0,
      damage: 1,
      target: ["enemy"],
      modifier: null,
      effect: null
    }
  ],
  abilities: [
    {
      trigger: { type: "etb", source: "this" },
      optional: false,
      effect: {
        type: "prosper",
        prosper: {
          object: "this",
          amount: 1
        }
      }
    },
    {
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
      }
    }
  ],
  flavorText: "Supel, Supel, hops and flops - Supel, Supel never stops / Supel, Supel cannot fly - Supel, Supel will still try"
},

horucan: {
  id: "horucan",
  type: "shumi",
  src: "campestral/horucan.png",
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
      name: "Greater Yao Release",
      yaoCost: 5,
      damage: 7,
      target: ["enemy"],
      modifier: null,
      effect: null
    }
  ],
  baseAttacks: [
    {
      name: "Claws",
      yaoCost: 0,
      damage: 4,
      target: ["enemy"],
      modifier: null,
      effect: null
    }
  ],
  abilities: [
    {
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
      }
    },
    {
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
      }
    }
  ],
  flavorText: "This grasslands nightly sentinel, even in the deepest darkness, nothing escapes its watchful gaze."
},
gramaum: {
  id: "gramaum",
  type: "shumi",
  src: "campestral/gramaum.png",
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
      }
    }
  ],
  baseAttacks: [
    {
      name: "Claws",
      yaoCost: 0,
      damage: 4,
      target: ["enemy"],
      modifier: null,
      effect: null
    }
  ],
  abilities: [
    {
      trigger: { type: "etb", source: "this" },
      optional: false,
      effect: {
        type: "transfer",
        transfer: {
          object: "this",
          source: ["all_friendly_sources"],
          amount: "x"
        }
      }
    },
    {
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
      }
    }
  ],
  flavorText: "The undisputed rulers of the grasslands. A rare and enigmatic creature only few have glimpsed upon."
},
musclyp: {
  id: "musclyp",
  type: "shumi",
  src: "campestral/musclyp.png",
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
      name: "Pack Attack",
      yaoCost: 1,
      damage: 2,
      target: ["enemy"],
      modifier: {
        resource: "friendly_shumi_count",
        filter: { name: "muspem" },
        source: ["battlefield"],
        amount: 1
      },
      effect: null
    }
  ],
  baseAttacks: [
    {
      name: "Claws",
      yaoCost: 0,
      damage: 2,
      target: ["enemy"],
      modifier: null,
      effect: null
    }
  ],
  abilities: [
    {
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
      }
    },
    {
      trigger: { type: "activated" },
      where: "battlefield",
      speed: "q",
      optional: true,
      cost: null,
      conditions: [
        { object: "this", condition: "has_momentum" }
      ],
      oncePerTurn: true,
      effect: {
        type: "put_into_play",
        put_into_play: {
          source: "hand",
          filter: { name: "muspem" }
        }
      }
    }
  ],
  flavorText: "A strange creature. It is unknown what truly happens when it matures fully. Naturally there are rumors..."
},
farloss: {
  id: "farloss",
  type: "shumi",
  src: "campestral/farloss.png",
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
      }
    }
  ],
  baseAttacks: [
    {
      name: "Ram",
      yaoCost: 0,
      damage: 2,
      target: ["enemy"],
      modifier: null,
      effect: null
    }
  ],
  abilities: [
    {
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
      }
    },
    {
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
      }
    }
  ],
  flavorText: "The most hardheaded creature to inhabit the grasslands. Can convert inner Yao into physical energy."
},
caquil: {
  id: "caquil",
  type: "shumi",
  src: "campestral/caquil.png",
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
      name: "Lesser Yao Release",
      yaoCost: 2,
      damage: 3,
      target: ["enemy"],
      modifier: null,
      effect: null
    }
  ],
  baseAttacks: [
    {
      name: "Peck",
      yaoCost: 0,
      damage: 2,
      target: ["enemy"],
      modifier: null,
      effect: null
    }
  ],
  abilities: [
    {
      trigger: { type: "etb", source: "this" },
      optional: false,
      effect: {
        type: "search_and_put_into_hand",
        search_and_put_into_hand: {
          deck: "action_deck",
          filter: {
            habitat: "campestral",
            yaoCost: [1, 2, 3],
            not: { name: "caquil" }
          },
          destination: "hand",
          then: "shuffle_deck"
        }
      }
    }
  ],
  flavorText: "A creature of the dark, ever glowing, guiding lost souls through the night."
},
schnuut: {
  id: "schnuut",
  type: "shumi",
  src: "campestral/schnuut.png",
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
      name: "From the Shadows",
      yaoCost: 1,
      damage: 1,
      target: ["enemy"],
      modifier: null,
      effect: null
    }
  ],
  baseAttacks: [
    {
      name: "Jumpscare",
      yaoCost: 0,
      damage: 0,
      target: ["enemy"],
      modifier: null,
      effect: null
    }
  ],
  abilities: [
    {
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
      }
    }
  ],
  flavorText: "It loves to playfully scare children, but only because it knows that they, too find it very enjoyable."
},
inazovis: {
  id: "inazovis",
  type: "shumi",
  src: "campestral/inazovis.png",
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
      }
    }
  ],
  baseAttacks: [
    {
      name: "Shock",
      yaoCost: 0,
      damage: 3,
      target: ["enemy"],
      modifier: null,
      effect: null
    }
  ],
  abilities: [
    {
      trigger: { type: "on_yao_added", object: "this" },
      optional: false,
      target: ["any_shumi"],
      effect: {
        type: "damage",
        damage: {
          object: "target",
          amount: 1
        }
      }
    }
  ],
  flavorText: "Among the Keepers of Inazovis exists a golden Rule: Males and Females must be kept in equal number."
},
equuna: {
  id: "equuna",
  type: "shumi",
  src: "campestral/equuna.png",
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
      name: "Tag Team",
      yaoCost: 0,
      damage: 1,
      target: ["enemy"],
      modifier: null,
      effect: null
    }
  ],
  baseAttacks: [
    {
      name: "Kick",
      yaoCost: 0,
      damage: 2,
      target: ["enemy"],
      modifier: null,
      effect: null
    }
  ],
  abilities: [
    {
      trigger: { type: "etb", source: "this" },
      optional: false,
      effect: {
        type: "draw_card",
        draw_card: {
          amount: 1
        }
      }
    },
    {
      trigger: { type: "on_attack", attack: "tag_team" },
      optional: true,
      additionalCost: [
        {
          type: "return_to_hand",
          object: "friendly_shumi_with_momentum",
          remember: true
        }
      ],
      conditions: [
        {
          object: "friendly_battlefield",
          condition: "has_shumi_with_momentum"
        }
      ],
      effect: {
        type: "amplify_attack",
        amplify_attack: {
          attack: "tag_team",
          amount: "remembered.baseAttackDamage"
        }
      }
    }
  ],
  flavorText: "The fields recoil beneath its hooves."
},
kalfil: {
  id: "kalfil",
  type: "shumi",
  src: "campestral/kalfil.png",
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
      name: "Moo Innocently",
      yaoCost: 2,
      damage: 0,
      target: null,
      modifier: null,
      effect: {
        type: "search_and_put_into_hand",
        search_and_put_into_hand: {
          deck: "action_deck",
          filter: { name: "mature_kalfil" },
          then: "shuffle_deck"
        }
      }
    }
  ],
  baseAttacks: [
    {
      name: "Rest",
      yaoCost: 0,
      damage: 0,
      target: null,
      modifier: null,
      effect: null
    }
  ],
  abilities: [
    {
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
      }
    }
  ],
  flavorText: "Since Kalfil severly lack proficiency at existing, their guardians protect them ever so fiercely."
},
sendris: {
  id: "sendris",
  type: "shumi",
  src: "campestral/sendris.png",
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
      name: "Swift Slice",
      yaoCost: 1,
      damage: 0,
      target: ["enemy"],
      modifier: {
        resource: "storedYao",
        source: ["all_friendly_shumi"],
        amount: 1
      },
      effect: null
    }
  ],
  baseAttacks: [
    {
      name: "Claws",
      yaoCost: 0,
      damage: 3,
      target: ["enemy"],
      modifier: null,
      effect: null
    }
  ],
  abilities: [
    {
      trigger: { type: "on_defeat_another" },
      optional: false,
      effect: {
        type: "prosper",
        prosper: {
          object: "this",
          amount: 1
        }
      }
    },
    {
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
      }
    }
  ],
  flavorText: "If it thinks you its prey, you best start to pray."
},
leppun: {
  id: "leppun",
  type: "shumi",
  src: "campestral/leppun.png",
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
      }
    }
  ],
  baseAttacks: [
    {
      name: "Overrun",
      yaoCost: 0,
      damage: 3,
      target: ["enemy"],
      modifier: null,
      effect: null
    }
  ],
  abilities: [],
  flavorText: "In the past, spotting Leppun in the Skies was said to be a boon, aiding in overcoming hardship and fulfilling ones dreams. In light of the drastic increase in populace however, this mythos has faded into the background and the creature itself has become a symbol."
},
kalflux: {
  id: "kalflux",
  type: "shumi",
  src: "campestral/kalflux.png",
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
      }
    }
  ],
  baseAttacks: [
    {
      name: "Horns",
      yaoCost: 0,
      damage: 1,
      target: ["enemy"],
      modifier: {
        resource: "friendly_shumi_count",
        filter: { name: "kalfil" },
        source: ["battlefield"],
        amount: 1
      },
      effect: null
    }
  ],
  abilities: [
    {
      trigger: { type: "continuous" },
      optional: false,
      effect: {
        type: "grant_immunity",
        grant_immunity: {
          object: "friendly_kalfil",
          immunity: "cannot_be_attack_target"
        }
      }
    }
  ],
  flavorText: "The most docile creature in the grasslands - until it thinks its offspring in danger, that is..."
},
inagnu: {
  id: "inagnu",
  type: "shumi",
  src: "campestral/inagnu.png",
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
      }
    }
  ],
  baseAttacks: [
    {
      name: "Shock",
      yaoCost: 0,
      damage: 2,
      target: ["enemy"],
      modifier: null,
      effect: null
    }
  ],
  abilities: [
    {
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
      }
    },
    {
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
      }
    }
  ],
  flavorText: "Some say the greatest shame in all the World is humanities shocking inability to pet this creature."
},
campest: {
  id: "campest",
  type: "myth",
  src: "campestral/campest.png",
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
      name: "Earthquake",
      yaoCost: 1,
      damage: 2,
      target: ["all_shumi"],
      modifier: null,
      effect: null
    }
  ],
  baseAttacks: [
    {
      name: "Crush",
      yaoCost: 0,
      damage: 5,
      target: ["enemy"],
      modifier: null,
      effect: null
    }
  ],
  abilities: [
    {
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
          object: "all_battlefield_shumi",
          order: 2
        }
      }
    }
  ],
  flavorText: "I am the the fertile field to birth the razorgrass and, too the winds to bend it - I am Campest the Vast"
},

  hasten:{
    id: "hasten",
    src: "campestral/hasten.png",
    type: "spell",
    name: "Hasten",
    speed: "s",
    habitat: "campestral",
    yaoCost: 3,
    target: ["any_shumi"],
    effect:{
      type: "gain_momentum",
      gain_momentum: {
        object: "target"
      }
    },
    text: "Target Shumi gains Momentum"
  },
  "razorgrass-shield":{
    id: "razorgrass-shield",
    src: "campestral/razorgrass-shield.png",
    type: "interception",
    name: "Razorgrass Shield",
    speed: "i",
    habitat: "campestral",
    yaoCost: 2,
    target: ["friendly_frontline_shumi"],
    conditions: [{
      object: "friendly_shumi",
      condition: "attacked"
    },
    {
      object: "friendly_backline",
      condition: "not_full"
    }],
    effect:{
      type: "move_to_backline create_token change_attack_target",
      "move_to_backline": {
        object: "target"
      },
      "create_token":{
        type: "shumi",
        name: "Razorgrass Shield",
        id: "razorgrass-shield",
        yaoCost: 1,
        hp: 3,
        baseAttacks: [
          {
            name: "Sting",
            yaoCost: 0,
            damage: 1,
            target: ["enemy"],
            modifier: null,
            effect: null
          }
        ],
        lane: "friendly_frontline"
      },
      "change_attack_target":{
        object: "created_token"
      }
    },
    text: "Play only if a frontline Shumi you control is being attacked - move it to the Backline. Summon a Razorgrass Shield Token (3LF / BA: Sting - 1) on the frontline as a new target for the attack."
  },
  prosper:{
    id: "prosper",
    src: "campestral/prosper.png",
    name: "Prosper",
    type: "quickcast",
    yaoCost: 1,
    speed: "q",
    habitat: "campestral",
    target: ["any_shumi"],
    conditions:[
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
        amount: 1,
      }
    },
    text: "Target Shumi Prospers 1. Draw a card"
  },
   "cycle-summon":{
    id: "cycle-summon",
    src: "campestral/cycle-summon.png",
    name: "Cycle Summon",
    type: "interception",
    yaoCost: 2,
    additionalCost: [{
      type: "return_to_hand",
      object: "friendly_shumi",
      remember: true
    }],
    speed: "i",
    habitat: "campestral",
    target: null,
    conditions:[
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
  "rune-of-the-razor-grass":{
    id: "rune-of-the-razor-grass",
    type: "power-rune",
    src: "campestral/rune-of-the-razor-grass.png",
    name: "Rune of the Razor Grass",
    habitat: "campestral",
    upperAbility:[
      {
        trigger: {type: "on_summon"},
        effect:{
          type: "reduce_play_cost",
          amount: 1,
          delayed: true,
          object: {
            habitat: "summoned_habitat",
            type: "shumi",
            delay: "next"
          }
        },
        text: "Whenever you summon a Shumi, the next Shumi of the same habitat you summon this turn costs one Yao less to summon."
      }
    ]
    ,
    lowerAbility:[
    {
      trigger: {type: "continuous"},
      effect:{
        type: "increase_spa_damage",
        amount: 1,
        object:{
          type: "friendly-shumi",
          stored: 1
        }
      },
      text: "Each Shumi under your control with at least one (Y) deals 1 additional damage with their special attacks."
    }],
    combinedAbility:[{
      trigger: {
        type: "on_prosper on_transfer"
      },
      effect:{
        type: "draw",
        amount: 1
      },
      text: "Whenever Yao is put onto any Shumi you control, draw a card."
    }]
  },
  "rune-of-the-fertile-field":{
    id: "rune-of-the-fertile-field",
    src: "campestral/rune-of-the-fertile-field.png",
    type: "power-rune",
    name: "Rune of the Fertile Field",
    habitat: "campestral",
    upperAbility:[
      {
        trigger: {
          type: "on_friendly_defeated",
          conditions:[{
            object: "defeated_shumi",
            condition: "had_stored"
          }]
        },
        effect:{
          type: "put_yao",
          object: "this",
          amount: "had_stored"
        },
        text: "Whenever a Shumi you control is defeated, if it had any Yao on it, put it on this card."
      },
      {
        trigger:{
          type: "activated",
          where: "battlefield",
          speed: "s",
          cost: null,
          conditions:
          [
            {
              object: "this",
              condition: "has_stored"
            },
            {
              object: "friendly_battlefield",
              condition: "has_shumi"
            },
        ]
        },
        effect:{
          type: "transfer",
          amount: 1,
          source: "this",
          object: "any_friendly_shumi",
          target: true
        },
        text: "Once per Turn: (S): Transfer 1 from this card to a Shumi you control."
      }
    ],
    lowerAbility:[{
      trigger:{
        type: "continious",
        conditions: [
          {
            object: "friendly_frontline",
            condition: "has_{3}_shumi"
          }
        ]
      },
      effect:{
        type: "increase_sta_damage",
        amount: 1,
        object: "friendly_frontline_shumi"
      },
      text: "If you have 3 Shumi on your frontline, Shumi on your frontline deal 1 additional damage with their standard attacks."
    }],
    combinedAbility:[
      {
        trigger: {
          type: "on_yao_reserve_add",
        },
        effect:{
          type: "put_yao",
          object: "this",
          amount: 1
        },
        text: "Whenever Yao is added to your Reserve, put one Yao on this card."
      },
      {
        trigger:{
          type: "activated",
          where: "battlefield",
          speed: "s",
          cost: null,
          conditions:
          [
            {
              object: "this",
              condition: "has_stored"
            },
            {
              object: "friendly_battlefield",
              condition: "has_shumi"
            },
        ]
        },
        effect:{
          type: "transfer",
          amount: 1,
          source: "this",
          object: "any_friendly_shumi",
          target: true
        },
        text: "Once per Turn: (S): Transfer 1 from this card to a Shumi you control."
      }
    ]
  },
  "no-rune":{
    src: null
  },
  "campestral-yao-crystal":{
    type: "crystal",
    yaoCost: null,
    speed: "s",
    src: "campestral/campestral-yao-crystal.png",
    id: "campestral-yao-crystal",
    name: "Campestral Yao Crystal",
    crystalDefaultEffect: true,
    abilities: [
      {

        trigger: {
          type: "activated",
          where: "hand",
          speed: "s",
          conditions: [
            {
              object: "battlefield",
              condition: "has_shumi"
            }
          ]
        },
        effect: {
          type: "prosper",
          amount: 1,
          target: ["any_shumi"],
          object: "target"
        }
      }
    ]
  }
};

export function getCardData(){
   return campestral;
}

export default campestral;