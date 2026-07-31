# Automatic AI Summary Review PR Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate AI summary drafts automatically on `dev-optimize`, place real changes in an isolated branch, and request `zhililab` review through a Pull Request instead of silently committing drafts.

**Architecture:** Keep the existing read-only generation job and artifact boundary. Replace the direct-commit job with a narrowly privileged review job that detects actual JSON changes, validates the staged paths, creates `ai-summary/run-<run_id>`, pushes it, and opens a PR to `dev-optimize`; a separate small source change removes the current radar article's explicit summary opt-out so the workflow can generate its first review PR.

**Tech Stack:** GitHub Actions YAML, GitHub CLI `gh`, shell, Node.js built-in test runner, Hexo static build.

## Global Constraints

- Do not push `dev-optimize` or deploy GitHub Pages without explicit publication authorization.
- Keep top-level workflow permissions at `contents: read`.
- Expose `GEMINI_API_KEY` only to the generation step.
- Grant `contents: write` and `pull-requests: write` only to the review job.
- Commit only `source/_data/ai-summaries/*.json` from the automation job.
- Do not create a branch or PR when the generated artifact has no changes.
- Request `zhililab` as reviewer and link the source workflow run in the PR body.
- Keep every generated summary at `status: draft` until the user approves it.
- Do not add Hexo or Pages deployment commands to the summary workflow.
- Preserve unrelated checkout changes, including `source/assets/images/cover/HelloWorld_Cover.jpg`, `.playwright-cli/`, and `.superpowers/`.

---

## File Structure

- `.github/workflows/generate-ai-summaries.yml`: owns automatic generation, change detection, restricted draft commit, branch push, PR creation, and review request.
- `test/ai-summary-workflow.test.js`: statically verifies trigger, permissions, secret scope, path confinement, no-change behavior, branch naming, PR target, reviewer, checklist, and deployment exclusion.
- `source/_posts/2026-07-31-weekly-ai-engineering-radar.md`: removes only the explicit `ai_summary: false` line so the shared cutoff policy requires a generated draft.

### Task 1: Replace Direct Draft Commits with Review Pull Requests

**Files:**
- Modify: `.github/workflows/generate-ai-summaries.yml:43-64`
- Modify: `test/ai-summary-workflow.test.js:11-86`

**Interfaces:**
- Consumes: the `ai-summary-drafts` artifact produced by the existing `generate` job.
- Produces: `steps.prepare.outputs.has_changes` as `'true' | 'false'` and `steps.prepare.outputs.branch` as `ai-summary/run-<run_id>`.
- Produces: a Pull Request whose base is `dev-optimize`, head is the generated branch, and requested reviewer is `zhililab`.

- [ ] **Step 1: Rewrite the workflow test for the required review behavior**

Replace the `commitJob` extraction and direct-commit assertions with a `reviewJob` extraction and assertions equivalent to:

```js
const reviewJob = workflow.match(
  /^\s{2}review:\n(?:^(?!\s{2}\S).*\n|^\s{4,}.*\n)*/m
);

assert.ok(reviewJob, 'missing review PR job');
assert.match(reviewJob[0], /needs:\s*generate/);
assert.match(
  reviewJob[0],
  /permissions:\s*\n\s{6}contents:\s*write\s*\n\s{6}pull-requests:\s*write/
);
assert.match(reviewJob[0], /id:\s*prepare/);
assert.match(reviewJob[0], /git add source\/_data\/ai-summaries/);
assert.match(reviewJob[0], /source\/_data\/ai-summaries\/\[\^\/\]\+\\\.json/);
assert.match(reviewJob[0], /has_changes=false/);
assert.match(reviewJob[0], /GITHUB_STEP_SUMMARY/);
assert.match(reviewJob[0], /ai-summary\/run-\$\{GITHUB_RUN_ID\}/);
assert.match(reviewJob[0], /git push --set-upstream origin/);
assert.match(reviewJob[0], /steps\.prepare\.outputs\.has_changes == 'true'/);
assert.match(reviewJob[0], /gh pr create/);
assert.match(reviewJob[0], /--base dev-optimize/);
assert.match(reviewJob[0], /--reviewer zhililab/);
assert.match(reviewJob[0], /github\.com\/\$\{\{ github\.repository \}\}\/actions\/runs\/\$\{\{ github\.run_id \}\}/);
assert.match(reviewJob[0], /status.*draft.*approved/is);
assert.doesNotMatch(reviewJob[0], /^\s*git push\s*$/m);
```

Keep the existing assertions for the automatic `dev-optimize` push trigger, path filters, read-only generation job, one secret reference, artifact upload/download, Node 20, and absence of deployment commands.

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
node --test test/ai-summary-workflow.test.js
```

Expected: FAIL with `missing review PR job` because the workflow still contains `commit:` and a direct `git push`.

- [ ] **Step 3: Implement the restricted review job**

Replace the `commit` job with this behavior:

```yaml
  review:
    needs: generate
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
      - name: Download draft summaries
        uses: actions/download-artifact@v4
        with:
          name: ai-summary-drafts
          path: source/_data/ai-summaries
      - name: Prepare AI summary review branch
        id: prepare
        run: |
          git config user.name 'github-actions[bot]'
          git config user.email '41898282+github-actions[bot]@users.noreply.github.com'
          git add source/_data/ai-summaries
          if git diff --cached --quiet; then
            echo 'has_changes=false' >> "$GITHUB_OUTPUT"
            echo '### No AI summary review required' >> "$GITHUB_STEP_SUMMARY"
            exit 0
          fi
          unexpected_paths="$(git diff --cached --name-only | sed -n '\|^source/_data/ai-summaries/[^/]\+\.json$|!p')"
          if [ -n "$unexpected_paths" ]; then
            echo 'Unexpected staged paths; refusing to create review PR.' >&2
            exit 1
          fi
          branch="ai-summary/run-${GITHUB_RUN_ID}"
          git switch -c "$branch"
          git commit -m 'chore: generate draft AI summaries [skip ci]'
          git push --set-upstream origin "$branch"
          echo 'has_changes=true' >> "$GITHUB_OUTPUT"
          echo "branch=$branch" >> "$GITHUB_OUTPUT"
      - name: Create AI summary review PR
        if: steps.prepare.outputs.has_changes == 'true'
        env:
          GH_TOKEN: ${{ github.token }}
          PR_BODY: |
            Automated AI summary drafts are ready for review.

            Source run: https://github.com/${{ github.repository }}/actions/runs/${{ github.run_id }}

            Review checklist:
            - [ ] The summary matches the article's core claims.
            - [ ] Evidence boundaries and qualifications are preserved.
            - [ ] No unsupported facts, numbers, or causal claims were added.
            - [ ] No sensitive or unpublished information is present.
            - [ ] `general`, `bullets`, and `explainer` serve distinct reading needs.
            - [ ] Change `status` from `draft` to `approved` before merge.
        run: |
          gh pr create \
            --base dev-optimize \
            --head "${{ steps.prepare.outputs.branch }}" \
            --title 'review: approve generated AI summaries' \
            --body "$PR_BODY" \
            --reviewer zhililab
```

The generation job remains unchanged. Do not add repository-wide write permissions or a deployment step.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run:

```bash
node --test test/ai-summary-workflow.test.js
```

Expected: PASS with one workflow test and no network access.

- [ ] **Step 5: Commit Task 1**

```bash
git add .github/workflows/generate-ai-summaries.yml test/ai-summary-workflow.test.js
git commit -m "feat: request review for AI summary drafts"
```

Expected: the commit contains exactly the workflow and its test.

### Task 2: Opt the Current Radar Article into Automatic Summary Generation

**Files:**
- Modify: `source/_posts/2026-07-31-weekly-ai-engineering-radar.md:13`
- Modify: `test/ai-summary-workflow.test.js`

**Interfaces:**
- Consumes: the existing shared Asia/Shanghai cutoff policy for posts dated on or after 2026-07-30.
- Produces: a radar post without an explicit summary opt-out, making `--scan` generate `source/_data/ai-summaries/2026-07-31-weekly-ai-engineering-radar.json` in GitHub Actions.

- [ ] **Step 1: Add a failing assertion for the radar article**

At the top of `test/ai-summary-workflow.test.js`, add:

```js
const radarPostPath = path.join(
  root,
  'source/_posts/2026-07-31-weekly-ai-engineering-radar.md'
);
```

Add this test:

```js
test('weekly AI engineering radar uses automatic summary generation', () => {
  const markdown = fs.readFileSync(radarPostPath, 'utf8');
  const frontmatter = markdown.match(/^---\n([\s\S]*?)\n---/);

  assert.ok(frontmatter, 'missing radar post frontmatter');
  assert.doesNotMatch(frontmatter[1], /^ai_summary:\s*false\s*$/m);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
node --test test/ai-summary-workflow.test.js
```

Expected: FAIL because line 13 still contains `ai_summary: false`.

- [ ] **Step 3: Remove only the explicit opt-out**

Delete this single frontmatter line from the radar article:

```yaml
ai_summary: false
```

Do not change the title, body, sources, cover, taxonomy, date, or whitespace elsewhere in the article.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run:

```bash
node --test test/ai-summary-workflow.test.js
```

Expected: both workflow tests PASS.

- [ ] **Step 5: Verify the local quality gate now requires a draft**

Run:

```bash
npm run summary:check
```

Expected: nonzero exit identifying `2026-07-31-weekly-ai-engineering-radar` as missing. This is the intended pre-generation state and proves the article entered the automatic summary policy.

- [ ] **Step 6: Commit Task 2**

```bash
git add test/ai-summary-workflow.test.js source/_posts/2026-07-31-weekly-ai-engineering-radar.md
git commit -m "feat: enable automatic summary for weekly radar"
```

Expected: the commit changes only the workflow test and removes one article frontmatter line.

### Task 3: Validate the Workflow and Repository Scope

**Files:**
- Verify: `.github/workflows/generate-ai-summaries.yml`
- Verify: `test/ai-summary-workflow.test.js`
- Verify: `source/_posts/2026-07-31-weekly-ai-engineering-radar.md`

**Interfaces:**
- Consumes: Tasks 1 and 2.
- Produces: a locally verified source commit ready for an explicitly authorized push; it does not publish or trigger GitHub Actions locally.

- [ ] **Step 1: Run all automated tests**

Run:

```bash
npm test
```

Expected: all tests PASS. The repository currently has 124 tests, so the new radar assertion should increase the total by one.

- [ ] **Step 2: Validate YAML syntax without adding dependencies**

Run:

```bash
ruby -e "require 'yaml'; YAML.load_file('.github/workflows/generate-ai-summaries.yml', aliases: true); puts 'workflow YAML valid'"
```

Expected: `workflow YAML valid`.

- [ ] **Step 3: Check secret, permission, and deployment boundaries**

Run:

```bash
test "$(rg -c 'GEMINI_API_KEY:' .github/workflows/generate-ai-summaries.yml)" -eq 1
test "$(rg -c 'secrets\.GEMINI_API_KEY' .github/workflows/generate-ai-summaries.yml)" -eq 1
! rg -n 'hexo deploy|npm run deploy' .github/workflows/generate-ai-summaries.yml
git diff --check HEAD~2..HEAD
```

Expected: every command exits zero and no deployment command is printed.

- [ ] **Step 4: Confirm exact committed scope and preserve unrelated files**

Run:

```bash
git diff --name-status HEAD~2..HEAD
git status --short
```

Expected committed paths:

```text
M .github/workflows/generate-ai-summaries.yml
M source/_posts/2026-07-31-weekly-ai-engineering-radar.md
M test/ai-summary-workflow.test.js
```

The pre-existing `HelloWorld_Cover.jpg`, `.playwright-cli/`, and `.superpowers/` changes remain unstaged and unchanged.

- [ ] **Step 5: Stop before remote mutation**

Report the local commits, focused/full test results, expected `summary:check` failure, and exact file scope. Request explicit confirmation before pushing `dev-optimize`; pushing will automatically start the workflow, call Gemini, create the review branch, and open the PR.
