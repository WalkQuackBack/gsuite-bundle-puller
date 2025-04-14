import postcss, { Root, Rule } from "postcss";

const colorProperties: Set<string> = new Set([
    "background-color",
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
    "border-color",
    "border-top-color",
    "border-right-color",
    "border-bottom-color",
    "border-left-color",

    "outline",
    "outline-top",
    "outline-right",
    "outline-bottom",
    "outline-left",
    "outline-color",
    "outline-top-color",
    "outline-right-color",
    "outline-bottom-color",
    "outline-left-color",

    "flood-color",
    "lighting-color",
    "scrollbar-color",
    "background-image",
    // Commented to decrease scope bloating
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
        // Process with PostCSS to filter
        const processed = await postcss()
            .use(postcssFilterColor())
            .process(css, { from: undefined });
        const filteredCSS = processed.css;
        return filteredCSS;
    } catch (error) {
        console.error("Error processing CSS:", error);
        return css;
    }
}

export function formatCSS(css: string): Promise<string> {
    return filterAndFormatCSS(css);
}
