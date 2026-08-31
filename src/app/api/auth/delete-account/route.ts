import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession, clearSessionCookie } from '@/lib/auth';

export async function DELETE() {
  try {
    const session = await getSession();
    
    if (!session || !session.userId) {
      return NextResponse.json(
        { error: 'غير مصرح لك بالقيام بهذا الإجراء.' },
        { status: 401 }
      );
    }

    // Delete the user from the database. 
    // Prisma's Cascade delete will handle related records based on the schema.
    await db.user.delete({
      where: { id: session.userId },
    });

    // Clear session cookies
    await clearSessionCookie();

    return NextResponse.json({ success: true, message: 'تم حذف الحساب وجميع البيانات بنجاح.' });
  } catch (error) {
    console.error('[DELETE_ACCOUNT]', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء محاولة حذف الحساب.' },
      { status: 500 }
    );
  }
}
