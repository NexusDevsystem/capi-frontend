
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { CashClosing, Transaction, TransactionType, FinancialSummary } from '../types';

const COMPANY_COLOR = [234, 88, 12]; // Orange-600 #ea580c
const SECONDARY_COLOR = [30, 41, 59]; // Slate-800

// Helper to format currency
const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

// Helper to draw a progress bar in PDF
const drawProgressBar = (doc: jsPDF, x: number, y: number, width: number, height: number, percentage: number, color: [number, number, number], label: string, valueText: string) => {
    // Label
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(label, x, y - 2);
    
    // Value (Right aligned)
    doc.text(valueText, x + width, y - 2, { align: 'right' });

    // Background Bar
    doc.setFillColor(240, 240, 240);
    doc.roundedRect(x, y, width, height, 1, 1, 'F');

    // Fill Bar
    if (percentage > 0) {
        doc.setFillColor(color[0], color[1], color[2]);
        const fillWidth = Math.min(width, (width * percentage) / 100);
        doc.roundedRect(x, y, fillWidth, height, 1, 1, 'F');
    }
};

export const generateClosingPDF = (closing: CashClosing, storeName: string) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const todayFormatted = new Date(closing.date).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

    // --- HEADER ---
    doc.setFillColor(COMPANY_COLOR[0], COMPANY_COLOR[1], COMPANY_COLOR[2]);
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("Fechamento de Caixa", 14, 20);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(storeName, 14, 28);
    doc.text(todayFormatted, pageWidth - 14, 20, { align: 'right' });
    doc.text(`Responsável: ${closing.closedBy}`, pageWidth - 14, 28, { align: 'right' });

    // --- HIGHLIGHT CARDS (Simulated) ---
    let startY = 55;
    const cardWidth = (pageWidth - 40) / 3;
    const cardHeight = 25;

    // Receita Card
    doc.setFillColor(236, 253, 245); // Green-ish bg
    doc.roundedRect(14, startY, cardWidth, cardHeight, 2, 2, 'F');
    doc.setTextColor(6, 95, 70); // Green text
    doc.setFontSize(10);
    doc.text("Total Entradas", 14 + (cardWidth/2), startY + 8, { align: 'center' });
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(formatCurrency(closing.totalRevenue), 14 + (cardWidth/2), startY + 18, { align: 'center' });

    // Despesa Card
    doc.setFillColor(254, 242, 242); // Red-ish bg
    doc.roundedRect(14 + cardWidth + 6, startY, cardWidth, cardHeight, 2, 2, 'F');
    doc.setTextColor(153, 27, 27); // Red text
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Total Saídas", 14 + cardWidth + 6 + (cardWidth/2), startY + 8, { align: 'center' });
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(formatCurrency(closing.totalExpense), 14 + cardWidth + 6 + (cardWidth/2), startY + 18, { align: 'center' });

    // Saldo Card
    const balanceColor = closing.balance >= 0 ? [30, 58, 138] : [153, 27, 27];
    doc.setFillColor(240, 249, 255); // Blue-ish bg
    doc.roundedRect(14 + (cardWidth * 2) + 12, startY, cardWidth, cardHeight, 2, 2, 'F');
    doc.setTextColor(balanceColor[0], balanceColor[1], balanceColor[2]);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Saldo Final", 14 + (cardWidth * 2) + 12 + (cardWidth/2), startY + 8, { align: 'center' });
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(formatCurrency(closing.balance), 14 + (cardWidth * 2) + 12 + (cardWidth/2), startY + 18, { align: 'center' });

    // --- VISUAL BREAKDOWN (Charts) ---
    startY += 40;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text("Detalhamento por Método", 14, startY);
    
    startY += 10;
    const totalMov = closing.breakdown.pix + closing.breakdown.cash + closing.breakdown.card + closing.breakdown.other;
    const safeTotal = totalMov || 1; // avoid division by zero

    // Pix Bar
    drawProgressBar(doc, 14, startY, pageWidth - 28, 6, (closing.breakdown.pix / safeTotal) * 100, [16, 185, 129], "Pix", formatCurrency(closing.breakdown.pix));
    startY += 15;
    // Cash Bar
    drawProgressBar(doc, 14, startY, pageWidth - 28, 6, (closing.breakdown.cash / safeTotal) * 100, [34, 197, 94], "Dinheiro", formatCurrency(closing.breakdown.cash));
    startY += 15;
    // Card Bar
    drawProgressBar(doc, 14, startY, pageWidth - 28, 6, (closing.breakdown.card / safeTotal) * 100, [59, 130, 246], "Cartão", formatCurrency(closing.breakdown.card));
    
    // --- TABLE ---
    startY += 20;
    autoTable(doc, {
        startY: startY,
        head: [['Método', 'Valor', '% do Total']],
        body: [
            ['Pix', formatCurrency(closing.breakdown.pix), `${((closing.breakdown.pix / safeTotal) * 100).toFixed(1)}%`],
            ['Dinheiro', formatCurrency(closing.breakdown.cash), `${((closing.breakdown.cash / safeTotal) * 100).toFixed(1)}%`],
            ['Cartão', formatCurrency(closing.breakdown.card), `${((closing.breakdown.card / safeTotal) * 100).toFixed(1)}%`],
            ['Outros', formatCurrency(closing.breakdown.other), `${((closing.breakdown.other / safeTotal) * 100).toFixed(1)}%`],
        ],
        theme: 'striped',
        headStyles: { fillColor: COMPANY_COLOR as any },
        styles: { fontSize: 10 },
        foot: [['TOTAL ENTRADAS', formatCurrency(closing.totalRevenue), '100%']],
        footStyles: { fillColor: [241, 245, 249], textColor: 50, fontStyle: 'bold' }
    });

    // Notes
    if (closing.notes) {
        const finalY = (doc as any).lastAutoTable.finalY + 15;
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text("Observações:", 14, finalY);
        doc.setTextColor(0);
        doc.setFontSize(10);
        const splitNotes = doc.splitTextToSize(closing.notes, pageWidth - 28);
        doc.text(splitNotes, 14, finalY + 6);
    }

    // Footer
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFillColor(248, 250, 252);
    doc.rect(0, pageHeight - 20, pageWidth, 20, 'F');
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("Documento gerado eletronicamente pelo CAPI ERP.", 14, pageHeight - 8);
    doc.text(`ID: ${closing.id}`, pageWidth - 14, pageHeight - 8, { align: 'right' });

    doc.save(`fechamento-${closing.date}.pdf`);
};

export const generateMonthlyReportPDF = (summary: FinancialSummary, transactions: Transaction[], monthStr: string, storeName: string) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const dateObj = new Date(monthStr + '-02'); // Add day to avoid timezone issues
    const monthName = dateObj.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    // --- COVER HEADER ---
    doc.setFillColor(COMPANY_COLOR[0], COMPANY_COLOR[1], COMPANY_COLOR[2]);
    doc.rect(0, 0, pageWidth, 50, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.text("Relatório Mensal", 14, 25);
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.text(monthName.charAt(0).toUpperCase() + monthName.slice(1), 14, 35);
    doc.text(storeName, pageWidth - 14, 25, { align: 'right' });

    // --- EXECUTIVE SUMMARY ---
    let startY = 70;
    doc.setTextColor(30);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("1. Resumo Financeiro", 14, startY);
    
    // Draw Key Metrics Grid
    startY += 10;
    const boxW = 40;
    const boxH = 20;
    const gap = 10;
    const startX = 14;

    const metrics = [
        { label: "Receita", val: summary.revenue, color: [22, 163, 74] },
        { label: "Despesas", val: summary.expenses, color: [220, 38, 38] },
        { label: "Lucro", val: summary.profit, color: summary.profit >= 0 ? [37, 99, 235] : [220, 38, 38] },
        { label: "Margem", val: summary.revenue ? `${((summary.profit/summary.revenue)*100).toFixed(1)}%` : "0%", color: [234, 88, 12], isText: true }
    ];

    metrics.forEach((m, i) => {
        const x = startX + (i * (boxW + gap));
        doc.setFillColor(250, 250, 250);
        doc.setDrawColor(200);
        doc.roundedRect(x, startY, boxW, boxH, 2, 2, 'FD');
        
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(m.label, x + 5, startY + 6);
        
        doc.setFontSize(11);
        doc.setTextColor(m.color[0], m.color[1], m.color[2]);
        doc.setFont("helvetica", "bold");
        const valText = m.isText ? (m.val as string) : formatCurrency(m.val as number);
        doc.text(valText, x + 5, startY + 15);
    });

    // --- EXPENSE CATEGORY CHART (Simulated Bar Chart) ---
    startY += 40;
    doc.setTextColor(30);
    doc.setFontSize(14);
    doc.text("2. Despesas por Categoria", 14, startY);
    startY += 10;

    // Aggregate Categories
    const catMap: Record<string, number> = {};
    transactions
        .filter(t => t.type === TransactionType.EXPENSE)
        .forEach(t => catMap[t.category] = (catMap[t.category] || 0) + t.amount);
    
    const sortedCats = Object.entries(catMap).sort((a,b) => b[1] - a[1]).slice(0, 5);
    const maxVal = sortedCats[0]?.[1] || 1;

    sortedCats.forEach((cat) => {
        const pct = (cat[1] / summary.expenses) * 100;
        const barWidth = (cat[1] / maxVal) * 100; // Relative to max for visual scaling
        
        drawProgressBar(doc, 14, startY, 120, 8, barWidth, [234, 88, 12], cat[0], formatCurrency(cat[1]));
        startY += 14;
    });

    if (sortedCats.length === 0) {
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text("Sem despesas registradas.", 14, startY);
        startY += 10;
    }

    // --- TOP TRANSACTIONS TABLE ---
    startY += 20;
    doc.setTextColor(30);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("3. Últimas Movimentações Relevantes", 14, startY);

    const topTx = transactions
        .sort((a,b) => b.amount - a.amount)
        .slice(0, 10)
        .map(t => [
            new Date(t.date).toLocaleDateString(),
            t.description,
            t.type === 'INCOME' ? 'Receita' : 'Despesa',
            formatCurrency(t.amount)
        ]);

    autoTable(doc, {
        startY: startY + 5,
        head: [['Data', 'Descrição', 'Tipo', 'Valor']],
        body: topTx,
        theme: 'grid',
        headStyles: { fillColor: SECONDARY_COLOR as any },
        styles: { fontSize: 9 },
    });

    // Footer
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("Gerado por CAPI ERP", 14, pageHeight - 10);
    doc.text(`Página 1 de 1`, pageWidth - 14, pageHeight - 10, { align: 'right' });

    doc.save(`relatorio-mensal-${monthStr}.pdf`);
};
