import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID || "scholarsage-ue2av",
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
    });
}

export async function POST(request: Request) {
    try {
        // This is a one-time admin sync - in production, protect this endpoint
        const authUsers = await admin.auth().listUsers(1000);
        const firestore = admin.firestore();

        const results = [];

        for (const user of authUsers.users) {
            const userDocRef = firestore.collection('users').doc(user.uid);
            const existingDoc = await userDocRef.get();

            if (!existingDoc.exists) {
                // Generate a simple username from email or display name
                const baseName = (user.displayName || user.email?.split('@')[0] || 'user')
                    .replace(/\s+/g, '')
                    .toLowerCase()
                    .substring(0, 10);
                const username = `@${baseName}_${Math.floor(Math.random() * 1000)}`;

                await userDocRef.set({
                    email: user.email,
                    displayName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
                    photoURL: user.photoURL || null,
                    provider: user.providerData[0]?.providerId || 'unknown',
                    username: username,
                    followerCount: 0,
                    followingCount: 0,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                });

                results.push({ uid: user.uid, email: user.email, status: 'created' });
            } else {
                results.push({ uid: user.uid, email: user.email, status: 'already_exists' });
            }
        }

        return NextResponse.json({
            success: true,
            message: `Synced ${results.length} users`,
            results
        });
    } catch (error: any) {
        console.error('Sync users error:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
