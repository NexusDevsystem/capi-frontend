import React, { useState, useRef, useMemo } from 'react';
import { usePrivacy } from '../contexts/PrivacyContext';
import { PrivacyToggle } from '../components/PrivacyToggle';
import { PrivacyValue } from '../components/PrivacyValue';
import { Product } from '../types';
import { extractProductsFromInvoice } from '../services/geminiService';
import { HelpTip } from '../components/HelpTip';
import { compressImage } from '../utils/imageUtils';

interface ProductsPageProps {
    products: Product[];
    onSave: (product: Product) => void;
    onUpdate: (product: Product) => void;
    onDelete: (id: string) => void;
}

export const ProductsPage: React.FC<ProductsPageProps> = ({ products, onSave, onUpdate, onDelete }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    // States para Importação Inteligente
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false); // Novo Modal de Upload
    const [isImportReviewOpen, setIsImportReviewOpen] = useState(false);
    const [isProcessingPdf, setIsProcessingPdf] = useState(false);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [tab, setTab] = useState<'GERAL' | 'FISCAL'>('GERAL');

    const [importedProducts, setImportedProducts] = useState<Partial<Product>[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState<Partial<Product>>({
        name: '', costPrice: 0, salePrice: 0, stock: 0, minStock: 5, barcode: '',
        taxData: { taxOrigin: '0' }
    });

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const { privacyMode } = usePrivacy();

    // --- Métricas Financeiras do Estoque ---
    const stockMetrics = useMemo(() => {
        let totalCost = 0;
        let totalSale = 0;
        let totalItems = 0;

        products.forEach(p => {
            const qty = p.stock || 0;
            const cost = p.costPrice || 0;
            const sale = p.salePrice || 0;

            if (qty > 0) {
                totalCost += cost * qty;
                totalSale += sale * qty;
                totalItems += qty;
            }
        });

        return {
            totalCost,
            totalSale,
            projectedProfit: totalSale - totalCost,
            totalItems
        };
    }, [products]);

    // --- PDF Handler ---
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        // Mantém o modal aberto, mas muda o estado para processando
        setIsProcessingPdf(true);

        try {
            // Processa múltiplos arquivos em paralelo
            const filePromises = Array.from(files).map(async (file: File) => {
                try {
                    let base64String = '';

                    if (file.type.startsWith('image/')) {
                        // Compress image before sending
                        const compressedDataUrl = await compressImage(file, 1000, 0.8); // High quality for OCR/AI
                        base64String = compressedDataUrl.split(',')[1];
                    } else {
                        // Read other files (PDF) as usual
                        base64String = await new Promise((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
                            reader.onerror = reject;
                            reader.readAsDataURL(file);
                        });
                    }

                    // Call Gemini Service
                    return await extractProductsFromInvoice(base64String, file.type);
                } catch (err) {
                    console.error(`Erro ao processar arquivo ${file.name}:`, err);
                    return [];
                }
            });

            const results = await Promise.all(filePromises);
            const allExtractedItems = results.flat(); // Junta todos os arrays de produtos encontrados

            if (allExtractedItems.length === 0) {
                alert("Nenhum produto identificado nos arquivos selecionados.");
                setIsProcessingPdf(false);
                return;
            }

            // Add temporary IDs and Defaults
            const itemsWithTempIds = allExtractedItems.map((item: any) => {
                const priceFound = item.salePrice || item.costPrice || 0;

                return {
                    ...item,
                    id: Math.random().toString(36).substr(2, 9),
                    sku: item.sku || '',
                    name: item.name || 'Produto Importado',
                    stock: item.stock || 1,
                    minStock: 5,
                    // Se a IA trouxe salePrice, usa. Se trouxe só costPrice, assume que o usuário queria que fosse venda.
                    salePrice: priceFound,
                    // Se costPrice veio e é menor que salePrice, usa. Se não, estima 60% do valor de venda.
                    costPrice: (item.costPrice && item.costPrice < priceFound) ? item.costPrice : (priceFound * 0.6),
                    taxData: { taxOrigin: '0' as const, ncm: item.taxData?.ncm || '' }
                };
            });

            setImportedProducts(itemsWithTempIds);

            // Finaliza processamento e troca os modais
            setIsProcessingPdf(false);
            setIsUploadModalOpen(false);
            setIsImportReviewOpen(true);
        } catch (error) {
            console.error(error);
            setIsProcessingPdf(false);
            alert("Erro geral ao ler os documentos. Tente novamente.");
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
        }
    };

    const [isSavingImport, setIsSavingImport] = useState(false);

    const handleConfirmImport = async () => {
        setIsSavingImport(true);
        try {
            // Processa salvamento em paralelo com Promise.all
            const savePromises = importedProducts.map(async (p) => {
                const newProduct = {
                    ...p,
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                    // Garante que valores numéricos sejam válidos
                    salePrice: Number(p.salePrice) || 0,
                    costPrice: Number(p.costPrice) || 0,
                    stock: Number(p.stock) || 0
                } as Product;

                // onSave é async, então precisamos aguardar
                return onSave(newProduct);
            });

            await Promise.all(savePromises);

            setIsImportReviewOpen(false);
            setImportedProducts([]);
        } catch (error) {
            console.error("Erro ao salvar produtos importados:", error);
            alert("Ocorreu um erro ao salvar alguns produtos. Tente novamente.");
        } finally {
            setIsSavingImport(false);
        }
    };

    const removeImportItem = (index: number) => {
        setImportedProducts(prev => prev.filter((_, i) => i !== index));
    };

    const updateImportItem = (index: number, field: string, value: any) => {
        const updated = [...importedProducts];
        updated[index] = { ...updated[index], [field]: value };
        setImportedProducts(updated);
    };

    // --- Standard Handlers ---
    const handleEditClick = (product: Product) => {
        setEditingId(product.id);
        setFormData(JSON.parse(JSON.stringify(product))); // Deep copy
        setTab('GERAL');
        setIsModalOpen(true);
    };

    const handleNewClick = () => {
        setEditingId(null);
        setFormData({ name: '', costPrice: 0, salePrice: 0, stock: 0, minStock: 5, barcode: '', taxData: { taxOrigin: '0' } });
        setTab('GERAL');
        setIsModalOpen(true);
    };

    const handleSubmit = () => {
        if (!formData.name || formData.salePrice === undefined) return;

        const productData = {
            ...formData,
            id: editingId || Date.now().toString(),
            costPrice: Number(formData.costPrice) || 0,
            salePrice: Number(formData.salePrice),
            stock: Number(formData.stock) || 0,
            minStock: Number(formData.minStock) || 5,
            sku: editingId ? products.find(p => p.id === editingId)?.sku : `SKU-${Math.floor(Math.random() * 10000)}`,
        } as Product;

        if (editingId) onUpdate(productData);
        else onSave(productData);

        setIsModalOpen(false);
    };

    return (
        <div className="flex-1 overflow-y-auto p-6 md:p-10 max-w-[1200px] w-full mx-auto pb-32">

            {/* Header com Toggle de Privacidade */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-slate-900 dark:text-white text-3xl font-black tracking-tight">Estoque & Produtos</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-base">Gerencie seu catálogo, códigos de barras e dados fiscais.</p>
                </div>
                <div className="flex items-center gap-3">
                    <PrivacyToggle className="flex items-center justify-center w-10 h-10 bg-white dark:bg-card-dark text-slate-400 hover:text-primary border border-slate-200 dark:border-slate-800 rounded-xl transition-all shadow-sm" />
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="application/pdf,image/*"
                        multiple
                        className="hidden"
                    />
                    <button
                        onClick={() => setIsUploadModalOpen(true)}
                        className="flex items-center gap-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-all"
                    >
                        <span className="material-symbols-outlined text-primary">auto_awesome</span>
                        Importar Nota/Foto
                    </button>
                    <button
                        onClick={handleNewClick}
                        className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-all"
                    >
                        <span className="material-symbols-outlined">add</span>
                        Novo Produto
                    </button>
                </div>
            </div>

            {/* --- CARDS DE MÉTRICAS DO ESTOQUE --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-fade-in-up">

                {/* Card 1: Custo Total (Investimento) */}
                <div className="bg-white dark:bg-card-dark p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:shadow-md hover:-translate-y-1 transition-all">
                    <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-8xl text-blue-600">inventory_2</span>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Patrimônio (Custo)</p>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                            <PrivacyValue value={formatCurrency(stockMetrics.totalCost)} blurContent={<span className="blur-sm opacity-50">R$ •••••</span>} />
                        </h3>
                        <p className="text-[10px] text-slate-400 mt-2 font-medium">Investido em {stockMetrics.totalItems} itens</p>
                    </div>
                </div>

                {/* Card 2: Valor de Venda (Potencial) */}
                <div className="bg-white dark:bg-card-dark p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:shadow-md hover:-translate-y-1 transition-all">
                    <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-8xl text-emerald-600">sell</span>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Valor de Venda Total</p>
                        <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                            <PrivacyValue value={formatCurrency(stockMetrics.totalSale)} blurContent={<span className="blur-sm opacity-50">R$ •••••</span>} />
                        </h3>
                        <p className="text-[10px] text-slate-400 mt-2 font-medium">Faturamento se vender tudo</p>
                    </div>
                </div>

                {/* Card 3: Lucro Projetado */}
                <div className="bg-gradient-to-br from-primary to-orange-700 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 opacity-20 group-hover:opacity-30 transition-opacity">
                        <span className="material-symbols-outlined text-8xl text-white">trending_up</span>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-orange-100 uppercase tracking-wider mb-1">Lucro Estimado</p>
                        <h3 className="text-2xl font-black text-white">
                            <PrivacyValue value={formatCurrency(stockMetrics.projectedProfit)} blurContent={<span className="blur-sm opacity-50">R$ •••••</span>} />
                        </h3>
                        <p className="text-[10px] text-orange-100/80 mt-2 font-medium">
                            Margem média: {stockMetrics.totalSale > 0 ? ((stockMetrics.projectedProfit / stockMetrics.totalSale) * 100).toFixed(1) : 0}%
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Produto</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Custo</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Venda</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">NCM</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Estoque</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {products.map(p => (
                                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-slate-900 dark:text-white">{p.name}</p>
                                        <p className="text-xs text-slate-400">{p.sku}</p>
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm text-slate-600 dark:text-slate-300">
                                        <PrivacyValue value={formatCurrency(p.costPrice)} blurContent="•••" />
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm font-bold text-slate-900 dark:text-white">
                                        <PrivacyValue value={formatCurrency(p.salePrice)} blurContent="•••" />
                                    </td>
                                    <td className="px-6 py-4 text-center text-xs text-slate-500">{p.taxData?.ncm || '-'}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`font-bold ${p.stock <= p.minStock ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}`}>{p.stock}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button onClick={() => handleEditClick(p)} className="text-slate-400 hover:text-primary"><span className="material-symbols-outlined">edit</span></button>
                                            <button onClick={() => onDelete(p.id)} className="text-slate-400 hover:text-red-500"><span className="material-symbols-outlined">delete</span></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- MODAL DE UPLOAD DE ARQUIVO (PASSO 1) --- */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in" onClick={() => !isProcessingPdf && setIsUploadModalOpen(false)}>
                    <div className="bg-white dark:bg-card-dark w-full max-w-lg rounded-3xl shadow-2xl p-8 animate-zoom-in relative" onClick={e => e.stopPropagation()}>

                        {/* Botão de Fechar (Só aparece se não estiver processando) */}
                        {!isProcessingPdf && (
                            <button onClick={() => setIsUploadModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        )}

                        {isProcessingPdf ? (
                            // ESTADO DE CARREGAMENTO (DENTRO DO MODAL)
                            <div className="flex flex-col items-center justify-center py-10 text-center animate-fade-in">
                                <div className="relative w-24 h-24 mb-6">
                                    <div className="absolute inset-0 border-4 border-slate-100 dark:border-slate-800 rounded-full"></div>
                                    <div className="absolute inset-0 border-4 border-t-primary border-r-primary border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-4xl text-primary animate-pulse">qr_code_scanner</span>
                                    </div>
                                </div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Analisando Arquivos...</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm max-w-[200px]">
                                    A IA está identificando produtos, preços e códigos em todos os arquivos.
                                </p>
                            </div>
                        ) : (
                            // ESTADO DE UPLOAD (PADRÃO)
                            <>
                                <div className="text-center mb-8">
                                    <div className="p-6 rounded-xl bg-primary text-white shadow-2xl relative overflow-hidden">
                                        <span className="material-symbols-outlined text-4xl">inventory_2</span>
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">Importar Produtos</h3>
                                    <p className="text-slate-500 mt-2">Envie fotos da prateleira, cardápio ou notas fiscais. Você pode selecionar múltiplos arquivos.</p>
                                </div>

                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group"
                                >
                                    <span className="material-symbols-outlined text-4xl text-slate-400 group-hover:text-primary mb-2 transition-colors">add_photo_alternate</span>
                                    <span className="font-bold text-slate-600 dark:text-slate-300 group-hover:text-primary transition-colors">Clique para selecionar arquivos</span>
                                    <span className="text-xs text-slate-400 mt-1">Suporta JPG, PNG e PDF (Múltiplos)</span>
                                </div>

                                <div className="mt-6 flex justify-center">
                                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Powered by Gemini AI</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Modal de Cadastro Manual */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
                    <div className="bg-white dark:bg-card-dark rounded-xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">

                        {/* Tabs Header */}
                        <div className="flex border-b border-slate-200 dark:border-slate-700">
                            <button
                                onClick={() => setTab('GERAL')}
                                className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors ${tab === 'GERAL' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                            >
                                Dados Gerais
                            </button>
                            <button
                                onClick={() => setTab('FISCAL')}
                                className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors ${tab === 'FISCAL' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                            >
                                Fiscal & Tributário
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {tab === 'GERAL' && (
                                <div className="space-y-4 animate-fade-in">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Nome do Produto</label>
                                        <input type="text" className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Código de Barras</label>
                                        <input type="text" className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white" value={formData.barcode} onChange={e => setFormData({ ...formData, barcode: e.target.value })} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">Preço Custo</label>
                                            <input type="number" className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white" value={formData.costPrice} onChange={e => setFormData({ ...formData, costPrice: parseFloat(e.target.value) })} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center">
                                                Preço Venda
                                                <HelpTip content="Preço final para o consumidor. O lucro é a diferença entre Venda e Custo." className="ml-1" />
                                            </label>
                                            <input type="number" className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white" value={formData.salePrice} onChange={e => setFormData({ ...formData, salePrice: parseFloat(e.target.value) })} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">Estoque</label>
                                            <input type="number" className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white" value={formData.stock} onChange={e => setFormData({ ...formData, stock: parseFloat(e.target.value) })} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">Validade (Opcional)</label>
                                            <input type="date" className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white" value={formData.expiryDate || ''} onChange={e => setFormData({ ...formData, expiryDate: e.target.value })} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {tab === 'FISCAL' && (
                                <div className="space-y-4 animate-fade-in">
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-xs text-blue-700 dark:text-blue-300 mb-4">
                                        Estes dados são obrigatórios para emissão de NF-e e NFC-e.
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center">
                                                NCM
                                                <HelpTip content="Nomenclatura Comum do Mercosul. Código de 8 dígitos obrigatório na nota fiscal." />
                                            </label>
                                            <input type="text" placeholder="Ex: 6109.10.00" className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white" value={formData.taxData?.ncm || ''} onChange={e => setFormData({ ...formData, taxData: { ...formData.taxData, ncm: e.target.value } as any })} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">CEST</label>
                                            <input type="text" placeholder="Ex: 28.038.00" className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white" value={formData.taxData?.cest || ''} onChange={e => setFormData({ ...formData, taxData: { ...formData.taxData, cest: e.target.value } as any })} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Origem da Mercadoria</label>
                                        <select
                                            className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                            value={formData.taxData?.taxOrigin || '0'}
                                            onChange={e => setFormData({ ...formData, taxData: { ...formData.taxData, taxOrigin: e.target.value } as any })}
                                        >
                                            <option value="0">0 - Nacional</option>
                                            <option value="1">1 - Estrangeira (Imp. Direta)</option>
                                            <option value="2">2 - Estrangeira (Adq. no mercado interno)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">CFOP Padrão</label>
                                        <input type="text" placeholder="Ex: 5102" className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white" value={formData.taxData?.cfop || ''} onChange={e => setFormData({ ...formData, taxData: { ...formData.taxData, cfop: e.target.value } as any })} />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-2 p-6 pt-0">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-500">Cancelar</button>
                            <button onClick={handleSubmit} className="px-4 py-2 text-sm font-bold bg-primary text-white rounded-lg shadow-md">
                                Salvar Produto
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* IMPORT REVIEW MODAL */}
            {isImportReviewOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white dark:bg-card-dark w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-zoom-in">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">auto_awesome</span>
                                    Revisão de Importação (IA)
                                </h3>
                                <p className="text-sm text-slate-500">Confira os produtos identificados no documento.</p>
                            </div>
                            <button onClick={() => { setIsImportReviewOpen(false); setImportedProducts([]); }} className="text-slate-400 hover:text-slate-600">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-500 uppercase sticky top-0 z-10">
                                    <tr>
                                        <th className="px-4 py-3 rounded-tl-lg w-28">Código (SKU)</th>
                                        <th className="px-4 py-3">Produto Identificado</th>
                                        <th className="px-4 py-3 w-28 text-center">Qtde (Estoque)</th>
                                        <th className="px-4 py-3 w-32 text-right">Custo Unit.</th>
                                        <th className="px-4 py-3 w-32 text-right">Venda Unit.</th>
                                        <th className="px-4 py-3 w-16 text-center rounded-tr-lg">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {importedProducts.map((p, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <td className="px-4 py-3">
                                                <input
                                                    type="text"
                                                    className="w-full bg-slate-50 dark:bg-slate-900 rounded px-2 py-1 text-xs font-bold outline-none focus:ring-1 focus:ring-primary text-slate-600 dark:text-slate-400"
                                                    value={p.sku || ''}
                                                    placeholder="Cód."
                                                    onChange={(e) => updateImportItem(idx, 'sku', e.target.value)}
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="text"
                                                    className="w-full bg-transparent border-b border-transparent focus:border-primary outline-none font-medium text-slate-900 dark:text-white"
                                                    value={p.name}
                                                    onChange={(e) => updateImportItem(idx, 'name', e.target.value)}
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    className="w-full bg-slate-100 dark:bg-slate-900 rounded px-2 py-1 text-center font-bold outline-none focus:ring-1 focus:ring-primary"
                                                    value={p.stock}
                                                    onChange={(e) => updateImportItem(idx, 'stock', parseFloat(e.target.value))}
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    className="w-full bg-slate-100 dark:bg-slate-900 rounded px-2 py-1 text-right outline-none focus:ring-1 focus:ring-primary"
                                                    value={p.costPrice}
                                                    onChange={(e) => updateImportItem(idx, 'costPrice', parseFloat(e.target.value))}
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    className="w-full bg-slate-100 dark:bg-slate-900 rounded px-2 py-1 text-right font-bold text-green-600 outline-none focus:ring-1 focus:ring-primary"
                                                    value={p.salePrice}
                                                    onChange={(e) => updateImportItem(idx, 'salePrice', parseFloat(e.target.value))}
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button onClick={() => removeImportItem(idx)} className="text-red-400 hover:text-red-600 p-1">
                                                    <span className="material-symbols-outlined">delete</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {importedProducts.length === 0 && (
                                <div className="text-center p-10 text-slate-400">
                                    <p>Nenhum item válido identificado.</p>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
                            <button
                                onClick={() => { setIsImportReviewOpen(false); setImportedProducts([]); }}
                                className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmImport}
                                disabled={importedProducts.length === 0 || isSavingImport}
                                className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSavingImport ? (
                                    <>
                                        <span className="material-symbols-outlined animate-spin">sync</span>
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined">save</span>
                                        Confirmar Importação ({importedProducts.length})
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};