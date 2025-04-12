const colorIndex: Record<string, string> = {
    // "white": "var(--gm3-sys-color-surface)",
    "#fff": "var(--gm3-sys-color-surface-container)",
    "#ffffff": "var(--gm3-sys-color-surface-container)",

    "#f1f3f4":
        "color-mix(in oklab, var(--gm3-sys-color-surface-container), currentColor 8%)",
    "#e8eaed":
        "color-mix(in oklab, var(--gm3-sys-color-surface-container), currentColor 16%)",

    "#e8ebee": "color-mix(in oklab, transparent, currentColor 8%)",
    "#e1e3e6": "color-mix(in oklab, transparent, currentColor 16%)",

    "#444746": "var(--gm3-sys-color-on-surface-variant)",
    "#5f6368": "var(--gm3-sys-color-on-surface-variant)",
    "#5F6366": "var(--gm3-sys-color-on-surface-variant)",
    "#333": "var(--gm3-sys-color-on-surface-variant)",

    "#202124": "var(--gm3-sys-color-on-surface)",
    "rgba(0,0,0,.7)": "var(--gm3-sys-color-on-surface)",

    "#f9fbfd": "var(--gm3-sys-color-surface)",
    "#f0f4f9": "var(--gm3-sys-color-surface-container-low)",
    "#edf2fa": "var(--gm3-sys-color-surface-container-low)",

    "#c2e7ff": "var(--gm3-sys-color-primary-container)",
    "#001d35": "var(--gm3-sys-color-on-primary-container)",

    "#d3e3fd": "var(--gm3-sys-color-secondary-container)",
    "#e8f0fe": "var(--gm3-sys-color-secondary-container)",
    "#041e49": "var(--gm3-sys-color-on-secondary-container)",

    "#15c": "var(--gm3-sys-color-primary)",
    "#4285f4": "var(--gm3-sys-color-primary)",

    "#ff0000": "red",
};

async function findAndReplaceColors(inputCss: string): Promise<string> {
    let css = inputCss;
    for (const key in colorIndex) {
        if (colorIndex.hasOwnProperty(key)) {
            const value = colorIndex[key];
            const regex = new RegExp(key, "g");
            css = css.replace(regex, value);
        }
    }
    return css;
}

export function themeCSS(css: string): Promise<string> {
    return findAndReplaceColors(css);
}
