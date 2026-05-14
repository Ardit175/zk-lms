# Skill: write-tests

Kur thirret `/write-tests [file-or-feature]`, shkruaj teste te plota duke ndjekur kete strukture:

## Backend Tests (Jest + Supertest)

### Unit Test per Service (`/backend/src/__tests__/services/[resource].service.test.ts`)
```typescript
import { [Resource]Service } from '../../services/[resource].service';
import { prismaMock } from '../mocks/prisma.mock';

jest.mock('../../lib/prisma', () => ({ prisma: prismaMock }));

describe('[Resource]Service', () => {
  let service: [Resource]Service;

  beforeEach(() => {
    service = new [Resource]Service();
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return resources for the given user', async () => {
      const mockData = [/* te dhena mock */];
      prismaMock.[resource].findMany.mockResolvedValue(mockData);

      const result = await service.findAll('user-id-123');

      expect(prismaMock.[resource].findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.any(Object) })
      );
      expect(result).toEqual(mockData);
    });

    it('should throw if database fails', async () => {
      prismaMock.[resource].findMany.mockRejectedValue(new Error('DB Error'));
      await expect(service.findAll('user-id')).rejects.toThrow('DB Error');
    });
  });
});
```

### Integration Test per Route (`/backend/src/__tests__/routes/[resource].routes.test.ts`)
```typescript
import request from 'supertest';
import app from '../../app';
import { generateTestToken } from '../helpers/auth.helper';

describe('[Resource] Routes', () => {
  const studentToken = generateTestToken({ id: 'student-1', role: 'STUDENT' });
  const instructorToken = generateTestToken({ id: 'instructor-1', role: 'INSTRUCTOR' });

  describe('GET /api/[resources]', () => {
    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/[resources]');
      expect(res.status).toBe(401);
    });

    it('should return 200 with valid token', async () => {
      const res = await request(app)
        .get('/api/[resources]')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 403 when student tries instructor route', async () => {
      const res = await request(app)
        .post('/api/[resources]')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({/* data */});
      expect(res.status).toBe(403);
    });
  });
});
```

## Frontend Tests (Playwright)

### E2E Test (`/frontend/e2e/[feature].spec.ts`)
```typescript
import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

test.describe('[Feature] - [Role] Flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'student'); // ose 'instructor', 'admin'
  });

  test('should [action] successfully', async ({ page }) => {
    await page.goto('/student/[page]');
    
    // Veprimet
    await page.click('[data-testid="[button]"]');
    await page.fill('[data-testid="[input]"]', 'vlera test');
    await page.click('[data-testid="submit"]');
    
    // Assertions
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page).toHaveURL('/student/[expected-page]');
  });
});
```

## Rregulla te Detyrueshme
- Code coverage target: minimumi 70% per backend services
- GJITHMONE testo: happy path, error path, edge cases, auth/authorization
- GJITHMONE perdor `data-testid` attributes per Playwright selectors (me te qendrueshme se CSS selectors)
- Mock GJITHMONE Prisma ne unit tests — mos lidhu me DB reale
- Cdo endpoint duhet te kete teste per: 401 (pa auth), 403 (rol i gabuar), 200/201 (sukses), 400 (input i gabuar)
- Emerto testet: `should [expected behavior] when [condition]`
