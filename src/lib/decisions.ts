/**
 * Decision system - life-stage-aware story.
 *
 * Real forks depend on WHO you are. A single 26-year-old, a newly-married
 * couple, and a family of five face entirely different decisions. So the deck
 * is chosen by life stage; each arc still rises settling -> shock -> opportunity
 * -> life-cost, but the dilemmas are the ones that household actually faces.
 *
 * Options trade money against time, comfort, security, or values. No option is
 * "correct" - the synthesis later reflects the player's stated values back.
 */

import type { LifeProfile } from "./profile";
import type { Persona } from "./persona";

export type DecisionEffect = {
  oneTime?: number;
  monthlySpendDelta?: number;
  monthlyIncomeDelta?: number;
  savingsRateDelta?: number;
  installment?: { monthly: number; months: number };
};

export type DecisionOption = {
  id: string;
  label: string;
  blurb: string;
  tag:
    | "money"
    | "comfort"
    | "time"
    | "security"
    | "risk"
    | "family"
    | "growth"
    | "lifestyle"
    | "freedom";
  effect: DecisionEffect;
  consequence: string;
};

export type Decision = {
  id: string;
  month: number;
  chapter: "settling" | "shock" | "opportunity" | "lifecost";
  title: string;
  setup: (p: LifeProfile, persona: Persona) => string;
  options: (p: LifeProfile, persona: Persona) => DecisionOption[];
};

const money = (n: number, cur: string) =>
  n.toLocaleString(cur === "INR" ? "en-IN" : "en-US", {
    style: "currency",
    currency: cur,
    maximumFractionDigits: 0,
  });
const costScale = (cur: string) =>
  cur === "CAD" ? 1.35 : cur === "INR" ? 85 : 1;

/** Childcare fork amounts — INR uses metro-realistic figures, not USD×85. */
function familyChildcareCosts(
  currency: string,
  kids: number,
  partnerEarns: boolean,
) {
  const k = Math.max(1, kids);
  if (currency === "INR") {
    return {
      daycare: k * 16000,
      nanny: 28000 + (k - 1) * 6000,
      stayHome: partnerEarns ? 42000 : 0,
    };
  }
  const scale = costScale(currency);
  return {
    daycare: Math.round(k * 1100 * scale),
    nanny: Math.round((1900 + (k - 1) * 300) * scale),
    stayHome: partnerEarns ? Math.round(2600 * scale) : 0,
  };
}
const transitFriendly = (city: string) =>
  [
    "New York",
    "San Francisco",
    "Toronto",
    "Montreal",
    "Vancouver",
    "Chicago",
    "Seattle",
    "Bangalore",
    "Mumbai",
    "Hyderabad",
    "Pune",
    "Delhi",
    "Chennai",
  ].includes(city);

// ============================================================
// SOLO ARC
// ============================================================
const SOLO: Decision[] = [
  {
    id: "solo-housing",
    month: 2,
    chapter: "settling",
    title: "Where you'll actually live",
    setup: (p) =>
      `You've landed in ${p.city}. Your own place runs about ${money(p.rentMonthly, p.currency)}/mo. How do you start?`,
    options: (p) => {
      const solo = p.rentMonthly,
        room = Math.round(solo * 0.62),
        nicer = Math.round(solo * 1.25);
      return [
        {
          id: "roommate",
          label: "Get a roommate",
          blurb: `Split it - ~${money(room, p.currency)}/mo. Less privacy, more cushion.`,
          tag: "money",
          effect: { monthlySpendDelta: room - solo },
          consequence: `You save ${money(solo - room, p.currency)}/mo sharing space.`,
        },
        {
          id: "solo",
          label: "Your own place",
          blurb: `The standard ${money(solo, p.currency)}/mo. Your space.`,
          tag: "comfort",
          effect: {},
          consequence: `Your own place at ${money(solo, p.currency)}/mo.`,
        },
        {
          id: "nicer",
          label: "Splurge a little",
          blurb: `A nicer spot, ${money(nicer, p.currency)}/mo.`,
          tag: "comfort",
          effect: { monthlySpendDelta: nicer - solo },
          consequence: `Comfort costs +${money(nicer - solo, p.currency)}/mo.`,
        },
      ];
    },
  },
  {
    id: "solo-furnish",
    month: 5,
    chapter: "settling",
    title: "An empty apartment",
    setup: () =>
      `The place is bare. A mattress on the floor works - but it doesn't feel like home.`,
    options: (p) => {
      const full = Math.round(2500 * costScale(p.currency)),
        basic = Math.round(800 * costScale(p.currency));
      return [
        {
          id: "basic",
          label: "Just the basics",
          blurb: `${money(basic, p.currency)}. Function over feeling.`,
          tag: "money",
          effect: { oneTime: -basic },
          consequence: `${money(basic, p.currency)} spent, kept lean.`,
        },
        {
          id: "home",
          label: "Make it a home",
          blurb: `${money(full, p.currency)}. You'll love being here.`,
          tag: "comfort",
          effect: { oneTime: -full },
          consequence: `${money(full, p.currency)} gone, but it's yours.`,
        },
        {
          id: "thrift",
          label: "Hunt secondhand",
          blurb: `${money(Math.round(basic * 0.6), p.currency)} + some weekends.`,
          tag: "money",
          effect: { oneTime: -Math.round(basic * 0.6) },
          consequence: `Furnished for ${money(Math.round(basic * 0.6), p.currency)}.`,
        },
      ];
    },
  },
  {
    id: "solo-car",
    month: 10,
    chapter: "shock",
    title: "Your car just died",
    setup: (p) =>
      transitFriendly(p.city)
        ? `Your car gave out. In ${p.city} you could go car-free - but it reshapes your days.`
        : `Your car gave out, and ${p.city} is hard to live in without one.`,
    options: (p) => carOptions(p),
  },
  {
    id: "solo-opp",
    month: 17,
    chapter: "opportunity",
    title: "A door opens",
    setup: () =>
      `A year in, things click. Your manager offers a raise for more responsibility - and a friend pitches a side project that could pay, or flop.`,
    options: (p) => {
      const raise = Math.round(380 * costScale(p.currency)),
        side = Math.round(550 * costScale(p.currency));
      return [
        {
          id: "raise",
          label: "Take the raise, more hours",
          blurb: `+${money(raise, p.currency)}/mo, longer weeks.`,
          tag: "security",
          effect: { monthlyIncomeDelta: raise },
          consequence: `Income +${money(raise, p.currency)}/mo; calendar fuller.`,
        },
        {
          id: "side",
          label: "Try the side project",
          blurb: `Maybe +${money(side, p.currency)}/mo. Your evenings are the bet.`,
          tag: "risk",
          effect: { monthlyIncomeDelta: Math.round(side * 0.7) },
          consequence: `Side project paying ${money(Math.round(side * 0.7), p.currency)}/mo - for now.`,
        },
        {
          id: "protect",
          label: "Keep your life as-is",
          blurb: `Say no to both. Your time stays yours.`,
          tag: "time",
          effect: {},
          consequence: `You protected your time over money.`,
        },
      ];
    },
  },
  {
    id: "solo-creep",
    month: 22,
    chapter: "opportunity",
    title: "You can afford more now",
    setup: () =>
      `With breathing room, temptation creeps in - nicer dinners, the gym, upgrades that quietly become your normal.`,
    options: (p) => creepOptions(p),
  },
  {
    id: "solo-life",
    month: 28,
    chapter: "lifecost",
    title: "Life happens",
    setup: () =>
      `A close friend's wedding out of town, and family needs help with an unexpected cost - the unglamorous stuff that drains accounts.`,
    options: (p) => lifeCostOptions(p),
  },
];

// ============================================================
// COUPLE ARC
// ============================================================
const COUPLE: Decision[] = [
  {
    id: "couple-housing",
    month: 2,
    chapter: "settling",
    title: "A place for two",
    setup: (p) =>
      `You and your partner have arrived in ${p.city}. A one-bedroom runs ~${money(p.rentMonthly, p.currency)}/mo. How much space do you take?`,
    options: (p) => {
      const one = p.rentMonthly,
        studio = Math.round(one * 0.8),
        two = Math.round(one * 1.35);
      return [
        {
          id: "cozy",
          label: "Keep it cozy",
          blurb: `A smaller place, ~${money(studio, p.currency)}/mo. Tight but cheap.`,
          tag: "money",
          effect: { monthlySpendDelta: studio - one },
          consequence: `Saving ${money(one - studio, p.currency)}/mo, close quarters.`,
        },
        {
          id: "onebed",
          label: "A solid one-bedroom",
          blurb: `${money(one, p.currency)}/mo. Room to breathe.`,
          tag: "comfort",
          effect: {},
          consequence: `A comfortable place at ${money(one, p.currency)}/mo.`,
        },
        {
          id: "twobed",
          label: "Two-bed (room to grow)",
          blurb: `${money(two, p.currency)}/mo. An office, or one day a nursery.`,
          tag: "family",
          effect: { monthlySpendDelta: two - one },
          consequence: `Room to grow for +${money(two - one, p.currency)}/mo.`,
        },
      ];
    },
  },
  {
    id: "couple-finances",
    month: 5,
    chapter: "settling",
    title: "Combining your money",
    setup: (p, per) =>
      per.partnerEarns
        ? `You both earn now. How do you handle money as a couple?`
        : `Your partner isn't working yet. You're the single income - for now.`,
    options: (p, per) => {
      if (!per.partnerEarns) {
        const job = Math.round(2600 * costScale(p.currency));
        return [
          {
            id: "stay-single-income",
            label: "Stay one income for now",
            blurb: `Partner takes time before working. Tighter, simpler.`,
            tag: "family",
            effect: {},
            consequence: `Living on one income - deliberate and tight.`,
          },
          {
            id: "partner-works",
            label: "Partner takes a job",
            blurb: `+~${money(job, p.currency)}/mo, but less flexibility at home.`,
            tag: "growth",
            effect: { monthlyIncomeDelta: job },
            consequence: `Second income of ${money(job, p.currency)}/mo changes everything.`,
          },
        ];
      }
      return [
        {
          id: "pool",
          label: "Pool everything, save hard",
          blurb: `One pot, aggressive saving. Aligned and lean.`,
          tag: "growth",
          effect: { savingsRateDelta: 0.08 },
          consequence: `Pooled finances, saving harder together.`,
        },
        {
          id: "balanced",
          label: "Share costs, enjoy some",
          blurb: `Split essentials, keep some fun money each.`,
          tag: "lifestyle",
          effect: {
            monthlySpendDelta: Math.round(300 * costScale(p.currency)),
          },
          consequence: `A balanced setup - some saving, some living.`,
        },
      ];
    },
  },
  {
    id: "couple-car",
    month: 10,
    chapter: "shock",
    title: "The car gave out",
    setup: (p) =>
      transitFriendly(p.city)
        ? `Your shared car died. In ${p.city} a couple can often manage on transit.`
        : `Your shared car died - and you both rely on it in ${p.city}.`,
    options: (p) => carOptions(p),
  },
  {
    id: "couple-kids",
    month: 18,
    chapter: "opportunity",
    title: "The big question",
    setup: () =>
      `You've talked about it for a while. Do you start trying for a baby now - or wait until you're more settled financially?`,
    options: (p) => {
      const babyOneTime = Math.round(4500 * costScale(p.currency));
      const babyMonthly = Math.round(900 * costScale(p.currency));
      return [
        {
          id: "now",
          label: "Start a family now",
          blurb: `Joy - and real cost. ~${money(babyOneTime, p.currency)} up front, ~${money(babyMonthly, p.currency)}/mo after.`,
          tag: "family",
          effect: {
            oneTime: -babyOneTime,
            monthlySpendDelta: babyMonthly,
            savingsRateDelta: -0.05,
          },
          consequence: `A baby's on the way - life and budget both change.`,
        },
        {
          id: "wait",
          label: "Wait, build the cushion first",
          blurb: `Save aggressively now so you're ready later.`,
          tag: "security",
          effect: { savingsRateDelta: 0.08 },
          consequence: `Waiting, and banking a real cushion first.`,
        },
        {
          id: "unsure",
          label: "Stay open, keep living",
          blurb: `No rush either way. Keep things as they are.`,
          tag: "freedom",
          effect: {},
          consequence: `Keeping options open, no pressure.`,
        },
      ];
    },
  },
  {
    id: "couple-creep",
    month: 23,
    chapter: "opportunity",
    title: "Living well as a couple",
    setup: () =>
      `Two incomes (or one good one) brings room for nicer things - trips, dinners out, a lifestyle that quietly ratchets up.`,
    options: (p) => creepOptions(p),
  },
  {
    id: "couple-life",
    month: 29,
    chapter: "lifecost",
    title: "Family ties",
    setup: () =>
      `A wedding you're both in, plus a parent who needs financial help. The pull of the people you love.`,
    options: (p) => lifeCostOptions(p),
  },
];

// ============================================================
// FAMILY ARC
// ============================================================
const FAMILY: Decision[] = [
  {
    id: "family-housing",
    month: 2,
    chapter: "settling",
    title: "The school-district question",
    setup: (p) =>
      `You're moving the family to ${p.city}. The defining choice: pay up for a good school area, or save on housing further out.`,
    options: (p) => {
      const base = p.rentMonthly,
        good = Math.round(base * 1.4),
        far = Math.round(base * 0.78);
      return [
        {
          id: "school",
          label: "Good school district",
          blurb: `${money(good, p.currency)}/mo. Costs more; sets the kids up.`,
          tag: "family",
          effect: { monthlySpendDelta: good - base },
          consequence: `In the good district - +${money(good - base, p.currency)}/mo, worth it to you.`,
        },
        {
          id: "standard",
          label: "A solid middle option",
          blurb: `${money(base, p.currency)}/mo. Decent schools, decent price.`,
          tag: "comfort",
          effect: {},
          consequence: `A balanced neighborhood at ${money(base, p.currency)}/mo.`,
        },
        {
          id: "far",
          label: "Save, commute further",
          blurb: `${money(far, p.currency)}/mo out of town. More driving, more saved.`,
          tag: "money",
          effect: { monthlySpendDelta: far - base, savingsRateDelta: 0.03 },
          consequence: `Further out, saving ${money(base - far, p.currency)}/mo - longer commutes.`,
        },
      ];
    },
  },
  {
    id: "family-childcare",
    month: 5,
    chapter: "settling",
    title: "Who watches the kids",
    setup: (p, per) =>
      `With ${per.kids > 1 ? `${per.kids} kids` : "a child"} and work, childcare isn't optional - it's one of your biggest costs.`,
    options: (p, per) => {
      const { daycare, nanny, stayHome } = familyChildcareCosts(
        p.currency,
        per.kids,
        per.partnerEarns,
      );
      const opts: DecisionOption[] = [
        {
          id: "daycare",
          label: "Daycare",
          blurb: `~${money(daycare, p.currency)}/mo. The common path.`,
          tag: "money",
          effect: { monthlySpendDelta: daycare },
          consequence: `Daycare locked in at ${money(daycare, p.currency)}/mo.`,
        },
        {
          id: "nanny",
          label: "A nanny",
          blurb: `~${money(nanny, p.currency)}/mo. Pricier, more flexible.`,
          tag: "comfort",
          effect: { monthlySpendDelta: nanny },
          consequence: `A nanny - ${money(nanny, p.currency)}/mo, but easier days.`,
        },
      ];
      if (per.partnerEarns) {
        opts.push({
          id: "stayhome",
          label: "A parent stays home",
          blurb: `No childcare bill, but lose ~${money(stayHome, p.currency)}/mo of income.`,
          tag: "family",
          effect: { monthlyIncomeDelta: -stayHome },
          consequence: `One parent home - income down ${money(stayHome, p.currency)}/mo, no daycare.`,
        });
      }
      return opts;
    },
  },
  {
    id: "family-kidcost",
    month: 11,
    chapter: "shock",
    title: "Something with the kids",
    setup: () =>
      `A child needs braces, or a medical thing comes up, or the car you haul everyone in dies. The stuff that doesn't wait.`,
    options: (p) => {
      const cur = p.currency;
      const big = Math.round(5500 * costScale(cur)),
        fin = Math.round(480 * costScale(cur));
      return [
        {
          id: "pay",
          label: "Pay it now, in full",
          blurb: `${money(big, cur)} from savings. Done, but the cushion thins.`,
          tag: "security",
          effect: { oneTime: -big },
          consequence: `${money(big, cur)} handled up front.`,
        },
        {
          id: "finance",
          label: "Spread it over time",
          blurb: `${money(fin, cur)}/mo for a year. Easier now, lingers.`,
          tag: "money",
          effect: { installment: { monthly: fin, months: 12 } },
          consequence: `Spread out at ${money(fin, cur)}/mo for a year.`,
        },
      ];
    },
  },
  {
    id: "family-space",
    month: 18,
    chapter: "opportunity",
    title: "Running out of room",
    setup: () =>
      `The kids are growing and the place feels small. Upgrade to more space, or make what you have work and bank the difference?`,
    options: (p) => {
      const up = Math.round(p.rentMonthly * 0.3);
      return [
        {
          id: "bigger",
          label: "Get a bigger place",
          blurb: `+${money(up, p.currency)}/mo. Everyone gets room.`,
          tag: "comfort",
          effect: { monthlySpendDelta: up },
          consequence: `More space, +${money(up, p.currency)}/mo.`,
        },
        {
          id: "makework",
          label: "Make it work, save instead",
          blurb: `Stay put, redirect the money to the kids' future.`,
          tag: "growth",
          effect: { savingsRateDelta: 0.06 },
          consequence: `Staying put, saving harder for their future.`,
        },
        {
          id: "secondcar",
          label: "Skip it - but a 2nd car",
          blurb: `Family logistics need it. +${money(Math.round(350 * costScale(p.currency)), p.currency)}/mo.`,
          tag: "family",
          effect: {
            installment: {
              monthly: Math.round(350 * costScale(p.currency)),
              months: 36,
            },
          },
          consequence: `A second car for ${money(Math.round(350 * costScale(p.currency)), p.currency)}/mo.`,
        },
      ];
    },
  },
  {
    id: "family-college",
    month: 24,
    chapter: "opportunity",
    title: "Their future vs your now",
    setup: () =>
      `You could start serious college savings, lock in family experiences while the kids are young, or ease the monthly squeeze.`,
    options: (p) => {
      const save = Math.round(500 * costScale(p.currency));
      return [
        {
          id: "college",
          label: "Start college savings",
          blurb: `${money(save, p.currency)}/mo set aside. Future-focused.`,
          tag: "growth",
          effect: { savingsRateDelta: 0.06 },
          consequence: `Building their college fund.`,
        },
        {
          id: "experiences",
          label: "Make memories now",
          blurb: `Trips and time while they're little. ${money(save, p.currency)}/mo.`,
          tag: "family",
          effect: { monthlySpendDelta: save },
          consequence: `Choosing memories now over the spreadsheet.`,
        },
        {
          id: "ease",
          label: "Just ease the squeeze",
          blurb: `Keep the monthly pressure low. No new commitments.`,
          tag: "security",
          effect: {},
          consequence: `Keeping breathing room in the budget.`,
        },
      ];
    },
  },
  {
    id: "family-life",
    month: 30,
    chapter: "lifecost",
    title: "The sandwich",
    setup: () =>
      `An aging parent needs help, and a family trip everyone's counting on. You're pulled in both directions at once.`,
    options: (p) => lifeCostOptions(p),
  },
];

// ---- Shared option builders ----
function carOptions(p: LifeProfile): DecisionOption[] {
  const cur = p.currency,
    cheap = Math.round(5000 * costScale(cur)),
    fin = Math.round(420 * costScale(cur));
  const opts: DecisionOption[] = [
    {
      id: "beater",
      label: "Cheap used car",
      blurb: `${money(cheap, cur)} cash - the last of your cushion.`,
      tag: "money",
      effect: { oneTime: -cheap },
      consequence: `${money(cheap, cur)} out; runway thinner.`,
    },
    {
      id: "finance",
      label: "Finance a reliable one",
      blurb: `${money(fin, cur)}/mo for 4 years.`,
      tag: "security",
      effect: { installment: { monthly: fin, months: 48 } },
      consequence: `New ${money(fin, cur)}/mo payment now.`,
    },
  ];
  if (transitFriendly(p.city))
    opts.push({
      id: "carfree",
      label: "Go car-free",
      blurb: `Transit + rideshare. Saves money, costs time.`,
      tag: "time",
      effect: { monthlySpendDelta: -Math.round(p.transportMonthly * 0.4) },
      consequence: `No car payment - slower mornings.`,
    });
  else
    opts.push({
      id: "stretch",
      label: "Patch the old one",
      blurb: `${money(Math.round(cheap * 0.4), cur)} and hope.`,
      tag: "risk",
      effect: { oneTime: -Math.round(cheap * 0.4) },
      consequence: `${money(Math.round(cheap * 0.4), cur)} for an uncertain fix.`,
    });
  return opts;
}
function creepOptions(p: LifeProfile): DecisionOption[] {
  const cur = p.currency,
    creep = Math.round(400 * costScale(cur));
  return [
    {
      id: "enjoy",
      label: "Enjoy it - you earned it",
      blurb: `+${money(creep, cur)}/mo on living well.`,
      tag: "comfort",
      effect: { monthlySpendDelta: creep, savingsRateDelta: -0.05 },
      consequence: `Life +${money(creep, cur)}/mo nicer; saving slowed.`,
    },
    {
      id: "balance",
      label: "A little of both",
      blurb: `Upgrade some, bank the rest.`,
      tag: "money",
      effect: { monthlySpendDelta: Math.round(creep * 0.4) },
      consequence: `Modestly nicer, savings mostly intact.`,
    },
    {
      id: "hold",
      label: "Hold the line",
      blurb: `Let the surplus pile up.`,
      tag: "growth",
      effect: { savingsRateDelta: 0.05 },
      consequence: `Held steady, saving even harder.`,
    },
  ];
}
function lifeCostOptions(p: LifeProfile): DecisionOption[] {
  const cur = p.currency,
    all = Math.round(2400 * costScale(cur)),
    some = Math.round(1100 * costScale(cur));
  return [
    {
      id: "show-up",
      label: "Show up for everyone",
      blurb: `${money(all, cur)}. Money you mostly won't regret.`,
      tag: "family",
      effect: { oneTime: -all },
      consequence: `${money(all, cur)} on the people who matter.`,
    },
    {
      id: "partial",
      label: "Do what you can",
      blurb: `${money(some, cur)}. Help where it counts.`,
      tag: "money",
      effect: { oneTime: -some },
      consequence: `Helped where it mattered: ${money(some, cur)}.`,
    },
    {
      id: "decline",
      label: "Sit this one out",
      blurb: `Protect the cushion. Responsible, and it stings.`,
      tag: "security",
      effect: {},
      consequence: `Savings intact - a hard call.`,
    },
  ];
}

export function deckFor(stage: Persona["stage"]): Decision[] {
  return stage === "family" ? FAMILY : stage === "couple" ? COUPLE : SOLO;
}

export const TAG_LABEL: Record<string, string> = {
  money: "Saves money",
  comfort: "Comfort",
  time: "Protects time",
  security: "Security",
  risk: "Risk",
  family: "Family",
  lifestyle: "Lifestyle",
  freedom: "Freedom",
};
export const TAG_COLOR: Record<string, string> = {
  money: "#2f7d77",
  comfort: "#c77b30",
  time: "#5a6e8c",
  security: "#4a7c59",
  risk: "#b0593f",
  family: "#9a5ea1",
  lifestyle: "#c77b30",
  freedom: "#5a6e8c",
};
