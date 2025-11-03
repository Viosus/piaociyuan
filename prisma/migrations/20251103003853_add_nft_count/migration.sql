/*
  Warnings:

  - You are about to drop the column `totalNFTs` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `totalTickets` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `badges` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_badges` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."badges" DROP CONSTRAINT "badges_eventId_fkey";

-- DropForeignKey
ALTER TABLE "public"."user_badges" DROP CONSTRAINT "user_badges_badgeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."user_badges" DROP CONSTRAINT "user_badges_orderId_fkey";

-- DropForeignKey
ALTER TABLE "public"."user_badges" DROP CONSTRAINT "user_badges_ticketId_fkey";

-- DropForeignKey
ALTER TABLE "public"."user_badges" DROP CONSTRAINT "user_badges_userId_fkey";

-- DropIndex
DROP INDEX "public"."users_isVerified_idx";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "totalNFTs",
DROP COLUMN "totalTickets",
ADD COLUMN     "followerCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "followingCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "nftCount" INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "public"."badges";

-- DropTable
DROP TABLE "public"."user_badges";

-- CreateIndex
CREATE INDEX "nfts_rarity_idx" ON "nfts"("rarity");

-- CreateIndex
CREATE INDEX "nfts_isMintable_idx" ON "nfts"("isMintable");

-- CreateIndex
CREATE INDEX "tickets_nftMintStatus_idx" ON "tickets"("nftMintStatus");

-- CreateIndex
CREATE INDEX "users_walletAddress_idx" ON "users"("walletAddress");

-- AddForeignKey
ALTER TABLE "nfts" ADD CONSTRAINT "nfts_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
