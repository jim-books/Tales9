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
    let drinkId: String
    let drinkName: String
    let timestamp: Date
}

@MainActor
@Observable
final class DemoSyncClient {
    var isFirebaseReady: Bool = true
    var ordersReceived: [KioskOrder] = []
    var assignedCoasters: [String: String] = [:]  // drinkId → coasterId (UI state)

    private let db = Firestore.firestore()
    /// Firebase callbacks are off the main actor; keep registration out of actor isolation so `deinit` can remove it.
    nonisolated(unsafe) private var ordersListener: ListenerRegistration?

    init() {
        startOrdersListener()
    }

    deinit {
        ordersListener?.remove()
    }

    func clearOrders() {
        let batch = db.batch()
        for order in ordersReceived {
            let ref = db.collection("venues").document("demo")
                        .collection("orders").document(order.id)
            batch.deleteDocument(ref)
        }
        batch.commit { _ in }
        ordersReceived.removeAll()
        assignedCoasters.removeAll()
    }

    // Writes session state to venues/demo/session/current so the display app reacts.
    func sendSession(active: Bool, userCount: Int = 0) {
        let ref = db.collection("venues").document("demo")
                    .collection("session").document("current")
        ref.setData([
            "active": active,
            "userCount": userCount,
            "updatedAt": Timestamp(date: Date())
        ], merge: true) { [weak self] error in
            if error != nil {
                DispatchQueue.main.async { self?.isFirebaseReady = false }
            }
        }
    }

    // Writes a coaster→drink assignment to venues/demo/coasterAssignments/{coasterId}.
    func sendCoasterAssignment(coasterId: String, drinkId: String) {
        let ref = db.collection("venues").document("demo")
                    .collection("coasterAssignments").document(coasterId)
        ref.setData([
            "drinkId": drinkId,
            "updatedAt": Timestamp(date: Date())
        ], merge: true) { [weak self] error in
            if error != nil {
                DispatchQueue.main.async { self?.isFirebaseReady = false }
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
                let tsMs = data["timestamp"] as? TimeInterval ?? (Date().timeIntervalSince1970 * 1000)
                return KioskOrder(
                    id: doc.documentID,
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
}
