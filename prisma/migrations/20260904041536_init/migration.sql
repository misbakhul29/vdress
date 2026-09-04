-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suited" (
    "id" SERIAL NOT NULL,
    "uid" TEXT NOT NULL,
    "a" TEXT NOT NULL DEFAULT 'default',
    "b" TEXT NOT NULL DEFAULT 'default',
    "c" TEXT NOT NULL DEFAULT 'default',

    CONSTRAINT "suited_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_resources" (
    "id" SERIAL NOT NULL,
    "uid" TEXT NOT NULL,
    "chic_coins" INTEGER NOT NULL DEFAULT 0,
    "glamour_gems" INTEGER NOT NULL DEFAULT 0,
    "glamour_dust" INTEGER NOT NULL DEFAULT 0,
    "fashion_tokens" INTEGER NOT NULL DEFAULT 0,
    "shimmering_essence" INTEGER NOT NULL DEFAULT 0,
    "glimmering_essence" INTEGER NOT NULL DEFAULT 0,
    "pity" INTEGER NOT NULL DEFAULT 0,
    "is_rate" BOOLEAN NOT NULL DEFAULT false,
    "standard_pity" INTEGER NOT NULL DEFAULT 0,
    "neonite" INTEGER NOT NULL DEFAULT 0,
    "chromite" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "user_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory" (
    "id" SERIAL NOT NULL,
    "uid" TEXT NOT NULL,
    "rarity" TEXT NOT NULL,
    "item_name" TEXT NOT NULL,
    "part_outfit" TEXT NOT NULL,
    "layer" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stat" JSONB,
    "power" DOUBLE PRECISION,

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gacha_item" (
    "id" SERIAL NOT NULL,
    "rarity" TEXT NOT NULL,
    "item_name" TEXT NOT NULL,
    "part_outfit" TEXT NOT NULL,
    "rate_up" BOOLEAN NOT NULL DEFAULT false,
    "islimited" BOOLEAN NOT NULL DEFAULT false,
    "layer" TEXT NOT NULL,
    "stat" JSONB,
    "power" DOUBLE PRECISION,

    CONSTRAINT "gacha_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gacha_history" (
    "id" SERIAL NOT NULL,
    "uid" TEXT NOT NULL,
    "rarity" TEXT NOT NULL,
    "item_name" TEXT NOT NULL,
    "part_outfit" TEXT NOT NULL,
    "gacha_type" TEXT NOT NULL,
    "gacha_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gacha_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "glamour_gems" INTEGER NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "token_items" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" INTEGER NOT NULL,

    CONSTRAINT "token_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dust_items" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" INTEGER NOT NULL,

    CONSTRAINT "dust_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_token_limit" (
    "id" SERIAL NOT NULL,
    "uid" TEXT NOT NULL,
    "item_id" INTEGER NOT NULL,
    "limit" INTEGER,
    "initial_limit" INTEGER,

    CONSTRAINT "user_token_limit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_dust_limit" (
    "id" SERIAL NOT NULL,
    "uid" TEXT NOT NULL,
    "item_id" INTEGER NOT NULL,
    "limit" INTEGER,
    "initial_limit" INTEGER,

    CONSTRAINT "user_dust_limit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "suited_uid_key" ON "suited"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "user_resources_uid_key" ON "user_resources"("uid");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suited" ADD CONSTRAINT "suited_uid_fkey" FOREIGN KEY ("uid") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_resources" ADD CONSTRAINT "user_resources_uid_fkey" FOREIGN KEY ("uid") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_uid_fkey" FOREIGN KEY ("uid") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gacha_history" ADD CONSTRAINT "gacha_history_uid_fkey" FOREIGN KEY ("uid") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_token_limit" ADD CONSTRAINT "user_token_limit_uid_fkey" FOREIGN KEY ("uid") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_dust_limit" ADD CONSTRAINT "user_dust_limit_uid_fkey" FOREIGN KEY ("uid") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
