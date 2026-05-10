-- AddForeignKey
ALTER TABLE "ContainerItem" ADD CONSTRAINT "ContainerItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
