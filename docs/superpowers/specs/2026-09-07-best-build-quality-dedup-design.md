# Best-build quality deduplication design

## Goal

Reduce the best-build search space when different physical equipment candidates produce the same final stat structure. Keep only the candidate with the highest existing average-quality percentage without changing the three transmutation modes or final graduation-rate scoring.

## Equivalence rule

Candidates are compared only within the same best-build slot after class, flow-type, weapon-type, Chengyin, and transmutation variants have been generated.

Two candidates have the same final stat structure when all of the following match:

- slot and weapon type;
- main-stat type;
- unordered multiset of sub-stat types.

Stat values, equipment IDs, names, transmutation source metadata, and sub-stat order do not affect the equivalence key. Dingyin does not affect the key because best-build calculation replaces it with the same full Dingyin value for the slot.

## Retention rule

For each equivalent group, calculate every candidate's quality with the existing `GradModal.getEquipAveragePercent()` method and keep the highest-quality candidate.

Use these deterministic tie-breakers when quality is equal:

1. Prefer a candidate without a transmutation change.
2. Prefer a candidate that does not use a synthetic `_chengyin` version.
3. Preserve original candidate order.

The first tie-breaker avoids recommending an unnecessary transmutation when the final quality is identical. The second avoids recommending an unnecessary Chengyin operation.

## Placement in the search pipeline

Deduplicate each slot's completed candidate list after original, Chengyin, and transmutation variants have been added, and before candidate compilation, theoretical combination counting, stat-count reachability checks, and DFS traversal.

This placement ensures:

- transmutation variants still use each source equipment's eligibility, active slot, and excluded targets;
- a lower-quality source can still contribute a unique final stat structure;
- all later pruning and progress totals use the reduced candidate lists;
- physical-equipment mutual exclusion remains as a separate safety check.

## Non-goals

- Do not merge candidates with different final stat types.
- Do not use graduation rate for candidate-level deduplication.
- Do not modify equipment-library records.
- Do not change saved transmutation state or scheme overlays.
- Do not change Top20 base-build deduplication.
- Do not change the semantics of `none`, `active`, or `plan` modes.

## Verification

Add focused behavioral coverage for:

- identical final stat structures keep the higher average-quality candidate;
- sub-stat order does not prevent grouping;
- different main-stat or sub-stat structures remain separate;
- equal quality prefers an untransmuted candidate;
- an equal-quality real candidate is preferred over a synthetic Chengyin candidate;
- variants with unique final stat structures remain searchable;
- physical-equipment mutual exclusion and Top20 deduplication continue to work.

Run the Tiaolv customization guard and the relevant JavaScript tests. Before publishing, update the modified JavaScript version tag and the required site update time fields.
