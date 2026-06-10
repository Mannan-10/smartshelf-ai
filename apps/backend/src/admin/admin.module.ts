import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller.js";
import { RolesGuard } from "../common/guards/roles.guard.js";

@Module({
    controllers: [AdminController],
    providers: [RolesGuard],
})

export class AdminModule {}
