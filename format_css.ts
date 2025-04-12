import postcss, { Root, Rule } from "postcss";
import { transform } from "lightningcss";

const colorProperties: Set<string> = new Set([
    "background-color",
    "border-color",
    "border-top-color",
    "border-right-color",
    "border-bottom-color",
    "border-left-color",
    "caret-color",
    "color",
    "column-rule-color",
    "fill",
    "outline-color",
    "stop-color",
    "stroke",
    "text-decoration-color",
    "text-emphasis-color",
    "box-shadow",
    "text-shadow",
    "background",
    "border",
    "border-top",
    "border-right",
    "border-bottom",
    "border-left",
    "flood-color",
    "lighting-color",
    "scrollbar-color",
    "background-image",
    // "list-style-image", // Can contain gradients.
    // "content", // can contain gradients with the image() function
    // "mask-image", // Can contain gradients.
    // "mask", // shorthand for mask-image and other mask properties.
    // "offset-path", // Can contain gradients when used with url() and svg.
]);

const postcssFilterColor = () => {
    return (root: Root) => {
        root.walkRules((rule: Rule) => {
            rule.walkDecls((decl, i) => {
                if (!colorProperties.has(decl.prop)) {
                    decl.remove();
                }
            });
            if (!rule.nodes?.length) {
                rule.remove();
            }
        });
    };
};

async function filterAndFormatCSS(css: string): Promise<string> {
    try {
        // 1. Process with PostCSS to filter
        const processed = await postcss()
            .use(postcssFilterColor())
            .process(css, { from: undefined });
        const filteredCSS = processed.css;

        // 2. Beautify with Lightning CSS
        // const pretty = transform({
        //     code: Buffer.from(filteredCSS),
        //     filename: "style.css",
        //     minify: false,
        //     sourceMap: false,
        // }).code.toString();

        // return pretty;
        return processed.css;
    } catch (error) {
        console.error("Error processing CSS:", error);
        return css;
    }
}

export function formatCSS(css: string): Promise<string> {
    return filterAndFormatCSS(css);
}
