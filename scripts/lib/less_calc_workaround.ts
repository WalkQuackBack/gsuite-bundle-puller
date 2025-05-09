import { Declaration, Root } from "postcss";

// Workaround for https://github.com/less/less.js/issues/3777

const lessCalcWorkaround = () => {
  return (root: Root, result) => {
    root.walkDecls((decl: Declaration) => {
      // Check if the declaration value contains 'calc('
      if (decl.value.includes('calc(')) {
        // Wrap the entire declaration value with e("...")
        decl.value = `e("${decl.value}")`;
      }
    });
  };
};

export default lessCalcWorkaround;
