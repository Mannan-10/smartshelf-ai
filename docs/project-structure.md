# SmartShelf AI Project Structure

This tree shows the main source-controlled project layout. Generated and dependency folders such as `node_modules`, `.next`, `dist`, and generated Prisma client output are omitted.

```text
smartshelf-ai/
|-- package.json
|-- package-lock.json
|-- docs/
|   `-- project-structure.md
|-- apps/
|   |-- backend/
|   |   |-- package.json
|   |   |-- README.md
|   |   |-- nest-cli.json
|   |   |-- eslint.config.mjs
|   |   |-- prisma.config.ts
|   |   |-- tsconfig.json
|   |   |-- tsconfig.build.json
|   |   |-- prisma/
|   |   |   |-- schema.prisma
|   |   |   `-- migrations/
|   |   |       |-- migration_lock.toml
|   |   |       |-- 20260609123708_init/
|   |   |       |   `-- migration.sql
|   |   |       |-- 20260609144523_add_user_auth/
|   |   |       |   `-- migration.sql
|   |   |       |-- 20260609172138_add_user_schema/
|   |   |       |   `-- migration.sql
|   |   |       |-- 20260611161704_add_categories_products_crud/
|   |   |       |   `-- migration.sql
|   |   |       |-- 20260617075255_add_vendors/
|   |   |       |   `-- migration.sql
|   |   |       `-- 20260625100049_add_purchase_orders_stock_movements/
|   |   |           `-- migration.sql
|   |   |-- src/
|   |   |   |-- main.ts
|   |   |   |-- app.module.ts
|   |   |   |-- app.controller.ts
|   |   |   |-- app.controller.spec.ts
|   |   |   |-- app.service.ts
|   |   |   |-- prisma.module.ts
|   |   |   |-- prisma.service.ts
|   |   |   |-- admin/
|   |   |   |   |-- admin.controller.ts
|   |   |   |   `-- admin.module.ts
|   |   |   |-- auth/
|   |   |   |   |-- auth.controller.ts
|   |   |   |   |-- auth.module.ts
|   |   |   |   |-- auth.service.ts
|   |   |   |   |-- auth.service.spec.ts
|   |   |   |   |-- jwt-payload.type.ts
|   |   |   |   |-- jwt.strategy.ts
|   |   |   |   `-- dto/
|   |   |   |       |-- login.dto.ts
|   |   |   |       `-- register.dto.ts
|   |   |   |-- categories/
|   |   |   |   |-- categories.controller.ts
|   |   |   |   |-- categories.module.ts
|   |   |   |   |-- categories.service.ts
|   |   |   |   `-- dto/
|   |   |   |       |-- create-category.dto.ts
|   |   |   |       `-- update-category.ts
|   |   |   |-- common/
|   |   |   |   |-- decorators/
|   |   |   |   |   `-- roles.decorator.ts
|   |   |   |   |-- enums/
|   |   |   |   |   `-- role.enum.ts
|   |   |   |   `-- guards/
|   |   |   |       |-- jwt-auth.guard.ts
|   |   |   |       `-- roles.guard.ts
|   |   |   |-- products/
|   |   |   |   |-- products.controller.ts
|   |   |   |   |-- products.module.ts
|   |   |   |   |-- products.service.ts
|   |   |   |   |-- products.service.spec.ts
|   |   |   |   `-- dto/
|   |   |   |       |-- create-product.dto.ts
|   |   |   |       `-- update-product.dto.ts
|   |   |   |-- purchases/
|   |   |   |   |-- purchases.controller.ts
|   |   |   |   |-- purchases.module.ts
|   |   |   |   |-- purchases.service.ts
|   |   |   |   `-- dto/
|   |   |   |       |-- create-purchase-item.dto.ts
|   |   |   |       `-- create-purchase.dto.ts
|   |   |   `-- vendors/
|   |   |       |-- vendors.controller.ts
|   |   |       |-- vendors.module.ts
|   |   |       |-- vendors.service.ts
|   |   |       `-- dto/
|   |   |           |-- create-vendor.dto.ts
|   |   |           `-- update-vendor.dto.ts
|   |   `-- test/
|   |       |-- app.e2e-spec.ts
|   |       `-- jest-e2e.json
|   `-- frontend/
|       |-- package.json
|       |-- README.md
|       |-- components.json
|       |-- eslint.config.mjs
|       |-- middleware.ts
|       |-- next.config.ts
|       |-- postcss.config.mjs
|       |-- tailwind.config.ts
|       |-- tsconfig.json
|       |-- public/
|       |   |-- file.svg
|       |   |-- globe.svg
|       |   |-- next.svg
|       |   |-- vercel.svg
|       |   `-- window.svg
|       `-- src/
|           |-- proxy.ts
|           |-- app/
|           |   |-- favicon.ico
|           |   |-- globals.css
|           |   |-- layout.tsx
|           |   |-- page.tsx
|           |   |-- admin/
|           |   |   `-- page.tsx
|           |   |-- api/
|           |   |   |-- admin/
|           |   |   |   `-- overview/
|           |   |   |       `-- route.ts
|           |   |   |-- categories/
|           |   |   |   `-- route.ts
|           |   |   |-- products/
|           |   |   |   |-- route.ts
|           |   |   |   `-- [id]/
|           |   |   |       `-- route.ts
|           |   |   `-- vendors/
|           |   |       |-- route.ts
|           |   |       `-- [id]/
|           |   |           `-- route.ts
|           |   |-- auth/
|           |   |   |-- login/
|           |   |   |   `-- route.ts
|           |   |   |-- logout/
|           |   |   |   `-- route.ts
|           |   |   |-- me/
|           |   |   |   `-- route.ts
|           |   |   `-- register/
|           |   |       `-- route.ts
|           |   |-- dashboard/
|           |   |   `-- page.tsx
|           |   |-- login/
|           |   |   `-- page.tsx
|           |   |-- products/
|           |   |   `-- page.tsx
|           |   |-- register/
|           |   |   `-- page.tsx
|           |   `-- vendors/
|           |       `-- page.tsx
|           |-- components/
|           |   |-- app-shell.tsx
|           |   |-- products/
|           |   |   |-- add-product-dialog.tsx
|           |   |   |-- edit-product-dialog.tsx
|           |   |   |-- product-form.tsx
|           |   |   |-- product-table.tsx
|           |   |   `-- products-manager.tsx
|           |   |-- ui/
|           |   |   |-- alert.tsx
|           |   |   |-- badge.tsx
|           |   |   |-- button.tsx
|           |   |   |-- card.tsx
|           |   |   |-- dialog.tsx
|           |   |   |-- form.tsx
|           |   |   |-- input.tsx
|           |   |   |-- label.tsx
|           |   |   |-- logout-button.tsx
|           |   |   |-- select.tsx
|           |   |   `-- table.tsx
|           |   `-- vendors/
|           |       |-- add-vendor-dialog.tsx
|           |       |-- edit-vendor-dialog.tsx
|           |       |-- vendor-form.tsx
|           |       |-- vendor-table.tsx
|           |       `-- vendors-manager.tsx
|           |-- hooks/
|           |   `-- useAuth.ts
|           |-- lib/
|           |   |-- api-client.ts
|           |   |-- auth-config.ts
|           |   |-- backend-api.ts
|           |   |-- products-api.ts
|           |   |-- rbac.ts
|           |   |-- utils.ts
|           |   |-- vendors-api.ts
|           |   |-- api/
|           |   |   `-- forward-backend-response.ts
|           |   |-- auth/
|           |   |   |-- current-user.ts
|           |   |   `-- jwt.ts
|           |   `-- validation/
|           |       |-- authSchema.ts
|           |       |-- product-schema.ts
|           |       `-- vendor-schema.ts
|           `-- types/
|               |-- product.ts
|               `-- vendor.ts
```
