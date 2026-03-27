import Foundation
import SwiftUI
import Observation

@Observable
final class AppViewModel {
    var discoveredTables: [AuraTable] = []
    var pairedTables: [AuraTable] = []
    var selectedTable: AuraTable?
    var brandProfile: BrandProfile?
    var brandPresets: [BrandProfile] = []
    var drinks: [Drink] = []
    var coasters: [Coaster] = []
    var telemetry: Telemetry = Telemetry(uptimeHours: 0, lastRestart: Date(), temperatureC: 0, detectionRate: 0, storageFreeGb: 0, drinkCount: 0, coasterCount: 0, warnings: [], updateAvailable: false)
    var updateInfo: UpdateInfo = UpdateInfo(currentVersion: "1.0.0", availableVersion: nil, releaseNotes: nil, status: .upToDate, progress: 0)
    var flow: AppFlow = .welcome
    var pairingCandidate: AuraTable?
    var manualHost: String = ""
    var reconnecting: Bool = false
    var livePreviewSimulations: [SimulatedCoaster] = []
    var adminPinEnabled: Bool = true
    var adminPin: String = "1234"

    @ObservationIgnored private let service: AuraService

    var serviceTemplates: [AnimationTemplate] {
        service.templates()
    }

    init(service: AuraService) {
        self.service = service
        discoverTables()
    }

    func discoverTables() {
        discoveredTables = service.discoverTables()
    }

    func selectForPairing(_ table: AuraTable) {
        pairingCandidate = table
        flow = .pairing(table)
    }

    func pair(code: String) -> Bool {
        guard let candidate = pairingCandidate else { return false }
        let success = service.pair(table: candidate, code: code)
        if success {
            selectedTable = candidate
            loadData(for: candidate)
            flow = .brandWizard
        }
        return success
    }

    func skipWizard() {
        flow = .main
    }

    func completeWizard(profile: BrandProfile) {
        brandProfile = profile
        flow = .main
    }

    func refreshTelemetry() {
        guard let table = selectedTable else { return }
        telemetry = service.loadTelemetry(for: table, drinks: drinks, coasters: coasters)
        updateInfo = service.updateInfo(for: table)
    }

    func applyBrand(_ profile: BrandProfile) {
        brandProfile = profile
    }

    func savePreset(profile: BrandProfile) {
        brandPresets.append(profile)
    }

    func deletePreset(_ profile: BrandProfile) {
        brandPresets.removeAll { $0.id == profile.id }
    }

    func addDrink(_ drink: Drink) {
        drinks.append(drink)
    }

    func updateDrink(_ drink: Drink) {
        guard let index = drinks.firstIndex(where: { $0.id == drink.id }) else { return }
        drinks[index] = drink
    }

    func deleteDrink(_ drink: Drink) {
        drinks.removeAll { $0.id == drink.id }
        coasters = coasters.map { coaster in
            guard coaster.assignedDrinkId == drink.id else { return coaster }
            var updated = coaster
            updated.assignedDrinkId = nil
            return updated
        }
    }

    func assign(coaster: Coaster, to drinkId: UUID?) {
        guard let index = coasters.firstIndex(where: { $0.id == coaster.id }) else { return }
        var updated = coaster
        updated.assignedDrinkId = drinkId
        coasters[index] = updated
    }

    func simulate(coaster: SimulatedCoaster) {
        livePreviewSimulations.append(coaster)
    }

    func clearSimulations() {
        livePreviewSimulations.removeAll()
    }

    func switchTable(_ table: AuraTable) {
        selectedTable = table
        loadData(for: table)
        flow = .main
    }

    func forgetSelectedTable() {
        selectedTable = nil
        brandProfile = nil
        drinks = []
        coasters = []
        flow = .welcome
    }

    func startUpdate() {
        guard selectedTable != nil else { return }
        var info = updateInfo
        info.status = .downloading
        info.progress = 0.1
        updateInfo = info
    }

    func restartTable() {
        reconnecting = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            self.reconnecting = false
            self.refreshTelemetry()
        }
    }

    private func loadData(for table: AuraTable) {
        let brand = service.loadBrand(for: table)
        let drinks = service.loadDrinks(for: table)
        let coasters = service.loadCoasters(for: table, drinks: drinks)
        self.brandProfile = brand
        self.drinks = drinks
        self.coasters = coasters
        self.telemetry = service.loadTelemetry(for: table, drinks: drinks, coasters: coasters)
        self.updateInfo = service.updateInfo(for: table)
    }
}

