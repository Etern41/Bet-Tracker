"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { BetRow } from "@/components/bets/BetRow";
import type { BetRow as BetRowType } from "@/components/bets/types";

type Props = {
  bets: BetRowType[];
  loading: boolean;
  onEdit: (bet: BetRowType) => void;
  onDelete: (bet: BetRowType) => void;
};

export function BetTable({ bets, loading, onEdit, onDelete }: Props) {
  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="w-[88px]">Дата</TableHead>
              <TableHead>Матч</TableHead>
              <TableHead className="hidden md:table-cell">Лига</TableHead>
              <TableHead>Тип</TableHead>
              <TableHead className="w-[72px]">Коэф</TableHead>
              <TableHead className="w-[100px]">Сумма</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="w-[100px]">Прибыль</TableHead>
              <TableHead className="w-[96px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 6 }).map((_, i) => (
              <TableRow key={i} className="border-border">
                <TableCell>
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-full max-w-[200px]" />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-10" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-14" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-14" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-8 w-16" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="w-[88px]">Дата</TableHead>
            <TableHead>Матч</TableHead>
            <TableHead className="hidden md:table-cell">Лига</TableHead>
            <TableHead>Тип</TableHead>
            <TableHead className="w-[72px]">Коэф</TableHead>
            <TableHead className="w-[100px]">Сумма</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead className="w-[100px]">Прибыль</TableHead>
            <TableHead className="w-[96px]">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bets.map((bet) => (
            <BetRow key={bet.id} bet={bet} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
