import { JSDOM } from "jsdom";

async function main(): Promise<void> {
  const response = await fetch("https://remoty.work/jobs/61840/");
  const html = await response.text();
  const document = new JSDOM(html).window.document;
  const text = (document.body.textContent ?? "").replace(/\s+/g, " ").trim();
  const companyLinks = [...document.querySelectorAll<HTMLAnchorElement>('a[href^="/companies/"]')]
    .map((link) => ({ href: link.href, text: link.textContent?.trim() }));
  const outsideLinks = [...document.querySelectorAll<HTMLAnchorElement>('a[href^="https://"]')]
    .filter((link) => !new URL(link.href).hostname.endsWith("remoty.work"))
    .map((link) => ({ href: link.href, text: link.textContent?.trim() }))
    .slice(0, 12);
  console.log(JSON.stringify({
    status: response.status,
    h1: document.querySelector("h1")?.textContent?.trim(),
    title: document.title,
    companyLinks,
    outsideLinks,
    start: text.slice(0, 1200),
  }, null, 2));
}

void main();
