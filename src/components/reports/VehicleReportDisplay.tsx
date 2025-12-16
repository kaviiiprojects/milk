
"use client";

import type { VehicleReportItem } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DownloadCloud, FileText, GaugeCircle, Route } from "lucide-react";
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Separator } from "../ui/separator";

interface VehicleReportDisplayProps {
  report: {
    items: VehicleReportItem[];
    startMeter?: number;
    endMeter?: number;
    totalKm?: number;
  };
  vehicleNumber: string;
  reportDate?: Date;
}

export function VehicleReportDisplay({ report, vehicleNumber, reportDate }: VehicleReportDisplayProps) {
  const { items: data, startMeter, endMeter, totalKm } = report;
    
  const totals = {
    loaded: data.reduce((sum, item) => sum + item.totalLoaded, 0),
    unloaded: data.reduce((sum, item) => sum + item.totalUnloaded, 0),
    netChange: data.reduce((sum, item) => sum + item.netChange, 0)
  };

  const handleExportExcel = () => {
    // Mileage data
    const mileageData = [
        ["Vehicle Report", vehicleNumber],
        ["Date", reportDate ? format(reportDate, 'yyyy-MM-dd') : 'N/A'],
        [],
        ["Mileage Summary"],
        ["Start Meter (km)", startMeter ?? 'N/A'],
        ["End Meter (km)", endMeter ?? 'N/A'],
        ["Total Traveled (km)", totalKm ?? 'N/A'],
        []
    ];
    const stockHeader = ['Product Name', 'SKU', 'Total Loaded', 'Total Unloaded', 'Net Change'];
    
    // Stock data
    const stockData = data.map(item => ({
        'Product Name': item.productName,
        'SKU': item.productSku || 'N/A',
        'Total Loaded': item.totalLoaded,
        'Total Unloaded': item.totalUnloaded,
        'Net Change': item.netChange
    }));
    
    // Totals row for stock
    const stockTotals = {
        'Product Name': 'Totals',
        'SKU': '',
        'Total Loaded': totals.loaded,
        'Total Unloaded': totals.unloaded,
        'Net Change': totals.netChange
    };

    const worksheet = XLSX.utils.json_to_sheet(stockData, { header: stockHeader, skipHeader: true });
    XLSX.utils.sheet_add_aoa(worksheet, mileageData, { origin: "A1" });
    XLSX.utils.sheet_add_aoa(worksheet, [stockHeader], { origin: "A9" });
    XLSX.utils.sheet_add_json(worksheet, [stockTotals], { origin: -1, skipHeader: true });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Vehicle Report`);
    XLSX.writeFile(workbook, `Vehicle_Report_${vehicleNumber}_${format(new Date(), 'yyyyMMdd')}.xlsx`);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    let yPos = 22;
    doc.text(`Vehicle Report for: ${vehicleNumber}`, 14, 16);
    doc.setFontSize(10);
    doc.text(`Date: ${reportDate ? format(reportDate, 'PPP') : 'N/A'}`, 14, yPos);
    yPos += 10;

    if (startMeter !== undefined || endMeter !== undefined || totalKm !== undefined) {
      doc.setFontSize(12);
      doc.text("Mileage Summary", 14, yPos);
      yPos += 6;
      autoTable(doc, {
        startY: yPos,
        body: [
          ['Start Meter', `${startMeter ?? 'N/A'} km`],
          ['End Meter', `${endMeter ?? 'N/A'} km`],
          ['Total Traveled', `${totalKm ?? 'N/A'} km`],
        ],
        theme: 'plain',
        styles: { fontSize: 10 }
      });
      yPos = (doc as any).lastAutoTable.finalY + 10;
    }
    
    doc.setFontSize(12);
    doc.text("Stock Movement Summary", 14, yPos);
    yPos += 6;

    autoTable(doc, {
        startY: yPos,
        head: [['Product Name', 'SKU', 'Total Loaded', 'Total Unloaded', 'Net Change']],
        body: data.map(item => [
            item.productName,
            item.productSku || 'N/A',
            item.totalLoaded,
            item.totalUnloaded,
            item.netChange
        ]),
        foot: [[
            'Totals', '', totals.loaded, totals.unloaded, totals.netChange
        ]],
        styles: { fontSize: 8 },
        headStyles: { fillColor: [30, 18, 57] },
        footStyles: { fillColor: [240, 240, 240], textColor: [0,0,0], fontStyle: 'bold' }
    });

    doc.save(`Vehicle_Report_${vehicleNumber}_${format(new Date(), 'yyyyMMdd')}.pdf`);
  };
    
  if (data.length === 0 && totalKm === undefined) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Report for {vehicleNumber}</CardTitle>
           <CardDescription>
            Date: {reportDate ? format(reportDate, 'PPP') : 'N/A'}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12 text-muted-foreground">
          <p>No vehicle transactions found for the selected period.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <CardTitle className="font-headline">Report for: {vehicleNumber}</CardTitle>
                <CardDescription>
                    Date: {reportDate ? format(reportDate, 'PPP') : 'N/A'}
                </CardDescription>
            </div>
            <div className="flex gap-2">
                <Button onClick={handleExportExcel} variant="outline" size="sm"><DownloadCloud className="mr-2 h-4 w-4" /> Export Excel</Button>
                <Button onClick={handleExportPDF} variant="outline" size="sm"><FileText className="mr-2 h-4 w-4" /> Export PDF</Button>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        { (startMeter !== undefined || endMeter !== undefined) && (
            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Route className="h-5 w-5 text-primary"/>
                    Mileage Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <Card className="p-4">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Start Meter</CardTitle>
                        <p className="text-2xl font-bold">{startMeter ?? 'N/A'} <span className="text-sm font-normal">km</span></p>
                    </Card>
                    <Card className="p-4">
                        <CardTitle className="text-sm font-medium text-muted-foreground">End Meter</CardTitle>
                        <p className="text-2xl font-bold">{endMeter ?? 'N/A'} <span className="text-sm font-normal">km</span></p>
                    </Card>
                    <Card className="p-4 bg-primary/5">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Traveled</CardTitle>
                        <p className="text-2xl font-bold text-primary">{totalKm ?? 'N/A'} <span className="text-sm font-normal">km</span></p>
                    </Card>
                </div>
            </div>
        )}
        <Separator className="my-6"/>
         <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <GaugeCircle className="h-5 w-5 text-primary"/>
            Stock Movement Summary
        </h3>
        <ScrollArea className="h-full max-h-[calc(100vh-42rem)]">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead className="w-[120px]">SKU</TableHead>
                <TableHead className="w-[150px] text-right">Total Loaded</TableHead>
                <TableHead className="w-[150px] text-right">Total Unloaded</TableHead>
                <TableHead className="w-[150px] text-right">Net Change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow key={item.productId}>
                  <TableCell className="font-medium">{item.productName}</TableCell>
                  <TableCell className="font-mono text-xs">{item.productSku || 'N/A'}</TableCell>
                  <TableCell className="text-right text-green-600 font-semibold">+{item.totalLoaded}</TableCell>
                  <TableCell className="text-right text-destructive font-semibold">-{item.totalUnloaded}</TableCell>
                  <TableCell className="text-right font-bold">{item.netChange > 0 ? `+${item.netChange}` : item.netChange}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
                <TableRow>
                    <TableCell colSpan={2} className="font-bold">Totals</TableCell>
                    <TableCell className="text-right font-bold text-green-600">+{totals.loaded}</TableCell>
                    <TableCell className="text-right font-bold text-destructive">-{totals.unloaded}</TableCell>
                    <TableCell className="text-right font-bold">{totals.netChange > 0 ? `+${totals.netChange}` : totals.netChange}</TableCell>
                </TableRow>
            </TableFooter>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
