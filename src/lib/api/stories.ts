import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';

export interface Story {
    id: string;
    title: string;
    location: string;
    tags: string[];
    roi: string;
    duration: string;
    summary: string;
    views: string;
    likes: string;
    createdAt: string;
}

export async function fetchStories(): Promise<Story[]> {
    try {
        const storiesRef = collection(db, 'stories');
        const q = query(storiesRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Story));
    } catch (e) {
        console.error('Error fetching stories:', e);
        return [];
    }
}
