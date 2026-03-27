//
//  SmartTableAIApp.swift
//  SmartTableAI
//
//  Created by jimbook on 11/12/2025.
//

import SwiftUI
import FirebaseCore

@main
struct SmartTableAIApp: App {
    @State private var viewModel = AppViewModel(service: MockAuraService())

    init() {
        FirebaseApp.configure()
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(viewModel)
        }
    }
}
