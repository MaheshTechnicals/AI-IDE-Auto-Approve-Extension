# Contributing to AI IDE Auto-Approve Extension

Thank you for your interest in improving **AI IDE Auto-Approve Extension**! We welcome bug reports, feature suggestions, and code contributions.

---

## 🛠️ Development Setup

1. **Prerequisites**:
   - Node.js >= 18.x
   - npm >= 9.x
   - VS Code, Kiro IDE, or Google Antigravity IDE

2. **Clone & Install**:
   ```bash
   git clone https://github.com/MaheshTechnicals/AI-IDE-Auto-Approve-Extension.git
   cd AI-IDE-Auto-Approve-Extension
   npm install
   ```

3. **Running the Build**:
   ```bash
   # Single build
   npm run build

   # Watch mode
   npm run watch
   ```

4. **Running Tests & Linting**:
   ```bash
   # Run Mocha test suite
   npm test

   # Run TypeScript type check
   npm run lint
   ```

5. **Debugging with F5**:
   - Open the project folder in VS Code or Kiro IDE.
   - Press **`F5`** to launch an Extension Development Host window with the extension loaded and live breakpoints enabled.

---

## 📝 Guidelines for Submitting Changes

1. **Zero Screen Automation Constraint**:
   - All contributions must use only the official VS Code / Kiro extension host API.
   - Contributions introducing OCR, mouse automation, or screen pixel scraping will not be accepted.

2. **Add Tests**:
   - If adding or refining safety patterns or parsing logic, add matching test cases to `test/safety.test.ts`.

3. **Code Style**:
   - Keep code clean, typed, and well-commented.
   - Ensure `npm test` and `npm run lint` pass with zero errors.

4. **Pull Requests**:
   - Fork the repository.
   - Create a feature branch: `git checkout -b feature/my-feature`.
   - Commit your changes with clear messages.
   - Push to your fork and submit a Pull Request!
