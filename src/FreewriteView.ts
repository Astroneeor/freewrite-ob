import { ItemView, WorkspaceLeaf, Notice } from "obsidian";
import type FreewritePlugin from "./main";
import {
  FREEWRITE_VIEW_TYPE,
  FONT_SIZES,
  FONT_FAMILIES,
  RANDOM_FONTS,
  PLACEHOLDER_TEXTS,
  TIMER_PRESETS,
  FontFamily,
} from "./types";

export class FreewriteView extends ItemView {
  plugin: FreewritePlugin;

  private editorEl!: HTMLTextAreaElement;
  private toolbarEl!: HTMLElement;
  private timerDisplayEl!: HTMLElement;
  private startStopBtn!: HTMLButtonElement;
  private fontSizeBtn!: HTMLButtonElement;
  private fontFamilyBtn!: HTMLButtonElement;

  private timerInterval: number | null = null;
  private autoSaveInterval: number | null = null;
  private toolbarHideTimeout: number | null = null;

  private timeRemaining = 0;
  private timerRunning = false;
  private sessionStarted = false;
  private currentFilePath: string | null = null;

  private currentFontSizeIndex = 1;
  private currentFontFamily: FontFamily = "sans";
  private resolvedRandomFont = "";

  constructor(leaf: WorkspaceLeaf, plugin: FreewritePlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return FREEWRITE_VIEW_TYPE;
  }

  getDisplayText(): string {
    return "Freewrite";
  }

  getIcon(): string {
    return "pencil";
  }

  async onOpen(): Promise<void> {
    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();
    container.addClass("freewrite-container");

    this.editorEl = container.createEl("textarea", {
      cls: "freewrite-editor",
      attr: {
        placeholder: this.randomPlaceholder(),
        spellcheck: String(!this.plugin.settings.disableSpellcheck),
        autocorrect: "off",
        autocapitalize: "off",
      },
    });

    this.buildToolbar(container);

    const sizeIndex = FONT_SIZES.indexOf(this.plugin.settings.defaultFontSize);
    this.applyFontSize(sizeIndex >= 0 ? sizeIndex : 1);
    this.applyFontFamily(this.plugin.settings.defaultFontFamily);

    this.timeRemaining = this.plugin.settings.defaultDuration;
    this.updateTimerDisplay();

    this.attachEditorListeners();
    this.attachToolbarMouseListeners();

    this.editorEl.focus();
  }

  private buildToolbar(container: HTMLElement): void {
    this.toolbarEl = container.createEl("div", { cls: "freewrite-toolbar" });

    // Left: font controls
    const left = this.toolbarEl.createEl("div", { cls: "freewrite-toolbar-group" });

    this.fontSizeBtn = left.createEl("button", {
      cls: "freewrite-btn",
      text: `${this.plugin.settings.defaultFontSize}px`,
      attr: { title: "Cycle font size" },
    });
    this.fontSizeBtn.addEventListener("click", () => this.cycleFontSize());

    this.fontFamilyBtn = left.createEl("button", {
      cls: "freewrite-btn",
      text: this.familyLabel(this.plugin.settings.defaultFontFamily),
      attr: { title: "Cycle font family" },
    });
    this.fontFamilyBtn.addEventListener("click", () => this.cycleFontFamily());

    // Center: presets + timer display + start/stop
    const center = this.toolbarEl.createEl("div", { cls: "freewrite-toolbar-group freewrite-toolbar-center" });

    const presetsEl = center.createEl("div", { cls: "freewrite-presets" });
    for (const preset of TIMER_PRESETS) {
      const btn = presetsEl.createEl("button", {
        cls: "freewrite-btn freewrite-preset-btn",
        text: preset.label,
      });
      btn.addEventListener("click", () => {
        if (!this.timerRunning) {
          this.timeRemaining = preset.seconds;
          this.updateTimerDisplay();
        }
      });
    }

    this.timerDisplayEl = center.createEl("div", {
      cls: "freewrite-timer",
      text: this.formatTime(this.timeRemaining),
    });

    this.startStopBtn = center.createEl("button", {
      cls: "freewrite-btn freewrite-start-btn",
      text: "Start",
    });
    this.startStopBtn.addEventListener("click", () => this.toggleTimer());

    // Right: new session
    const right = this.toolbarEl.createEl("div", { cls: "freewrite-toolbar-group" });

    right.createEl("button", {
      cls: "freewrite-btn",
      text: "New session",
      attr: { title: "Save and start a new session" },
    }).addEventListener("click", () => this.startNewSession());
  }

  // ─── Editor listeners ───────────────────────────────────────────────────────

  private attachEditorListeners(): void {
    this.editorEl.addEventListener("keydown", (e: KeyboardEvent) => {
      if (
        this.plugin.settings.noBackspace &&
        this.timerRunning &&
        (e.key === "Backspace" || e.key === "Delete")
      ) {
        e.preventDefault();
      }
    });

    this.editorEl.addEventListener("blur", async () => {
      if (this.sessionStarted) await this.saveNote();
    });
  }

  // ─── Toolbar fade ────────────────────────────────────────────────────────────

  private attachToolbarMouseListeners(): void {
    this.containerEl.addEventListener("mousemove", () => this.showToolbar());
    this.containerEl.addEventListener("mouseleave", () => {
      if (this.timerRunning) this.scheduleToolbarHide();
    });
  }

  private showToolbar(): void {
    this.toolbarEl.removeClass("freewrite-toolbar--hidden");
    if (this.toolbarHideTimeout !== null) {
      clearTimeout(this.toolbarHideTimeout);
      this.toolbarHideTimeout = null;
    }
    if (this.timerRunning) this.scheduleToolbarHide();
  }

  private scheduleToolbarHide(): void {
    if (this.toolbarHideTimeout !== null) return;
    this.toolbarHideTimeout = window.setTimeout(() => {
      this.toolbarEl.addClass("freewrite-toolbar--hidden");
      this.toolbarHideTimeout = null;
    }, 2000);
  }

  // ─── Timer ───────────────────────────────────────────────────────────────────

  private toggleTimer(): void {
    this.timerRunning ? this.stopTimer() : this.startTimer();
  }

  private startTimer(): void {
    if (this.timeRemaining <= 0) {
      this.timeRemaining = this.plugin.settings.defaultDuration;
    }

    if (!this.sessionStarted) this.initSession();

    this.timerRunning = true;
    this.startStopBtn.textContent = "Stop";

    this.autoSaveInterval = window.setInterval(async () => {
      await this.saveNote();
    }, 30_000);

    this.timerInterval = window.setInterval(() => {
      this.timeRemaining -= 1;
      this.updateTimerDisplay();
      if (this.timeRemaining <= 0) this.onTimerComplete();
    }, 1000);

    this.scheduleToolbarHide();
  }

  private stopTimer(): void {
    if (this.timerInterval !== null) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.autoSaveInterval !== null) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
    if (this.toolbarHideTimeout !== null) {
      clearTimeout(this.toolbarHideTimeout);
      this.toolbarHideTimeout = null;
    }
    this.timerRunning = false;
    this.startStopBtn.textContent = "Start";
    this.showToolbar();
  }

  private async onTimerComplete(): Promise<void> {
    this.stopTimer();
    await this.saveNote();

    this.timerDisplayEl.addClass("freewrite-timer--complete");
    new Notice("Freewrite session complete!", 4000);

    window.setTimeout(() => {
      this.timerDisplayEl.removeClass("freewrite-timer--complete");
      this.timeRemaining = this.plugin.settings.defaultDuration;
      this.updateTimerDisplay();
    }, 3000);
  }

  private updateTimerDisplay(): void {
    this.timerDisplayEl.textContent = this.formatTime(this.timeRemaining);
  }

  private formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  // ─── Session / file ──────────────────────────────────────────────────────────

  private initSession(): void {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const ts = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
    this.currentFilePath = `${this.plugin.settings.folderName}/${ts}.md`;
    this.sessionStarted = true;
  }

  private async saveNote(): Promise<void> {
    if (!this.sessionStarted || !this.currentFilePath) return;
    const content = this.editorEl.value;
    if (!content.trim()) return;

    const vault = this.plugin.app.vault;
    const folder = this.plugin.settings.folderName;

    if (!vault.getFolderByPath(folder)) {
      await vault.createFolder(folder);
    }

    const existing = vault.getFileByPath(this.currentFilePath);
    if (existing) {
      await vault.modify(existing, content);
    } else {
      await vault.create(this.currentFilePath, content);
    }
  }

  private async startNewSession(): Promise<void> {
    if (this.sessionStarted && this.editorEl.value.trim()) {
      await this.saveNote();
    }
    if (this.timerRunning) this.stopTimer();

    this.sessionStarted = false;
    this.currentFilePath = null;
    this.editorEl.value = "";
    this.editorEl.placeholder = this.randomPlaceholder();
    this.timeRemaining = this.plugin.settings.defaultDuration;
    this.updateTimerDisplay();
    this.editorEl.focus();
  }

  // ─── Appearance ──────────────────────────────────────────────────────────────

  private applyFontSize(index: number): void {
    this.currentFontSizeIndex = index;
    const size = FONT_SIZES[index];
    this.editorEl.style.fontSize = `${size}px`;
    this.editorEl.style.lineHeight = `${size * 1.75}px`;
    this.fontSizeBtn.textContent = `${size}px`;
  }

  private cycleFontSize(): void {
    this.applyFontSize((this.currentFontSizeIndex + 1) % FONT_SIZES.length);
  }

  private applyFontFamily(family: FontFamily): void {
    this.currentFontFamily = family;
    if (family === "random") {
      if (!this.resolvedRandomFont) {
        this.resolvedRandomFont = RANDOM_FONTS[Math.floor(Math.random() * RANDOM_FONTS.length)];
      }
      this.editorEl.style.fontFamily = this.resolvedRandomFont;
    } else {
      this.resolvedRandomFont = "";
      this.editorEl.style.fontFamily = FONT_FAMILIES[family];
    }
    this.fontFamilyBtn.textContent = this.familyLabel(family);
  }

  private cycleFontFamily(): void {
    const order: FontFamily[] = ["sans", "serif", "mono", "random"];
    const next = order[(order.indexOf(this.currentFontFamily) + 1) % order.length];
    this.resolvedRandomFont = "";
    this.applyFontFamily(next);
  }

  private familyLabel(family: FontFamily): string {
    return { sans: "Sans", serif: "Serif", mono: "Mono", random: "Random" }[family];
  }

  private randomPlaceholder(): string {
    return PLACEHOLDER_TEXTS[Math.floor(Math.random() * PLACEHOLDER_TEXTS.length)];
  }

  // ─── Cleanup ─────────────────────────────────────────────────────────────────

  async onClose(): Promise<void> {
    if (this.sessionStarted && this.editorEl?.value.trim()) {
      await this.saveNote();
    }
    if (this.timerInterval !== null) clearInterval(this.timerInterval);
    if (this.autoSaveInterval !== null) clearInterval(this.autoSaveInterval);
    if (this.toolbarHideTimeout !== null) clearTimeout(this.toolbarHideTimeout);
  }
}
