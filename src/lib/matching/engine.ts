import {
  Property,
  Requirement,
  MatchType,
  MismatchReason,
} from "@/types";

export interface MatchEvaluationResult {
  isMatch: boolean;
  matchType: MatchType;
  matchScore: number;
  mismatchReasons: MismatchReason[];
}

/**
 * Evaluates whether a property matches a customer requirement.
 * Adheres strictly to Section 12 specifications.
 */
export function evaluatePropertyMatch(
  property: Property,
  requirement: Requirement
): MatchEvaluationResult {
  const mismatchReasons: MismatchReason[] = [];

  // =========================================================================
  // HARD NON-NEGOTIABLE CONSTRAINTS (Never flexible)
  // =========================================================================
  
  // 1. Organization isolation
  if (property.organization_id !== requirement.organization_id) {
    return { isMatch: false, matchType: "near", matchScore: 0, mismatchReasons: [] };
  }

  // 2. Archived or unavailable properties must NEVER match
  if (property.archived_at || property.availability_status !== "available") {
    return { isMatch: false, matchType: "near", matchScore: 0, mismatchReasons: [] };
  }

  // 3. Purpose must match strictly (rent vs sale vs lease)
  if (property.purpose !== requirement.purpose) {
    return { isMatch: false, matchType: "near", matchScore: 0, mismatchReasons: [] };
  }

  // 4. Category must match (residential, commercial, land)
  if (property.category !== requirement.category) {
    return { isMatch: false, matchType: "near", matchScore: 0, mismatchReasons: [] };
  }

  // 5. Rent period must match for rental/lease properties
  if (
    (requirement.purpose === "rent" || requirement.purpose === "lease") &&
    requirement.budget_period &&
    property.rent_period &&
    property.rent_period !== requirement.budget_period
  ) {
    return { isMatch: false, matchType: "near", matchScore: 0, mismatchReasons: [] };
  }

  // =========================================================================
  // CONDITION 1: PROPERTY TYPE
  // =========================================================================
  let typeIsExact = true;
  if (requirement.property_type && property.property_type !== requirement.property_type) {
    if (!requirement.allow_alternate_property_types) {
      // Not allowed to differ
      return { isMatch: false, matchType: "near", matchScore: 0, mismatchReasons: [] };
    }
    typeIsExact = false;
    mismatchReasons.push({
      field: "property_type",
      label: `Alternative property type: ${property.property_type.replace("_", " ")} instead of ${requirement.property_type.replace("_", " ")}`,
      difference: property.property_type,
    });
  }

  // =========================================================================
  // CONDITION 2: LOCATION / SECTORS
  // =========================================================================
  const targetLocations = requirement.locations || [];
  const propertySector = (property.sector || "").toLowerCase().trim();
  const propertyCity = (property.city || "").toLowerCase().trim();

  let locationIsExact = false;
  let matchedPriority = 99;

  if (targetLocations.length === 0) {
    // If requirement has no location criteria, matches by default
    locationIsExact = true;
    matchedPriority = 1;
  } else {
    for (const loc of targetLocations) {
      const locSector = (loc.sector || "").toLowerCase().trim();
      const locCity = (loc.city || "").toLowerCase().trim();

      const cityMatches = !locCity || locCity === propertyCity;
      if (cityMatches && propertySector.includes(locSector) || locSector.includes(propertySector)) {
        locationIsExact = true;
        matchedPriority = Math.min(matchedPriority, loc.priority || 1);
        break;
      }
    }
  }

  if (!locationIsExact) {
    if (!requirement.allow_nearby_locations) {
      // Nearby locations disabled -> rejected
      return { isMatch: false, matchType: "near", matchScore: 0, mismatchReasons: [] };
    }
    // Check if at least the city matches
    const cityMatchesAny = targetLocations.some(
      (loc) => !loc.city || loc.city.toLowerCase().trim() === propertyCity
    );
    if (!cityMatchesAny) {
      return { isMatch: false, matchType: "near", matchScore: 0, mismatchReasons: [] };
    }

    mismatchReasons.push({
      field: "location",
      label: `Property located in ${property.sector}, ${property.city} (nearby location enabled)`,
      difference: property.sector,
    });
  }

  // =========================================================================
  // CONDITION 3: BUDGET / PRICE
  // =========================================================================
  const price = property.price_amount;
  const maxBudget = requirement.max_budget;
  const flexPercent = requirement.budget_flexibility_percent || 0;
  const allowableMaxBudget = maxBudget * (1 + flexPercent / 100);

  let budgetIsExact = true;

  if (price > maxBudget) {
    if (price > allowableMaxBudget) {
      // Over budget even with flexibility
      return { isMatch: false, matchType: "near", matchScore: 0, mismatchReasons: [] };
    }
    budgetIsExact = false;
    const overage = price - maxBudget;
    const pctOver = Math.round((overage / maxBudget) * 100);
    mismatchReasons.push({
      field: "budget",
      label: `Budget exceeds primary cap by ${pctOver}% (within allowed ${flexPercent}% flexibility)`,
      difference: `+₹${overage.toLocaleString("en-IN")}`,
    });
  }

  if (requirement.min_budget && price < requirement.min_budget * 0.7) {
    // Significantly below expected tier
    budgetIsExact = false;
    mismatchReasons.push({
      field: "budget",
      label: "Price is noticeably below the requested minimum budget range",
      difference: `-₹${(requirement.min_budget - price).toLocaleString("en-IN")}`,
    });
  }

  // =========================================================================
  // CONDITION 4: BHK (For residential)
  // =========================================================================
  let bhkIsExact = true;
  if (property.category === "residential" && property.bhk != null) {
    if (requirement.min_bhk != null && property.bhk < requirement.min_bhk) {
      return { isMatch: false, matchType: "near", matchScore: 0, mismatchReasons: [] };
    }
    if (requirement.max_bhk != null && property.bhk > requirement.max_bhk) {
      return { isMatch: false, matchType: "near", matchScore: 0, mismatchReasons: [] };
    }
  }

  // =========================================================================
  // CONDITION 5: FURNISHING
  // =========================================================================
  let furnishingIsExact = true;
  if (
    requirement.preferred_furnishing &&
    property.furnishing_status &&
    property.furnishing_status !== requirement.preferred_furnishing
  ) {
    if (!requirement.allow_alternate_furnishing) {
      return { isMatch: false, matchType: "near", matchScore: 0, mismatchReasons: [] };
    }
    furnishingIsExact = false;
    mismatchReasons.push({
      field: "furnishing",
      label: `Furnishing is ${property.furnishing_status.replace("_", " ")} instead of ${requirement.preferred_furnishing.replace("_", " ")}`,
      difference: property.furnishing_status,
    });
  }

  // =========================================================================
  // CONDITION 6: AREA (sqft)
  // =========================================================================
  const propertyArea =
    property.builtup_area_sqft || property.carpet_area_sqft || property.plot_area_sqft;
  if (propertyArea != null) {
    if (requirement.min_area_sqft != null && propertyArea < requirement.min_area_sqft * 0.9) {
      return { isMatch: false, matchType: "near", matchScore: 0, mismatchReasons: [] };
    }
  }

  // =========================================================================
  // MATCH CLASSIFICATION & SCORING
  // =========================================================================
  const isExact =
    typeIsExact &&
    locationIsExact &&
    budgetIsExact &&
    bhkIsExact &&
    furnishingIsExact &&
    mismatchReasons.length === 0;

  const matchType: MatchType = isExact ? "exact" : "near";

  // Score computation (0 - 100)
  let score = 100;

  // Deductions for near match factors
  if (!locationIsExact) {
    score -= 15;
  } else if (matchedPriority > 1) {
    score -= (matchedPriority - 1) * 3; // Slight penalty for secondary priority location
  }

  if (!budgetIsExact) {
    const overagePct = Math.max(0, ((price - maxBudget) / maxBudget) * 100);
    score -= Math.min(20, Math.round(overagePct * 1.5));
  }

  if (!furnishingIsExact) {
    score -= 10;
  }

  if (!typeIsExact) {
    score -= 12;
  }

  // Bound score
  if (isExact) {
    score = Math.max(90, Math.min(100, score));
  } else {
    score = Math.max(50, Math.min(88, score));
  }

  return {
    isMatch: true,
    matchType,
    matchScore: score,
    mismatchReasons,
  };
}

/**
 * Filter and rank properties for a requirement.
 * Returns sorted list: exact matches first (ranked by score DESC), followed by near matches.
 */
export function matchPropertiesForRequirement(
  properties: Property[],
  requirement: Requirement
): {
  exactMatches: { property: Property; score: number; mismatchReasons: MismatchReason[] }[];
  nearMatches: { property: Property; score: number; mismatchReasons: MismatchReason[] }[];
} {
  const exactMatches: { property: Property; score: number; mismatchReasons: MismatchReason[] }[] =
    [];
  const nearMatches: { property: Property; score: number; mismatchReasons: MismatchReason[] }[] = [];

  for (const prop of properties) {
    const evaluation = evaluatePropertyMatch(prop, requirement);
    if (!evaluation.isMatch) continue;

    if (evaluation.matchType === "exact") {
      exactMatches.push({
        property: prop,
        score: evaluation.matchScore,
        mismatchReasons: evaluation.mismatchReasons,
      });
    } else {
      nearMatches.push({
        property: prop,
        score: evaluation.matchScore,
        mismatchReasons: evaluation.mismatchReasons,
      });
    }
  }

  // Sort exact matches by score DESC, then price ASC
  exactMatches.sort((a, b) => b.score - a.score || a.property.price_amount - b.property.price_amount);

  // Sort near matches by score DESC
  nearMatches.sort((a, b) => b.score - a.score || a.property.price_amount - b.property.price_amount);

  return { exactMatches, nearMatches };
}
