import Papa from 'papaparse';
import productsCSV from '../data/produk.csv?raw';

export const getProducts = () => {
    return new Promise((resolve, reject) => {
        Papa.parse(productsCSV, {
            header: true,
            dynamicTyping: true,
            complete: (results) => {
                const products = results.data.filter(p => p.nama); // Filter out empty lines
                resolve(products);
            },
            error: (error) => {
                reject(error);
            }
        });
    });
};

export const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
};
