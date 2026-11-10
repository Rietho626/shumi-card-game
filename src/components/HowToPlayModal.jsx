import { useState } from "react";

const GUIDE_SECTIONS = [
  {
    id: "overview",
    title: "1. Overview & Decks",
    icon: "🏆",
    content: (
      <div className="htp-section-body">
        <h3>Objective of the Game</h3>
        <p>
          Each player begins the match at <strong>20 Life Force (♥)</strong>. Reduce your opponent&apos;s Life Force to{" "}
          <strong>0</strong> using your Shumi creatures, attacks, and abilities—or outlast them if they are forced to
          draw from an empty deck—to claim victory!
        </p>

        <div className="htp-grid-2">
          <div className="htp-card">
            <h4>🃏 Action Deck (30 Cards)</h4>
            <p>
              Contains your <strong>Shumi</strong> (creatures) and <strong>Spells</strong> (Sorceries, Quickcasts, and
              Interceptions). Maximum of <strong>2 copies</strong> of any card per Action Deck.
            </p>
          </div>
          <div className="htp-card">
            <h4>💎 Yao Deck (20 Cards)</h4>
            <p>
              Contains your <strong>Yao Crystals</strong>. Whenever you draw a card (including your starting hand and
              each Draw Phase), <strong>you choose</strong> whether to draw from your Action Deck or your Yao Deck!
            </p>
          </div>
        </div>

        <h3>🔮 Runes (Upper, Lower &amp; Combined ↕)</h3>
        <p>
          Before the battle, you configure your <strong>Rune Slots</strong> in the Deck &amp; Rune Forge:
        </p>
        <ul>
          <li>
            <strong>Dual Rune Loadout (Upper ▲ + Lower ▼):</strong> Equip two different Runes to gain the Upper passive
            effect of the top Rune and the Lower passive effect of the bottom Rune.
          </li>
          <li>
            <strong>Combined Rune Loadout (↕):</strong> Place a single Rune in your Upper slot and leave the Lower slot
            empty to unlock its powerful <strong>Combined (↕) ability</strong>!
          </li>
        </ul>

        <h3>🖱️ Controls (Click to Play &amp; Act)</h3>
        <ul>
          <li>
            <strong>Play Cards from Hand:</strong> Hover over your hand at the bottom of the screen and{" "}
            <strong>click any glowing card</strong> to play it (or Burst a Crystal).
          </li>
          <li>
            <strong>Command Shumi on the Board:</strong> Click any friendly Shumi on your Frontline or Backline to open
            its tactical menu (Attack, Activate Abilities, or Move Lanes).
          </li>
          <li>
            <strong>Inspect Zones:</strong> Click your or your opponent&apos;s <em>Resting Grounds</em> or{" "}
            <em>Spirited Away</em> piles on the left to inspect all cards inside.
          </li>
        </ul>
      </div>
    )
  },
  {
    id: "cycles",
    title: "2. Turns & Yao Cycles",
    icon: "🔄",
    content: (
      <div className="htp-section-body">
        <h3>What is a Yao Cycle?</h3>
        <p>
          Time in Shumi flows in <strong>Yao Cycles</strong>. One full Yao Cycle consists of{" "}
          <strong>two consecutive turns</strong> (the Cycle Starter&apos;s turn followed by the Second Player&apos;s
          turn).
        </p>

        <div className="htp-timeline">
          <div className="htp-step">
            <span className="htp-step-badge">Phase 1</span>
            <div>
              <strong>Yao Phase:</strong> Each Crystal in the active player&apos;s Crystal Zone generates{" "}
              <strong>+1 Yao</strong> into their Yao Reserve. All friendly Shumi regain <strong>⚡ Momentum</strong>,
              and your <strong>1 Free Lane Change</strong> for the turn refreshes.
            </div>
          </div>
          <div className="htp-step">
            <span className="htp-step-badge">Phase 2</span>
            <div>
              <strong>Draw Phase:</strong> The active player chooses to draw 1 card from either their{" "}
              <strong>Action Deck</strong> or their <strong>Yao Deck</strong>.{" "}
              <em>(Note: On Turn 1 of the match, the starting player skips their Draw Phase.)</em>
            </div>
          </div>
          <div className="htp-step">
            <span className="htp-step-badge">Phase 3</span>
            <div>
              <strong>Action Phase:</strong> Play up to <strong>1 Crystal</strong> per turn, summon Shumi, cast Spells,
              reposition lanes, activate abilities, and declare attacks while the Stack is empty.
            </div>
          </div>
          <div className="htp-step">
            <span className="htp-step-badge">Phase 4</span>
            <div>
              <strong>End Phase:</strong> Turn-based effects expire. When the <strong>second turn</strong> of a Yao
              Cycle finishes, the <strong>Yao Cycle Ends</strong>:
              <ul>
                <li>
                  Each player&apos;s <strong>Yao Reserve</strong> resets down to the number of Crystals they control.
                </li>
                <li>
                  <em>&quot;Until end of Yao cycle&quot;</em> buffs and temporary keywords expire.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "yao",
    title: "3. Yao, Prosper & Burst",
    icon: "✦",
    content: (
      <div className="htp-section-body">
        <h3>Two Places Yao Can Exist</h3>
        <div className="htp-grid-2">
          <div className="htp-card">
            <h4>✦ Yao Reserve (Player Pool)</h4>
            <p>
              Your general mana pool on the right side of the board. Used to pay for playing Shumi, casting Spells, and
              activating abilities. At the end of each full Yao Cycle, excess Yao above your Crystal count is lost.
            </p>
          </div>
          <div className="htp-card">
            <h4>🌱 Stored Yao (On a Shumi)</h4>
            <p>
              Yao stored directly on a Shumi card! Stored Yao <strong>does not reset</strong> at the end of a Yao Cycle.
              It can be spent to:
            </p>
            <ul>
              <li>
                Pay for that Shumi&apos;s own <strong>Activated Abilities</strong> or <strong>Special Attacks</strong>.
              </li>
              <li>
                Pay toward <strong>Maturing</strong> that Young Shumi into a Mature Shumi.
              </li>
              <li>Power cards that scale with or consume Stored Yao (e.g., <em>Gramaum</em>, <em>The Grand Harvest</em>).</li>
            </ul>
          </div>
        </div>

        <h3>Key Yao Mechanics &amp; Prompts</h3>
        <ul>
          <li>
            <strong>Choosing How to Pay:</strong> Whenever an ability, Special Attack, or Mature summon can be paid
            using either <strong>Stored Yao</strong> on that Shumi or your <strong>Yao Reserve</strong>, a prompt will
            let you choose the exact split!
          </li>
          <li>
            <strong>Prosper X:</strong> The Shumi generates <strong>X Yao out of thin air</strong> (like photosynthesis)
            and places it directly onto itself as Stored Yao.
          </li>
          <li>
            <strong>Transfer X:</strong> Move up to <strong>X Yao</strong> from your Yao Reserve (or any source if
            specified, like <em>Gramaum</em>) onto the Shumi as Stored Yao.
          </li>
          <li>
            <strong>💥 Crystal Burst:</strong> Instead of playing a Crystal to your Crystal Zone, you can{" "}
            <strong>Burst</strong> it from your hand at <strong>Quickcast speed</strong> by paying 1 Yao: the Crystal is
            destroyed in hand and a target friendly Shumi <strong>Prospers 1</strong>!
          </li>
        </ul>
      </div>
    )
  },
  {
    id: "combat",
    title: "4. Lanes & Combat",
    icon: "⚔",
    content: (
      <div className="htp-section-body">
        <h3>Frontline vs. Backline</h3>
        <p>
          Each player has two Shumi lanes (up to 5 Shumi per lane) plus a Crystal Zone (up to 5 Crystals):
        </p>
        <div className="htp-grid-2">
          <div className="htp-card">
            <h4>🛡️ Frontline (Melee &amp; Vanguard)</h4>
            <p>
              Protects your Backline and your Life Force! As long as your opponent controls at least one Frontline
              Shumi, normal attacks <strong>must target a Frontline Shumi</strong>.
            </p>
          </div>
          <div className="htp-card">
            <h4>🏹 Backline (Support &amp; Ranged)</h4>
            <p>
              Protected behind your Frontline. <strong>Melee (M-Shumi)</strong> cannot declare attacks from the
              Backline, whereas <strong>Ranged (R-Shumi)</strong> can attack from either lane!
            </p>
          </div>
        </div>

        <h3>⚡ Momentum, Lane Movement &amp; Flight</h3>
        <ul>
          <li>
            <strong>Momentum (⚡):</strong> Shumi enter play with Momentum and refresh it every Yao Phase. Declaring an
            attack consumes the attacker&apos;s Momentum for the turn.
          </li>
          <li>
            <strong>Lane Repositioning (⇄):</strong> Once per turn during your Action Phase, <strong>one</strong>{" "}
            friendly Shumi may switch between Frontline and Backline <strong>for free</strong>. Additional Shumi may
            also switch lanes by spending their <strong>⚡ Momentum</strong> (and if both options are available, you can
            choose which to spend).
          </li>
          <li>
            <strong>🪽 Flight:</strong> An attacking Shumi with <em>Flight</em> ignores the enemy Frontline blockade and
            may target <strong>any enemy Shumi (Frontline or Backline) or the enemy Player directly</strong>! (Note:
            Melee Shumi with Flight still must be on the Frontline to initiate an attack.)
          </li>
          <li>
            <strong>Persistent Damage:</strong> Damage marked on Shumi persists across turns until healed or until the
            Shumi is destroyed. Combat attacks deal one-way damage (no automatic counter-attack damage).
          </li>
        </ul>
      </div>
    )
  },
  {
    id: "mature_stack",
    title: "5. Maturing & The Stack",
    icon: "🌿",
    content: (
      <div className="htp-section-body">
        <h3>🌿 Maturing Shumi (Evolution)</h3>
        <p>
          Shumi come in two stages: <strong>Young Shumi</strong> and <strong>Mature Shumi</strong>. You can play a
          Mature Shumi in two ways:
        </p>
        <ul>
          <li>
            <strong>Play Directly (Hard-Cast):</strong> Pay its full Yao cost from your Yao Reserve and place it into an
            open Frontline or Backline slot.
          </li>
          <li>
            <strong>Mature a Young Shumi:</strong> Choose a friendly Young Shumi already on the battlefield to evolve!
            <ul>
              <li>
                You only pay the <strong>difference in Yao cost</strong> between the Mature Shumi and the Young Shumi
                (minimum 0).
              </li>
              <li>
                You may use the Young Shumi&apos;s <strong>Stored Yao</strong> and/or your <strong>Yao Reserve</strong>{" "}
                to pay that difference.
              </li>
              <li>
                The Young Shumi is <em>Spirited Away</em> (removed from the game), and the Mature Shumi takes its exact
                lane spot, inheriting all <strong>Stored Yao</strong> and <strong>marked damage</strong> (Momentum is
                not carried over).
              </li>
            </ul>
          </li>
        </ul>

        <h3>⚡ Spells, Interceptions &amp; The Stack</h3>
        <ul>
          <li>
            <strong>Sorcery Speed:</strong> Can only be played during your own Action Phase when The Stack is empty
            (Shumi summons, Crystals, and Sorcery spells).
          </li>
          <li>
            <strong>Quickcast Speed:</strong> Can be played anytime you have Priority, including in response to enemy
            actions or attacks on The Stack!
          </li>
          <li>
            <strong>Interception Speed:</strong> Specialized reaction spells (such as <em>Spore-Cloud</em> or{" "}
            <em>Puff-Puff Threat</em>) that can only be cast when their specific trigger condition is currently on The
            Stack (e.g., an enemy Attack or Spell).
          </li>
          <li>
            <strong>Resting Grounds vs. Spirited Away:</strong> Destroyed Shumi and resolved Spells go to the{" "}
            <strong>Resting Grounds</strong> (graveyard). Young Shumi used to Mature—or cards exiled by effects like{" "}
            <em>Lullaby</em> or <em>Bramble Volley</em>—are <strong>Spirited Away</strong>.
          </li>
        </ul>
      </div>
    )
  }
];

function HowToPlayModal({ onClose }) {
  const [activeTab, setActiveTab] = useState(GUIDE_SECTIONS[0].id);
  const currentSection = GUIDE_SECTIONS.find((s) => s.id === activeTab) || GUIDE_SECTIONS[0];

  return (
    <div className="shumi-modal-backdrop htp-backdrop" onClick={onClose}>
      <div className="htp-modal" onClick={(e) => e.stopPropagation()}>
        <div className="htp-header">
          <div>
            <span className="htp-kicker">SHUMI FIELD MANUAL</span>
            <h2>📖 How to Play Guide</h2>
          </div>
          <button className="sam-close-btn" onClick={onClose} title="Close Guide">
            ✕
          </button>
        </div>

        <div className="htp-tabs">
          {GUIDE_SECTIONS.map((sec) => (
            <button
              key={sec.id}
              className={`htp-tab-btn ${activeTab === sec.id ? "active" : ""}`}
              onClick={() => setActiveTab(sec.id)}
            >
              <span>{sec.icon}</span> {sec.title}
            </button>
          ))}
        </div>

        <div className="htp-content-area">{currentSection.content}</div>

        <div className="htp-footer">
          <div className="htp-nav-Step">
            {GUIDE_SECTIONS.findIndex((s) => s.id === activeTab) > 0 && (
              <button
                className="shumi-btn secondary small"
                onClick={() => {
                  const idx = GUIDE_SECTIONS.findIndex((s) => s.id === activeTab);
                  if (idx > 0) setActiveTab(GUIDE_SECTIONS[idx - 1].id);
                }}
              >
                ← Previous Section
              </button>
            )}
            {GUIDE_SECTIONS.findIndex((s) => s.id === activeTab) < GUIDE_SECTIONS.length - 1 && (
              <button
                className="shumi-btn primary small"
                onClick={() => {
                  const idx = GUIDE_SECTIONS.findIndex((s) => s.id === activeTab);
                  if (idx < GUIDE_SECTIONS.length - 1) setActiveTab(GUIDE_SECTIONS[idx + 1].id);
                }}
              >
                Next Section →
              </button>
            )}
          </div>
          <button className="shumi-btn secondary small" onClick={onClose}>
            Done Reading
          </button>
        </div>
      </div>
    </div>
  );
}

export default HowToPlayModal;
