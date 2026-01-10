-- CreateTable
CREATE TABLE "LinkList" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500),
    "slug" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(6),
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "LinkList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LinkItem" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "linkListId" UUID NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "description" VARCHAR(300),
    "url" VARCHAR(2048) NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "LinkItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LinkList_slug_key" ON "LinkList"("slug");

-- CreateIndex
CREATE INDEX "linklist_userId_createdAt_idx" ON "LinkList"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "linklist_published_views_idx" ON "LinkList"("isPublished", "viewCount");

-- CreateIndex
CREATE INDEX "linklist_slug_idx" ON "LinkList"("slug");

-- CreateIndex
CREATE INDEX "linkitem_listId_position_idx" ON "LinkItem"("linkListId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "linkitem_list_url_unique" ON "LinkItem"("linkListId", "url");

-- AddForeignKey
ALTER TABLE "LinkList" ADD CONSTRAINT "LinkList_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkItem" ADD CONSTRAINT "LinkItem_linkListId_fkey" FOREIGN KEY ("linkListId") REFERENCES "LinkList"("id") ON DELETE CASCADE ON UPDATE CASCADE;
