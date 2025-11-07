-- CreateTable
CREATE TABLE "post_favorites" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_favorites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "post_favorites_postId_idx" ON "post_favorites"("postId");

-- CreateIndex
CREATE INDEX "post_favorites_userId_idx" ON "post_favorites"("userId");

-- CreateIndex
CREATE INDEX "post_favorites_createdAt_idx" ON "post_favorites"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "post_favorites_postId_userId_key" ON "post_favorites"("postId", "userId");

-- AddForeignKey
ALTER TABLE "post_favorites" ADD CONSTRAINT "post_favorites_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_favorites" ADD CONSTRAINT "post_favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
