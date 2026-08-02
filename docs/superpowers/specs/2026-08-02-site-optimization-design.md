# ZHILILAB Site Optimization Design

## Status

Approved by the user on 2026-08-02 through the site optimization review and the follow-up instruction to begin execution.

## Goal

Upgrade ZHILILAB from a generic chronological technology blog into Walker's personal content product while preserving the existing Hexo, Fluid, AI summary, performance, comments, and publication pipeline.

## Constraints

- Do not rewrite existing post bodies.
- Do not deploy or push remote changes in this implementation pass.
- Do not rewrite Git history.
- Do not attempt external credential rotation; remove exposed local configuration and report rotation as a required follow-up.
- Preserve AdSense as disabled and preserve the existing privacy page.
- Preserve the human confirmation gate before publication.
- Keep changes compatible with the pinned Fluid theme instead of editing the theme submodule.

## Approaches Considered

### A. Incremental Fluid override and site enhancement script

Create a root `_config.fluid.yml`, update Hexo identity metadata, add one tested HTML enhancement script, and add focused CSS. This preserves the existing article system and provides a controlled path toward the Reading Desk direction.

This is the selected approach because it has the smallest blast radius and keeps future Fluid upgrades possible.

### B. Modify the pinned Fluid submodule

This offers precise visual control but couples ZHILILAB to a modified detached theme commit. It would make theme recovery and upgrades harder.

Rejected.

### C. Replace the homepage with a separate React application

This could match the earlier prototype closely but would create two frontend systems, duplicate routing and metadata logic, and complicate static deployment.

Rejected for this phase.

## Architecture

### Site identity configuration

`_config.yml` becomes the canonical source for the public domain, site title, author, description, keywords, and publication-safe settings. Obsolete GitTalk and Hexo Admin authentication material is removed.

`_config.fluid.yml` becomes the supported override layer for the Walker navbar label, homepage slogan, banner sizing, navigation, and footer copy. The pinned theme submodule remains unchanged.

### HTML enhancement

`scripts/blog-site-identity.js` owns two bounded transformations:

1. Inject a canonical link and JSON-LD into generated pages.
2. Inject the Reading Desk introduction and four-topic writing map only into the homepage.

The script must be idempotent and must leave post bodies unchanged.

### Presentation

`source/css/blog-site-identity.css` styles the injected homepage section using the existing Fluid color variables where possible. The visual direction is quiet, editorial, and content-first. It uses spacing, typography, dividers, and a restrained green accent instead of decorative effects.

### Content pages

`source/about/index.md` is rewritten as a current professional profile grounded in demonstrated site capabilities. `source/notes/index.md` becomes Field Notes and preserves the historical notes under an archive heading. `source/projects/index.md` provides a lightweight portfolio using only verifiable systems present in the repository.

## Homepage Information Architecture

1. Existing Fluid banner, reduced in height, with the slogan "把实践写成可复用的系统".
2. Walker introduction with two actions: latest articles and writing map.
3. Four stable writing themes:
   - AI automation and agents
   - DevOps and platform engineering
   - Content engineering and personal brand
   - Personal growth and review
4. Existing article feed, with the first card visually emphasized as the current featured article.
5. Navigation entry to Projects.

## SEO And Security Behavior

- All generated canonical and Open Graph URLs use `https://www.zhililab.cn`.
- Homepage JSON-LD describes Walker as a `Person` and the site as their URL.
- Post JSON-LD describes the page as `BlogPosting` using rendered post metadata.
- Generated author metadata must never render `[object Object]`.
- Tracked source must not contain GitTalk secrets or Hexo Admin password hashes.

## Testing

Tests must fail before implementation and cover:

- Configuration source contains no GitTalk secret or Hexo Admin password hash.
- Generated homepage uses the canonical domain and valid author metadata.
- Generated post contains canonical and BlogPosting JSON-LD.
- Homepage contains exactly one Reading Desk introduction and writing map.
- Non-home pages do not contain the homepage introduction.
- About, Field Notes, and Projects routes render expected headings.
- Existing 124 tests continue to pass after a fresh build.

## Out Of Scope

- Production deployment.
- Git history rewriting.
- External OAuth secret rotation.
- Full category migration of historical posts.
- AdSense activation.
- Newsletter provider integration.
- Full visual or WCAG audit when screenshot capture is unavailable.
