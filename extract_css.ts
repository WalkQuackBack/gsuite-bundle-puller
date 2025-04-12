import puppeteer, { Browser, HTTPResponse, Page } from "puppeteer";
import * as fs from "node:fs/promises";
import path from "path";

import { formatCSS } from "./format_css.ts";
import { themeCSS } from "./theme_colors.ts";
import { generateMdFromStyle } from "./output_colours_to_md.ts";
import chalk from "chalk";

async function extractAndSaveCSS(
    url: string,
    outputDir: string,
    outputFilename: string = `build`,
    siteName: string,
): Promise<void> {
    let browser: Browser | null = null;

    const suffix = chalk.bold(`${siteName} `);

    console.log(chalk.yellow("⏳ loading main page..."), suffix);

    try {
        browser = await puppeteer.launch();
        const page: Page = await browser.newPage();

        await page.goto(url, { waitUntil: "networkidle2" });

        console.log(chalk.blue("📄 loaded main page"), suffix);

        const stylesheets: { href: string | null }[] = await page.$$eval(
            'link[rel="stylesheet"]',
            (links: any[]) =>
                links.map((link: any) => ({ href: link.getAttribute("href") })),
        );

        const styleTags = await page.$$eval(
            "style",
            (styles: any[]) =>
                styles.map((style: any) => ({
                    content: style.textContent,
                    href: style.getAttribute("data-href"),
                })),
        );

        let cssContent = "";

        for (const stylesheet of stylesheets) {
            if (stylesheet.href) {
                try {
                    console.log(
                        chalk.yellow(`⏳ loading external stylesheet`),
                        // chalk.blueBright(`${stylesheet.href}`),
                        suffix,
                    );

                    const absoluteUrl: string =
                        new URL(stylesheet.href, url).href;
                    const response: HTTPResponse | null = await page.goto(
                        absoluteUrl,
                        { waitUntil: "domcontentloaded" },
                    );
                    if (response) {
                        const stylesheetContent: string = await response.text();
                        cssContent +=
                            `\n/** External stylesheet "${stylesheet.href}" */\n${stylesheetContent}\n`;
                    }

                    console.log(
                        chalk.ansi256(171)(`🔗 loaded external stylesheet`),
                        // chalk.blueBright(`${stylesheet.href}`),
                        suffix,
                    );
                } catch (error) {
                    console.error(
                        `Error fetching stylesheet ${stylesheet.href}:`,
                        error,
                    );
                }
            }
        }

        for (const styleTag of styleTags) {
            if (styleTag.content) {
                cssContent += `\n/** Inline stylesheet\nData-Href: ${
                    styleTag.href ?? "N/A"
                } */\n\n${styleTag.content}\n`;
            }
        }

        const markdownTable = await generateMdFromStyle(cssContent, siteName);
        cssContent = await formatCSS(cssContent);

        const themedCss = await themeCSS(cssContent);

        await fs.mkdir(outputDir, { recursive: true });

        await fs.writeFile(
            path.join(outputDir, outputFilename + ".css"),
            cssContent,
        );
        await fs.writeFile(
            path.join(outputDir, outputFilename + Date.now() + "-themed.css"),
            themedCss,
        );
        await fs.writeFile(
            path.join(outputDir, outputFilename + "-index.md"),
            markdownTable,
        );

        console.log(chalk.green(`💾 build saved to ${outputDir}`));
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

async function extractFromSite(targetUrl: string) {
    const siteName = new URL(targetUrl).href;
    const outputDirectory = path.join(
        "dist",
        siteName.replace(
            /[^a-zA-Z0-9_-]+/g,
            "_",
        ),
    );

    const prefix = chalk.bold(`${siteName} `);

    await extractAndSaveCSS(targetUrl, outputDirectory, undefined, siteName)
        .catch((error) =>
            console.error(chalk.red(prefix, "building failed!", error))
        );
}

extractFromSite(
    "https://docs.google.com/document/d/1RDErYoVPRCvy2nRvWo8a1xa5m7NrxpWBzZirE97m_3g/",
);
extractFromSite(
    "https://docs.google.com/presentation/d/1-jVYOX5SuCT9hU9sOKgPEMOJ5W6X3bWD5SnMm7Kz6Sc/",
);
