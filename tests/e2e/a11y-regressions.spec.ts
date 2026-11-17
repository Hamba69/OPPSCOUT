import { expect, test, type Page } from "@playwright/test";

/**
 * Focused regression checks for the two major accessibility audit findings:
 *   1. Keyboard focus must stay visible in forced-colours (high-contrast) mode.
 *   2. Category tiles and headings must not overflow or overlap at 200% text size or zoom.
 *
 * Every check first confirms it actually reached the page under test. A redirect to a
 * login page fails loudly as "not tested" instead of passing silently.
 */

// "/" redirects signed-in users to their home; ?unlock=1 keeps the public landing page.
const TILE_PAGES = ["/?unlock=1"];

async function openOrFail(page: Page, path: string) {
  const response = await page.goto(path);
  const finalPath = new URL(page.url()).pathname;
  if (/\/(login|signin|sign-in|auth)\b/.test(finalPath)) {
    throw new Error(`NOT TESTED: ${path} redirected to ${finalPath} (login). Sign in before running this check.`);
  }
  expect(response?.ok(), `${path} returned ${response?.status()}`).toBeTruthy();
}

async function tabTo(page: Page, selector: string, maxTabs = 40) {
  for (let i = 0; i < maxTabs; i += 1) {
    await page.keyboard.press("Tab");
    if (await page.evaluate((s) => document.activeElement?.matches(s) ?? false, selector)) return;
  }
  throw new Error(`Could not reach ${selector} with the keyboard in ${maxTabs} tabs`);
}

for (const path of TILE_PAGES) {
  test.describe(`a11y regressions on ${path}`, () => {
    test("category tile shows a real outline on keyboard focus in forced-colours mode", async ({ page }) => {
      await page.emulateMedia({ forcedColors: "active" });
      await openOrFail(page, path);
      await tabTo(page, ".tile");
      const outline = await page.evaluate(() => {
        const style = getComputedStyle(document.activeElement as Element);
        return { style: style.outlineStyle, width: parseFloat(style.outlineWidth) };
      });
      // box-shadow is discarded in forced-colours mode, so an outline is the only reliable indicator.
      expect(outline.style).not.toBe("none");
      expect(outline.width).toBeGreaterThanOrEqual(2);
    });

    const scenarios = [
      { name: "200% root text size", viewport: { width: 390, height: 844 }, rootSize: "200%" },
      { name: "200% browser zoom (1280px window)", viewport: { width: 640, height: 400 }, rootSize: null },
    ];

    for (const scenario of scenarios) {
      test(`tiles and headings fit at ${scenario.name}`, async ({ page }) => {
        await page.setViewportSize(scenario.viewport);
        await openOrFail(page, path);
        if (scenario.rootSize) {
          await page.addStyleTag({ content: `html { font-size: ${scenario.rootSize} !important; }` });
        }
        const result = await page.evaluate(() => {
          const rect = (el: Element) => el.getBoundingClientRect();
          const tiles = [...document.querySelectorAll(".tile")];
          const tileOverflow = tiles
            .filter((t) => t.scrollHeight > t.clientHeight + 1 || t.scrollWidth > t.clientWidth + 1)
            .map((t) => t.textContent?.trim());
          const tileRects = tiles.map(rect);
          const tileOverlap: string[] = [];
          tileRects.forEach((a, i) => tileRects.slice(i + 1).forEach((b, j) => {
            if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1) {
              tileOverlap.push(`${tiles[i].textContent?.trim()} / ${tiles[i + j + 1].textContent?.trim()}`);
            }
          }));
          const headingOverflow = [...document.querySelectorAll("h1, h2, h3")]
            .filter((h) => h.scrollWidth > h.clientWidth + 1 || rect(h).right > document.documentElement.clientWidth + 1)
            .map((h) => h.textContent?.trim());
          return {
            tileCount: tiles.length,
            tileOverflow,
            tileOverlap,
            headingOverflow,
            pageScrollsSideways: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
          };
        });
        expect(result.tileCount, "no category tiles found: page did not render as expected").toBeGreaterThan(0);
        expect(result.tileOverflow, "tile content overflows its card").toEqual([]);
        expect(result.tileOverlap, "tiles overlap each other").toEqual([]);
        expect(result.headingOverflow, "headings overflow their box").toEqual([]);
        expect(result.pageScrollsSideways, "page scrolls horizontally").toBe(false);
      });
    }
  });
}
