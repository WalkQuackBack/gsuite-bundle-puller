import postcss, { Declaration, Root } from "postcss";

// Workaround for https://github.com/less/less.js/issues/3777

async function lessCalcWorkaround(css: string): Promise<string> {
    // Regular expression to find calc() expressions (improved for nested)
    const calcRegex =
        /(?<!['"])\bcalc\((?:[^()]|\((?:[^()]|\([^()]*\))*\))*\)(?![`"])/gi;

    const result = await postcss([
        (root: Root) => {
            root.walkDecls((decl: Declaration) => {
                if (calcRegex.test(decl.value)) {
                    // Only process declarations that contain calc()
                    decl.value = decl.value.replace(
                        calcRegex,
                        (match) => `"${match}"`,
                    );
                }
            });
        },
    ]).process(css, { from: undefined });
    return result.css;
}

export default lessCalcWorkaround;
