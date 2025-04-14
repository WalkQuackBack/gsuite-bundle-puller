import postcss from "postcss";

// Helpers
// Helper function to normalize color values
const normalizeColor = (value: string): string => {
    value = value.toLowerCase().trim();
    if (value === "currentColor") return "currentcolor";
    return value;
};

// Helper function to determine if a string is a color.
const isColor = (value: string): boolean => {
    if (!value) return false;
    // Simplified regex for hex, rgb, rgba, hsl, hsla.
    return /^#([0-9a-f]{3,8})$|^rgb(a)?\(\s*(\d{1,3}%?)\s*,\s*(\d{1,3}%?)\s*,\s*(\d{1,3}%?)\s*(,\s*(\d*(?:\.\d+)?)\s*)?\)$|^hsl(a)?\(\s*(\d{0,360})\s*,\s*(\d{1,3}%)?\s*,\s*(\d{1,3}%)\s*(,\s*(\d*(?:\.\d+)?)\s*)?\)$/i
        .test(value) ||
        value.toLowerCase() === "transparent" ||
        value.toLowerCase() === "currentcolor" ||
        value.toLowerCase() === "inherit";
};

async function generateColorTable(css: string): Promise<string> {
    try {
        const root = await postcss.parse(css);
        const colorOccurrences: Record<
            string,
            { uniqueValues: Set<string>; classes: Set<string> }
        > = {};

        // Function to extract color values from a CSS value string
        const extractColors = (value: string, parentRuleSelector: string) => {
            const colorRegex =
                /#([0-9a-f]{3,8})|rgb(a)?\(\s*(\d{1,3}%?)\s*,\s*(\d{1,3}%?)\s*,\s*(\d{1,3}%?)\s*(,\s*(\d*(?:\.\d+)?)\s*)?\)|hsl(a)?\(\s*(\d{0,360})\s*,\s*(\d{1,3}%)?\s*,\s*(\d{1,3}%)\s*(,\s*(\d*(?:\.\d+)?)\s*)?|transparent|currentcolor|inherit/gi;
            let match;
            while ((match = colorRegex.exec(value)) !== null) {
                const colorValue = normalizeColor(match[0]);
                if (isColor(colorValue)) {
                    updateColorData(colorValue, match[0], parentRuleSelector);
                }
            }
        };

        const updateColorData = (
            hex: string,
            value: string,
            className: string,
        ) => {
            if (!colorOccurrences[hex]) {
                colorOccurrences[hex] = {
                    uniqueValues: new Set(),
                    classes: new Set(),
                };
            }
            colorOccurrences[hex].uniqueValues.add(value);
            colorOccurrences[hex].classes.add(className);
        };

        // Walk through the AST and find color declarations
        root.walk((node) => {
            let parentRuleSelector = "";
            if (node.type === "rule") {
                parentRuleSelector = node.selector; // Store selector for current rule
                node.walk((childNode) => {
                    if (childNode.type === "decl" && childNode.value) {
                        extractColors(childNode.value, parentRuleSelector);
                    }
                });
            } else if (node.type === "decl" && node.value) {
                // Handle declarations outside of rules (if any)
                parentRuleSelector = "";
                extractColors(node.value, parentRuleSelector);
            }
        });

        // Generate Markdown table
        let markdownTable = `| Hex | Unique selectors | Uses |\n`;
        markdownTable +=
            `| :--------------------------------------- | :--------------------------------------- | :--------------------------------------- |\n`;

        for (
            const [hex, { uniqueValues, classes }] of Object.entries(
                colorOccurrences,
            )
        ) {
            const uniqueValuesString = Array.from(uniqueValues).join(", ");
            const classesString = Array.from(classes).join(", ");
            markdownTable +=
                `| ${hex} | ${uniqueValuesString} | ${classesString} |\n`;
        }

        return markdownTable;
    } catch (error) {
        console.error("Error parsing CSS or generating table:", error);
        return "Error generating color table.";
    }
}

export async function generateColorList(css: string): Promise<string> {
    try {
        const root = await postcss.parse(css);
        const uniqueColors = new Set<string>();

        // Function to extract color values from a CSS value string
        const extractColors = (value: string) => {
            const colorRegex =
                /#([0-9a-f]{3,8})|rgb(a)?\(\s*(\d{1,3}%?)\s*,\s*(\d{1,3}%?)\s*,\s*(\d{1,3}%?)\s*(,\s*(\d*(?:\.\d+)?)\s*)?\)|hsl(a)?\(\s*(\d{0,360})\s*,\s*(\d{1,3}%)?\s*,\s*(\d{1,3}%)\s*(,\s*(\d*(?:\.\d+)?)\s*)?|transparent|currentcolor|inherit/gi;
            let match;
            while ((match = colorRegex.exec(value)) !== null) {
                const colorValue = normalizeColor(match[0]);
                if (isColor(colorValue)) {
                    uniqueColors.add(colorValue);
                }
            }
        };

        // Walk through the AST and find color declarations
        root.walk((node) => {
            if (node.type === "decl" && node.value) {
                extractColors(node.value);
            }
        });

        // Convert the Set to an array and return.
        return Array.from(uniqueColors).map((value: string) => {
            return `- ${value}`;
        }).join("\n");
    } catch (error) {
        console.error("Error parsing CSS or extracting colors:", error);
        return "";
    }
}

export async function generateMdFromStyle(
    css: string,
    siteName: string,
): Promise<string> {
    let mdFile: String[] = [];
    mdFile.push(`# Generated markdown file colour index for ${siteName}`);

    mdFile.push(`## List of unique colors`);
    mdFile.push(await generateColorList(css));

    mdFile.push(`## Colour table`);
    mdFile.push(await generateColorTable(css));
    return mdFile.join("\n\n");
}
