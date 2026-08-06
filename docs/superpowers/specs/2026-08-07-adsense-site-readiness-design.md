# AdSense Site Readiness Design

## Goal

Resolve the concrete crawl, canonical-domain, and discovery defects found after
the AdSense "low-value content" review, without rewriting or removing existing
articles. Improve the evidence Google can observe before requesting another
AdSense review.

## Current Evidence

- AdSense recognizes `ads.txt`; authorization is not the blocker.
- `https://zhililab.cn/` currently fails strict TLS hostname validation.
- `https://zhililab.cn/robots.txt` returns HTTP 404.
- `https://zhililab.cn/sitemap.xml` returns HTTP 404.
- Hexo declares `url: https://github.com/zhililab`, so canonical and social
  metadata can point at the wrong origin.
- `_config.yml` contains Sitemap settings, but the project does not install a
  Sitemap generator.
- Public search results expose very little of the recent original content.

## Scope

### Included

1. Make `https://zhililab.cn` the single canonical origin because AdSense
   reviews the registrable root domain.
2. Keep `www.zhililab.cn` as a strict-HTTPS alias that redirects to the
   canonical apex origin.
3. Align Hexo URL and Pages `CNAME` with the canonical apex origin.
4. Generate a valid XML Sitemap during every Hexo build.
5. Publish a permissive `robots.txt` that references the canonical Sitemap.
6. Add source and rendered-output regression tests.
7. Build, deploy, update the GitHub Pages custom-domain setting, and verify
   apex/www DNS, TLS, redirects, canonical metadata, robots, and Sitemap.
8. Prepare Search Console for Sitemap submission and request indexing for a
   small set of the strongest recent original articles when the connected
   session permits it.
9. Produce a non-destructive content-readiness audit for later editorial work.

### Excluded

- Bulk deletion, unpublishing, `noindex`, or rewriting of old posts.
- Enabling more advertisements or automatic ads.
- Reapplying to AdSense immediately after deployment.
- Changing Waline, comments, reading layout, image optimization, or pet logic.
- Changing unrelated local `HelloWorld_Cover.jpg` or `.playwright-cli/` files.

## Design

### Canonical Domain

The source `CNAME` becomes `zhililab.cn` and Hexo `url` becomes
`https://zhililab.cn`. DNS keeps the four GitHub Pages apex A records and the
existing `www` CNAME. GitHub Pages is configured with `zhililab.cn` as its
custom domain so it can provision the correct certificate and redirect `www`
to the apex domain.

All generated canonical, Open Graph, Twitter, feed, Sitemap, and internal
absolute URLs must use `https://zhililab.cn`.

### Discovery Files

Install a pinned `hexo-generator-sitemap` dependency. Keep the existing
`sitemap.path: sitemap.xml` setting and add `source/robots.txt`:

```text
User-agent: *
Allow: /

Sitemap: https://zhililab.cn/sitemap.xml
```

Both files must be present in `public/` after a clean build and return HTTP 200
with appropriate text/XML content types in production.

### Search Console

After canonical DNS/TLS has stabilized:

1. Verify or select the `zhililab.cn` domain property.
2. Submit `https://zhililab.cn/sitemap.xml`.
3. Request indexing only for the homepage and representative recent articles:
   Kubernetes Pod creation, Agentic DevOps, DevOps Agent Control Plane, and the
   AdSense reflection.
4. Record whether each action succeeded or requires the user's Google session.

AdSense review is not resubmitted until Search Console shows that the Sitemap
can be read and several representative URLs are discovered or indexed.

### Content Readiness

The implementation produces a report rather than mutating content. It groups
posts by word count, age, missing cover/summary, and likely originality signal.
The report recommends which articles should later receive personal experience,
real evidence, updated references, or consolidation. Editorial changes require
separate approval.

## Tests

Source-level tests require:

- one-line `source/CNAME` equal to `zhililab.cn`;
- `_config.yml` canonical URL equal to `https://zhililab.cn`;
- pinned Sitemap dependency;
- `source/robots.txt` with the canonical Sitemap URL.

Rendered tests require:

- `public/CNAME`, `public/robots.txt`, and `public/sitemap.xml`;
- canonical and social URLs on the homepage and representative article;
- Sitemap entries using only the canonical HTTPS origin;
- no generated `https://github.com/zhililab` page URLs.

## Deployment and Verification

1. Build in the existing isolated worktree.
2. Preserve the current Pages version of the unrelated HelloWorld cover.
3. Run the complete test suite.
4. Push the exact source commit to `dev-optimize`.
5. Deploy the exact generated site to Pages `master`.
6. Change the Pages custom domain to `zhililab.cn` and wait for its certificate.
7. Wait for Pages/DNS/TLS propagation without repeated deploys.
8. Require strict HTTPS success for apex and www, the intended redirect,
   robots, Sitemap, homepage, and representative articles.

## Rollback

The source and Pages commits are independently revertible. If the apex
certificate cannot be issued, restore the previous Pages custom domain and
`CNAME`, while leaving Sitemap/robots generation available under the working
origin. No DNS records are deleted without separately resolving the exact
target and confirming the action remains necessary.

## Acceptance Criteria

- Apex and www both pass strict TLS validation.
- One hostname is canonical and the other redirects to it.
- `robots.txt` and `sitemap.xml` return HTTP 200.
- Sitemap entries and canonical metadata use `https://zhililab.cn`.
- Complete automated tests and Hexo build pass.
- Existing article content and unrelated user changes remain untouched.
- Search Console readiness is verified; AdSense review is not prematurely
  resubmitted.
