"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const obsidian_1 = require("obsidian");
const DEFAULT_SETTINGS = {
    printOption: true
};
class PrintPlugin extends obsidian_1.Plugin {
    onload() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Loading print plugin');
            yield this.loadSettings();
            this.addCommand({
                id: 'print-note',
                name: 'Print Note',
                callback: () => this.printCurrentNote(),
            });
            this.addSettingTab(new PrintSettingTab(this.app, this));
        });
    }
    onunload() {
        console.log('Unloading print plugin');
    }
    loadSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            this.settings = Object.assign({}, DEFAULT_SETTINGS, yield this.loadData());
        });
    }
    saveSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.saveData(this.settings);
        });
    }
    printCurrentNote() {
        console.log('printCurrentNote called');
        const activeView = this.app.workspace.getActiveViewOfType(obsidian_1.MarkdownView);
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
            }
            else {
                console.error('Failed to access iframe content window');
            }
        }
        else {
            console.error('No active view found');
        }
    }
}
exports.default = PrintPlugin;
class PrintSettingTab extends obsidian_1.PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }
    display() {
        const { containerEl } = this;
        containerEl.empty();
        containerEl.createEl('h2', { text: 'Print Plugin Settings' });
        new obsidian_1.Setting(containerEl)
            .setName('Enable Print Option')
            .setDesc('Enable or disable the print option.')
            .addToggle(toggle => toggle
            .setValue(this.plugin.settings.printOption)
            .onChange((value) => __awaiter(this, void 0, void 0, function* () {
            this.plugin.settings.printOption = value;
            yield this.plugin.saveSettings();
        })));
    }
}
