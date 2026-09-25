# Contributing to Invoice Generator

Contributions are welcome across calculations, print layout, accessibility, documentation, and international formatting.

Run before opening a pull request:

```bash
pnpm install
pnpm check
pnpm build
pnpm format
```

Test zero values, decimals, large quantities, 0–100% discount, tax changes, removing the final item, and browser print preview. Keep financial calculations transparent and avoid adding payment or data-storage integrations without an explicit design and privacy review.

Do not commit real client information, addresses, tax identifiers, invoices, or secrets. Use synthetic examples.
