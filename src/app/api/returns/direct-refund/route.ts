
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, doc, getDocs, query, where, runTransaction, setDoc } from 'firebase/firestore';
import { returnTransactionConverter, saleConverter, type ReturnTransaction } from '@/lib/types';
import { format } from 'date-fns';

async function generateCustomReturnId(): Promise<string> {
  const today = new Date();
  const datePart = format(today, "MM.dd");
  const counterDocId = format(today, "yyyy-MM-dd");

  const counterRef = doc(db, "dailyReturnCounters", counterDocId);

  try {
    const newCount = await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      if (!counterDoc.exists()) {
        transaction.set(counterRef, { count: 1 });
        return 1;
      } else {
        const count = counterDoc.data().count + 1;
        transaction.update(counterRef, { count });
        return count;
      }
    });
    // Add a specific prefix to distinguish these from regular returns
    return `direct-refund-${datePart}-${newCount}`;
  } catch (e) {
    console.error("Custom direct refund ID transaction failed: ", e);
    const randomPart = Math.random().toString(36).substring(2, 8);
    return `direct-refund-${datePart}-err-${randomPart}`;
  }
}

async function calculateAvailableCredit(customerId: string): Promise<number> {
    const salesQuery = query(collection(db, 'sales'), where('customerId', '==', customerId));
    const returnsQuery = query(collection(db, 'returns'), where('customerId', '==', customerId));

    const [salesSnapshot, returnsSnapshot] = await Promise.all([
        getDocs(salesQuery.withConverter(saleConverter)),
        getDocs(returnsQuery.withConverter(returnTransactionConverter))
    ]);

    // Credit used in sales is a debit from the credit pool
    const totalCreditUsed = salesSnapshot.docs.reduce((sum, doc) => sum + (doc.data().creditUsed || 0), 0);
    // Net refund amount (can be positive for credit given, negative for cash paid out)
    const totalRefundsNet = returnsSnapshot.docs.reduce((sum, doc) => sum + (doc.data().refundAmount || 0), 0);
    
    return totalRefundsNet - totalCreditUsed;
}


export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { customerId, customerName, cashPaidOut, staffId } = body;

        if (!customerId || !staffId || typeof cashPaidOut !== 'number' || cashPaidOut <= 0) {
            return NextResponse.json({ error: 'Missing required fields (customerId, staffId, cashPaidOut)' }, { status: 400 });
        }

        const availableCredit = await calculateAvailableCredit(customerId);

        if (cashPaidOut > availableCredit) {
            return NextResponse.json({ error: `Refund amount of ${cashPaidOut.toFixed(2)} exceeds available credit of ${availableCredit.toFixed(2)}.` }, { status: 400 });
        }
        
        const returnId = await generateCustomReturnId();

        const returnData: ReturnTransaction = {
            id: returnId,
            originalSaleId: "DIRECT_REFUND",
            returnDate: new Date(),
            staffId,
            customerId,
            customerName,
            returnedItems: [],
            exchangedItems: [],
            cashPaidOut,
            // Create a negative refund amount to correctly debit the customer's credit balance.
            refundAmount: -cashPaidOut,
        };

        const returnDocRef = doc(db, 'returns', returnId);
        await setDoc(returnDocRef.withConverter(returnTransactionConverter), returnData);

        return NextResponse.json({ message: 'Direct refund processed successfully.', returnData });

    } catch (error) {
        console.error('Error processing direct refund:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: 'Failed to process direct refund', details: errorMessage }, { status: 500 });
    }
}
