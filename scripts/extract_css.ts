import puppeteer, { Browser, HTTPResponse, Page } from "puppeteer";
import * as fs from "node:fs/promises";
import path from "path";

import { formatCSS } from "./format_css.ts";
import { themeCSS } from "./theme_colors.ts";
import { generateMdFromStyle } from "./output_colours_to_md.ts";
import chalk from "chalk";
import { trimCss } from "./trim_css.ts";
import CleanCSS from "clean-css";
import lessCalcWorkaround from "./lib/less_calc_workaround.ts";

const ANSI_PURPLE = 171;

const cCssInstance = new CleanCSS({
    format: "beautify",
});

async function extractCss(url: string, logSuffix: string) {
    let browser: Browser | null = null;

    console.log(chalk.yellow("⏳ loading main page..."), logSuffix);

    try {
        browser = await puppeteer.launch({
            args: ["--lang=en-US,en"],
        });
        const page: Page = await browser.newPage();

        await page.goto(url, { waitUntil: "networkidle2" });

        console.log(chalk.blue("📄 loaded main page"), logSuffix);

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
                        logSuffix,
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
                            `\n/*! External stylesheet "${stylesheet.href}" */\n${stylesheetContent}\n`;
                    }

                    console.log(
                        chalk.ansi256(ANSI_PURPLE)(
                            `🔗 loaded external stylesheet`,
                        ),
                        // chalk.blueBright(`${stylesheet.href}`),
                        logSuffix,
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
                cssContent += `\n/*! Inline stylesheet\nData-Href: ${
                    styleTag.href ?? "N/A"
                } */\n\n${styleTag.content}\n`;
            }
        }
        return cssContent
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

async function saveCss(
    cssContent: string,
    outputDir: string,
    outputFilename: string = `dump`,
    siteName: string,
): Promise<string> {
    const markdownTable = await generateMdFromStyle(cssContent, siteName);
    cssContent = cCssInstance.minify(cssContent).styles;
    cssContent = await formatCSS(cssContent);

    const themedCss =
        await themeCSS(cssContent);

    await fs.mkdir(outputDir, { recursive: true });

    await fs.writeFile(
        path.join(outputDir, outputFilename + "-GOOGLE.css"),
        cssContent,
    );
    await fs.writeFile(
        path.join(outputDir, outputFilename + "-themed.css"),
        themedCss,
    );
    await fs.writeFile(
        path.join(outputDir, outputFilename + "-index.md"),
        markdownTable,
    );

    console.log(chalk.green(`💾 build saved to ${outputDir}`));
    return themedCss;
}

async function buildUserstyle(cssContent: string, linkedStyle: string, suffix: string) {
    const userstyleBuildTemplate = await fs.readFile(
        path.join(
            "styles",
            "templates",
            `${linkedStyle}`,
        ),
        "utf8",
    );

    const userstyleBuildOutput = path.join(
        "styles",
    );

    console.log(chalk.yellow(`\n⏳ minifying code...`), suffix);

    const output = await trimCss(cssContent);
    console.log(chalk.green(`\n🎨 minified code for userstyle`), suffix);

    const userstyle = userstyleBuildTemplate.replace('@charset "UTF-8;"', "")
        .replace(
            "/**** Generated code REPLACE ****/",
            output,
        );

    console.log(chalk.green(`🟦 templated userstyles`), suffix);

    console.log(
        chalk.blue(`\n💬 built userstyle size in bytes: `) +
            chalk.bold.ansi256(ANSI_PURPLE)(userstyle.length),
    );

    await fs.writeFile(
        path.join(userstyleBuildOutput, `${linkedStyle}`),
        userstyle,
    );

    console.log(
        chalk.green(`💾 saved userstyle to ${userstyleBuildOutput}`),
        suffix,
    );
}

async function buildSiteFromUrl(targetUrl: string, linkedStyles?: string[]) {
    const siteName = new URL(targetUrl).href;
    const suffix = chalk.bold(`${siteName} `);

    const webBuildOutputDirectory = path.join(
        "dist",
        siteName.replace(
            /[^a-zA-Z0-9_-]+/g,
            "_",
        ),
    );

    const extracted = await extractCss(targetUrl, suffix)

    const buildThemed = await saveCss(
        extracted,
        webBuildOutputDirectory,
        undefined,
        siteName,
    );

    if (!linkedStyles) {
        return;
    }

    for (const linkedStyles of templateTo) {
        await buildUserstyle(buildThemed, linkedStyles, suffix);
    }
}

async function buildSiteFromFile(targetFile: string, linkedStyle?: string) {
    const fileBuildOutputDirectory = path.join(
        "dist",
        targetFile,
    );
    const suffix = chalk.bold(`${targetFile} `);

    const sourceTemplate = await fs.readFile(
        path.join(
            "styles",
            "sources",
            `${targetFile}.css`,
        ),
        "utf8",
    );

    const buildThemed = await saveCss(
        sourceTemplate,
        fileBuildOutputDirectory,
        undefined,
        targetFile,
    );

    if (!linkedStyle) {
        return;
    }

    buildUserstyle(buildThemed, linkedStyle, suffix)
}

buildSiteFromUrl(
    "https://docs.google.com/document/d/1RDErYoVPRCvy2nRvWo8a1xa5m7NrxpWBzZirE97m_3g/",
    ["docseditor.user.less", "docseditor.user.css"],
);

buildSiteFromFile(
    "google-vids",
    ["vidseditor.user.less"],
);

buildSiteFromUrl(
    "https://play.google.com/store/games",
);

buildSiteFromUrl(
    "https://www.google.com/finance/",
);

buildSiteFromUrl(
    "https://news.google.com/",
);

buildSiteFromUrl(
    "https://trends.google.com/",
);

buildSiteFromUrl(
    "https://translate.google.com/",
    ["googletranslate.user.less"],
);

buildSiteFromUrl(
    "https://artsandculture.google.com",
);

buildSiteFromUrl(
    "https://chromewebstore.google.com/",
);
