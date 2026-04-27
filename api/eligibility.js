// Karnataka Policy Eligibility Engine — API
// Deploy on Vercel: save as api/eligibility.js in a Vercel project
// Endpoint: POST /api/eligibility
// Body: { entity, sector, location, age, employees, revenue }
// Returns: { eligible_policies, grand_total, summary }

const POLICIES = [
  {
    id: "it2025", name: "Karnataka IT Policy 2025-2030", icon: "💻",
    desc: "IT/ITeS, Deep-Tech, AI, Cybersecurity, Quantum, Cloud",
    check: (p) => ["startup_lt5","startup_5_10","msme","large","gcc","itpark"].includes(p.entity) && ["it_ites","ai_ml","cybersecurity","saas","deeptech","cloud","other"].includes(p.sector),
    benefits: (p) => {
      const bb = p.location === "beyond_blr";
      const e = p.employees || 0;
      let items = [], total = 0;
      if (bb) {
        const epf = Math.min(e * 3000 * 24, 10000000);
        items.push({ name: "EPF reimbursement", detail: `₹3,000/employee/month × ${e} × 24 months`, value: epf, tag: "Beyond Bangalore only" });
        total += epf;
        items.push({ name: "Talent relocation support", detail: "50% of costs, ₹50K/employee cap", value: Math.min(e * 50000, 5000000), tag: "Beyond Bangalore only" });
        total += Math.min(e * 50000, 5000000);
        items.push({ name: "Recruitment assistance", detail: "10-50% of costs, up to ₹7 Cr", value: Math.min(e * 15000, 70000000), tag: "Beyond Bangalore only" });
        total += Math.min(e * 15000, 70000000);
        items.push({ name: "100% electricity duty exemption", detail: "5 years", value: null, tag: "Beyond Bangalore only" });
        items.push({ name: "Broadband subsidy", detail: "25%, ₹6L/year × 3 years", value: 1800000, tag: "Beyond Bangalore only" });
        total += 1800000;
      }
      items.push({ name: "R&D Innovation Grant", detail: "40% of R&D spend, up to ₹5 Cr", value: null, tag: "All Karnataka" });
      const rental = bb ? 5000000 : 1000000;
      items.push({ name: "Rental assistance", detail: `50% Year 1, up to ₹${bb?"50L":"10L"}`, value: rental, tag: "All Karnataka" });
      total += rental;
      items.push({ name: "Internship stipend", detail: "50%, ₹5K/mo, 3 months, up to 100 interns", value: Math.min(100,e)*5000*3, tag: "All Karnataka" });
      total += Math.min(100,e)*5000*3;
      items.push({ name: "Patent filing support", detail: "50% — ₹3L domestic, ₹10L international", value: 300000, tag: "All Karnataka" });
      total += 300000;
      items.push({ name: "Quality certification", detail: `50%, up to ₹${bb?"8":"6"}L, max 3 claims`, value: bb?2400000:1800000, tag: "All Karnataka" });
      total += bb ? 2400000 : 1800000;
      return { items, total };
    }
  },
  {
    id: "startup", name: "Karnataka Startup Policy 2022-2027", icon: "🚀",
    desc: "Early-stage ventures, sector-agnostic",
    check: (p) => ["startup_lt5","startup_5_10"].includes(p.entity) && p.revenue < 10000,
    benefits: (p) => {
      const bb = p.location === "beyond_blr";
      let items = [], total = 0;
      items.push({ name: "₹100 Cr VC Fund access", detail: "Indicative, equity, depends on eligibility & approval", value: null, tag: "All Karnataka" });
      items.push({ name: "₹200 Cr Seed Fund", detail: "Pre-seed / seed, depends on eligibility & approval", value: null, tag: "All Karnataka" });
      items.push({ name: "₹6,000/month stipend", detail: "Only for select founders (eligibility applies)", value: null, tag: "All Karnataka" });
      return { items, total };
    }
  },
  {
    id: "msme_policy", name: "Karnataka MSME Development Policy 2024", icon: "🛠️",
    desc: "MSME manufacturing/services support",
    check: (p) => p.entity === "msme",
    benefits: (p) => {
      const bb = p.location === "beyond_blr";
      let items = [], total = 0;
      items.push({ name: "Capital subsidy", detail: `15% (+5% special category), cap varies`, value: null, tag: "All Karnataka" });
      items.push({ name: "Stamp duty exemption", detail: "100%", value: null, tag: "All Karnataka" });
      items.push({ name: "Interest subsidy", detail: `5% up to ₹3L/year`, value: 300000, tag: "All Karnataka" });
      total += 300000;
      items.push({ name: "Skill upgradation", detail: "50% reimbursement", value: null, tag: "All Karnataka" });
      return { items, total };
    }
  },
  {
    id: "semicon", name: "Karnataka Semiconductor Policy", icon: "🛪",
    desc: "Chip design / fab ecosystem",
    check: (p) => ["ai_ml","cloud","cybersecurity","saas","deeptech","semiconductor"].includes(p.sector),
    benefits: (p) => {
      const bb = p.location === "beyond_blr";
      let items = [], total = 0;
      items.push({ name: "Design-linked incentives", detail: "Based on approved proposal", value: null, tag: "All Karnataka" });
      items.push({ name: "Infra support", detail: "Depends on location/cluster", value: null, tag: bb?"Beyond Bangalore only":"Bangalore" });
      return { items, total };
    }
  },
  {
    id: "it_park", name: "IT Park / Dedicated Facility incentives", icon: "📂",
    desc: "Applicable if operating in an IT park/approved facility",
    check: (p) => p.entity === "itpark",
    benefits: (p) => {
      let items = [], total = 0;
      items.push({ name: "Stamp duty & electricity duty incentives", detail: "Tangible & intangible set-up benefits", value: null, tag: "All Karnataka" });
      return { items, total };
    }
  },
];

function formatMoneyINR(amount) {
  if (typeof amount !== "number") return "TBD";
  const formatter = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
  return formatter.format(amount);
}

function createWhatsappCard(policy) {
  const benefitsLines = policy.benefits.items
    .slice(0, 7)
    .map((it) => {
      const val = it.value == null ? "TBD" : formatMoneyINR(it.value);
      const tag = it.tag ? ` (${it.tag})` : "";
      return `- ${it.name}: ${val}${tag}`;
    })
    .join("\n");

  const totalLine = policy.benefits.total ? 
    `\nEstimated total: ${formatMoneyINR(policy.benefits.total)}` : "";

  return `${policy.icon} *${policy.name}*\n${policy.desc}\n\nEligibility summary:\n${benefitsLines}${totalLine}`;
}

function buildSummary(policies, grandTotal) {
  const titles = policies.slice(0, 5).map(p => p.name).join("\n");
  const more = policies.length > 5 ? "\n+ more" : "";
  return `You may be eligible for ${policies.length} policies.\n\nTop matches:\n${titles}${more}\n\nEstimated grand total: ${formatMoneyINR(grandTotal)} (indicative)`;
}

function eligibilityEngine(input) {
  const normalized = {
    entity: input.entity,
    sector: input.sector,
    location: input.location,
    age: Number(input.age || 0),
    employees: Number(input.employees || 0),
    revenue: Number(input.revenue || 0),
  };

  const eligible = POLICIES.map(p => {
    try {
      return p.check(normalized) ? {
        id: p.id,
        name: p.name,
        icon: p.icon,
        desc: p.desc,
        benefits: p.benefits(normalized),
      } : null;
    } catch (e) {
      return null;
    }
  }).filter(Boolean);

  const grandTotal = eligible.reduce((sum, p) => sum + (p.benefits.total || 0), 0);

  return {
    eligible_policies: eligible,
    grand_total: grandTotal,
    summary: buildSummary(eligible, grandTotal),
  };
}

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  try {
    const result = eligibilityEngine(req.body);

    const whatsapp_card = result.eligible_policies
      .slice(0, 5)
      .map(createWhatsappCard)
      .join("\n\n");

    res.status(200).json({
      ...result,
      grand_total_formatted: formatMoneyINR(result.grand_total),
      eligible_policy_count: result.eligible_policies.length,
      whatsapp_card,
    });
  } catch (e) {
    res.status(500).json({ error: "Eligibility engine crashed", details: String(e) });
  }
}
