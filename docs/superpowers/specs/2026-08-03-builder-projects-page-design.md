# ZHILILAB Builder Projects Page Design

## Status

Approved by the user on 2026-08-03 after selecting visual direction 3 and two layout refinements.

## Goal

Turn `/projects/` from a short text page into an evidence-first Builder portfolio. The page should show why each public project exists, how it was built, what has been verified, and what remains incomplete.

## Design Reference

The selected direction is the final revision of Studio Casebook:

- tall editorial page rather than a wide dashboard;
- near-black background with off-white text;
- restrained cyan build markers and amber status text;
- thin dividers instead of floating cards;
- one consistent project-row rhythm from top to bottom;
- screenshots and video always on the right;
- project narrative always on the left.

The implementation must preserve the selected direction's proportions rather than copying generated mock text or invented screenshots.

## Content Scope

Show four grounded public projects from the most recent six-month Builder period:

1. DevOps Agent Control Plane
2. Tutorial-to-Template
3. ZHILILAB ContentOps
4. Python Learning Resources

Forks and repositories without enough public evidence are excluded. Claims must come from the public repository metadata, README, local project evidence, or current website behavior.

Each project uses the same narrative fields:

- `动机`: the problem or opportunity that started the build;
- `方法`: the implementation approach and important system boundaries;
- `结果`: only verifiable shipped behavior, checks, or artifacts;
- `当前边界`: limitations, incomplete work, or intentionally deferred scope.

## Page Structure

### Header And Introduction

- Preserve the existing Walker navigation and Fluid site shell.
- Replace the generic page-body treatment with a scoped Studio Casebook surface.
- Use a compact eyebrow, `Selected Builds` heading, one Chinese supporting sentence, and the current update date.
- Keep the introduction modest so the first project remains visible without an oversized hero.

### Project Rows

Every project is a full-width row separated by a thin divider.

Desktop layout:

- left narrative column: approximately 36%;
- right media column: approximately 64%;
- stable media aspect ratio and aligned row boundaries;
- no screenshot or video may appear in the left column.

Mobile layout:

- narrative comes first;
- media follows immediately below;
- controls remain reachable and text remains readable without horizontal scrolling.

### Project Links

Each project exposes only grounded actions:

- `GitHub 仓库` for the public repository;
- `实践记录` only when a relevant public article or live project route exists.

Use familiar icons from the site's existing icon set. Links must have visible focus states and accessible names.

## Media

### Quality

- Use original project screenshots or purpose-made high-resolution captures.
- Do not upscale small images or use generated mock screenshots as production assets.
- Desktop media should remain sharp on high-density displays.
- Preserve intrinsic dimensions and aspect ratio to prevent layout shifts.
- Use responsive image delivery and existing performance helpers where compatible.

### DevOps Agent Control Plane

- Use one consolidated media viewport on the right.
- The default slide is the project homepage or primary dashboard image.
- Additional screenshots may be browsed as a lightweight slideshow.
- Provide previous, next, and slide-indicator controls.
- Support pointer, keyboard, and touch interaction.
- Respect reduced-motion preferences and do not auto-advance.
- If JavaScript is unavailable, the first image remains visible and useful.

### Other Projects

- Use one primary screenshot per project in the initial implementation.
- A video may replace the screenshot only when an actual public demonstration asset exists.
- Videos must use controls, a poster image, and must not autoplay with sound.

## Typography And Readability

- Body text targets 15-16px on desktop and at least 15px on mobile.
- Chinese body copy uses comfortable line height and short paragraphs.
- Labels, status, technology, and narrative values have distinct hierarchy.
- Avoid condensed or decorative fonts for Chinese copy.
- Do not rely on cyan or amber alone to communicate state.
- Keep long project descriptions within a readable line length.

## Implementation Boundary

- Keep Hexo and Fluid as the rendering system.
- Do not modify the Fluid submodule.
- Implement the portfolio as scoped source content, CSS, and a bounded client script for the slideshow.
- Do not change article bodies, homepage identity, comments, monetization, or publication automation.
- Do not deploy in this implementation pass unless the user gives a separate deployment instruction.

## Data And Maintenance

The project page remains source-controlled and fact-reviewed. It is not populated dynamically in the browser from GitHub.

GitHub metadata may be collected during content maintenance, but the published page must use reviewed project data so unavailable APIs or rate limits cannot break rendering.

## Accessibility

- Use semantic headings and project sections.
- Slideshow controls are real buttons with accessible labels.
- The active slide indicator is exposed without depending only on color.
- Keyboard focus is visible.
- Images have concise project-specific alternative text.
- Motion is disabled or minimized under `prefers-reduced-motion`.

## Testing And Verification

Automated coverage must verify:

- four project sections render in the intended order;
- all project rows keep narrative before media in source order;
- the DevOps slideshow renders one active image at a time;
- previous, next, indicators, keyboard navigation, and no-JavaScript fallback behave correctly;
- external links use safe attributes;
- generated media assets exist and meet size/dimension expectations;
- existing site identity and article tests continue to pass.

Visual verification must cover:

- desktop and mobile viewports;
- high-resolution screenshot legibility;
- no overlapping or clipped Chinese text;
- consistent left-text/right-media desktop layout;
- stacked mobile layout without horizontal overflow;
- comparison against the approved final visual direction.

## Out Of Scope

- automatic GitHub API rendering in the visitor's browser;
- fabricated usage, revenue, adoption, or productivity metrics;
- autoplaying background video;
- new project detail routes;
- rewriting existing technical articles;
- production deployment without a separate instruction.
