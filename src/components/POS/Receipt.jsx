import React, { forwardRef } from 'react';
import { MeraLogo } from '../Logo';

const Receipt = forwardRef(({ cart, subtotal, total, paymentMethod, customer }, ref) => {
    return (
        <div ref={ref} style={{
            fontFamily: 'monospace',
            fontSize: '12px',
            padding: '8px',
            width: '58mm',
            margin: '0 auto',
            background: 'white',
            color: 'black',
            lineHeight: '1.4',
        }}>
            {/* Logo */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                <MeraLogo className="h-10 w-auto" style={{ filter: 'invert(1)', display: 'block' }} />
            </div>

            {/* Meta */}
            <div style={{ fontSize: '11px', marginBottom: '8px', color: 'black' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Tgl : {new Date().toLocaleDateString('id-ID')}</span>
                    <span>Jam : {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Cust: {customer.name || 'Guest'}</span>
                    <span>{customer.type}</span>
                </div>
                <div><span>Kasir: Satria</span></div>
            </div>

            <div style={{ borderBottom: '2px dashed black', margin: '8px 0' }}></div>

            {/* Items */}
            <div style={{ marginBottom: '8px', color: 'black' }}>
                {cart.map((item, index) => {
                    let itemTotal = 0;
                    let singlePriceDisplay = 0;

                    if (item.tipe_harga === 'bertingkat') {
                        if (item.qty === 1) itemTotal = item.tier_1 || 0;
                        else if (item.qty === 2) itemTotal = item.tier_2 || item.tier_1 || 0;
                        else if (item.qty === 3) itemTotal = item.tier_3 || item.tier_2 || item.tier_1 || 0;
                        else {
                            const baseThree = item.tier_3 || item.tier_2 || item.tier_1 || 0;
                            const extra = (item.qty - 3) * (item.tier_lebih || 0);
                            itemTotal = baseThree + extra;
                        }
                        singlePriceDisplay = itemTotal / item.qty;
                    } else {
                        singlePriceDisplay = item.price || item.harga || 0;
                        itemTotal = singlePriceDisplay * item.qty;
                    }

                    return (
                        <div key={index} style={{ marginBottom: '6px' }}>
                            <div style={{ fontWeight: 'bold', color: 'black' }}>{item.nama || item.name}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'black' }}>
                                <span>{item.qty} x {parseInt(singlePriceDisplay).toLocaleString('id-ID')}</span>
                                <span>{parseInt(itemTotal).toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div style={{ borderBottom: '2px dashed black', margin: '8px 0' }}></div>

            {/* Total */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px', color: 'black' }}>
                <span>TOTAL</span>
                <span>Rp {total.toLocaleString('id-ID')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '4px', textTransform: 'uppercase', color: 'black' }}>
                <span>Pembayaran</span>
                <span>{paymentMethod}</span>
            </div>

            <div style={{ borderBottom: '2px dashed black', margin: '8px 0' }}></div>

            {/* Footer */}
            <div style={{ textAlign: 'center', fontSize: '11px', color: 'black', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                <p style={{ margin: '2px 0', color: '#000000' }}>Terimakasih!</p>
                <p style={{ margin: '2px 0', color: '#000000' }}>Jangan lupa follow dan tag kami di instagram yaa</p>
                <p style={{ margin: '2px 0', fontWeight: 'bold', color: '#000000' }}>@mera.selfstudios</p>
            </div>
        </div>
    );
});

export default Receipt;
