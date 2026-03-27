import Foundation

protocol AuraService {
    func discoverTables() -> [AuraTable]
    func pair(table: AuraTable, code: String) -> Bool
    func loadBrand(for table: AuraTable) -> BrandProfile
    func loadDrinks(for table: AuraTable) -> [Drink]
    func loadCoasters(for table: AuraTable, drinks: [Drink]) -> [Coaster]
    func loadTelemetry(for table: AuraTable, drinks: [Drink], coasters: [Coaster]) -> Telemetry
    func updateInfo(for table: AuraTable) -> UpdateInfo
    func templates() -> [AnimationTemplate]
}

final class MockAuraService: AuraService {
    private let templateCatalog: [AnimationTemplate] = [
        AnimationTemplate(id: "A01", name: "Pulse", description: "Soft breathing glow", parameters: ["speed": 0.5, "intensity": 0.6]),
        AnimationTemplate(id: "A02", name: "Ripple", description: "Gentle expanding rings", parameters: ["speed": 0.7, "intensity": 0.7]),
        AnimationTemplate(id: "A03", name: "Spark", description: "Playful sparkles", parameters: ["speed": 0.8, "intensity": 0.9]),
        AnimationTemplate(id: "A04", name: "Aurora", description: "Slow moving gradients", parameters: ["speed": 0.4, "intensity": 0.7]),
        AnimationTemplate(id: "A05", name: "Beam", description: "Directional light sweep", parameters: ["speed": 0.9, "intensity": 0.8])
    ]

    func templates() -> [AnimationTemplate] {
        templateCatalog
    }

    func discoverTables() -> [AuraTable] {
        [
            AuraTable(id: UUID(), name: "Main Bar", tableId: "AURA-2847", softwareVersion: "1.6.2", status: .online, paired: true, ipAddress: "10.0.0.42", lastSeen: Date()),
            AuraTable(id: UUID(), name: "Lounge", tableId: "AURA-1734", softwareVersion: "1.6.0", status: .offline, paired: false, ipAddress: "10.0.0.51", lastSeen: Date().addingTimeInterval(-3600)),
            AuraTable(id: UUID(), name: "Patio", tableId: "AURA-1999", softwareVersion: "1.5.3", status: .incompatible, paired: false, ipAddress: "10.0.0.66", lastSeen: Date().addingTimeInterval(-7200))
        ]
    }

    func pair(table: AuraTable, code: String) -> Bool {
        code.count == 6
    }

    func loadBrand(for table: AuraTable) -> BrandProfile {
        BrandProfile(
            id: UUID(),
            venueName: "AURA Demo Venue",
            tagline: "Immersive tables for modern bars",
            colors: BrandColors(primary: "#7D5FFF", secondary: "#F2A950", accent: "#FF6B6B", background: "#0B0B13"),
            typography: BrandTypography(headingFont: "SF Pro Rounded", bodyFont: "SF Pro"),
            idleAnimation: templateCatalog.first ?? AnimationTemplate(id: "A01", name: "Pulse", description: "", parameters: ["speed": 0.5]),
            brightness: 75,
            brightnessCap: 85,
            primaryLogoName: "primary_logo",
            secondaryLogoName: nil,
            backgroundImageName: nil
        )
    }

    func loadDrinks(for table: AuraTable) -> [Drink] {
        let base = BrandColors(primary: "#7D5FFF", secondary: "#F2A950", accent: "#FF6B6B", background: "#0B0B13")
        return [
            Drink(id: UUID(), name: "Electric Paloma", description: "Grapefruit, tequila, citrus, saline", category: "Tequila", iconName: "sparkles", useBrandColors: false, colors: BrandColors(primary: "#FF7E5F", secondary: "#FEB47B", accent: "#FFE29F", background: base.background), animation: templateCatalog[1], showNameOnPlacement: true, displayDuration: 3, intensity: 0.8, speed: 0.7),
            Drink(id: UUID(), name: "Midnight Old Fashioned", description: "Smoked bourbon, demerara, bitters", category: "Whiskey", iconName: "flame.fill", useBrandColors: false, colors: BrandColors(primary: "#F6C177", secondary: "#B07D62", accent: "#D36135", background: base.background), animation: templateCatalog[0], showNameOnPlacement: false, displayDuration: 2, intensity: 0.6, speed: 0.5),
            Drink(id: UUID(), name: "Cucumber Cooler", description: "Gin, cucumber, mint, soda", category: "Gin", iconName: "leaf.fill", useBrandColors: true, colors: base, animation: templateCatalog[3], showNameOnPlacement: true, displayDuration: 4, intensity: 0.5, speed: 0.6)
        ]
    }

    func loadCoasters(for table: AuraTable, drinks: [Drink]) -> [Coaster] {
        [
            Coaster(id: UUID(), code: "C01", label: "Red dot", assignedDrinkId: drinks.first?.id, lastSeen: Date(), positionDescription: "Front left"),
            Coaster(id: UUID(), code: "C02", label: "Blue slash", assignedDrinkId: drinks.dropFirst().first?.id, lastSeen: Date().addingTimeInterval(-600), positionDescription: "Front right"),
            Coaster(id: UUID(), code: "C03", label: "Green circle", assignedDrinkId: nil, lastSeen: nil, positionDescription: nil)
        ]
    }

    func loadTelemetry(for table: AuraTable, drinks: [Drink], coasters: [Coaster]) -> Telemetry {
        Telemetry(
            uptimeHours: 72,
            lastRestart: Date().addingTimeInterval(-3600 * 12),
            temperatureC: 53.5,
            detectionRate: 18,
            storageFreeGb: 23.4,
            drinkCount: drinks.count,
            coasterCount: coasters.count,
            warnings: ["High temperature detected at 10:15pm", "Update available"],
            updateAvailable: true
        )
    }

    func updateInfo(for table: AuraTable) -> UpdateInfo {
        UpdateInfo(
            currentVersion: table.softwareVersion,
            availableVersion: "1.6.3",
            releaseNotes: "Fixes detection reliability and adds A05 Beam animation.",
            status: .available,
            progress: 0
        )
    }
}

