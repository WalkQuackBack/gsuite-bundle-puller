import postcss, { AtRule, Declaration, Root, Rule } from "postcss";
import CleanCSS from "clean-css";
import chalk from "chalk";

const postcssTrimCss = () => {
    return (root: Root) => {
        root.walkDecls((decl: Declaration) => {
            if (decl.value.includes("var(") || decl.value.includes("--")) {
                return;
            } else {
                decl.remove();
            }
        });
        root.walkAtRules("charset", (atRule: AtRule) => {
            atRule.remove();
        });
    };
};

const cCssInstance = new CleanCSS({
    format: "keep-breaks",
    level: {
        2: {
            all: true,
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
