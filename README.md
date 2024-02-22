# prisma-migratiopn

To install dependencies:

```bash
bun install
```

To run:

```bash
dropdb demo-wasp-schema && bun prisma migrate dev > /dev/null && time bun dummy.ts && time node build.mjs transaction
```
