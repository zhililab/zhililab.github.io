# Builder Projects Page Design QA

## Evidence

- Source visual truth: `/Users/lizhi/.codex/generated_images/019e8bf0-707f-79b3-88e5-3decc315cfed/exec-4b8262d2-a6af-44e3-90f4-fd71b787213b.png`
- Source dimensions: 863 x 1822 px; editorial concept board, no browser chrome.
- Desktop implementation: `/Users/lizhi/code/ContentOps/zhililab-blog/.worktrees/site-optimization/output/playwright/task-5/desktop-1440x1100-full.png`
- Desktop dimensions: 1440 x 3686 px; CSS viewport 1440 x 1100; device scale factor 1.
- Mobile implementation: `/Users/lizhi/code/ContentOps/zhililab-blog/.worktrees/site-optimization/output/playwright/task-5/mobile-390x844-full.png`
- Mobile dimensions: 390 x 4625 px; CSS viewport 390 x 844; device scale factor 1.
- Focused comparison: `/Users/lizhi/code/ContentOps/zhililab-blog/.worktrees/site-optimization/output/playwright/task-5/qa-focus-comparison.png`
- State: dark Projects route, DevOps first slide active, mobile navigation closed.
- Density normalization: the concept board and desktop capture were proportionally resized into equal-width comparison panels; no source pixels were used as production assets.

## Full-View Comparison

The implementation keeps the approved tall editorial structure, near-black surface, thin dividers, cyan build markers, amber status text, and four evidence-led project rows. Desktop rows preserve the specified 36/64 narrative/media split with every screenshot on the right. Mobile keeps each complete narrative before its media with no horizontal overflow or overlap.

The original Fluid 60vh banner was a P1 mismatch because it displaced the first screen and caused the mobile navigation to overlap the Updated line. The route now hides that banner, reserves a compact 64px desktop or 56px mobile header, and uses an opaque near-black navbar. Post-fix captures show the overlap is gone.

## Focused Comparison

The focused source/implementation comparison covers the introduction and first two Builds, where layout fidelity and screenshot legibility are easiest to judge. The DevOps media remains a single contained 16:9 viewport, the first slide is visible without JavaScript, and controls do not resize the frame. Chinese narrative copy is readable and the real product capture remains sharp at its rendered size.

## Fidelity Surfaces

- Fonts and typography: hierarchy, 15-16px narrative copy, weights, line height, zero/positive letter spacing, wrapping, and mobile sizing are clear. The implementation retains the site's existing Fluid font stack, an acceptable product constraint.
- Spacing and layout rhythm: the 36/64 grid, 48px desktop gap, section dividers, stable 16:9 media, and mobile single-column flow match the approved structure. No content or controls overlap.
- Colors and tokens: near-black background, off-white text, muted gray evidence copy, cyan identifiers/focus, and amber status labels match the concept direction. No decorative gradient or orb was introduced.
- Image quality and asset fidelity: all five media sources are real project or repository captures. Desktop assets remain between 1280 and 1600px wide, mobile variants are 960px, and no low-resolution asset was enlarged. `object-fit: contain` prevents cropping.
- Copy and content: all four projects include 动机、方法、结果、当前边界, with reviewed links and no unsupported usage, revenue, or improvement claims.

## Interaction And Accessibility

- Previous/next buttons, dots, ArrowLeft, ArrowRight, Home, End, and horizontal swipe each switch exactly one DevOps slide.
- Reduced-motion mode keeps slide changes immediate.
- Focus-visible outlines are present, control hit targets are at least 40px, and the first image remains available without JavaScript.
- Browser console check after interactions: 0 errors and 0 warnings.

## Findings

- P0: none.
- P1: none after removing the route banner and navigation overlap.
- P2: none.
- P3: the implementation intentionally retains the site's Chinese Fluid navigation labels, while the concept board uses compact English labels. This preserves the existing product navigation and does not affect layout or use.

## Comparison History

1. Initial capture: blocked by the unrelated 60vh Fluid banner and mobile navigation overlap.
2. Fix: added Projects-only banner hiding, compact header heights, opaque navbar, and AST-backed CSS contracts.
3. Post-fix capture: banner absent, Updated line unobstructed, no horizontal overflow, four rows correctly ordered, interactions and console checks passed.

## Implementation Checklist

- [x] Desktop 36/64 story/media layout.
- [x] Mobile narrative-first layout.
- [x] Real high-resolution media with contained fitting.
- [x] Accessible non-autoplay DevOps slideshow.
- [x] Compact Projects-only header with no banner overlap.
- [x] Clean build, full tests, interaction checks, and console inspection.

final result: passed
