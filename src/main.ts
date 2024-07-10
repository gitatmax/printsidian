import { App, MarkdownView, Plugin, PluginSettingTab, Setting } from 'obsidian';

interface PrintPluginSettings {
  printOption: boolean;
}

const DEFAULT_SETTINGS: PrintPluginSettings = {
  printOption: true
}

export default class PrintPlugin extends Plugin {
  settings!: PrintPluginSettings;

  async onload() {
    console.log('Loading print plugin');

    await this.loadSettings();

    this.addCommand({
      id: 'print-note',
      name: 'Print Note',
      callback: () => this.printCurrentNote(),
    });

    this.addSettingTab(new PrintSettingTab(this.app, this));
  }

  onunload() {
    console.log('Unloading print plugin');
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  printCurrentNote() {
    console.log('printCurrentNote called');
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (activeView) {
      console.log('Active view found');
      const content = activeView.getViewData();
      const printFrame = document.createElement('iframe');
      printFrame.style.position = 'fixed';
      printFrame.style.right = '0';
      printFrame.style.bottom = '0';
      printFrame.style.width = '0';
      printFrame.style.height = '0';
      printFrame.style.border = 'none';
      document.body.appendChild(printFrame);

      const frameWindow = printFrame.contentWindow;
      if (frameWindow) {
        frameWindow.document.open();
        frameWindow.document.write(`
          <html>
            <head>
              <title>Print Note</title>
              <style>
                body { font-family: Arial, sans-serif; }
              </style>
            </head>
            <body>
              <div id="content"></div>
              <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
              <script>
                document.getElementById('content').innerHTML = marked.parse(${JSON.stringify(content)});
                window.onload = () => {
                  window.print();
                  window.onafterprint = () => {
                    window.parent.document.body.removeChild(window.frameElement);
                  };
                };
              </script>
            </body>
          </html>
        `);
        frameWindow.document.close();
      } else {
        console.error('Failed to access iframe content window');
      }
    } else {
      console.error('No active view found');
    }
  }
}

class PrintSettingTab extends PluginSettingTab {
  plugin: PrintPlugin;

  constructor(app: App, plugin: PrintPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'Print Plugin Settings' });

    new Setting(containerEl)
      .setName('Enable Print Option')
      .setDesc('Enable or disable the print option.')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.printOption)
        .onChange(async (value) => {
          this.plugin.settings.printOption = value;
          await this.plugin.saveSettings();
        }));
  }
}