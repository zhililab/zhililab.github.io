const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const css = require('css');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const unsupportedNumberClaim = /用户量|收入|节省了?\s*\d+|提升了?\s*\d+/;
const declarationsFor = (rules, selector) => Object.fromEntries(
  rules
    .filter((rule) => rule.type === 'rule' && rule.selectors.includes(selector))
    .flatMap((rule) => rule.declarations)
    .filter((declaration) => declaration.type === 'declaration')
    .map((declaration) => [declaration.property, declaration.value])
);

test('projects frontmatter opts out of Fluid lazyloading', () => {
  const source = read('source/projects/index.md');
  assert.match(source, /^lazyload:\s*false$/m);
});

test('projects source contains four evidence-first builds in order', () => {
  const source = read('source/projects/index.md');
  const names = ['DevOps Agent Control Plane', 'Tutorial-to-Template', 'ZHILILAB ContentOps', 'Python Learning Resources'];
  const positions = names.map((name) => source.indexOf(name));
  assert.ok(positions.every((position) => position >= 0));
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b));
  assert.equal((source.match(/class="builder-project"/g) || []).length, 4);
  assert.equal((source.match(/<dt>动机<\/dt>/g) || []).length, 4);
  assert.equal((source.match(/<dt>方法<\/dt>/g) || []).length, 4);
  assert.equal((source.match(/<dt>结果<\/dt>/g) || []).length, 4);
  assert.equal((source.match(/<dt>当前边界<\/dt>/g) || []).length, 4);
  assert.doesNotMatch(source, unsupportedNumberClaim);
  assert.match('提升 25', unsupportedNumberClaim);
  assert.match('节省了 30', unsupportedNumberClaim);
});

test('DevOps uses one media viewport with two real slides', () => {
  const source = read('source/projects/index.md');
  assert.equal((source.match(/data-project-carousel/g) || []).length, 1);
  assert.equal((source.match(/data-project-slide/g) || []).length, 2);
  assert.match(source, /data-carousel-prev/);
  assert.match(source, /data-carousel-next/);
  assert.equal((source.match(/data-carousel-dot/g) || []).length, 2);
});

test('project media has desktop and mobile high-resolution variants', async () => {
  const bases = ['devops-control-plane-home', 'devops-control-plane-quality', 'zhililab-contentops'];
  for (const base of bases) {
    const desktop = path.join(root, `source/assets/images/projects/${base}-1600.webp`);
    const mobile = path.join(root, `source/assets/images/projects/${base}-960.webp`);
    assert.ok(fs.existsSync(desktop), desktop);
    assert.ok(fs.existsSync(mobile), mobile);
    const desktopMeta = await sharp(desktop).metadata();
    const mobileMeta = await sharp(mobile).metadata();
    assert.ok(desktopMeta.width >= 1280);
    assert.ok(mobileMeta.width >= 900);
    if (base.startsWith('devops-control-plane')) {
      assert.deepEqual([desktopMeta.width, desktopMeta.height], [1280, 720]);
      assert.deepEqual([mobileMeta.width, mobileMeta.height], [960, 540]);
    }
  }
});

test('project desktop images declare their real source dimensions', () => {
  const source = read('source/projects/index.md');
  const dimensions = [
    ['devops-control-plane-home', 1280, 720],
    ['devops-control-plane-quality', 1280, 720],
    ['zhililab-contentops', 1440, 810]
  ];

  for (const [base, width, height] of dimensions) {
    assert.match(
      source,
      new RegExp(`<img src="/assets/images/projects/${base}-1600\\.webp" width="${width}" height="${height}"`)
    );
  }
});

test('non-UI projects use code-grounded execution traces instead of GitHub screenshots', () => {
  const source = read('source/projects/index.md');
  const tutorial = source.match(/<div class="builder-project__media builder-trace" data-project-trace data-trace-kind="tutorial"[^>]*>[\s\S]*?<\/div>\s*<\/article>/)?.[0];
  const python = source.match(/<div class="builder-project__media builder-trace" data-project-trace data-trace-kind="python-resources"[^>]*>[\s\S]*?<\/div>\s*<\/article>/)?.[0];

  assert.ok(tutorial, 'Tutorial-to-Template execution trace must exist');
  assert.ok(python, 'Python Learning Resources execution trace must exist');
  assert.match(
    tutorial,
    /data-trace-kind="tutorial" role="group" aria-label="Tutorial-to-Template 执行流程"/
  );
  assert.match(
    tutorial,
    /class="builder-trace__outputs" role="group" aria-label="生成产物"/
  );
  assert.match(
    python,
    /data-trace-kind="python-resources" role="group" aria-label="Python Learning Resources 执行流程"/
  );
  assert.match(
    python,
    /class="builder-trace__outputs" role="group" aria-label="README 内容"/
  );
  assert.doesNotMatch(source, /tutorial-to-template-(?:960|1600)\.webp/);
  assert.doesNotMatch(source, /python-learning-resources-(?:960|1600)\.webp/);

  for (const label of ['Source', 'Resolve', 'Classify', 'Extract', 'Validate', 'Write']) {
    assert.match(tutorial, new RegExp(`data-trace-stage[^>]*>[\\s\\S]*?${label}`));
  }
  for (const output of ['PROJECT_TEMPLATE.md', 'TASKS.md', 'OBSIDIAN_NOTE.md', 'AGENT_CONTEXT.md', 'TEMPLATE.json', 'README.md']) {
    assert.match(tutorial, new RegExp(output.replace('.', '\\.')));
  }

  for (const label of ['Trigger', 'Prepare', 'Fetch', 'Generate', 'Write', 'Commit']) {
    assert.match(python, new RegExp(`data-trace-stage[^>]*>[\\s\\S]*?${label}`));
  }
  assert.match(python, /data-trace-fallback[\s\S]*FALLBACK_PROJECTS/);
  assert.doesNotMatch(python, /quality score|deduplicat|human approv/i);
});

test('DevOps dashboard and Quality Lab captures are distinct', () => {
  const directory = path.join(root, 'source/assets/images/projects');
  for (const width of [1600, 960]) {
    const home = fs.readFileSync(path.join(directory, `devops-control-plane-home-${width}.webp`));
    const quality = fs.readFileSync(path.join(directory, `devops-control-plane-quality-${width}.webp`));
    assert.notDeepEqual(home, quality);
  }
});

test('generated first DevOps slide keeps its real image without Fluid lazyloading', () => {
  const html = read('public/projects/index.html');
  const firstSlide = html.match(/<figure data-project-slide>[\s\S]*?<\/figure>/)?.[0];

  assert.ok(firstSlide, 'first DevOps slide must render');
  assert.match(firstSlide, /<source media="\(max-width: 767px\)" srcset="\/assets\/images\/projects\/devops-control-plane-home-960\.webp">/);
  assert.match(firstSlide, /<img src="\/assets\/images\/projects\/devops-control-plane-home-1600\.webp" width="1280" height="720"/);
  assert.doesNotMatch(firstSlide, /srcset="\/img\/loading\.gif"/);
  assert.doesNotMatch(firstSlide, /\slazyload(?:\s|=|>)/);
});

test('projects CSS rules own the approved layout and interaction declarations', () => {
  const rules = css.parse(read('source/css/blog-projects.css')).stylesheet.rules;
  const desktopProject = declarationsFor(rules, '.builder-project');
  const media = declarationsFor(rules, '.builder-project__media');
  const focus = declarationsFor(rules, '.builder-projects a:focus-visible');
  const board = declarationsFor(rules, '.builder-projects-page #board');
  const banner = declarationsFor(rules, '.builder-projects-page #banner');
  const header = declarationsFor(rules, '.builder-projects-page .header-inner');
  const navbar = declarationsFor(rules, '.builder-projects-page #navbar');
  const trace = declarationsFor(rules, '.builder-trace');
  const stages = declarationsFor(rules, '.builder-trace__stages');
  const stage = declarationsFor(rules, '.builder-trace__stages button');
  const paused = declarationsFor(rules, '.builder-trace.is-trace-paused *');
  const pinned = declarationsFor(rules, '.builder-trace.is-trace-pinned *');
  const pausedRail = declarationsFor(
    rules,
    '.builder-trace.is-trace-paused .builder-trace__stages::after'
  );
  const pinnedRail = declarationsFor(
    rules,
    '.builder-trace.is-trace-pinned .builder-trace__stages::after'
  );
  const traceFocus = declarationsFor(rules, '.builder-trace__stages button:focus-visible');
  const activeStage = declarationsFor(rules, '.builder-trace.is-trace-active .builder-trace__stages li');
  const activeStageButton = declarationsFor(
    rules,
    '.builder-trace.is-trace-active .builder-trace__stages button'
  );
  const stageKeyframes = rules.find(
    (rule) => rule.type === 'keyframes' && rule.name === 'builder-trace-stage'
  );
  const stageAnimationProperties = new Set(
    stageKeyframes.keyframes.flatMap((keyframe) => keyframe.declarations)
      .filter((declaration) => declaration.type === 'declaration')
      .map((declaration) => declaration.property)
  );
  const responsiveTrace = rules.find(
    (rule) => rule.type === 'media' && rule.media === '(max-width: 1023px)'
  );
  const mobile = rules.find((rule) => rule.type === 'media' && rule.media === '(max-width: 767px)');
  const reducedMotion = rules.find(
    (rule) => rule.type === 'media' && rule.media === '(prefers-reduced-motion: reduce)'
  );

  assert.equal(desktopProject['grid-template-columns'], 'minmax(280px, 0.36fr) minmax(0, 0.64fr)');
  assert.equal(media['aspect-ratio'], '16 / 9');
  assert.equal(media['align-self'], 'center');
  assert.equal(media.overflow, 'hidden');
  assert.equal(media['box-shadow'], 'none');
  assert.equal(media['touch-action'], 'pan-y');
  assert.equal(trace['aspect-ratio'], '16 / 9');
  assert.equal(stages['grid-template-columns'], 'repeat(6, minmax(0, 1fr))');
  assert.equal(stage['min-width'], '0');
  assert.equal(paused['animation-play-state'], 'paused !important');
  assert.equal(pinned['animation-play-state'], 'paused !important');
  assert.equal(pausedRail['animation-play-state'], 'paused !important');
  assert.equal(pinnedRail['animation-play-state'], 'paused !important');
  assert.equal(traceFocus.outline, '3px solid var(--projects-cyan)');
  assert.match(activeStage.animation, /builder-trace-stage/);
  assert.equal(activeStageButton.animation, undefined);
  assert.deepEqual(stageAnimationProperties, new Set(['transform']));

  assert.ok(responsiveTrace, 'content-driven trace media query must exist');
  const responsiveTraceFrame = declarationsFor(responsiveTrace.rules, '.builder-trace');
  const responsiveTraceStages = declarationsFor(responsiveTrace.rules, '.builder-trace__stages');
  assert.equal(responsiveTraceFrame['aspect-ratio'], 'auto');
  assert.equal(responsiveTraceFrame.overflow, 'visible');
  assert.equal(responsiveTraceStages['grid-template-columns'], 'repeat(3, minmax(0, 1fr))');

  assert.ok(mobile, 'mobile projects media query must exist');
  const mobileProject = declarationsFor(mobile.rules, '.builder-project');
  assert.equal(mobileProject['grid-template-columns'], 'minmax(0, 1fr)');
  assert.equal(mobileProject.gap, '28px');
  assert.equal(mobileProject.padding, '48px 0');

  assert.equal(focus.outline, '3px solid var(--projects-cyan)');
  assert.equal(focus['outline-offset'], '4px');

  assert.ok(reducedMotion, 'reduced-motion projects media query must exist');
  const reducedMotionContent = declarationsFor(reducedMotion.rules, '.builder-projects *');
  const reducedTraceSelectors = [
    '.builder-trace *',
    '.builder-trace *::before',
    '.builder-trace *::after'
  ];
  const reducedRail = declarationsFor(reducedMotion.rules, '.builder-trace__stages::after');
  const reducedButtons = declarationsFor(reducedMotion.rules, '.builder-trace__stages button');
  const reducedOutputs = declarationsFor(reducedMotion.rules, '.builder-trace__outputs span');
  const reducedFallback = declarationsFor(reducedMotion.rules, '.builder-trace__fallback');
  assert.equal(reducedMotionContent['animation-duration'], '0.01ms !important');
  assert.equal(reducedMotionContent['transition-duration'], '0.01ms !important');
  for (const selector of reducedTraceSelectors) {
    const declarations = declarationsFor(reducedMotion.rules, selector);
    assert.equal(declarations['animation-name'], 'none !important');
    assert.equal(declarations.transform, 'none !important');
  }
  assert.equal(reducedRail.opacity, '1');
  assert.equal(reducedRail.width, '100%');
  assert.equal(reducedButtons['background-color'], '#142b3d');
  assert.equal(reducedButtons['border-color'], 'var(--projects-cyan)');
  assert.equal(reducedOutputs.opacity, '1');
  assert.equal(reducedFallback.opacity, '1');

  assert.equal(board['margin-top'], '0 !important');
  assert.equal(banner.display, 'none');
  assert.equal(header.height, '64px !important');
  assert.equal(navbar['background-color'], 'var(--projects-bg) !important');
  assert.equal(
    declarationsFor(mobile.rules, '.builder-projects-page .header-inner').height,
    '56px !important'
  );
});

test('project actions use the emitted icon font without replacing their visible labels', () => {
  const source = read('source/projects/index.md');

  assert.match(source, /<a[^>]*><i class="iconfont icon-github-fill" aria-hidden="true"><\/i>GitHub 仓库<\/a>/);
  assert.match(source, /<a[^>]*><i class="iconfont icon-articles" aria-hidden="true"><\/i>实践记录<\/a>/);
  assert.match(read('source/vendor/blog/site-icons.css'), /\.icon-github-fill:before/);
  assert.match(read('source/vendor/blog/fluid-icons.css'), /\.icon-articles:before/);
});
