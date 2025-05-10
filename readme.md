# google css bundle puller

Work in progress, builds may be broken or not work.

## Get the prebuilt files

They should be under /styles, not /styles/templates

## Developing locally

### prerequisites

- node.js
- pnpm

Install necessary files

```bash
pnpm install
```

Install a browser to use with Puppeteer, for example

```bash
npx puppeteer browsers install chrome
```

### Live reload development

WIP

### building generated CSS

run

```bash
pnpm build-all
```

output files will be in /dist/\<time>/\<url>
