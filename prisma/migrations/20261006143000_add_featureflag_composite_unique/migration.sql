/*
  Change FeatureFlag from unique(key) to composite unique (tenantId, key).
  The database is a sandbox — zero rows — so dropping the old unique has no
  side effect and the new index is what makes one key per tenant.
*/

-- Old single-column unique index on `key` (created by `key String @unique`).
DROP INDEX IF EXISTS "FeatureFlag_key_key";

-- New composite unique: the same key can exist once per tenant (tenantId: null = global).
CREATE UNIQUE INDEX "FeatureFlag_tenantId_key_key" ON "FeatureFlag"("tenantId", "key");
