import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma.service.js';

// ── Shared state across tests ─────────────────────────────────────────────────
let app: INestApplication;
let prisma: PrismaService;
let accessToken: string;
let productId: string;
let categoryId: string;
let vendorId: string;
let purchaseOrderId: string;
let saleId: string;

const TEST_EMAIL = `e2e-test-${Date.now()}@smartshelf.test`;
const TEST_PASSWORD = 'TestPassword123!';

// ── App bootstrap ─────────────────────────────────────────────────────────────
beforeAll(async () => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleFixture.createNestApplication();

  // Same pipes as main.ts
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  await app.init();
  prisma = moduleFixture.get<PrismaService>(PrismaService);
});

// ── Cleanup test data after all tests ─────────────────────────────────────────
afterAll(async () => {
  // Delete in FK-safe order
  await prisma.stockMovement.deleteMany({ where: { product: { name: { startsWith: 'E2E' } } } });
  await prisma.saleItem.deleteMany({ where: { product: { name: { startsWith: 'E2E' } } } });
  await prisma.sale.deleteMany({ where: { invoiceNumber: { startsWith: 'E2E-' } } });
  await prisma.purchaseOrderItem.deleteMany({ where: { product: { name: { startsWith: 'E2E' } } } });
  await prisma.productBatch.deleteMany({ where: { product: { name: { startsWith: 'E2E' } } } });
  await prisma.purchaseOrder.deleteMany({ where: { orderNumber: { startsWith: 'E2E-' } } });
  await prisma.product.deleteMany({ where: { name: { startsWith: 'E2E' } } });
  await prisma.category.deleteMany({ where: { name: { startsWith: 'E2E' } } });
  await prisma.vendor.deleteMany({ where: { name: { startsWith: 'E2E' } } });
  await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
  await app.close();
});

// ═════════════════════════════════════════════════════════════════════════════
// AUTH
// ═════════════════════════════════════════════════════════════════════════════
describe('Auth', () => {
  describe('POST /auth/register', () => {
    it('201 — registers a new user and returns accessToken', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'E2E User', email: TEST_EMAIL, password: TEST_PASSWORD })
        .expect(201);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.user.email).toBe(TEST_EMAIL);
      accessToken = res.body.accessToken;
    });

    it('409 — duplicate email returns ConflictException', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'E2E User', email: TEST_EMAIL, password: TEST_PASSWORD })
        .expect(409);
    });

    it('400 — missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: TEST_EMAIL })
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    it('200 — valid credentials return accessToken', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD })
        .expect(200);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.message).toBe('Login successful');
      accessToken = res.body.accessToken; // refresh token
    });

    it('401 — wrong password', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: TEST_EMAIL, password: 'wrongpassword' })
        .expect(401);
    });

    it('401 — non-existent email', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'nobody@example.com', password: TEST_PASSWORD })
        .expect(401);
    });

    it('400 — missing password field', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: TEST_EMAIL })
        .expect(400);
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// CATEGORIES (needed for product tests)
// ═════════════════════════════════════════════════════════════════════════════
describe('Categories', () => {
  describe('POST /categories', () => {
    it('201 — creates a category', async () => {
      const res = await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'E2E Category', description: 'Test category' })
        .expect(201);

      expect(res.body.name).toBe('E2E Category');
      categoryId = res.body.id;
    });

    it('401 — no token returns 401', async () => {
      await request(app.getHttpServer())
        .post('/categories')
        .send({ name: 'E2E No Auth' })
        .expect(401);
    });
  });

  describe('GET /categories', () => {
    it('200 — returns list of categories', async () => {
      const res = await request(app.getHttpServer())
        .get('/categories')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// PRODUCTS
// ═════════════════════════════════════════════════════════════════════════════
describe('Products', () => {
  describe('POST /products', () => {
    it('201 — creates a product', async () => {
      const res = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'E2E Product',
          sku: `E2E-SKU-${Date.now()}`,
          stock: 100,
          reorderLevel: 10,
          sellingPrice: 25.0,
          costPrice: 15.0,
          categoryId,
        })
        .expect(201);

      expect(res.body.name).toBe('E2E Product');
      expect(res.body.stock).toBe(100);
      productId = res.body.id;
    });

    it('409 — duplicate SKU returns conflict', async () => {
      await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'E2E Duplicate', sku: `E2E-SKU-FIXED`, stock: 10, reorderLevel: 5 })
        .expect(201);

      await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'E2E Duplicate 2', sku: `E2E-SKU-FIXED`, stock: 10, reorderLevel: 5 })
        .expect(409);
    });

    it('400 — missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'E2E No SKU' })
        .expect(400);
    });

    it('401 — no token', async () => {
      await request(app.getHttpServer())
        .post('/products')
        .send({ name: 'E2E No Auth', sku: 'E2E-NOAUTH', stock: 0, reorderLevel: 0 })
        .expect(401);
    });
  });

  describe('GET /products', () => {
    it('200 — returns array of products', async () => {
      const res = await request(app.getHttpServer())
        .get('/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('401 — no token', async () => {
      await request(app.getHttpServer()).get('/products').expect(401);
    });
  });

  describe('GET /products/:id', () => {
    it('200 — returns a single product', async () => {
      const res = await request(app.getHttpServer())
        .get(`/products/${productId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.id).toBe(productId);
    });

    it('404 — non-existent product', async () => {
      await request(app.getHttpServer())
        .get('/products/123e4567-e89b-12d3-a456-426614174000')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('PUT /products/:id', () => {
    it('200 — updates a product', async () => {
      const res = await request(app.getHttpServer())
        .put(`/products/${productId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'E2E Product Updated', stock: 90 })
        .expect(200);

      expect(res.body.name).toBe('E2E Product Updated');
      expect(res.body.stock).toBe(90);
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// VENDORS
// ═════════════════════════════════════════════════════════════════════════════
describe('Vendors', () => {
  describe('POST /vendors', () => {
    it('201 — creates a vendor', async () => {
      const res = await request(app.getHttpServer())
        .post('/vendors')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'E2E Vendor', contactName: 'Test Contact', phone: '9876543210' })
        .expect(201);

      expect(res.body.name).toBe('E2E Vendor');
      vendorId = res.body.id;
    });

    it('401 — no token', async () => {
      await request(app.getHttpServer()).post('/vendors').send({ name: 'E2E No Auth' }).expect(401);
    });
  });

  describe('GET /vendors', () => {
    it('200 — returns list of vendors', async () => {
      const res = await request(app.getHttpServer())
        .get('/vendors')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// PURCHASES
// ═════════════════════════════════════════════════════════════════════════════
describe('Purchases', () => {
  describe('POST /purchases', () => {
    it('201 — creates a purchase order and increments stock', async () => {
      const stockBefore = (
        await request(app.getHttpServer())
          .get(`/products/${productId}`)
          .set('Authorization', `Bearer ${accessToken}`)
      ).body.stock;

      const res = await request(app.getHttpServer())
        .post('/purchases')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          orderNumber: `E2E-PO-${Date.now()}`,
          vendorId,
          items: [{ productId, quantity: 20, unitCost: 15.0 }],
        })
        .expect(201);

      expect(res.body.totalAmount).toBeDefined();
      purchaseOrderId = res.body.id;

      // Verify stock incremented
      const stockAfter = (
        await request(app.getHttpServer())
          .get(`/products/${productId}`)
          .set('Authorization', `Bearer ${accessToken}`)
      ).body.stock;

      expect(stockAfter).toBe(stockBefore + 20);
    });

    it('400 — non-existent product in items', async () => {
      await request(app.getHttpServer())
        .post('/purchases')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ items: [{ productId: '123e4567-e89b-12d3-a456-426614174000', quantity: 5, unitCost: 10 }] })
        .expect(400);
    });

    it('400 — empty items array', async () => {
      await request(app.getHttpServer())
        .post('/purchases')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ items: [] })
        .expect(400);
    });

    it('401 — no token', async () => {
      await request(app.getHttpServer())
        .post('/purchases')
        .send({ items: [{ productId, quantity: 1, unitCost: 10 }] })
        .expect(401);
    });
  });

  describe('GET /purchases', () => {
    it('200 — returns list of purchase orders', async () => {
      const res = await request(app.getHttpServer())
        .get('/purchases')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  describe('GET /purchases/:id', () => {
    it('200 — returns a single purchase order', async () => {
      const res = await request(app.getHttpServer())
        .get(`/purchases/${purchaseOrderId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.id).toBe(purchaseOrderId);
      expect(res.body.items).toBeDefined();
    });

    it('404 — non-existent purchase order', async () => {
      await request(app.getHttpServer())
        .get('/purchases/123e4567-e89b-12d3-a456-426614174000')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// SALES
// ═════════════════════════════════════════════════════════════════════════════
describe('Sales', () => {
  describe('POST /sales', () => {
    it('201 — creates a sale and decrements stock', async () => {
      const stockBefore = (
        await request(app.getHttpServer())
          .get(`/products/${productId}`)
          .set('Authorization', `Bearer ${accessToken}`)
      ).body.stock;

      const res = await request(app.getHttpServer())
        .post('/sales')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          invoiceNumber: `E2E-INV-${Date.now()}`,
          items: [{ productId, quantity: 5, unitPrice: 25.0 }],
        })
        .expect(201);

      expect(res.body.totalAmount).toBeDefined();
      expect(res.body.items).toHaveLength(1);
      saleId = res.body.id;

      // Verify stock decremented
      const stockAfter = (
        await request(app.getHttpServer())
          .get(`/products/${productId}`)
          .set('Authorization', `Bearer ${accessToken}`)
      ).body.stock;

      expect(stockAfter).toBe(stockBefore - 5);
    });

    it('400 — insufficient stock', async () => {
      await request(app.getHttpServer())
        .post('/sales')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          items: [{ productId, quantity: 99999, unitPrice: 25.0 }],
        })
        .expect(400);
    });

    it('400 — non-existent product', async () => {
      await request(app.getHttpServer())
        .post('/sales')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ items: [{ productId: '123e4567-e89b-12d3-a456-426614174000', quantity: 1, unitPrice: 25 }] })
        .expect(400);
    });

    it('400 — empty items array', async () => {
      await request(app.getHttpServer())
        .post('/sales')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ items: [] })
        .expect(400);
    });

    it('401 — no token', async () => {
      await request(app.getHttpServer())
        .post('/sales')
        .send({ items: [{ productId, quantity: 1, unitPrice: 25 }] })
        .expect(401);
    });
  });

  describe('GET /sales', () => {
    it('200 — returns list of sales', async () => {
      const res = await request(app.getHttpServer())
        .get('/sales')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('401 — no token', async () => {
      await request(app.getHttpServer()).get('/sales').expect(401);
    });
  });

  describe('GET /sales/:id', () => {
    it('200 — returns a single sale', async () => {
      const res = await request(app.getHttpServer())
        .get(`/sales/${saleId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.id).toBe(saleId);
      expect(res.body.items).toBeDefined();
    });

    it('404 — non-existent sale', async () => {
      await request(app.getHttpServer())
        .get('/sales/123e4567-e89b-12d3-a456-426614174000')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// ALERTS
// ═════════════════════════════════════════════════════════════════════════════
describe('Alerts', () => {
  describe('GET /alerts/summary', () => {
    it('200 — returns lowStock, expiring, expired counts', async () => {
      const res = await request(app.getHttpServer())
        .get('/alerts/summary')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('lowStock');
      expect(res.body).toHaveProperty('expiring');
      expect(res.body).toHaveProperty('expired');
      expect(typeof res.body.lowStock).toBe('number');
    });
  });

  describe('GET /alerts/low-stock', () => {
    it('200 — returns array of low stock products', async () => {
      const res = await request(app.getHttpServer())
        .get('/alerts/low-stock')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /alerts/expiring', () => {
    it('200 — returns array of expiring products', async () => {
      const res = await request(app.getHttpServer())
        .get('/alerts/expiring')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('200 — accepts custom days query param', async () => {
      const res = await request(app.getHttpServer())
        .get('/alerts/expiring?days=60')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});