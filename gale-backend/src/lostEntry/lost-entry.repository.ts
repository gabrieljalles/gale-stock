import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateLostEntryDto } from "./dto/create-lost-entry.dto";

@Injectable()
export class LostEntryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async runInTransaction<T>(callback: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(callback);
  }

  async createLoss(data: CreateLostEntryDto, tx?: Prisma.TransactionClient){
    const client = tx?? this.prisma;
    return client.lostEntry.create({data});
  }

  async deleteLoss(id: string, tx?: Prisma.TransactionClient){
    const client = tx?? this.prisma;
    return client.lostEntry.delete({where: {id}});
  }

  async findLossById(id: string){
    return this.prisma.lostEntry.findUnique({where: {id}})
  }
}