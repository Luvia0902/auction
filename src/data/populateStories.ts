import { addDoc, collection } from 'firebase/firestore';
import { Story } from '../lib/api/stories';
import { db } from '../lib/firebase';

const MOCK_STORIES: Omit<Story, 'id'>[] = [
    {
        title: '信義區老公寓，一拍流標三拍撿漏',
        location: '台北市信義區',
        tags: ['不點交', '排除租約', '精華地段'],
        roi: '45%',
        duration: '持有 8 個月',
        summary: '原本帶有假租約的不點交物件，無人敢碰。透過精準的法律程序成功排除租約，並重新整理後以市價售出，成功獲利。',
        views: '12.5k',
        likes: '342',
        createdAt: new Date().toISOString()
    },
    {
        title: '點交不順利？教你如何和平勸退海蟑螂',
        location: '新北市中和區',
        tags: ['點交', '佔用處理', '談判技巧'],
        roi: '28%',
        duration: '處理 3 個月',
        summary: '得標後發現前屋主惡意破壞並拒絕搬遷。分享如何運用法院公權力結合搬遷費談判，以最低成本和平取回房屋。',
        views: '8.9k',
        likes: '215',
        createdAt: new Date().toISOString()
    }
];

export async function populateStories() {
    const storiesRef = collection(db, 'stories');
    for (const story of MOCK_STORIES) {
        await addDoc(storiesRef, story);
    }
    console.log('Stories populated!');
}
