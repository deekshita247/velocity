# VELOCITY performance and caching audit

## Result and scope

Implemented without changing section order, CSS/layout, photographs, shaders, carousel inputs, or animation timings. No assets deleted or renamed, no service worker, API cache, dependency, or deployment-setting changes. Local production Chrome checks passed; this is not a Vercel deployment or a Lighthouse/Core Web Vitals benchmark.

## Largest public assets (largest first)

41 files total, 4,273,653 bytes (4.08 MiB). Most current race textures are already modest (roughly 617?1200 pixels wide). `c5.jpg` is 3840?2160 and has no current component reference. `c18.jpeg` is only 617?408 / 19.6 KiB; further downsampling would hurt image quality.

| File | KiB |
| --- | ---: |
| `public/portfolio/c5.jpg` | 496.0 |
| `public/assets/reference/flower-spine.bin` | 476.9 |
| `public/images/gallery/spiral-5.jpg` | 340.3 |
| `public/images/gallery/spiral-6.jpg` | 274.2 |
| `public/portfolio/c15.jpeg` | 226.9 |
| `public/portfolio/c9.jpeg` | 225.0 |
| `public/images/gallery/spiral-4.jpg` | 198.6 |
| `public/images/gallery/spiral-3.jpg` | 160.2 |
| `public/portfolio/c17.jpeg` | 151.2 |
| `public/images/gallery/spiral-2.jpg` | 148.7 |
| `public/portfolio/c4.jpeg` | 142.1 |
| `public/images/gallery/spiral-1.jpg` | 136.0 |
| `public/images/racing/porsche-study.jpg` | 136.0 |
| `public/portfolio/c6.jpeg` | 129.9 |
| `public/portfolio/c11.jpeg` | 125.8 |

Other notable assets: `assets/spine/spine.bin` is 14.8 KiB, `assets/reference/waternormals.jpg` is 26.1 KiB, and `portfolio/logo.png` is 61.7 KiB (500?500). SHA-256 comparison found one exact duplicate pair: `images/gallery/spiral-1.jpg` and `images/racing/porsche-study.jpg`. Both are retained. No external HDR environment-map download is used by the active gallery/background: Lightformers generate their maps locally, once.

## Cache policy and verification

Verified HTTP 200 and these headers against `next start` on port 3001:

| Path | Cache-Control |
| --- | --- |
| `/portfolio/:path*` except logo | `public, max-age=86400, stale-while-revalidate=604800` |
| `/assets/:path*` | `public, max-age=86400, stale-while-revalidate=604800` |
| `/images/:path*` | `public, max-age=86400, stale-while-revalidate=604800` |
| `/portfolio/logo.png` | `public, max-age=0, must-revalidate` |
| Content-hashed `/_next/static/...` | Next.js-managed immutable caching; not overridden |
| Optimized `/_next/image?...` responses | Next.js-managed image caching, respecting upstream freshness; not overridden |
| HTML/routes | Existing Next.js static-rendering policy; not overridden |

All current public filenames are treated as mutable. No new one-year immutable public rule was added. Other than the logo, updated same-name files may remain fresh for one day and may be served stale during the seven-day background revalidation window. For immediate replacement, use a new URL and update **all** DOM, preload, texture, critical-loader, and data references together. Suggested future names: `logo-v2.png`, `c18-v2.jpeg`, `spine-v2.bin`; content hashes are preferable for an automated immutable pipeline. A version suffix should only receive immutable caching if the file is never overwritten.

The logo revalidates on every request and can use conditional responses. Vercel edge headers should be spot-checked after deployment; no deployment was performed. Repeat-visit browser checks confirmed disk-cache reuse for geometry, photographs, and hashed Draco decoder files.

## Preloads and accurate entrance progress

- Hero and logo use Next 16's `preload` API rather than deprecated `priority`.
- The hero DOM and disintegration canvas both use the same raw 117 KiB JPEG, avoiding an additional optimized hero variant. CORS modes match the gallery texture request so the browser can reuse the response. This also preserves the canvas's original image quality.
- Explicit early preloads cover `spine.bin`, the water normal map, and the first gallery photo (`c9.jpeg`). Hero `c13.jpeg` already supplies the second gallery photo.
- Removed the preloader's extra standalone hero Image/decode operation; completion comes from the displayed image's load handler.
- Seven actual completion signals gate entrance: hero, logo, fragment masks, decoded spine, normal map, and first two gallery photos.
- Particle decoding, gallery photos 3?6, Featured Projects, and Details do not gate entrance. The eight-second escape timeout and existing exit animation remain.
- Existing next/font Geist and Geist Mono setup is retained; no new fonts/weights. Their existing font preloads remain Next-managed.

Chrome reached 100% without invoking the timeout. The final initial network trace had one response per raw hero/first-photo/normal-map URL, rather than duplicate CORS-mode requests.

## Deferred loading and stable layout

- Featured Projects, Details, Race Sequence, and Motion in the Round are separate normal `next/dynamic` modules, with SSR retained. These section modules still mount immediately; splitting them is not claimed as viewport-delayed JavaScript delivery.
- The expensive liquid renderer is now a separate module, imported only when the existing 250px visibility threshold is reached. Its original server-rendered DOM image and sized host remain in place.
- The shared watery renderer retains its existing 600px proximity trigger and lazy scene import.
- Gallery photos 3?6 start after critical readiness or when approaching the gallery (800px margin, also providing a timeout/failure escape path). They generally finish during the hero, preserving the surrounding 3D composition when scrolling begins.
- Below-fold DOM images keep browser-native lazy loading. Featured RGB overlay raw-image URLs are assigned only when the card approaches the viewport.
- No whole-section placeholder or `ssr:false` was added. The final outro remains in its original section.

## WebGL, memory, and mobile

- Spine requests now honor HTTP caching instead of forcing `no-store`.
- A module-level promise cache reuses the decoded spine source. Each consumer gets its own clone, so disposing a mesh cannot destroy another consumer's geometry. Rejected loads are retryable. Decoder workers, mesh material, and owned geometry are disposed; a completed load after unmount disposes its clone.
- Shared watery base/night/normal textures use individual `useTexture` keys, allowing the normal/night texture objects to reuse the gallery's existing loader cache. Separate WebGL contexts still require their own GPU uploads.
- Gallery renders during bounded warmup or while its visible transition is active; it pauses behind the fully opaque static hero and when offscreen. Warmup has an eight-second cap even if a critical asset fails.
- Watery and liquid effects pause in hidden tabs. The watery pointer listener no longer measures all chapter rectangles on each pointer event; layout reads occur on scroll/resize/visibility changes.
- Watery and liquid canvas DPR is capped at 1 on mobile, retaining desktop [1, 1.25]. At the former 1.25 cap this uses 36% fewer drawing-buffer pixels. Browser verification measured a 358px drawing buffer for a 358.8px CSS-width mobile Details canvas.
- Existing mobile gallery DPR 1, 2,400 versus 9,000 spine particles, 96 versus 160 fluid grid, half-size refraction buffer, and reduced sparkles remain. Shader parameters, particle counts, bloom appearance, and desktop quality were not altered.
- Mipmaps are retained for perspective gallery photos; disabling them would risk shimmering. No destructive shared-texture disposal was introduced.

## Images, React, and lifecycle audit

Featured image `sizes` now matches the actual two-column grid and capped content width; its liquid layer receives the same sizes. The Details image describes its full 92vw host. Existing fill/width/height and object-fit behavior remain.

The cursor and reel retain ref-driven RAF work, index-only React updates, visibility cleanup, and local reel wheel capture. Fluid/render targets and particles already provide disposal hooks. The remaining global wheel locks belong to the visible preloader or open gallery detail, with effect cleanup; no global reel wheel listener exists. No broad memoization was added.

Legacy components not used by the home route (including InspectionLens, ParticleImage, and TransitionCanvas) retain their existing lazy/paused behavior; they were not unnecessarily rewritten.

## Build and browser validation

- `npm.cmd run lint`: pass (Windows uses npm.cmd to avoid the local PowerShell npm.ps1 policy).
- `npm.cmd run build`: pass; routes remain static (`/`, `/_not-found`, `/icon.png`, `/spine-test`). No bundle warnings emitted.
- `git diff --check`: pass.
- Production Chrome: preloader completion, visible hero/logo, spinal gallery rendering and photo open/close, Featured dialog containment, watery renderer proximity mount, Details lazy canvas/hover, Race Sequence advance, reel wrap, text-free cursor, and reachable outro pass.
- No failed image responses, broken DOM images, hydration/console errors, or WebGL exceptions observed.
- Instrumented Chrome draw calls confirmed the gallery stops drawing behind the static hero after readiness. Touch emulation confirms no custom cursor and the mobile DPR cap.
- Visual inspection covered screenshots of the hero, spinal gallery, Details, sequence, and reel; randomized particles/fragments are not suitable for exact pixel comparisons.

## Remaining costs and next opportunities

The largest generated JavaScript chunk is about 873 KiB uncompressed. The build also includes a roughly 703 KiB Draco JavaScript fallback and 279/188 KiB WASM decoders; presence in build output does not mean every variant is downloaded on the normal WASM path. These are retained to preserve the WebGL experience. There is no measured before/after FPS or Core Web Vitals claim.

The hero still prepares 75 desktop/40 mobile fragment canvases. The gallery intentionally starts loading before entry, includes physical transmission, a fluid simulation, refraction rendering, bloom, and generated environment maps. Those dominate runtime cost more than the small race JPEGs. Further reductions need device profiling and a deliberate visual-quality decision. The full gallery texture set is still loaded during/near the hero, but only the first two gate entrance.

## Files changed

- `next.config.ts`: mutable-asset cache headers and logo exception.
- `app/page.tsx`: early gallery resource hints and SSR-preserving section splitting.
- `components/loading/criticalAssets.ts`, `Preloader.tsx`: narrowed readiness and removal of duplicate hero decoding.
- `components/hero/HeroSection.tsx`, `DisintegrationCanvas.tsx`: matching raw hero request, preload/load signals and CORS modes.
- `components/gallery/GalleryScene.tsx`, `SpinalGallery.tsx`: staged texture loading and bounded/visible rendering.
- `lib/loadSpineGeometry.ts`, `components/experience/SpineMesh.tsx`: cached decoding and owned-resource cleanup.
- `components/background/WateryBackground.tsx`, `components/featured/FeaturedBackground.tsx`: pause behavior, cheaper pointer handling, mobile DPR and shared texture cache keys.
- `components/images/LiquidImage.tsx`, new `LiquidCanvas.tsx`: lazy renderer split and responsive image sizes.
- `components/featured/ProjectCard.tsx`: image sizes and delayed RGB-image URLs.
- New `components/performance/deviceState.ts`: hydration-safe visibility/mobile subscriptions with cleanup.
- This audit report. No stylesheet or font changes.
