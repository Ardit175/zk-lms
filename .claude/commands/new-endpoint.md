# Skill: new-endpoint

Kur thirret `/new-endpoint [METHOD] [path] [description]`, krijo nje endpoint te plote ne /backend duke ndjekur GJITHMONE kete strukture:

## Struktura e Domosdoshme

### 1. Route file (`/backend/src/routes/[resource].routes.ts`)
```typescript
import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { [Resource]Controller } from '../controllers/[resource].controller';
import { create[Resource]Schema, update[Resource]Schema } from '../validators/[resource].validator';

const router = Router();
const controller = new [Resource]Controller();

// Shembull — adapto per endpoint-in e kerkuar
router.get('/', requireAuth, controller.getAll);
router.post('/', requireAuth, requireRole('INSTRUCTOR'), validate(create[Resource]Schema), controller.create);

export default router;
```

### 2. Controller (`/backend/src/controllers/[resource].controller.ts`)
```typescript
import { Request, Response, NextFunction } from 'express';
import { [Resource]Service } from '../services/[resource].service';
import { ApiResponse } from '../types/api';

export class [Resource]Controller {
  private service = new [Resource]Service();

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.findAll(req.user!.id);
      return res.json(ApiResponse.success(data));
    } catch (error) {
      next(error);
    }
  };
}
```

### 3. Service (`/backend/src/services/[resource].service.ts`)
```typescript
import { prisma } from '../lib/prisma';

export class [Resource]Service {
  async findAll(userId: string) {
    return prisma.[resource].findMany({
      where: { /* filtro sipas userId dhe rolit */ },
      orderBy: { createdAt: 'desc' },
    });
  }
}
```

### 4. Validator (`/backend/src/validators/[resource].validator.ts`)
```typescript
import { z } from 'zod';

export const create[Resource]Schema = z.object({
  body: z.object({
    // fushat e kerkuara
  }),
});
```

## Rregulla te Detyrueshme
- GJITHMONE perdor `ApiResponse.success(data)` dhe `ApiResponse.error(message)` per responses
- GJITHMONE shto `requireAuth` ne çdo route te mbrojtur
- GJITHMONE shto `requireRole()` per routes qe kerkojne role specifike
- GJITHMONE valido input me Zod perpara se te arrije controller-in
- GJITHMONE testo endpoint-in me nje shembull curl ne fund
- Prisma queries GJITHMONE filtrojne me `WHERE userId/instructorId` per izolim te dhenave
- HTTP status codes: 200 (OK), 201 (Created), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 500 (Server Error)
