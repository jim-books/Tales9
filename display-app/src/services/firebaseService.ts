import { initializeApp, getApps } from 'firebase/app'
import {
  getFirestore,
  doc,
  setDoc,
  deleteDoc,
  collection,
  onSnapshot,
} from 'firebase/firestore'
import type { Order } from '../types'
import { getDrinkById } from '../data/drinkCatalog'

const FIREBASE_CONFIG = {
  apiKey:
    (import.meta.env.VITE_FIREBASE_API_KEY as string | undefined) ??
    'AIzaSyAmel3OfSqCxjgyeJFjbwhCIXAnGJ_P-NU',
  authDomain: 'tales9-8383d.firebaseapp.com',
  projectId:
    (import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined) ??
    'tales9-8383d',
  storageBucket:
    (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined) ??
    'tales9-8383d.firebasestorage.app',
}

let _db: ReturnType<typeof getFirestore> | null = null

function getDb() {
  if (_db) return _db
  try {
    const app = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG)
    _db = getFirestore(app)
    return _db
  } catch {
    return null
  }
}

// ── Writes ────────────────────────────────────────────────────────────────────

export async function writeOrderToFirestore(order: Order): Promise<void> {
  const db = getDb()
  if (!db) return
  try {
    const drink = getDrinkById(order.drinkId)
    await setDoc(doc(db, 'venues', 'demo', 'orders', order.id), {
      drinkId: order.drinkId,
      drinkName: drink?.name ?? order.drinkId,
      userId: order.userId,
      status: order.status,
      timestamp: order.createdAt,
    })
  } catch (e) {
    console.warn('[Firebase] writeOrder failed:', e)
  }
}

export async function writeCoasterAssignmentToFirestore(
  coasterId: string,
  orderId: string,
  drinkId: string,
): Promise<void> {
  const db = getDb()
  if (!db) return
  try {
    await setDoc(doc(db, 'venues', 'demo', 'coasterAssignments', coasterId), {
      orderId,
      drinkId,
      updatedAt: Date.now(),
    })
  } catch (e) {
    console.warn('[Firebase] writeCoasterAssignment failed:', e)
  }
}

export async function deleteCoasterAssignmentFromFirestore(coasterId: string): Promise<void> {
  const db = getDb()
  if (!db) return
  try {
    await deleteDoc(doc(db, 'venues', 'demo', 'coasterAssignments', coasterId))
  } catch (e) {
    console.warn('[Firebase] deleteCoasterAssignment failed:', e)
  }
}

// ── Listeners ─────────────────────────────────────────────────────────────────

export type SessionSnapshot = { active: boolean; userCount: number }
export type AssignmentSnapshot =
  | { type: 'assigned'; coasterId: string; orderId: string; drinkId: string }
  | { type: 'cleared'; coasterId: string }

/**
 * Listens to venues/demo/session/current for session state changes pushed by iOS.
 * Returns an unsubscribe function.
 */
export function listenToSession(
  onUpdate: (snap: SessionSnapshot) => void,
): () => void {
  const db = getDb()
  if (!db) return () => {}
  return onSnapshot(doc(db, 'venues', 'demo', 'session', 'current'), (snap) => {
    if (!snap.exists()) return
    const d = snap.data()
    onUpdate({ active: Boolean(d.active), userCount: Number(d.userCount ?? 0) })
  })
}

/**
 * Listens to venues/demo/coasterAssignments for order->coaster assignments from iOS.
 * Emits assigned for add/modify, and cleared for delete.
 * Returns an unsubscribe function.
 */
export function listenToCoasterAssignments(
  onChange: (snap: AssignmentSnapshot) => void,
): () => void {
  const db = getDb()
  if (!db) return () => {}
  return onSnapshot(
    collection(db, 'venues', 'demo', 'coasterAssignments'),
    (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          const d = change.doc.data()
          const orderId = d.orderId as string | undefined
          const drinkId = d.drinkId as string | undefined
          if (orderId && drinkId) {
            onChange({ type: 'assigned', coasterId: change.doc.id, orderId, drinkId })
          }
        } else if (change.type === 'removed') {
          onChange({ type: 'cleared', coasterId: change.doc.id })
        }
      })
    },
  )
}
