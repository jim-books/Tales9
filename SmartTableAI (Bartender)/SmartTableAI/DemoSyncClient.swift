//
//  DemoSyncClient.swift
//  SmartTableAI
//
//  Demo Firestore client for syncing config to the table and receiving orders from the kiosk.
//

import Foundation
import FirebaseFirestore

struct KioskOrder: Identifiable {
    let id: String
    let userId: String
    let drinkId: String
    let drinkName: String
    let timestamp: Date

    /// Display label for kiosk user nodes (`user-0` → "User 1").
    var displayUserLabel: String {
        guard userId.hasPrefix("user-"),
              let index = Int(userId.dropFirst(5)) else {
            return userId
        }
        return "User \(index + 1)"
    }
}

@MainActor
@Observable
final class DemoSyncClient {
    var isFirebaseReady: Bool = true
    var ordersReceived: [KioskOrder] = []
    var assignedCoasters: [String: String] = [:]  // orderId → coasterId (UI state)

    private let db = Firestore.firestore()
    /// Firebase callbacks are off the main actor; keep registration out of actor isolation so `deinit` can remove it.
    nonisolated(unsafe) private var ordersListener: ListenerRegistration?

    init() {
        startOrdersListener()
    }

    deinit {
        ordersListener?.remove()
    }

    func clearOrdersAndAssignments() {
        Task {
            await clearOrdersAndAssignmentsInFirestore()
        }
    }

    // Writes session state to venues/demo/session/current so the display app reacts.
    func sendSession(active: Bool, userCount: Int = 0) {
        Task {
            if active {
                await clearOrdersAndAssignmentsInFirestore()
            }
            await sendSessionState(active: active, userCount: userCount)
            if !active {
                await clearOrdersAndAssignmentsInFirestore()
            }
        }
    }

    private func sendSessionState(active: Bool, userCount: Int) async {
        let ref = db.collection("venues").document("demo")
            .collection("session").document("current")
        do {
            try await ref.setData([
                "active": active,
                "userCount": userCount,
                "updatedAt": Timestamp(date: Date())
            ], merge: true)
        } catch {
            isFirebaseReady = false
        }
    }

    // Writes a coaster→order assignment to venues/demo/coasterAssignments/{coasterId}.
    func sendCoasterAssignment(coasterId: String, orderId: String, drinkId: String) {
        let ref = db.collection("venues").document("demo")
                    .collection("coasterAssignments").document(coasterId)
        ref.setData([
            "orderId": orderId,
            "drinkId": drinkId,
            "updatedAt": Timestamp(date: Date())
        ], merge: true) { [weak self] error in
            if error != nil {
                DispatchQueue.main.async { self?.isFirebaseReady = false }
            }
        }
    }

    func clearCoasterAssignment(coasterId: String, forOrderId orderId: String) {
        let ref = db.collection("venues").document("demo")
            .collection("coasterAssignments").document(coasterId)
        ref.delete { [weak self] error in
            if error != nil {
                DispatchQueue.main.async { self?.isFirebaseReady = false }
                return
            }
            DispatchQueue.main.async {
                self?.assignedCoasters.removeValue(forKey: orderId)
            }
        }
    }

    func sendConfig(animationType: String, topBarName: String, color: String) {
        let ref = db.collection("venues").document("demo").collection("config").document("current")
        ref.setData([
            "animationType": animationType,
            "topBarName": topBarName,
            "color": color,
            "updatedAt": Timestamp(date: Date())
        ], merge: true) { [weak self] error in
            if error != nil {
                DispatchQueue.main.async { self?.isFirebaseReady = false }
            }
        }
    }

    private func startOrdersListener() {
        let ref = db.collection("venues").document("demo").collection("orders")
        ordersListener = ref.addSnapshotListener { [weak self] snapshot, error in
            guard let self else { return }
            if let error = error {
                print("Firestore orders listener error: \(error)")
                return
            }
            guard let documents = snapshot?.documents else { return }
            let orders = documents.compactMap { doc -> KioskOrder? in
                let data = doc.data()
                let drinkId = (data["drinkId"] as? String) ?? (data["drinkId"] as? Int).map { String($0) } ?? ""
                let drinkName = data["drinkName"] as? String ?? drinkId
                let userId = data["userId"] as? String ?? ""
                let tsMs = data["timestamp"] as? TimeInterval ?? (Date().timeIntervalSince1970 * 1000)
                return KioskOrder(
                    id: doc.documentID,
                    userId: userId,
                    drinkId: drinkId,
                    drinkName: drinkName,
                    timestamp: Date(timeIntervalSince1970: tsMs / 1000)
                )
            }
            let sorted = orders.sorted { $0.timestamp > $1.timestamp }
            DispatchQueue.main.async {
                self.ordersReceived = sorted
            }
        }
    }

    private func clearOrdersAndAssignmentsInFirestore() async {
        do {
            let venueRef = db.collection("venues").document("demo")
            let ordersSnapshot = try await venueRef.collection("orders").getDocuments()
            let assignmentsSnapshot = try await venueRef.collection("coasterAssignments").getDocuments()
            let batch = db.batch()

            for doc in ordersSnapshot.documents {
                batch.deleteDocument(doc.reference)
            }
            for doc in assignmentsSnapshot.documents {
                batch.deleteDocument(doc.reference)
            }

            try await batch.commit()
            ordersReceived.removeAll()
            assignedCoasters.removeAll()
        } catch {
            isFirebaseReady = false
        }
    }
}
