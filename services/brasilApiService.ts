export interface BrasilApiCompany {
    cnpj: string;
    razao_social: string;
    nome_fantasia: string;
    descricao_situacao_cadastral: string;
    logradouro: string;
    numero: string;
    bairro: string;
    municipio: string;
    uf: string;
    cep: string;
    ddd_telefone_1: string;
}

export const fetchCnpjData = async (cnpj: string): Promise<BrasilApiCompany | null> => {
    // Remove non-digits
    const cleanCnpj = cnpj.replace(/\D/g, '');

    if (cleanCnpj.length !== 14) {
        throw new Error('CNPJ deve ter 14 dígitos.');
    }

    try {
        const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);

        if (response.status === 404) {
            throw new Error('CNPJ não encontrado na Receita Federal.');
        }

        if (!response.ok) {
            throw new Error('Erro ao consultar CNPJ.');
        }

        const data = await response.json();
        return data as BrasilApiCompany;
    } catch (error) {
        console.error("BrasilAPI Error:", error);
        throw error;
    }
};
