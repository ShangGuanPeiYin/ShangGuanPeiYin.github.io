# Equipment Card Transmutation Target Hint Design

## Goal

Show only checked and usable transmutation target stats in the highlighted sub-stat hint on an equipment card.

## Scope

Update `buildZhuanlvTargetHint` in `static/tools/yysls-tiaolv/assets/js/local-customizations.js`.

The hint will continue to exclude targets that are unavailable for the equipment slot or would duplicate an existing sub-stat. It will also exclude every target stored in the equipment's `excludedTargets` list. When no target remains, the card will not render a parenthetical target hint.

## Data Flow

The existing active transmutation status contains `excludedTargets`, populated from unchecked target checkboxes when the equipment editor is saved. The card renderer already receives that status. It will pass the status to the hint builder, which filters its candidate list before abbreviating and rendering it.

## Non-Goals

- Do not change target checkbox rendering or saving.
- Do not change the best-build or transmutation-advice candidate search.
- Do not alter the transmutation status schema or migration behavior.

## Verification

For an active, eligible 110-level equipment item, unchecking a valid target and saving must remove it from the card hint. Checked valid targets remain visible. Targets blocked by slot rules or duplicate sub-stats remain absent. If every target is unavailable or unchecked, no hint is shown.
