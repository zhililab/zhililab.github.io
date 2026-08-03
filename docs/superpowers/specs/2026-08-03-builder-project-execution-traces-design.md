# Builder Project Execution Traces Design

## Goal

Replace repository-homepage screenshots for projects without a real product UI or demo video with interactive, code-grounded execution diagrams. The diagrams must help a visitor understand what each project actually does without implying capabilities that are absent from the public repository.

This iteration covers:

1. Tutorial-to-Template
2. Python Learning Resources

DevOps Agent Control Plane keeps its real interface slideshow. ZHILILAB ContentOps keeps its real website screenshot.

## Selected Direction

Use the approved **Execution Trace** direction. Each affected project receives one responsive 16:9 diagram in the existing right-side media slot. A highlighted trace moves through the real execution stages and ends at the project's concrete outputs.

The diagrams share one visual language:

- near-black background consistent with the Projects page;
- cyan for the primary execution path;
- amber for decisions, errors, and fallback paths;
- green for validated or written outputs;
- compact monospace module labels paired with plain-language stage names;
- no decorative illustration, fabricated dashboard, or GitHub page screenshot.

## Evidence Sources

The diagrams are derived from the public repositories as read on 2026-08-03.

### Tutorial-to-Template

Primary files:

- `src/cli.ts`
- `src/transcript.ts`
- `src/extract/classifySource.ts`
- `src/extract/extractTemplate.ts`
- `src/schemas/TutorialTemplate.schema.ts`
- `src/render/*.ts`
- `src/io/writeOutput.ts`
- `tests/karpathy-fixture.test.mjs`

### Python Learning Resources

Primary files:

- `.github/workflows/update_resources.yml`
- `update_resources.py`
- `README.md`

## Diagram 1: Tutorial-to-Template

### Primary Trace

1. **Source**: YouTube URL and optional local transcript file.
2. **Resolve**: `resolveTranscript` reads the local transcript or downloads and stores one.
3. **Classify**: `classifySource` scores five supported source types.
4. **Extract**: `extractTemplate` separates source-supported facts from recommended defaults and preserves `not_specified` fields.
5. **Validate**: `validateTemplate` checks the structured tutorial template before any final artifacts are written.
6. **Write**: `writeOutput` renders and writes the project artifacts, with an optional Obsidian vault copy.

### Visible Outputs

- `PROJECT_TEMPLATE.md`
- `TASKS.md`
- `OBSIDIAN_NOTE.md`
- `AGENT_CONTEXT.md`
- `TEMPLATE.json`
- `README.md`

The diagram footer states the project's governing rule: unsupported source details remain `not_specified`; inferred defaults are labeled separately.

## Diagram 2: Python Learning Resources

### Primary Trace

1. **Trigger**: daily `0 0 * * *` schedule or manual workflow dispatch.
2. **Prepare**: checkout, Python setup, and installation of `requests` and `beautifulsoup4`.
3. **Fetch**: `fetch_trending_projects` requests the GitHub daily Python trending page and parses up to five repositories.
4. **Generate**: `generate_readme` combines maintained tutorial and best-practice sections with the fetched project list and update date.
5. **Write**: the script replaces `README.md`.
6. **Commit**: GitHub Actions commits and pushes the regenerated documentation.

### Fallback Trace

When the request, status check, or parsing fails, the trace moves through an amber fallback branch to `FALLBACK_PROJECTS`, then rejoins the README generation stage. The diagram must not claim source ranking, content quality scoring, deduplication, or human approval because the current code does not implement those behaviors.

## Interaction Model

- Animation begins only when the diagram enters the viewport.
- One loop lasts approximately 8 to 9 seconds.
- A single stage is emphasized at a time; the overall layout remains stable.
- Hovering the diagram or focusing an interactive stage pauses playback.
- Each stage is keyboard focusable and exposes a concise module explanation.
- Activating a stage pins its explanation until focus moves or Escape is pressed.
- Animation resumes when the diagram is no longer paused or pinned.
- `prefers-reduced-motion: reduce` disables tracing and shows the complete static state.
- Without JavaScript, every stage, branch, and output remains visible and readable.

## Responsive Behavior

- Desktop uses the existing right-side 16:9 media slot.
- The diagram does not increase the approved 1180px page width or alter the 36/64 project grid.
- On narrow screens, labels shorten before type size becomes unreadable.
- At mobile width, stages may wrap into two rows while preserving source-to-output order.
- No horizontal page overflow is allowed.
- Text must remain legible at 390px viewport width and in the 960px responsive capture.

## Implementation Boundaries

- Use semantic HTML, scoped CSS, and the existing Projects JavaScript asset.
- Do not add a diagram framework for these two bounded flows.
- Do not generate raster screenshots of the diagrams; the browser-rendered diagrams must stay sharp at all densities.
- Do not hand-author SVG illustrations.
- Keep all styles and behavior scoped to `.builder-projects-page` and the diagram component.
- Keep the existing project links, descriptions, order, status, and text evidence unchanged unless required for accessibility.
- Remove the two obsolete GitHub screenshot references from the Projects source after the diagrams replace them. Retaining the old image files is optional only if another route still uses them.

## Accessibility

- Each diagram has a descriptive accessible name.
- The stage list preserves logical DOM order.
- Stage state is not communicated by color alone.
- Paused and pinned details remain available to keyboard users.
- Focus indicators meet the current dark-theme contrast.
- Decorative movement is hidden from assistive technology.

## Testing

Add focused tests that verify:

- Tutorial-to-Template contains the six approved stages and six real outputs.
- Python Learning Resources contains the workflow stages and the explicit fallback branch.
- Neither diagram claims unsupported capabilities.
- Both old repository screenshot references are absent from generated Projects HTML.
- diagrams preserve readable no-JavaScript content;
- stage activation, pause, pin, Escape, and reduced-motion behavior;
- route scoping and non-Projects pages remain unchanged;
- CSS includes the approved 16:9, responsive, focus, and reduced-motion contracts.

Run a clean Hexo build, focused Projects tests, the full test suite, and desktop/mobile visual QA. Visual QA must compare the approved Execution Trace mockup and the rendered implementation in the same review input.

## Acceptance Criteria

- Visitors can identify each project's input, processing stages, fallback or validation boundary, and outputs without opening GitHub.
- Every displayed stage maps to reviewed repository code.
- The two diagrams replace GitHub homepage screenshots and remain on the right on desktop.
- Animations are smooth, readable, pausable, keyboard accessible, and motion-safe.
- Desktop and mobile layouts preserve the approved Projects page proportions.
- Existing DevOps and ContentOps media are unchanged.
- No deployment or push occurs as part of this implementation pass.
