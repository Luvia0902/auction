import * as dotenv from 'dotenv';
import { collection, getDocs } from 'firebase/firestore';
dotenv.config({ path: '.env.local' });
// @ts-ignore
import { db } from './src/lib/firebase';

async function test() {
    try {
        const auctionRef = collection(db, 'auctions');
        const snapshot = await getDocs(auctionRef);
        let chbCount = 0;
        let totalCount = 0;

        snapshot.forEach(doc => {
            totalCount++;
            const court = doc.data().court;
            if (court && court.includes('彰化銀行')) {
                chbCount++;
            }
        });

        console.log(`Total DB properties: ${totalCount}`);
        console.log(`Chang Hwa Bank properties: ${chbCount}`);
    } catch (e) {
        console.error('Error:', e);
    }
    process.exit(0);
}

test();
