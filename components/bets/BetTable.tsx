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

const tableLayoutClass = "table-fixed w-full min-w-[56rem]";

type Props = {
  bets: BetRowType[];
  loading: boolean;
  onEdit: (bet: BetRowType) => void;
  onDelete: (bet: BetRowType) => void;
};

export function BetTable({ bets, loading, onEdit, onDelete }: Props) {
  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card">
        <Table className={tableLayoutClass}>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="w-[5.25rem] min-w-[5.25rem] max-w-[5.25rem]">
                Дата
              </TableHead>
              <TableHead className="min-w-0">Матч</TableHead>
              <TableHead className="hidden w-[11rem] min-w-0 max-w-[11rem] md:table-cell">
                Лига
              </TableHead>
              <TableHead className="w-[7.25rem] min-w-0 max-w-[7.25rem]">Тип</TableHead>
              <TableHead className="w-14 min-w-14 max-w-14">Коэф</TableHead>
              <TableHead className="w-[5.5rem] min-w-[5.5rem] max-w-[5.5rem] text-right">
                Сумма
              </TableHead>
              <TableHead className="w-[6.75rem] min-w-[6.75rem] max-w-[6.75rem]">
                Статус
              </TableHead>
              <TableHead className="w-[6.75rem] min-w-[6.75rem] max-w-[6.75rem] text-right">
                Прибыль
              </TableHead>
              <TableHead className="w-[5.25rem] min-w-[5.25rem] max-w-[5.25rem] text-right">
                Действия
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 6 }).map((_, i) => (
              <TableRow key={i} className="border-border hover:bg-transparent">
                <TableCell className="w-[5.25rem] min-w-[5.25rem] max-w-[5.25rem] align-top">
                  <Skeleton className="h-4 w-14" />
                </TableCell>
                <TableCell className="min-w-0 align-top whitespace-normal">
                  <Skeleton className="h-4 w-full max-w-[240px]" />
                </TableCell>
                <TableCell className="hidden min-w-0 max-w-[11rem] align-top md:table-cell">
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell className="w-[7.25rem] align-top">
                  <Skeleton className="h-6 w-20 rounded-full" />
                </TableCell>
                <TableCell className="w-14 align-top">
                  <Skeleton className="h-4 w-10" />
                </TableCell>
                <TableCell className="w-[5.5rem] align-top">
                  <Skeleton className="ml-auto h-4 w-14" />
                </TableCell>
                <TableCell className="w-[6.75rem] align-top">
                  <Skeleton className="h-6 w-20 rounded-full" />
                </TableCell>
                <TableCell className="w-[6.75rem] align-top">
                  <Skeleton className="ml-auto h-4 w-14" />
                </TableCell>
                <TableCell className="w-[5.25rem] align-top">
                  <div className="flex justify-end gap-0.5">
                    <Skeleton className="size-8 shrink-0 rounded-md" />
                    <Skeleton className="size-8 shrink-0 rounded-md" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <Table className={tableLayoutClass}>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="w-[5.25rem] min-w-[5.25rem] max-w-[5.25rem]">Дата</TableHead>
            <TableHead className="min-w-0">Матч</TableHead>
            <TableHead className="hidden w-[11rem] min-w-0 max-w-[11rem] md:table-cell">Лига</TableHead>
            <TableHead className="w-[7.25rem] min-w-0 max-w-[7.25rem]">Тип</TableHead>
            <TableHead className="w-14 min-w-14 max-w-14">Коэф</TableHead>
            <TableHead className="w-[5.5rem] min-w-[5.5rem] max-w-[5.5rem] text-right">Сумма</TableHead>
            <TableHead className="w-[6.75rem] min-w-[6.75rem] max-w-[6.75rem]">Статус</TableHead>
            <TableHead className="w-[6.75rem] min-w-[6.75rem] max-w-[6.75rem] text-right">
              Прибыль
            </TableHead>
            <TableHead className="w-[5.25rem] min-w-[5.25rem] max-w-[5.25rem] text-right">
              Действия
            </TableHead>
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
