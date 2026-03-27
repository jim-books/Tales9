//
//  ContentView.swift
//  SmartTableAI
//
//  Created by jimbook on 11/12/2025.
//

import SwiftUI
import Observation

struct ContentView: View {
    @Environment(AppViewModel.self) private var model

    var body: some View {
        NavigationStack {
            ZStack(alignment: .top) {
                switch model.flow {
                case .welcome:
                    WelcomeScreen()
                case .pairing(let table):
                    PairingScreen(table: table)
                case .brandWizard:
                    BrandWizardScreen()
                case .main:
                    MainShell()
                }
            }
            .navigationTitle("AURA Manager")
            .toolbarTitleDisplayMode(.inline)
            .toolbar {
                if model.reconnecting {
                    ToolbarItem(placement: .navigationBarLeading) {
                        Label("Reconnecting…", systemImage: "wifi.exclamationmark")
                            .foregroundStyle(.orange)
                    }
                }
            }
        }
        .onAppear {
            model.discoverTables()
        }
    }
}

private struct WelcomeScreen: View {
    @Environment(AppViewModel.self) private var model
    @State private var showManualEntry = false
    @State private var manualHost = ""

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                VStack(alignment: .leading, spacing: 12) {
                    Text("Configure your AURA tables with no code.")
                        .font(.title)
                        .fontWeight(.semibold)
                    Text("Discover tables on the local network, pair with a 6-digit code, then customize branding, drinks, coasters, and live previews.")
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                DiscoveryList()

                Button {
                    showManualEntry.toggle()
                } label: {
                    Label("Enter IP / Host manually", systemImage: "network")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .tint(.indigo)

                if showManualEntry {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Manual connect")
                            .font(.headline)
                        TextField("e.g. 10.0.0.42", text: $manualHost)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                            .textFieldStyle(.roundedBorder)
                        Text("If discovery fails, enter the table IP/hostname printed in setup docs.")
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    }
                    .padding()
                    .background(.thinMaterial)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                }
            }
            .padding()
        }
    }
}

private struct DiscoveryList: View {
    @Environment(AppViewModel.self) private var model

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Discovered tables")
                    .font(.headline)
                Spacer()
                Button {
                    model.discoverTables()
                } label: {
                    Label("Refresh", systemImage: "arrow.clockwise")
                }
                .labelStyle(.iconOnly)
            }

            if model.discoveredTables.isEmpty {
                HStack {
                    ProgressView()
                    Text("Scanning local network…")
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            } else {
                ForEach(model.discoveredTables) { table in
                    Button {
                        model.selectForPairing(table)
                    } label: {
                        HStack(spacing: 12) {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(table.name)
                                    .font(.headline)
                                Text("\(table.tableId) • v\(table.softwareVersion)")
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                            }
                            Spacer()
                            Label(table.status.label, systemImage: "circle.fill")
                                .foregroundStyle(table.status.tint)
                                .font(.footnote)
                            if table.paired {
                                Label("Paired", systemImage: "checkmark.seal.fill")
                                    .foregroundStyle(.green)
                            }
                        }
                        .padding()
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(.ultraThinMaterial)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                }
            }
        }
    }
}

private struct PairingScreen: View {
    @Environment(AppViewModel.self) private var model
    let table: AuraTable
    @State private var code: String = ""
    @State private var showError = false

    var body: some View {
        Form {
            Section("Table") {
                Text(table.name)
                Text(table.tableId)
                    .foregroundStyle(.secondary)
            }
            Section("Enter 6-digit pairing code") {
                TextField("123456", text: $code)
                    .keyboardType(.numberPad)
                Button("Pair & Continue") {
                    let success = model.pair(code: code)
                    showError = !success
                }
                .buttonStyle(.borderedProminent)
                .disabled(code.count != 6)
                if showError {
                    Text("Invalid code. Check the sticker or table display.")
                        .foregroundStyle(.red)
                        .font(.footnote)
                }
            }
        }
    }
}

private struct BrandWizardScreen: View {
    @Environment(AppViewModel.self) private var model
    @State private var step: Int = 0
    @State private var profile: BrandProfile = BrandProfile(
        id: UUID(),
        venueName: "New Venue",
        tagline: "Describe your vibe",
        colors: BrandColors(primary: "#7D5FFF", secondary: "#F2A950", accent: "#FF6B6B", background: "#0B0B13"),
        typography: BrandTypography(headingFont: "SF Pro Rounded", bodyFont: "SF Pro"),
        idleAnimation: AnimationTemplate(id: "A01", name: "Pulse", description: "Soft breathing glow", parameters: ["speed": 0.5, "intensity": 0.6]),
        brightness: 70,
        brightnessCap: 85,
        primaryLogoName: nil,
        secondaryLogoName: nil,
        backgroundImageName: nil
    )

    private var steps: [String] = ["Venue", "Palette", "Animation", "Preview"]

    var body: some View {
        VStack(spacing: 16) {
            ProgressView(value: Double(step + 1), total: Double(steps.count))
                .tint(.indigo)
            TabView(selection: $step) {
                venueStep.tag(0)
                paletteStep.tag(1)
                animationStep.tag(2)
                previewStep.tag(3)
            }
            .tabViewStyle(.page(indexDisplayMode: .always))

            HStack {
                Button("Back") {
                    step = max(0, step - 1)
                }
                .disabled(step == 0)

                Spacer()
                Button(step == steps.count - 1 ? "Finish" : "Next") {
                    if step == steps.count - 1 {
                        model.completeWizard(profile: profile)
                    } else {
                        step += 1
                    }
                }
                .buttonStyle(.borderedProminent)
            }
            .padding(.horizontal)
        }
        .padding()
        .onAppear {
            if let existing = model.brandProfile {
                profile = existing
            }
        }
    }

    private var venueStep: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Venue basics").font(.title3).bold()
            TextField("Venue name", text: $profile.venueName)
                .textFieldStyle(.roundedBorder)
            TextField("Tagline (optional)", text: $profile.tagline)
                .textFieldStyle(.roundedBorder)
            Text("These values show in the dashboard and on the table (optional).")
                .font(.footnote)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
    }

    private var paletteStep: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Brand palette").font(.title3).bold()
            ColorRow(title: "Primary", value: $profile.colors.primary)
            ColorRow(title: "Secondary", value: $profile.colors.secondary)
            ColorRow(title: "Accent", value: $profile.colors.accent)
            ColorRow(title: "Background", value: $profile.colors.background)
            Picker("Heading font", selection: $profile.typography.headingFont) {
                ForEach(["SF Pro Rounded", "SF Pro", "Avenir Next", "Futura"], id: \.self) { font in
                    Text(font)
                }
            }
            Picker("Body font", selection: $profile.typography.bodyFont) {
                ForEach(["SF Pro", "SF Pro Rounded", "Avenir Next", "Inter"], id: \.self) { font in
                    Text(font)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
    }

    private var animationStep: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Idle animation & brightness").font(.title3).bold()
            Picker("Animation", selection: Binding(get: {
                profile.idleAnimation.id
            }, set: { newId in
                if let template = model.serviceTemplates.first(where: { $0.id == newId }) {
                    profile.idleAnimation = template
                }
            })) {
                ForEach(model.serviceTemplates) { template in
                    Text("\(template.name) (\(template.id))").tag(template.id)
                }
            }
            Slider(value: $profile.brightness, in: 10...100, step: 1) {
                Text("Brightness")
            }
            Slider(value: Binding(get: {
                profile.brightnessCap ?? profile.brightness
            }, set: { newValue in
                profile.brightnessCap = newValue
            }), in: 30...100, step: 1) {
                Text("Brightness limit")
            }
            Text("Keep brightness under control for dark venues.")
                .font(.footnote)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
    }

    private var previewStep: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Preview & confirm").font(.title3).bold()
            RoundedRectangle(cornerRadius: 14)
                .fill(Color(hex: profile.colors.background))
                .frame(height: 180)
                .overlay(
                    VStack(spacing: 12) {
                        Text(profile.venueName).font(.title2).foregroundColor(Color(hex: profile.colors.primary))
                        Text(profile.tagline).foregroundColor(Color(hex: profile.colors.secondary))
                        Label("Idle: \(profile.idleAnimation.name)", systemImage: "play.circle.fill")
                            .foregroundStyle(Color(hex: profile.colors.accent))
                    }
                )
            Text("You can revisit this wizard later from Settings.")
                .font(.footnote)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
    }
}

private struct MainShell: View {
    @Environment(AppViewModel.self) private var model

    var body: some View {
        TabView {
            DashboardView()
                .tabItem { Label("Dashboard", systemImage: "rectangle.grid.2x2.fill") }
            BrandEditorView()
                .tabItem { Label("Brand", systemImage: "paintpalette.fill") }
            DrinksView()
                .tabItem { Label("Drinks", systemImage: "martini.glass.fill") }
            CoasterView()
                .tabItem { Label("Coasters", systemImage: "circle.hexagonpath") }
            PreviewSimulationView()
                .tabItem { Label("Preview", systemImage: "sparkles") }
            DemoSyncView()
                .tabItem { Label("Demo Sync", systemImage: "arrow.triangle.2.circlepath") }
            SettingsView()
                .tabItem { Label("Settings", systemImage: "gearshape.fill") }
        }
    }
}

private struct DashboardView: View {
    @Environment(AppViewModel.self) private var model

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if let table = model.selectedTable {
                    HStack {
                        VStack(alignment: .leading, spacing: 8) {
                            Text(table.name).font(.title3).bold()
                            Text("\(table.tableId) • v\(table.softwareVersion)")
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                        Label(table.status.label, systemImage: "circle.fill")
                            .foregroundStyle(table.status.tint)
                    }
                    .padding()
                    .background(.ultraThinMaterial)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                }

                HStack(spacing: 12) {
                    StatCard(title: "Drinks", value: "\(model.telemetry.drinkCount)", icon: "cup.and.saucer.fill")
                    StatCard(title: "Coasters", value: "\(model.telemetry.coasterCount)", icon: "circle.hexagonpath")
                    StatCard(title: "Uptime", value: "\(Int(model.telemetry.uptimeHours))h", icon: "clock")
                }

                if model.telemetry.warnings.isEmpty == false {
                    VStack(alignment: .leading, spacing: 8) {
                        Label("Warnings", systemImage: "exclamationmark.triangle.fill")
                            .foregroundStyle(.orange)
                        ForEach(model.telemetry.warnings, id: \.self) { warning in
                            Text("• \(warning)")
                        }
                        .foregroundStyle(.secondary)
                    }
                    .padding()
                    .background(Color.orange.opacity(0.1))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                }

                UpdateTile()
            }
            .padding()
        }
        .onAppear {
            model.refreshTelemetry()
        }
    }
}

private struct StatCard: View {
    var title: String
    var value: String
    var icon: String

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label(title, systemImage: icon)
                .font(.caption)
                .foregroundStyle(.secondary)
            Text(value)
                .font(.title2)
                .bold()
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(.thinMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

private struct UpdateTile: View {
    @Environment(AppViewModel.self) private var model

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Label("Software Update", systemImage: "arrow.down.circle.fill")
                Spacer()
                Text(model.updateInfo.currentVersion)
                    .foregroundStyle(.secondary)
            }
            if let available = model.updateInfo.availableVersion {
                Text("Available: \(available)")
                if let notes = model.updateInfo.releaseNotes {
                    Text(notes).font(.footnote).foregroundStyle(.secondary)
                }
                if model.updateInfo.status == .available {
                    Button("Download & Install") { model.startUpdate() }
                        .buttonStyle(.borderedProminent)
                } else {
                    ProgressView(value: model.updateInfo.progress) {
                        Text(model.updateInfo.status.rawValue.capitalized)
                    }
                }
            } else {
                Text("Up to date")
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(.ultraThinMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

private struct BrandEditorView: View {
    @Environment(AppViewModel.self) private var model
    @State private var profileDraft: BrandProfile = BrandProfile(
        id: UUID(),
        venueName: "Venue",
        tagline: "",
        colors: BrandColors(primary: "#7D5FFF", secondary: "#F2A950", accent: "#FF6B6B", background: "#0B0B13"),
        typography: BrandTypography(headingFont: "SF Pro Rounded", bodyFont: "SF Pro"),
        idleAnimation: AnimationTemplate(id: "A01", name: "Pulse", description: "", parameters: [:]),
        brightness: 70,
        brightnessCap: 85,
        primaryLogoName: nil,
        secondaryLogoName: nil,
        backgroundImageName: nil
    )

    var body: some View {
        Form {
            Section("Venue") {
                TextField("Venue name", text: $profileDraft.venueName)
                TextField("Tagline", text: $profileDraft.tagline)
            }

            Section("Colors") {
                ColorRow(title: "Primary", value: $profileDraft.colors.primary)
                ColorRow(title: "Secondary", value: $profileDraft.colors.secondary)
                ColorRow(title: "Accent", value: $profileDraft.colors.accent)
                ColorRow(title: "Background", value: $profileDraft.colors.background)
            }

            Section("Typography") {
                Picker("Heading font", selection: $profileDraft.typography.headingFont) {
                    ForEach(["SF Pro Rounded", "SF Pro", "Avenir Next", "Futura"], id: \.self) { font in
                        Text(font)
                    }
                }
                Picker("Body font", selection: $profileDraft.typography.bodyFont) {
                    ForEach(["SF Pro", "SF Pro Rounded", "Avenir Next", "Inter"], id: \.self) { font in
                        Text(font)
                    }
                }
            }

            Section("Idle animation & brightness") {
                Slider(value: $profileDraft.brightness, in: 10...100, step: 1) {
                    Text("Brightness")
                }
                Slider(value: Binding(get: { profileDraft.brightnessCap ?? profileDraft.brightness }, set: { profileDraft.brightnessCap = $0 }), in: 30...100, step: 1) {
                    Text("Brightness limit")
                }
                Picker("Idle animation", selection: Binding(get: { profileDraft.idleAnimation.id }, set: { newId in
                    if let template = model.serviceTemplates.first(where: { $0.id == newId }) {
                        profileDraft.idleAnimation = template
                    }
                })) {
                    ForEach(model.serviceTemplates, id: \.id) { template in
                        Text("\(template.name) (\(template.id))").tag(template.id)
                    }
                }
            }

            Section {
                Button("Preview on table") {
                    model.applyBrand(profileDraft)
                }
                Button("Apply") {
                    model.applyBrand(profileDraft)
                }
                .buttonStyle(.borderedProminent)
            }

            Section("Presets") {
                Button("Save as preset") { savePreset() }
                if model.brandPresets.isEmpty == false {
                    ForEach(model.brandPresets, id: \.id) { preset in
                        HStack {
                            VStack(alignment: .leading) {
                                Text(preset.venueName)
                                Text(preset.idleAnimation.name).font(.footnote).foregroundStyle(.secondary)
                            }
                            Spacer()
                            Button("Load") {
                                profileDraft = preset
                            }
                            Button(role: .destructive) {
                                model.deletePreset(preset)
                            } label: {
                                Image(systemName: "trash")
                            }
                        }
                    }
                }
            }
        }
        .navigationTitle("Brand")
        .onAppear {
            if let existing = model.brandProfile {
                profileDraft = existing
            }
        }
    }

    private func savePreset() {
        model.savePreset(profile: profileDraft)
    }
}

private struct DrinksView: View {
    @Environment(AppViewModel.self) private var model
    @State private var searchText: String = ""
    @State private var categoryFilter: String = "All"
    @State private var editingDrink: Drink?
    @State private var showingEditor = false

    var body: some View {
        VStack {
            HStack {
                TextField("Search drinks", text: $searchText)
                    .textFieldStyle(.roundedBorder)
                Menu {
                    Picker("Category", selection: $categoryFilter) {
                        Text("All").tag("All")
                        ForEach(categories, id: \.self) { cat in
                            Text(cat).tag(cat)
                        }
                    }
                } label: {
                    Label("Filter", systemImage: "line.3.horizontal.decrease.circle")
                }
            }
            .padding([.horizontal, .top])

            List {
                ForEach(filteredDrinks) { drink in
                    VStack(alignment: .leading, spacing: 6) {
                        HStack {
                            Label(drink.name, systemImage: drink.iconName)
                                .font(.headline)
                            Spacer()
                            Text(drink.category).font(.caption).padding(6).background(Color(hex: drink.colors.secondary).opacity(0.2)).clipShape(Capsule())
                        }
                        Text(drink.description).foregroundStyle(.secondary)
                        HStack(spacing: 12) {
                            Label(drink.animation.name, systemImage: "sparkles")
                            Label("Intensity \(Int(drink.intensity * 100))%", systemImage: "dial.medium")
                            if drink.showNameOnPlacement {
                                Label("Name on placement", systemImage: "textformat")
                            }
                        }
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        HStack {
                            Button("Preview on table") {
                                // mock preview
                            }
                            Spacer()
                            Button("Edit") {
                                editingDrink = drink
                                showingEditor = true
                            }
                            Button(role: .destructive) {
                                model.deleteDrink(drink)
                            } label: {
                                Image(systemName: "trash")
                            }
                        }
                    }
                    .padding(.vertical, 6)
                }
            }
        }
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button {
                    editingDrink = nil
                    showingEditor = true
                } label: {
                    Label("Add", systemImage: "plus")
                }
            }
        }
        .sheet(isPresented: $showingEditor) {
            DrinkEditor(drink: editingDrink, templates: model.serviceTemplates) { updated in
                if editingDrink != nil {
                    model.updateDrink(updated)
                } else {
                    model.addDrink(updated)
                }
            }
        }
    }

    private var filteredDrinks: [Drink] {
        model.drinks.filter { drink in
            (searchText.isEmpty || drink.name.lowercased().contains(searchText.lowercased())) &&
            (categoryFilter == "All" || drink.category == categoryFilter)
        }
    }

    private var categories: [String] {
        Set(model.drinks.map { $0.category }).sorted()
    }
}

private struct DrinkEditor: View {
    @Environment(\.dismiss) private var dismiss
    @State private var draft: Drink
    let templates: [AnimationTemplate]
    var onSave: (Drink) -> Void

    init(drink: Drink?, templates: [AnimationTemplate], onSave: @escaping (Drink) -> Void) {
        _draft = State(initialValue: drink ?? Drink(id: UUID(), name: "New Drink", description: "", category: "Signature", iconName: "sparkles", useBrandColors: true, colors: BrandColors(primary: "#7D5FFF", secondary: "#F2A950", accent: "#FF6B6B", background: "#0B0B13"), animation: templates.first ?? AnimationTemplate(id: "A01", name: "Pulse", description: "", parameters: [:]), showNameOnPlacement: true, displayDuration: 3, intensity: 0.6, speed: 0.5))
        self.templates = templates
        self.onSave = onSave
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Basics") {
                    TextField("Name", text: $draft.name)
                    TextField("Description", text: $draft.description)
                    TextField("Category", text: $draft.category)
                    TextField("SF Symbol icon", text: $draft.iconName)
                }
                Section("Visuals") {
                    Toggle("Use brand colors", isOn: $draft.useBrandColors)
                    if draft.useBrandColors == false {
                        ColorRow(title: "Primary", value: $draft.colors.primary)
                        ColorRow(title: "Secondary", value: $draft.colors.secondary)
                        ColorRow(title: "Accent", value: $draft.colors.accent)
                    }
                    Picker("Animation", selection: Binding(get: {
                        draft.animation.id
                    }, set: { newId in
                        if let template = templates.first(where: { $0.id == newId }) {
                            draft.animation = template
                        }
                    })) {
                        ForEach(templates) { template in
                            Text("\(template.name) (\(template.id))").tag(template.id)
                        }
                    }
                    Slider(value: $draft.intensity, in: 0...1) { Text("Intensity") }
                    Slider(value: $draft.speed, in: 0...1) { Text("Speed") }
                    Toggle("Show name on placement", isOn: $draft.showNameOnPlacement)
                    Stepper("Display for \(Int(draft.displayDuration))s", value: $draft.displayDuration, in: 1...5)
                }
            }
            .navigationTitle("Drink")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        onSave(draft)
                        dismiss()
                    }
                }
            }
        }
    }
}

private struct CoasterView: View {
    @Environment(AppViewModel.self) private var model
    private let unassignedId = UUID(uuidString: "00000000-0000-0000-0000-000000000000")!

    var body: some View {
        List {
            ForEach(model.coasters) { coaster in
                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        Text(coaster.code).font(.headline)
                        if let label = coaster.label.isEmpty ? nil : coaster.label {
                            Text(label).foregroundStyle(.secondary)
                        }
                        Spacer()
                        if let lastSeen = coaster.lastSeen {
                            Text(lastSeen, style: .time).font(.caption).foregroundStyle(.secondary)
                        }
                    }
                    Picker("Assigned drink", selection: Binding(get: {
                        coaster.assignedDrinkId ?? unassignedId
                    }, set: { newValue in
                        let drinkId = newValue == unassignedId ? nil : newValue
                        model.assign(coaster: coaster, to: drinkId)
                    })) {
                        Text("Unassigned").tag(unassignedId)
                        ForEach(model.drinks) { drink in
                            Text(drink.name).tag(drink.id)
                        }
                    }
                    .pickerStyle(.menu)
                    if let position = coaster.positionDescription {
                        Text(position).font(.footnote).foregroundStyle(.secondary)
                    }
                    HStack {
                        Button("Test") {}
                        Spacer()
                        Button("Scan mode") {}
                    }
                }
                .padding(.vertical, 6)
            }
        }
    }
}

private struct PreviewSimulationView: View {
    @Environment(AppViewModel.self) private var model
    @State private var selectedDrinkId: UUID?

    var body: some View {
        VStack(spacing: 12) {
            HStack {
                Picker("Drink", selection: $selectedDrinkId) {
                    Text("Use assigned").tag(UUID?.none)
                    ForEach(model.drinks) { drink in
                        Text(drink.name).tag(UUID?.some(drink.id))
                    }
                }
                .pickerStyle(.menu)
                Button("Clear test effects") {
                    model.clearSimulations()
                }
            }
            .padding(.horizontal)

            GeometryReader { geo in
                ZStack {
                    RoundedRectangle(cornerRadius: 16)
                        .fill(Color(white: 0.1))
                    ForEach(model.livePreviewSimulations) { sim in
                        let point = CGPoint(x: sim.position.x * geo.size.width, y: sim.position.y * geo.size.height)
                        VStack(spacing: 4) {
                            Circle()
                                .fill(Color.blue.opacity(0.8))
                                .frame(width: 36, height: 36)
                                .overlay(Text(sim.name.prefix(2)).foregroundColor(.white))
                            if let drink = model.drinks.first(where: { $0.id == sim.drinkId }) {
                                Text(drink.name).font(.caption).foregroundStyle(.secondary)
                            }
                        }
                        .position(point)
                    }
                }
                .gesture(
                    DragGesture(minimumDistance: 0)
                        .onEnded { value in
                            let location = value.location
                            let normalized = CGPoint(x: location.x / geo.size.width, y: location.y / geo.size.height)
                            let sim = SimulatedCoaster(id: UUID(), name: "Sim", drinkId: selectedDrinkId ?? model.drinks.first?.id, position: normalized, rotation: 0)
                            model.simulate(coaster: sim)
                        }
                )
            }
            .frame(height: 300)
            Text("Tap the table to simulate coaster placement and send test animations.")
                .font(.footnote)
                .foregroundStyle(.secondary)
                .padding(.horizontal)
        }
    }
}

private struct DemoSyncView: View {
    @Environment(AppViewModel.self) private var model
    @State private var client = DemoSyncClient()
    @State private var demoAnimationTypeId: String = "A01"
    @State private var demoTopBarName: String = "BARCODE"
    @State private var demoColor: String = "#7D5FFF"

    var body: some View {
        Form {
            Section {
                Text("Using Firebase. Config and orders sync in real time.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
            Section("Send to table") {
                Picker("Animation Type", selection: $demoAnimationTypeId) {
                    ForEach(model.serviceTemplates) { template in
                        Text("\(template.name) (\(template.id))").tag(template.id)
                    }
                }
                TextField("Top Bar name", text: $demoTopBarName)
                ColorRow(title: "Color", value: $demoColor)
                Button("Send to table") {
                    let name = model.serviceTemplates.first(where: { $0.id == demoAnimationTypeId })?.name ?? demoAnimationTypeId
                    client.sendConfig(animationType: name, topBarName: demoTopBarName, color: demoColor)
                }
                .buttonStyle(.borderedProminent)
                .disabled(!client.isFirebaseReady)
            }
            Section {
                HStack {
                    Text("Orders from kiosk")
                        .font(.headline)
                    Spacer()
                    if !client.ordersReceived.isEmpty {
                        Button("Clear") { client.clearOrders() }
                            .font(.footnote)
                    }
                }
                if client.ordersReceived.isEmpty {
                    Text("No orders yet. Place an order on the table (kiosk) to see them here.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                } else {
                    ForEach(client.ordersReceived) { order in
                        HStack {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(order.drinkName)
                                    .font(.subheadline)
                                    .fontWeight(.medium)
                                Text(order.timestamp, style: .time)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            Spacer()
                            Image(systemName: "cup.and.saucer.fill")
                                .foregroundStyle(.secondary)
                        }
                        .padding(.vertical, 4)
                    }
                }
            }
        }
        .navigationTitle("Demo Sync")
    }
}

private struct SettingsView: View {
    @Environment(AppViewModel.self) private var model
    @State private var pin: String = ""

    var body: some View {
        @Bindable var bindableModel = model
        Form {
            Section("Connection") {
                if let table = model.selectedTable {
                    Text("\(table.name) (\(table.tableId))")
                    Button("Switch table") {
                        model.flow = .welcome
                    }
                    Button("Forget table", role: .destructive) {
                        model.forgetSelectedTable()
                    }
                }
            }
            Section("Maintenance") {
                Button("Restart table services") { model.restartTable() }
                Button("Export logs") {}
            }
            Section("Admin PIN") {
                Toggle("Require PIN for risky actions", isOn: $bindableModel.adminPinEnabled)
                SecureField("PIN", text: $pin)
                Button("Save PIN") {
                    model.adminPin = pin
                }
            }
            Section("About") {
                Text("AURA Manager prototype").foregroundStyle(.secondary)
            }
        }
    }
}

private struct ColorRow: View {
    var title: String
    @Binding var value: String

    var body: some View {
        HStack {
            Text(title)
            TextField("#FFFFFF", text: $value)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .multilineTextAlignment(.trailing)
            Circle()
                .fill(Color(hex: value))
                .frame(width: 24, height: 24)
                .overlay(Circle().stroke(Color(.systemGray4), lineWidth: 1))
        }
    }
}
