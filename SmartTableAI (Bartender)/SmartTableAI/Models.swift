import Foundation
import SwiftUI

enum ConnectionState: String, CaseIterable, Identifiable {
    case online, offline, updating, incompatible, pairing
    var id: String { rawValue }

    var label: String {
        switch self {
        case .online: return "Online"
        case .offline: return "Offline"
        case .updating: return "Updating"
        case .incompatible: return "Incompatible"
        case .pairing: return "Pairing"
        }
    }

    var tint: Color {
        switch self {
        case .online: return .green
        case .offline: return .gray
        case .updating: return .orange
        case .incompatible: return .red
        case .pairing: return .blue
        }
    }
}

struct AuraTable: Identifiable, Hashable {
    let id: UUID
    var name: String
    var tableId: String
    var softwareVersion: String
    var status: ConnectionState
    var paired: Bool
    var ipAddress: String
    var lastSeen: Date
}

struct BrandColors: Hashable, Codable {
    var primary: String
    var secondary: String
    var accent: String
    var background: String
}

struct BrandTypography: Hashable, Codable {
    var headingFont: String
    var bodyFont: String
}

struct BrandProfile: Identifiable, Hashable, Codable {
    let id: UUID
    var venueName: String
    var tagline: String
    var colors: BrandColors
    var typography: BrandTypography
    var idleAnimation: AnimationTemplate
    var brightness: Double
    var brightnessCap: Double?
    var primaryLogoName: String?
    var secondaryLogoName: String?
    var backgroundImageName: String?
}

struct AnimationTemplate: Identifiable, Hashable, Codable {
    let id: String
    var name: String
    var description: String
    var parameters: [String: Double]
}

struct Drink: Identifiable, Hashable, Codable {
    let id: UUID
    var name: String
    var description: String
    var category: String
    var iconName: String
    var useBrandColors: Bool
    var colors: BrandColors
    var animation: AnimationTemplate
    var showNameOnPlacement: Bool
    var displayDuration: Double
    var intensity: Double
    var speed: Double
}

struct Coaster: Identifiable, Hashable, Codable {
    let id: UUID
    var code: String
    var label: String
    var assignedDrinkId: UUID?
    var lastSeen: Date?
    var positionDescription: String?
}

struct Telemetry: Hashable {
    var uptimeHours: Double
    var lastRestart: Date
    var temperatureC: Double
    var detectionRate: Int
    var storageFreeGb: Double
    var drinkCount: Int
    var coasterCount: Int
    var warnings: [String]
    var updateAvailable: Bool
}

enum UpdateStatus: String, Identifiable {
    case upToDate, available, downloading, installing, restarting
    var id: String { rawValue }
}

struct UpdateInfo: Hashable {
    var currentVersion: String
    var availableVersion: String?
    var releaseNotes: String?
    var status: UpdateStatus
    var progress: Double
}

struct SimulatedCoaster: Identifiable, Hashable {
    let id: UUID
    var name: String
    var drinkId: UUID?
    var position: CGPoint
    var rotation: Double
}

enum AppFlow: Equatable {
    case welcome
    case pairing(AuraTable)
    case brandWizard
    case main
}

extension Color {
    init(hex: String) {
        let sanitized = hex.replacingOccurrences(of: "#", with: "")
        var rgb: UInt64 = 0
        Scanner(string: sanitized).scanHexInt64(&rgb)
        let r = Double((rgb >> 16) & 0xFF) / 255.0
        let g = Double((rgb >> 8) & 0xFF) / 255.0
        let b = Double(rgb & 0xFF) / 255.0
        self.init(red: r, green: g, blue: b)
    }
}

