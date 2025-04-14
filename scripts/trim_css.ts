import { Declaration, Root } from "postcss";

const postcssTrimNonVars = () => {
    return (root: Root) => {
        root.walkDecls((decl: Declaration) => {
            if (decl.value.includes("var(") || decl.value.includes("--")) {
                return;
            } else {
                decl.remove();
            }
        });
    };
};
