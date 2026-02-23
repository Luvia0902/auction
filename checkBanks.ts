import * as dotenv from 'dotenv';
import { collection, getDocs } from 'firebase/firestore';
dotenv.config({ path: '.env.local' });
// @ts-ignore
import { db } from './src/lib/firebase';

async function test() {
    try {
        const auctionRef = collection(db, 'auctions');
        const snapshot = await getDocs(auctionRef);
        const bankSet = new Set<string>();

        snapshot.forEach(doc => {
            const court = doc.data().court;
            if (court && court.includes('銀行')) {
                bankSet.add(court);
            }
        });

        console.log('--- DB BANKS ---');
        console.log(Array.from(bankSet));
    } catch (e) {
        console.error('Error:', e);
    }
    process.exit(0);
}

test();
