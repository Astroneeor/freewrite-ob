import { App, Plugin, WorkspaceLeaf, PluginSettingTab, Setting, Notice } from "obsidian";
import { FreewriteView } from "./FreewriteView";
import {
  FREEWRITE_VIEW_TYPE,
  DEFAULT_SETTINGS,
  FreewriteSettings,
  FONT_SIZES,
} from "./types";

export default class FreewritePlugin extends Plugin {
  settings!: FreewriteSettings;

  async onload(): Promise<void> {
    await this.loadSettings();

    this.registerView(
      FREEWRITE_VIEW_TYPE,
      (leaf: WorkspaceLeaf) => new FreewriteView(leaf, this)
    );

    this.addRibbonIcon("pencil", "New Freewrite session", () => {
      this.openFreewriteView();
    });

    this.addCommand({
      id: "open-freewrite-session",
      name: "New session",
      callback: () => this.openFreewriteView(),
    });

    this.addCommand({
      id: "open-freewrite-history",
      name: "Show history folder",
      callback: () => {
        new Notice(`Freewrite notes are in: ${this.settings.folderName}/`);
        const explorerLeaf = this.app.workspace.getLeavesOfType("file-explorer")[0];
        if (explorerLeaf) this.app.workspace.revealLeaf(explorerLeaf);
      },
    });

    this.addSettingTab(new FreewriteSettingTab(this.app, this));
  }

  async openFreewriteView(): Promise<void> {
    const leaf = this.app.workspace.getLeaf("tab");
    await leaf.setViewState({ type: FREEWRITE_VIEW_TYPE, active: true });
    this.app.workspace.revealLeaf(leaf);
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}

class FreewriteSettingTab extends PluginSettingTab {
  plugin: FreewritePlugin;

  constructor(app: App, plugin: FreewritePlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Freewrite" });

    new Setting(containerEl)
      .setName("Default timer duration")
      .setDesc("How long each writing session lasts")
      .addDropdown((drop) => {
        drop
          .addOption("300", "5 minutes")
          .addOption("600", "10 minutes")
          .addOption("900", "15 minutes")
          .addOption("1500", "25 minutes")
          .setValue(String(this.plugin.settings.defaultDuration))
          .onChange(async (val) => {
            this.plugin.settings.defaultDuration = parseInt(val);
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Freewrite folder")
      .setDesc("Vault folder where session notes are saved")
      .addText((text) =>
        text
          .setPlaceholder("Freewrite")
          .setValue(this.plugin.settings.folderName)
          .onChange(async (val) => {
            this.plugin.settings.folderName = val.trim() || "Freewrite";
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("No-backspace mode")
      .setDesc("Prevent Backspace and Delete while the timer is running")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.noBackspace)
          .onChange(async (val) => {
            this.plugin.settings.noBackspace = val;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Disable spellcheck")
      .setDesc("Hide red underlines while writing")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.disableSpellcheck)
          .onChange(async (val) => {
            this.plugin.settings.disableSpellcheck = val;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Default font size")
      .addDropdown((drop) => {
        for (const sz of FONT_SIZES) drop.addOption(String(sz), `${sz}px`);
        drop
          .setValue(String(this.plugin.settings.defaultFontSize))
          .onChange(async (val) => {
            this.plugin.settings.defaultFontSize = parseInt(val);
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Default font family")
      .addDropdown((drop) =>
        drop
          .addOption("sans", "Sans-serif")
          .addOption("serif", "Serif")
          .addOption("mono", "Monospace")
          .addOption("random", "Random")
          .setValue(this.plugin.settings.defaultFontFamily)
          .onChange(async (val) => {
            this.plugin.settings.defaultFontFamily = val as FreewriteSettings["defaultFontFamily"];
            await this.plugin.saveSettings();
          })
      );
  }
}
