import postcss, { AtRule, Declaration, Root, Rule } from "postcss";
import CleanCSS from "clean-css";
import chalk from "chalk";

const vendorPrefixRegex = /^-\w+-|::-\w+/;

const postcssTrimCss = () => {
    return (root: Root) => {
        root.walkDecls((decl: Declaration) => {
            if (decl.value.includes("var(") || decl.value.includes("--")) {
                return;
            } else {
                decl.remove();
            }
        });
        root.walkAtRules((node: Root | AtRule) => {
            node.walkRules((rule: Rule) => {
                // Remove rules with vendor prefixes in the selector
                rule.selectors = rule.selectors.filter((selector) =>
                    !vendorPrefixRegex.test(selector.trim())
                );
            });
        });
        root.walkAtRules("charset", (atRule: AtRule) => {
            atRule.remove();
        });
    };
};

const cCssInstance = new CleanCSS({
    format: "beautify",
    level: {
        1: {
            cleanupCharsets: false,
            normalizeUrls: true,
            optimizeBackground: true,
            optimizeBorderRadius: true,
            optimizeFilter: true,
            optimizeFont: true,
            optimizeFontWeight: true,
            optimizeOutline: true,

            removeEmpty: true,
            removeNegativePaddings: true,
            removeQuotes: true,
            removeWhitespace: true,

            replaceMultipleZeros: true,
            replaceTimeUnits: true,
            replaceZeroUnits: true,

            roundingPrecision: false,
            selectorsSortingMethod: "standard",
            specialComments: "all",

            tidyAtRules: false,
            tidyBlockScopes: false,
            tidySelectors: false,
        },
    },
});

export const trimCss = async (css: string): Promise<string> => {
    try {
        const processed = await postcss()
            .use(postcssTrimCss())
            .process(css, { from: undefined });
        const filteredCSS = processed.css;

        const pretty = cCssInstance.minify(filteredCSS);
        console.log(
            chalk.blue("💬 minified with stats:\n"),
            pretty.stats,
        );
        return pretty.styles;
    } catch (error) {
        console.error("Error processing CSS:", error);
        return css;
    }
};
